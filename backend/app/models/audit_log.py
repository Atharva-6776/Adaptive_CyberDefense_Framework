import json
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, index=True, nullable=False)
    resource = Column(String, nullable=False)
    result = Column(String, nullable=False, default="success")
    metadata_json = Column(Text, nullable=True)
    timestamp = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    user = relationship("User")

    @property
    def user_email(self) -> str:
        if self.user:
            return self.user.email
        if self.metadata_json:
            try:
                data = json.loads(self.metadata_json)
                if isinstance(data, dict) and "user_email" in data:
                    return data["user_email"]
            except Exception:
                pass
        return "system"

    @property
    def details(self) -> Optional[str]:
        if self.metadata_json:
            try:
                data = json.loads(self.metadata_json)
                if isinstance(data, dict):
                    return data.get("details")
            except Exception:
                pass
        return None

    @property
    def ip_address(self) -> Optional[str]:
        if self.metadata_json:
            try:
                data = json.loads(self.metadata_json)
                if isinstance(data, dict):
                    return data.get("ip_address")
            except Exception:
                pass
        return None
