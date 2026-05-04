from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import register, nodes

app = FastAPI(title="ZeroCompute Control Plane", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(register.router)
app.include_router(nodes.router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "control-plane"}
