from fastapi import FastAPI
from contextlib import asynccontextmanager
import requests
import os
import socket
import platform
import threading
import time
from app.routes import compute, storage

CONTROL_URL = os.getenv("CONTROL_URL", "http://localhost:8000")
ACCOUNT_ID = os.getenv("ACCOUNT_ID", "shashank_dev")
NODE_PORT = int(os.getenv("NODE_PORT", 8001))
NODE_ID = os.getenv("NODE_ID", f"node-{socket.gethostname()}")

def _get_real_ip():
    """Detect the machine's real IP for remote accessibility."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def _get_system_metrics():
    """Collect real system metrics."""
    try:
        load = os.getloadavg()[0]
        cpu_count = os.cpu_count() or 1
        cpu_pct = round((load / cpu_count) * 100, 1)
    except Exception:
        cpu_pct = 0.0
    return {"cpu": cpu_pct, "cores": os.cpu_count() or 1, "platform": platform.system()}

def _register():
    ip = _get_real_ip()
    metrics = _get_system_metrics()
    payload = {
        "id": NODE_ID,
        "account_id": ACCOUNT_ID,
        "ip": ip,
        "port": NODE_PORT,
        "role": "unified-node",
        "capabilities": ["compute", "storage", "python", "bash"],
        "metrics": metrics,
    }
    try:
        r = requests.post(f"{CONTROL_URL}/register", json=payload, timeout=5)
        print(f"[NODE] Registered as {NODE_ID} at {ip}:{NODE_PORT} -> {r.status_code}")
    except Exception as e:
        print(f"[NODE] Registration failed: {e}")

def _heartbeat_loop():
    """Send heartbeat every 10s so control plane knows we're alive."""
    while True:
        time.sleep(10)
        try:
            requests.post(f"{CONTROL_URL}/heartbeat/{NODE_ID}", timeout=3)
        except Exception:
            pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    _register()
    t = threading.Thread(target=_heartbeat_loop, daemon=True)
    t.start()
    yield

app = FastAPI(title="ZeroCompute Mesh Node", version="1.0.0", lifespan=lifespan)

app.include_router(compute.router, prefix="/compute")
app.include_router(storage.router, prefix="/storage")

@app.get("/health")
def health():
    return {"status": "ok", "node_id": NODE_ID, "port": NODE_PORT}
