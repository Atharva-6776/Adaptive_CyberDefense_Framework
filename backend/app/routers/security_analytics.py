"""
Security Analytics Router — exposes threat data and risk metrics.

Endpoints:
  GET  /api/v1/security/threats          — active threats ordered by score
  GET  /api/v1/security/threats/{ip}     — full event timeline for an IP
  GET  /api/v1/security/metrics          — dashboard summary metrics
  POST /api/v1/security/recalculate      — admin-only manual recalculation
"""
from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.threat_block import ThreatBlock
from app.models.threat_event import ThreatEvent, ThreatScore
from app.schemas.security_analytics import (
    RecalculateResponse,
    SecurityMetrics,
    ThreatDetail,
    ThreatEventOut,
    ThreatScoreOut,
)
from app.services.risk_engine import risk_engine
from app.utils.deps import get_current_user, get_db
from app.models.user import User

router = APIRouter(prefix="/security", tags=["Security Analytics"])


def _require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


# ── GET /security/threats ──────────────────────────────────────────────────────

@router.get("/threats", response_model=List[ThreatScoreOut])
def list_active_threats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all tracked IPs ordered by current risk score (descending)."""
    scores = (
        db.query(ThreatScore)
        .order_by(ThreatScore.current_score.desc())
        .all()
    )
    return scores


# ── GET /security/threats/{ip} ─────────────────────────────────────────────────

@router.get("/threats/{ip_address}", response_model=ThreatDetail)
def get_threat_detail(
    ip_address: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the risk score and full event timeline for a specific IP."""
    score_rec = db.query(ThreatScore).filter(
        ThreatScore.ip_address == ip_address
    ).first()
    if not score_rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No threat data found for IP {ip_address}",
        )

    events = (
        db.query(ThreatEvent)
        .filter(ThreatEvent.ip_address == ip_address)
        .order_by(ThreatEvent.created_at.desc())
        .all()
    )

    return ThreatDetail(score=score_rec, events=events)


# ── GET /security/metrics ──────────────────────────────────────────────────────

@router.get("/metrics", response_model=SecurityMetrics)
def get_security_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return aggregated dashboard metrics."""
    now = datetime.utcnow()
    window_24h = now - timedelta(hours=24)

    # Active blocks
    active_blocks = db.query(ThreatBlock).filter(
        ThreatBlock.status == "blocked"
    ).count()

    # Critical threats
    critical_threats = db.query(ThreatScore).filter(
        ThreatScore.threat_level == "CRITICAL"
    ).count()

    # Honeypot hits in last 24 h
    honeypot_hits_24h = db.query(ThreatEvent).filter(
        ThreatEvent.event_type == "honeypot_hit",
        ThreatEvent.created_at >= window_24h,
    ).count()

    # Failed logins in last 24 h
    failed_logins_24h = db.query(ThreatEvent).filter(
        ThreatEvent.event_type == "failed_login",
        ThreatEvent.created_at >= window_24h,
    ).count()

    # Average threat score
    avg_result = db.query(func.avg(ThreatScore.current_score)).scalar()
    average_threat_score = round(float(avg_result or 0.0), 2)

    # Top 10 offending IPs
    top_ips_query = (
        db.query(ThreatScore)
        .order_by(ThreatScore.current_score.desc())
        .limit(10)
        .all()
    )
    top_offending_ips = [
        {
            "ip_address": s.ip_address,
            "current_score": round(s.current_score, 2),
            "threat_level": s.threat_level,
        }
        for s in top_ips_query
    ]

    return SecurityMetrics(
        active_blocks=active_blocks,
        critical_threats=critical_threats,
        honeypot_hits_24h=honeypot_hits_24h,
        failed_logins_24h=failed_logins_24h,
        average_threat_score=average_threat_score,
        top_offending_ips=top_offending_ips,
    )


# ── POST /security/recalculate ─────────────────────────────────────────────────

@router.post("/recalculate", response_model=RecalculateResponse)
def recalculate_scores(
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    """Admin only — manually trigger score recalculation with decay applied."""
    updated = risk_engine.recalculate_all(db)
    return RecalculateResponse(
        recalculated=updated,
        message=f"Recalculated {updated} threat scores with decay applied.",
    )
