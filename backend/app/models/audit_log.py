from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
<<<<<<< HEAD
from app.core.database import Base

=======
from sqlalchemy.orm import relationship
from app.core.database import Base


>>>>>>> origin/main
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
<<<<<<< HEAD
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, index=True, nullable=False)
    resource = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    result = Column(String, nullable=False)
    metadata_json = Column(Text, nullable=True)
=======
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_email = Column(String, nullable=False)
    action = Column(String, nullable=False)      # e.g. "REPORT_GENERATED", "SETTINGS_UPDATED", "REPORT_EXPORTED"
    resource = Column(String, nullable=False)    # e.g. "reports", "settings"
    details = Column(Text, nullable=True)        # JSON string or description
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User")
>>>>>>> origin/main
