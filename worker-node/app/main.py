from fastapi import FastAPI
import requests
import os
from app.routes import compute

app = FastAPI()

CONTROL_URL = os.getenv("CONTROL_URL", "http://localhost:8000")
ACCOUNT_ID = os.getenv("ACCOUNT_ID", "shashank_dev")

@app.on_event("startup")
def register():
    try:
        requests.post(f"{CONTROL_URL}/register", json={
            "id": "worker-1",
            "account_id": ACCOUNT_ID,
            "ip": "localhost",
            "port": 8001,
            "role": "worker",
            "capabilities": ["python", "bash", "remote-exec"],
            "metrics": {"cpu": 10.0, "ram": 30.0}
        }, timeout=5)
    except Exception as e:
        print(f"Registration failed: {e}")

app.include_router(compute.router, prefix="/compute")
