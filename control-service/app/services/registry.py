from app.models.node_store import nodes
import time

def register_node(node: dict):
    # Ensure the node has a timestamp and account_id
    node["last_seen"] = time.time()
    nodes[node["id"]] = node
    print(f"REGISTERED NODE: {node['id']} in mesh {node.get('account_id')}")
    return node

def get_all_nodes():
    return list(nodes.values())

def get_nodes_by_role(role: str):
    return [n for n in nodes.values() if n["role"] == role]
