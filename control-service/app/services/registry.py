from app.models.node_store import nodes
import time

STALE_TIMEOUT = 30  # seconds before a node is considered offline

def register_node(node: dict):
    node["last_seen"] = time.time()
    nodes[node["id"]] = node
    print(f"[REGISTRY] Node registered: {node['id']} -> {node.get('ip')}:{node.get('port')} (mesh: {node.get('account_id')})")
    return node

def heartbeat_node(node_id: str):
    if node_id in nodes:
        nodes[node_id]["last_seen"] = time.time()
        return True
    return False

def get_all_nodes():
    _prune_stale()
    return list(nodes.values())

def get_nodes_by_role(role: str):
    _prune_stale()
    return [n for n in nodes.values() if n["role"] == role]

def remove_node(node_id: str):
    if node_id in nodes:
        del nodes[node_id]
        return True
    return False

def _prune_stale():
    now = time.time()
    stale = [nid for nid, n in nodes.items() if now - n.get("last_seen", 0) > STALE_TIMEOUT]
    for nid in stale:
        print(f"[REGISTRY] Pruning stale node: {nid}")
        del nodes[nid]
