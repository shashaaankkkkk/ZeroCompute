from fastapi import FastAPI
import requests
import os
import socket
from app.routes import compute, storage

app = FastAPI()

CONTROL_URL = os.getenv("CONTROL_URL", "http://localhost:8000")
ACCOUNT_ID = os.getenv("ACCOUNT_ID", "shashank_dev")
NODE_PORT = int(os.getenv("NODE_PORT", 8001))
NODE_ID = os.getenv("NODE_ID", f"node-{socket.gethostname()}")

@app.on_event("startup")
def register():
    try:
        requests.post(f"{CONTROL_URL}/register", json={
            "id": NODE_ID,
            "account_id": ACCOUNT_ID,
            "ip": "localhost",
            "port": NODE_PORT,
            "role": "unified-node",
            "capabilities": ["compute", "storage", "python", "files"],
            "metrics": {"cpu": 15.0, "ram": 40.0}
        }, timeout=5)
    except Exception as e:
        print(f"Mesh registration failed: {e}")

app.include_router(compute.router, prefix="/compute")
app.include_router(storage.router, prefix="/storage")
