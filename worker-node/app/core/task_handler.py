def handle_task(payload: str):
    """
    Handles a compute task by processing the payload.
    For now, it just reverses the string as a demonstration.
    """
    print(f"Processing task with payload: {payload}")
    # Simulate some work
    result = payload[::-1]
    return result
