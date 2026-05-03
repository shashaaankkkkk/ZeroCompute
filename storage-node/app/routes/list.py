from fastapi import APIRouter
from app.services.file_manager import list_files

router = APIRouter()

@router.get("/list")
def list_all():
    return list_files()
