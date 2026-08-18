from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Integer, String
from app.core.database import Base


class ThreatBlock(Base):
    __tablename__ = "threat_blocks"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, unique=True, index=True, nullable=False)
    reason = Column(String, nullable=True)
    threat_score = Column(Integer, default=0, nullable=False)
    hit_count = Column(Integer, default=0, nullable=False)
    first_seen = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    last_seen = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    blocked_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, default="active", nullable=False)  # "active", "blocked", "expired", "unblocked"
