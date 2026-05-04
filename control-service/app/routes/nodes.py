from fastapi import APIRouter
from app.services.registry import get_all_nodes, get_nodes_by_role

router = APIRouter()

@router.get("/nodes")
def all_nodes(account_id: str = None):
    nodes = get_all_nodes()
    if account_id:
        return [n for n in nodes if n.get("account_id") == account_id]
    return nodes

@router.get("/nodes/{role}")
def nodes_by_role(role: str, account_id: str = None):
    nodes = get_nodes_by_role(role)
    if account_id:
        return [n for n in nodes if n.get("account_id") == account_id]
    return nodes
