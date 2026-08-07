from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel


class PathRotationInfo(BaseModel):
    dynamic_path: str
    target_handler: str
    created_at: datetime
    status: str  # "active" or "deprecated"


class MTDStatusResponse(BaseModel):
    mtd_enabled: bool
    current_seed: str
    active_routes: Dict[str, str]  # dynamic_path -> real_path mapping
    decoy_paths: List[str]
    rotation_interval_seconds: int
    last_rotation: Optional[datetime] = None
    next_rotation_in_seconds: Optional[float] = None
    rotation_history: List[PathRotationInfo] = []


class HoneypotLogEntry(BaseModel):
    id: Optional[int] = None
    decoy_path_triggered: str
    ip_address: str
    user_agent: Optional[str] = None
    timestamp: datetime
    headers_logged: Dict[str, str]
