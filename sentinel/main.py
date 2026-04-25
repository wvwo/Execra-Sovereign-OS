import os
import json
import hashlib
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Request, Response
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Tuple
import aiohttp
from geopy.distance import geodesic
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

app = FastAPI(title="Process Autopilot Sentinel", description="ISO 27001/9001 Audit and Security Layer")

audit_log_entries = Counter('autopilot_audit_log_entries_total', 'Total audit log entries', ['event_type', 'status'])
sentinel_alerts = Counter('autopilot_sentinel_alerts_total', 'Total security alerts', ['rule_name', 'severity'])
anomaly_detection_duration = Histogram('autopilot_anomaly_detection_duration_seconds', 'Anomaly detection duration')

@app.get("/metrics")
async def metrics(request: Request):
    client_ip = request.client.host if request.client else ""
    if client_ip in ("127.0.0.1", "::1") or client_ip.startswith("172.") or client_ip.startswith("10."):
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
    return Response("Forbidden", status_code=403)

LOG_DIR = "/var/log/process_autopilot/audit/hot"
os.makedirs(LOG_DIR, exist_ok=True)

class AuditLog(BaseModel):
    session_id: str
    workflow_id: str
    step_id: Optional[int] = None
    event_type: str = Field(..., description="STEP_EXECUTION | WORKFLOW_START | WORKFLOW_COMPLETE | AUTH_SUCCESS | AUTH_FAILURE | CAPTCHA_ENCOUNTERED | ANOMALY_DETECTED")
    action: Optional[str] = None
    status: str
    severity: str = "info"
    user_id: str = "system"
    source_ip: str = "127.0.0.1"
    target_url: Optional[str] = None
    details: Dict[str, Any] = {}
    screenshot_path: Optional[str] = None
    processing_time_ms: Optional[int] = None
    retry_count: Optional[int] = 0

class ImmutableAuditStore:
    def __init__(self):
        self.log_dir = LOG_DIR
        os.makedirs(self.log_dir, exist_ok=True)

    def _get_current_file(self) -> str:
        date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        return os.path.join(self.log_dir, f"audit_{date_str}.jsonl")

    def get_previous_hash(self, filepath: str) -> str:
        if not os.path.exists(filepath):
            return "0" * 64
        try:
            with open(filepath, 'r') as f:
                lines = f.readlines()
                if lines:
                    last_line = json.loads(lines[-1].strip())
                    return last_line.get("hash", "0" * 64)
        except Exception:
            pass
        return "0" * 64

    async def query(self, user_id=None, event_type=None, session_id=None, limit=100) -> list:
        # Mocked query method for AnomalyDetector & QualityAssuranceEngine
        filepath = self._get_current_file()
        results = []
        if not os.path.exists(filepath):
            return results
        with open(filepath, 'r') as f:
            for line in f:
                data = json.loads(line.strip())
                if user_id and data.get("user_id") != user_id: continue
                if event_type and data.get("event_type") != event_type: continue
                if session_id and data.get("session_id") != session_id: continue
                results.append(data)
        return results[-limit:]

store = ImmutableAuditStore()

class AnomalyDetector:
    def __init__(self, store: ImmutableAuditStore):
        self.store = store
        self.ALERT_THRESHOLD_IMPOSSIBLE_TRAVEL_KM = 500
        self.RULES = {
            "BRUTE_FORCE": {
                "condition": lambda log: log.event_type == "AUTH_FAILURE" and (log.retry_count or 0) > 5,
                "severity": "critical",
                "action": "alert"
            },
            "BOT_DETECTION": {
                "condition": lambda log: log.event_type == "CAPTCHA_ENCOUNTERED",
                "severity": "warning",
                "action": "alert + suggest_api"
            }
        }

    async def _get_ip_location(self, ip: str) -> Optional[Tuple[float, float]]:
        if ip == "127.0.0.1" or ip.startswith("192.168."):
            return None
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"https://ipapi.co/{ip}/json/", timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    data = await resp.json()
                    if data.get("status") == "success":
                        return (data["lat"], data["lon"])
        except Exception:
            pass
        return None

    async def _check_impossible_travel(self, entry: AuditLog) -> Optional[Dict]:
        if entry.event_type != "AUTH_SUCCESS" or not entry.source_ip:
            return None
        
        current_location = await self._get_ip_location(entry.source_ip)
        if not current_location:
            return None
        
        recent_logins = await self.store.query(
            user_id=entry.user_id,
            event_type="AUTH_SUCCESS",
            limit=100
        )
        
        for prev_login in recent_logins:
            if prev_login.get("source_ip") == entry.source_ip:
                continue
            
            prev_location = await self._get_ip_location(prev_login.get("source_ip"))
            if not prev_location:
                continue
            
            distance_km = geodesic(current_location, prev_location).kilometers
            if distance_km > self.ALERT_THRESHOLD_IMPOSSIBLE_TRAVEL_KM:
                return {
                    "rule_name": "IMPOSSIBLE_TRAVEL",
                    "severity": "critical",
                    "action": "alert",
                    "details": f"User logged in from {distance_km:.0f}km away in < 1 hour"
                }
        return None

    async def detect(self, log: AuditLog) -> Optional[Dict[str, str]]:
        for anomaly_name, rule in self.RULES.items():
            if rule["condition"](log):
                return {
                    "anomaly": anomaly_name,
                    "severity": rule["severity"],
                    "action": rule["action"]
                }
        travel_alert = await self._check_impossible_travel(log)
        if travel_alert:
            return travel_alert
        return None

