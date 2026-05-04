import requests

CONTROL_URL = "http://localhost:8000"
ACCOUNT_ID = "shashank_dev"

def get_nodes(role: str):
    # Only fetch nodes belonging to our specific mesh/account
    res = requests.get(f"{CONTROL_URL}/nodes/{role}?account_id={ACCOUNT_ID}")
    return res.json()
