from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AlertCreate(BaseModel):
    camera_id: int
    title: str
    violation_type: str
    severity: str = "medium"
    status: str = "active"
    description: Optional[str] = None
    evidence_path: Optional[str] = None


class AlertUpdateStatus(BaseModel):
    status: str  # active, investigating, resolved


class AlertResponse(BaseModel):
    id: int
    camera_id: int
    title: str
    camera: str
    location: str
    timestamp: str
    rawTimestamp: float
    severity: str
    status: str
    description: Optional[str] = None
    evidence_path: Optional[str] = None

    model_config = {
        "from_attributes": True
    }

    @classmethod
    def model_validate(cls, obj, **kwargs):
        camera_name = "Unknown Camera"
        location = "Unknown Location"
        if obj.camera:
            camera_name = obj.camera.name
            location = obj.camera.location

        raw_ts = 0.0
        timestamp_str = "N/A"
        if isinstance(obj.timestamp, datetime):
            raw_ts = obj.timestamp.timestamp()
            timestamp_str = obj.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        elif obj.timestamp:
            timestamp_str = str(obj.timestamp)

        return cls(
            id=obj.id,
            camera_id=obj.camera_id,
            title=obj.title,
            camera=camera_name,
            location=location,
            timestamp=timestamp_str,
            rawTimestamp=raw_ts,
            severity=obj.severity,
            status=obj.status,
            description=obj.description,
            evidence_path=obj.evidence_path
        )
