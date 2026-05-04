from app.services.registry_client import get_nodes
from app.services.compute_client import send_task
from app.services.storage_client import fetch_file
from app.core.decision_engine import is_heavy_task

def run_task(data: str):
    if is_heavy_task(data):
        try:
            workers = get_nodes("worker")
            if workers:
                return send_task(workers[0], {
                    "task_id": "1",
                    "payload": data
                })
        except Exception as e:
            print(f"Failed to offload task: {e}")

    # Fallback to local execution
    return {"result": data.lower(), "note": "Execution completed locally"}

def get_file(file_id: str):
    try:
        storage_nodes = get_nodes("storage")
        if storage_nodes:
            return fetch_file(storage_nodes[0], file_id)
    except Exception as e:
        print(f"Failed to fetch file: {e}")
    return None
