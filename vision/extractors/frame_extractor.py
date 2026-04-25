import asyncio
import subprocess
import tempfile
from pathlib import Path
from typing import List

class FrameExtractor:
    def __init__(self, fps: float = 1.0, max_width: int = 1920, max_height: int = 1080, quality: int = 85):
        self.fps = fps
        self.max_width = max_width
        self.max_height = max_height
        self.quality = quality

    async def extract(self, video_path: Path, session_id: str) -> List[Path]:
        output_dir = Path(tempfile.gettempdir()) / "frames" / session_id
        output_dir.mkdir(parents=True, exist_ok=True)
        
        cmd = [
            "ffmpeg",
            "-i", str(video_path),
            "-vf", f"fps={self.fps},scale={self.max_width}:{self.max_height}:force_original_aspect_ratio=decrease",
            "-q:v", str(self.quality),
            str(output_dir / "frame_%04d.jpg")
        ]
        
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await proc.communicate()
        
        if proc.returncode != 0:
            raise RuntimeError(f"FFmpeg failed: {stderr.decode()}")
        
        frames = sorted(output_dir.glob("frame_*.jpg"))
        return frames
