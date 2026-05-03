from fastapi import FastAPI
from app.routes import register, nodes

app = FastAPI()

app.include_router(register.router)
app.include_router(nodes.router)
