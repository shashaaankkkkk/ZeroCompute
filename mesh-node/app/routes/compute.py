from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import subprocess
import sys
import tempfile
import os

router = APIRouter()

class ExecutionRequest(BaseModel):
    engine: str = "python"
    code: str

@router.post("/execute")
async def execute_code(request: ExecutionRequest):
    # BRIGHT CONSOLE ALERT
    print("\n" + "="*50)
    print("🚀 INCOMING TASK FROM MESH PORTAL")
    print(f"Engine: {request.engine}")
    print("-" * 50)
    print(request.code)
    print("="*50 + "\n")
    
    if request.engine == "python":
        return run_python(request.code)
    elif request.engine == "bash":
        return run_bash(request.code)
    else:
        raise HTTPException(status_code=400, detail="Unsupported engine")

def run_python(code: str):
    with tempfile.NamedTemporaryFile(suffix=".py", delete=False) as tmp:
        tmp.write(code.encode())
        tmp_path = tmp.name
    try:
        result = subprocess.run([sys.executable, tmp_path], capture_output=True, text=True, timeout=30)
        os.remove(tmp_path)
        print(f"✅ Execution Finished. Output size: {len(result.stdout)} bytes")
        return {"stdout": result.stdout, "stderr": result.stderr, "exit_code": result.returncode}
    except Exception as e:
        if os.path.exists(tmp_path): os.remove(tmp_path)
        return {"error": str(e)}

def run_bash(code: str):
    try:
        result = subprocess.run(["bash", "-c", code], capture_output=True, text=True, timeout=30)
        return {"stdout": result.stdout, "stderr": result.stderr, "exit_code": result.returncode}
    except Exception as e:
        return {"error": str(e)}
