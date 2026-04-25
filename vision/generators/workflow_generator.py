from typing import List, Dict, Any
import uuid
from datetime import datetime, timezone

class WorkflowGenerator:
    MIN_CONFIDENCE = 0.75
    
    def _detect_start_url(self, analyses):
        return "https://www.google.com"

    def generate(self, analyses: List[Dict], video_name: str, session_id: str) -> Dict[str, Any]:
        steps = []
        total_tokens = 0
        total_cost = 0
        
        for i, analysis in enumerate(analyses):
            confidence = analysis.get("confidence", 0.0)
            if confidence < self.MIN_CONFIDENCE:
                continue
            
            step = {
                "step_id": i + 1,
                "action": analysis.get("suggested_action", "wait"),
                "description": analysis.get("reasoning", ""),
                "target": analysis.get("target", {}),
                "input_value": analysis.get("input_value"),
                "confidence": confidence,
                "stealth": {
                    "humanize": True,
                    "bezier_curves": True,
                    "typing_speed_wpm": 45,
                    "thinking_pause_ms": 200,
                    "mouse_overshoot": True
                },
                "audit": {
                    "screenshot_before": True,
                    "screenshot_after": True,
                    "log_level": "info",
                    "capture_dom": False
                },
                "error_handling": {
                    "on_failure": "retry",
                    "fallback_step_id": None,
                    "max_retries": 3
                }
            }
            steps.append(step)
            total_tokens += analysis.get("_tokens_used", 1500)
            total_cost += analysis.get("_cost_usd", 0.0075)
        
        return {
            "workflow_title": f"Auto-generated workflow from {video_name}",
            "start_url": self._detect_start_url(analyses),
            "session_id": session_id,
            "workflow_id": str(uuid.uuid4()),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "steps": steps,
            "metadata": {
                "total_frames_analyzed": len(analyses),
                "steps_generated": len(steps),
                "vlm_tokens_used": total_tokens,
                "estimated_cost_usd": round(total_cost, 4),
                "vlm_provider": analyses[0].get("_provider", "unknown") if analyses else "none"
            }
        }
