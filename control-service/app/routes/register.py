from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict
from app.services.registry import register_node

router = APIRouter()

class Node(BaseModel):
    id: str
    account_id: str
    ip: str
    port: int
    role: str
    capabilities: List[str] = []
    status: str = "online"
    metrics: Dict[str, float] = {}

@router.post("/register")
def register(node: Node):
    return register_node(node.dict())
