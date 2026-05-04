from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.registry import register_node, heartbeat_node, remove_node

router = APIRouter()

class NodeRegistration(BaseModel):
    id: str
    account_id: str
    ip: str
    port: int
    role: str = "unified-node"
    capabilities: List[str] = []
    status: str = "online"
    metrics: Dict[str, Any] = {}

@router.post("/register")
def register(node: NodeRegistration):
    return register_node(node.dict())

@router.post("/heartbeat/{node_id}")
def heartbeat(node_id: str):
    if heartbeat_node(node_id):
        return {"status": "ok"}
    return {"status": "unknown_node"}

@router.delete("/nodes/{node_id}")
def deregister(node_id: str):
    if remove_node(node_id):
        return {"status": "removed"}
    return {"status": "not_found"}
