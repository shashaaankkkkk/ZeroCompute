from fastapi import APIRouter, UploadFile, File
from app.services.file_manager import save_file

router = APIRouter()

@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    file_id = save_file(file)
    return {"file_id": file_id}
