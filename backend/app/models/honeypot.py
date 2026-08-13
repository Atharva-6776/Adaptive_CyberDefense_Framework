from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, JSON
from app.core.database import Base


class HoneypotLog(Base):
    __tablename__ = "honeypot_logs"

    id = Column(Integer, primary_key=True, index=True)
    decoy_path_triggered = Column(String, nullable=False)
    ip_address = Column(String, nullable=False)
    user_agent = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    headers_logged = Column(JSON, nullable=True)
