import requests

CONTROL_URL = "http://localhost:8000"

def get_nodes(role: str):
    res = requests.get(f"{CONTROL_URL}/nodes/{role}")
    return res.json()
