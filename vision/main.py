import os
import uuid
import shutil
import tempfile
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException, Response, Request
from extractors.frame_extractor import FrameExtractor
from analyzers.vlm_client import VLMClient
from generators.workflow_generator import WorkflowGenerator
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

app = FastAPI(title="Process Autopilot Vision Engine")

vision_analysis_duration = Histogram('autopilot_vision_analysis_duration_seconds', 'Vision analysis duration', ['vlm_provider'])
vision_cost = Counter('autopilot_vision_cost_usd_total', 'Vision cost in USD', ['vlm_provider'])

@app.get("/metrics")
async def metrics(request: Request):
    client_ip = request.client.host if request.client else ""
    # Allow only internal Docker network and localhost
    if client_ip in ("127.0.0.1", "::1") or client_ip.startswith("172.") or client_ip.startswith("10."):
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
    return Response("Forbidden", status_code=403)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
if not OPENAI_API_KEY:
    import logging
    logging.warning("OPENAI_API_KEY not set — vision analysis will fail")

extractor = FrameExtractor()
# VLMClient uses multi-provider fallback — construct providers with the available keys
if OPENAI_API_KEY:
    from analyzers.vlm_client import OpenAIProvider, QwenProvider
    _providers = [OpenAIProvider(api_key=OPENAI_API_KEY)]
    _qwen_key = os.getenv("QWEN_API_KEY", "")
    if _qwen_key:
        _providers.append(QwenProvider(api_key=_qwen_key))
    analyzer = VLMClient(providers=_providers)
else:
    analyzer = None
generator = WorkflowGenerator()

@app.post("/api/v1/vision/analyze")
async def analyze_video(file: UploadFile = File(...)):
    # Validate file type
    allowed_types = ["video/mp4", "video/webm", "video/quicktime"]
    if file.content_type and file.content_type not in allowed_types:
        return {"error": f"Invalid file type: {file.content_type}. Allowed: {allowed_types}"}
    if not analyzer:
        return {"error": "Vision engine not configured — OPENAI_API_KEY required"}
    
    session_id = str(uuid.uuid4())
    safe_filename = Path(file.filename).name
    # Ensure no path traversal in filename
    if '/' in safe_filename or '\\' in safe_filename or '..' in safe_filename:
        return {"error": "Invalid filename"}
    frames_dir = Path(tempfile.gettempdir()) / "frames" / session_id
    temp_video_path = Path(tempfile.gettempdir()) / f"{session_id}_{safe_filename}"
    
    try:
        # 1. الاستقبال والحفظ المؤقت
        with open(temp_video_path, "wb") as f:
            content = await file.read()
            f.write(content)
            
        # 2. استخراج الإطارات (FFmpeg 1 FPS)
        frames = await extractor.extract(temp_video_path, session_id)
        if not frames:
            raise HTTPException(status_code=400, detail="Failed to extract any frames from the video.")
            
        # 3. تحليل VLM
        analyses = []
        context = "Starting new workflow."
        for frame in frames:
            try:
                analysis = await analyzer.analyze_frame(frame, previous_context=context)
                analyses.append(analysis)
                context = f"Previous action suggested: {analysis.get('suggested_action')} on target {analysis.get('target', {}).get('text')}."
            except Exception as e:
                print(f"Error analyzing frame {frame.name}: {e}")
                
        # 4. توليد المخطط (JSON Schema v2)
        workflow_json = generator.generate(analyses, safe_filename, session_id)
        
        return workflow_json

    except Exception as e:
        import logging
        logging.error(f"Vision analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Video analysis failed")
    finally:
        # 5. تنظيف الخصوصية فوراً
        if temp_video_path.exists():
            temp_video_path.unlink()
        if frames_dir.exists():
            shutil.rmtree(frames_dir)

@app.get("/health")
def health():
    return {"status": "healthy", "service": "vision"}

@app.get("/api/v1/vision/health")
def health_check():
    return {"status": "healthy", "service": "vision"}
