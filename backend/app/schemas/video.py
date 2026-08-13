from datetime import datetime
from typing import Optional, Dict
from pydantic import BaseModel, Field


class CameraBase(BaseModel):
    name: str
    location: str
    ip_address: Optional[str] = None
    status: str = "offline"
    health: int = 100
    violations: int = 0
    fps: int = 30
    resolution: str = "1920x1080"
    stream_type: str = "RTSP / H.264"
    preview_bg: str = "from-slate-800 to-cyan-950"
    stream_url: Optional[str] = None


class CameraCreate(CameraBase):
    pass


class CameraUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    ip_address: Optional[str] = None
    status: Optional[str] = None
    health: Optional[int] = None
    violations: Optional[int] = None
    fps: Optional[int] = None
    resolution: Optional[str] = None
    stream_type: Optional[str] = None
    preview_bg: Optional[str] = None
    stream_url: Optional[str] = None


class CameraResponse(BaseModel):
    id: int
    name: str
    location: str
    ipAddress: Optional[str] = None
    status: str
    health: int
    violations: int
    fps: int
    resolution: str
    lastActive: str
    streamType: str
    previewBg: str
    is_ingesting: bool
    stream_url: Optional[str] = None

    model_config = {
        "from_attributes": True
    }

    @classmethod
    def model_validate(cls, obj, **kwargs):
        last_active_str = "N/A"
        if isinstance(obj.last_active, datetime):
            last_active_str = obj.last_active.strftime("%Y-%m-%d %H:%M:%S")
        elif obj.last_active:
            last_active_str = str(obj.last_active)

        return cls(
            id=obj.id,
            name=obj.name,
            location=obj.location,
            ipAddress=obj.ip_address,
            status=obj.status,
            health=obj.health,
            violations=obj.violations,
            fps=obj.fps,
            resolution=obj.resolution,
            lastActive=last_active_str,
            streamType=obj.stream_type,
            previewBg=obj.preview_bg,
            is_ingesting=obj.is_ingesting,
            stream_url=obj.stream_url
        )


class VideoMetricsResponse(BaseModel):
    total_cameras: int
    online_cameras: int
    active_alerts: int
    system_health: str
