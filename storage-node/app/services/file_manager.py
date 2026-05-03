import os
import shutil
from uuid import uuid4

STORAGE_PATH = "storage/files"
os.makedirs(STORAGE_PATH, exist_ok=True)

files_db = {}

def save_file(upload_file):
    file_id = str(uuid4())
    file_path = os.path.join(STORAGE_PATH, file_id)

    with open(file_path, "wb") as f:
        shutil.copyfileobj(upload_file.file, f)

    files_db[file_id] = {
        "name": upload_file.filename,
        "path": file_path
    }

    return file_id

def get_file(file_id: str):
    return files_db.get(file_id)

def list_files():
    return files_db

