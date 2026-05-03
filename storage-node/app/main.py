from fastapi import FastAPI
import requests
from app.routes import upload, download, list as list_routes

app = FastAPI()

CONTROL_URL = "http://localhost:8000"

@app.on_event("startup")
def register():
    requests.post(f"{CONTROL_URL}/register", json={
        "id": "storage-1",
        "ip": "localhost",
        "port": 8002,
        "role": "storage"
    })

app.include_router(upload.router)
app.include_router(download.router)
app.include_router(list_routes.router)
