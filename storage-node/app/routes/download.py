from fastapi import APIRouter
from app.services.file_manager import get_file

router = APIRouter()

@router.get("/download/{file_id}")
def download(file_id: str):
    file = get_file(file_id)
    if not file:
        return {"error": "Not found"}
    return {"file_path": file["path"]}
