from fastapi import FastAPI
import requests
import os
from app.routes import upload, download, list as list_routes

app = FastAPI()

CONTROL_URL = os.getenv("CONTROL_URL", "http://localhost:8000")
ACCOUNT_ID = os.getenv("ACCOUNT_ID", "shashank_dev")

@app.on_event("startup")
def register():
    try:
        requests.post(f"{CONTROL_URL}/register", json={
            "id": "storage-1",
            "account_id": ACCOUNT_ID,
            "ip": "localhost",
            "port": 8002,
            "role": "storage",
            "capabilities": ["file-storage", "sync"],
            "metrics": {"cpu": 5.0, "ram": 20.0}
        }, timeout=5)
    except Exception as e:
        print(f"Failed to register: {e}")

app.include_router(upload.router)
app.include_router(download.router)
app.include_router(list_routes.router)
