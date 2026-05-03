from fastapi import FastAPI
import requests
from app.routes import compute

app = FastAPI()

CONTROL_URL = "http://localhost:8000"

@app.on_event("startup")
def register():
    requests.post(f"{CONTROL_URL}/register", json={
        "id": "worker-1",
        "ip": "localhost",
        "port": 8001,
        "role": "worker"
    })

app.include_router(compute.router)
