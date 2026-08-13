from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    violation_type = Column(String, nullable=False)  # e.g., "no-helmet", "no-vest", "no-ppe"
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    severity = Column(String, default="medium", nullable=False)  # critical, high, medium, low
    status = Column(String, default="active", nullable=False)  # active, investigating, resolved
    description = Column(String, nullable=True)
    evidence_path = Column(String, nullable=True)

    camera = relationship("Camera", back_populates="alerts")


# We also need to add a relationship to Camera model, so let's import Alert inside Camera later if needed,
# or add the relationship on the Camera model. Let's add 'alerts' relationship to Camera model.
