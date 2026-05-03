from app.models.node_store import nodes

def register_node(node: dict):
    nodes[node["id"]] = node
    return node

def get_all_nodes():
    return list(nodes.values())

def get_nodes_by_role(role: str):
    return [n for n in nodes.values() if n["role"] == role]
