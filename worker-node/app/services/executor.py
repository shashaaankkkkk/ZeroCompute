from app.core.task_handler import handle_task

def execute(task: dict):
    result = handle_task(task["payload"])
    return {
        "task_id": task["task_id"],
        "result": result
    }
