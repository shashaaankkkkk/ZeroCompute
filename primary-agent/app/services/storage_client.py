import requests

def fetch_file(storage, file_id):
    url = f"http://{storage['ip']}:{storage['port']}/download/{file_id}"
    return requests.get(url).json()