detector = AnomalyDetector(store)

class QualityAssuranceEngine:
    def __init__(self, store: ImmutableAuditStore):
        self.store = store
        self.KPI_MAX_PROCESSING_TIME_MS = 60000
        self.KPI_TARGET_SUCCESS_RATE = 0.8
    
    async def compute_metrics(self, workflow_id: str, session_id: str):
        entries = await self.store.query(session_id=session_id, limit=1000)
        
        total_steps = len([e for e in entries if e.get("event_type") == "STEP_EXECUTION"])
        successful = len([e for e in entries if e.get("status") == "success"])
        failed = len([e for e in entries if e.get("status") == "failure"])
        retries = len([e for e in entries if e.get("event_type") == "STEP_RETRY"])
        
        try:
            start_times = [datetime.fromisoformat(e.get("timestamp")) for e in entries if e.get("event_type") == "WORKFLOW_START"]
            end_times = [datetime.fromisoformat(e.get("timestamp")) for e in entries if e.get("event_type") == "WORKFLOW_COMPLETE"]
            duration_ms = 0
            if start_times and end_times:
                duration_ms = int((max(end_times) - min(start_times)).total_seconds() * 1000)
        except Exception:
            duration_ms = 0
        
        first_try_success = (total_steps - retries) / max(total_steps, 1)
        
        return {
            "workflow_id": workflow_id,
            "total_steps": total_steps,
            "successful_steps": successful,
            "failed_steps": failed,
            "retry_count": retries,
            "total_duration_ms": duration_ms,
            "first_try_success_rate": first_try_success,
            "meets_sla": (duration_ms <= self.KPI_MAX_PROCESSING_TIME_MS and first_try_success >= self.KPI_TARGET_SUCCESS_RATE)
        }

qa_engine = QualityAssuranceEngine(store)

def calculate_hash(data_str: str, previous_hash: str) -> str:
    hash_input = f"{previous_hash}{data_str}".encode('utf-8')
    return hashlib.sha256(hash_input).hexdigest()

@app.post("/api/v1/audit/log")
async def log_audit_event(log: AuditLog):
    filepath = store._get_current_file()
    previous_hash = store.get_previous_hash(filepath)
    
    log_dict = log.dict()
    log_dict["timestamp"] = datetime.now(timezone.utc).isoformat()
    
    anomaly = await detector.detect(log)
    if anomaly:
        log_dict["anomaly_detected"] = anomaly
    
    data_str = json.dumps({k: v for k, v in log_dict.items() if k not in ["hash", "previous_hash"]}, sort_keys=True)
    current_hash = calculate_hash(data_str, previous_hash)
    log_dict["hash"] = current_hash
    log_dict["previous_hash"] = previous_hash

    try:
        with open(filepath, 'a') as f:
            f.write(json.dumps(log_dict) + "\n")
            os.fsync(f.fileno()) 
    except Exception as e:
        import logging
        logging.error(f"Failed to write audit log: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal audit logging error")
        
    return {"status": "logged", "hash": current_hash, "anomaly": anomaly}

@app.get("/api/v1/quality/metrics/{workflow_id}/{session_id}")
async def get_metrics(workflow_id: str, session_id: str):
    return await qa_engine.compute_metrics(workflow_id, session_id)

@app.get("/api/v1/health")
def health_check():
    return {"status": "healthy", "service": "sentinel", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.get("/api/v1/audit/verify/{date_str}")
def verify_integrity(date_str: str):
    filepath = os.path.join(LOG_DIR, f"audit_{date_str}.jsonl")
    if not os.path.exists(filepath):
        return {"valid": False, "errors": ["File not found"]}
    
    previous_hash = "0" * 64
    valid = True
    errors = []
    
    with open(filepath, 'r') as f:
        for line_num, line in enumerate(f, 1):
            try:
                log_data = json.loads(line.strip())
                recorded_hash = log_data.pop("hash")
                log_data.pop("previous_hash", None)
                
                data_str = json.dumps(log_data, sort_keys=True)
                computed_hash = calculate_hash(data_str, previous_hash)
                
                if computed_hash != recorded_hash:
                    valid = False
                    errors.append(f"Hash mismatch at line {line_num}")
                    break
                    
                previous_hash = computed_hash
            except Exception as e:
                valid = False
                errors.append(f"Parsing error at line {line_num}: {str(e)}")
                break
                
    return {"valid": valid, "errors": errors, "last_hash": previous_hash}
