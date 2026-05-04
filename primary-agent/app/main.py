from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from app.core.orchestrator import run_task
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

class TaskRequest(BaseModel):
    task_id: str
    payload: str

@app.post("/task")
async def handle_task_request(request: TaskRequest):
    try:
        logger.info(f"Received task {request.task_id}")
        result = run_task(request.payload)
        return {"task_id": request.task_id, "result": result}
    except Exception as e:
        logger.error(f"Task failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok"}
