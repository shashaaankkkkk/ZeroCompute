from pydantic import BaseModel
from typing import List, Optional, Dict

class Node(BaseModel):
    id: str
    account_id: str
    ip: str
    port: int
    role: str       # worker, storage, control
    capabilities: List[str] = ["python", "bash"]
    status: str = "online"
    metrics: Dict[str, float] = {"cpu": 0.0, "ram": 0.0}
