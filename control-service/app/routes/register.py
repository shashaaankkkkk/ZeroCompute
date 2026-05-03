from fastapi import APIRouter
from pydantic import BaseModel
from app.services.registry import register_node

router = APIRouter()

class Node(BaseModel):
    id: str
    ip: str
    port: int
    role: str

@router.post("/register")
def register(node: Node):
    return register_node(node.dict())
