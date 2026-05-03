from fastapi import APIRouter
from app.services.registry import get_all_nodes, get_nodes_by_role

router = APIRouter()

@router.get("/nodes")
def all_nodes():
    return get_all_nodes()

@router.get("/nodes/{role}")
def nodes_by_role(role: str):
    return get_nodes_by_role(role)
