"""
ThreatEvent model — persists every security signal observed by the correlation engine.
ThreatScore model — stores the current aggregate risk score per IP address.
"""
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from app.core.database import Base


class ThreatEvent(Base):
    __tablename__ = "threat_events"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, index=True, nullable=False)
    event_type = Column(String, nullable=False)       # e.g. "honeypot_hit", "failed_login"
    source = Column(String, nullable=False)           # e.g. "mtd", "auth", "surveillance"
    severity = Column(String, default="LOW")          # LOW / MEDIUM / HIGH / CRITICAL
    score = Column(Float, default=0.0)                # points contributed by this event
    metadata_json = Column(Text, nullable=True)       # extra JSON-encoded context
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ThreatScore(Base):
    __tablename__ = "threat_scores"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, unique=True, index=True, nullable=False)
    current_score = Column(Float, default=0.0, nullable=False)
    threat_level = Column(String, default="LOW", nullable=False)  # LOW/MEDIUM/HIGH/CRITICAL
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    active_block_id = Column(Integer, ForeignKey("threat_blocks.id"), nullable=True)
