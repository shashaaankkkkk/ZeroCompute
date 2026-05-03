import requests

def send_task(worker, task):
    url = f"http://{worker['ip']}:{worker['port']}/compute"
    return requests.post(url, json=task).json()
