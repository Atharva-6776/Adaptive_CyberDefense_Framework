from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    ip_address = Column(String, nullable=True)
    status = Column(String, default="offline", nullable=False)  # online, offline, warning
    health = Column(Integer, default=100, nullable=False)
    violations = Column(Integer, default=0, nullable=False)
    fps = Column(Integer, default=30, nullable=False)
    resolution = Column(String, default="1920x1080", nullable=False)
    last_active = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    stream_type = Column(String, default="RTSP / H.264", nullable=False)
    preview_bg = Column(String, default="from-slate-800 to-cyan-950", nullable=False)
    stream_url = Column(String, nullable=True)  # Video path, webcam index or RTSP URL
    is_ingesting = Column(Boolean, default=False, nullable=False)

    alerts = relationship("Alert", back_populates="camera", cascade="all, delete-orphan")

