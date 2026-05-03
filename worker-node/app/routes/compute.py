from fastapi import APIRouter
from pydantic import BaseModel
from app.services.executor import execute

router = APIRouter()

class Task(BaseModel):
    task_id: str
    payload: str

@router.post("/compute")
def compute(task: Task):
    return execute(task.dict())
