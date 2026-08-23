from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.core.database import Base


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, index=True, nullable=False)  # e.g. "notifications", "security", "mtd", "api", "appearance"
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)  # Stored value (JSON string or plain string)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    updated_by = Column(String, nullable=True)
