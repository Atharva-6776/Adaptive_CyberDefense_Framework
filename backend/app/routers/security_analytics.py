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
    ThreatBlockOut,
    ManualBlockRequest,
)
from app.services.risk_engine import risk_engine
from app.services.audit_service import audit_service
from app.utils.deps import get_current_user, get_db, RequirePermission
from app.models.user import User

router = APIRouter(prefix="/security", tags=["Security Analytics"])

require_security_monitoring = RequirePermission("security_monitoring")
require_threat_management = RequirePermission("threat_management")
require_ip_blocking = RequirePermission("ip_blocking")


# ── GET /security/threats ──────────────────────────────────────────────────────

@router.get("/threats", response_model=List[ThreatScoreOut])
def list_active_threats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_security_monitoring),
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
    current_user: User = Depends(require_security_monitoring),
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
    current_user: User = Depends(require_security_monitoring),
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
    current_user: User = Depends(require_threat_management),
):
    """Admin only — manually trigger score recalculation with decay applied."""
    updated = risk_engine.recalculate_all(db)
    
    audit_service.log_action(
        db=db,
        user_id=current_user.id,
        action="recalculate_scores",
        resource="risk_engine",
        result="success",
        metadata={"updated_count": updated}
    )
    
    return RecalculateResponse(
        recalculated=updated,
        message=f"Recalculated {updated} threat scores with decay applied.",
    )


# ── GET /security/blocks ───────────────────────────────────────────────────────

@router.get("/blocks", response_model=List[ThreatBlockOut])
def list_blocks(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_security_monitoring),
):
    """Return all threat block history."""
    blocks = db.query(ThreatBlock).order_by(ThreatBlock.last_seen.desc()).all()
    return blocks


# ── POST /security/blocks/{ip}/block ───────────────────────────────────────────

@router.post("/blocks/{ip_address}/block", response_model=ThreatBlockOut)
def manual_block_ip(
    ip_address: str,
    req: ManualBlockRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_ip_blocking),
):
    """Admin only — manually block an IP address."""
    from datetime import timezone
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    expires_at = now + timedelta(minutes=req.duration_minutes)

    block = db.query(ThreatBlock).filter(ThreatBlock.ip_address == ip_address).first()
    if not block:
        block = ThreatBlock(
            ip_address=ip_address,
            reason=req.reason,
            threat_score=100,
            hit_count=1,
            status="blocked",
            first_seen=now,
            last_seen=now,
            blocked_at=now,
            expires_at=expires_at,
        )
        db.add(block)
    else:
        block.status = "blocked"
        block.reason = req.reason
        block.last_seen = now
        block.blocked_at = now
        block.expires_at = expires_at

    # Check if a ThreatScore exists and link it
    score_rec = db.query(ThreatScore).filter(ThreatScore.ip_address == ip_address).first()
    if score_rec:
        score_rec.threat_level = "CRITICAL"
        score_rec.current_score = max(score_rec.current_score, 100.0)
        
    db.flush()
    if score_rec:
        score_rec.active_block_id = block.id

    from app.services.threat_mitigation import threat_mitigation_service
    threat_mitigation_service._blocked_cache[ip_address] = expires_at

    db.commit()
    db.refresh(block)
    
    audit_service.log_action(
        db=db,
        user_id=current_user.id,
        action="block_ip",
        resource=f"ip:{ip_address}",
        result="success",
        metadata={"reason": req.reason, "duration_minutes": req.duration_minutes}
    )
    
    return block


# ── POST /security/blocks/{ip}/unblock ─────────────────────────────────────────

@router.post("/blocks/{ip_address}/unblock", response_model=ThreatBlockOut)
def manual_unblock_ip(
    ip_address: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_ip_blocking),
):
    """Admin only — manually unblock an IP address."""
    block = db.query(ThreatBlock).filter(ThreatBlock.ip_address == ip_address).first()
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No block record found for IP {ip_address}",
        )

    block.status = "unblocked"
    # Do not reset expires_at so history remains clear

    score_rec = db.query(ThreatScore).filter(ThreatScore.ip_address == ip_address).first()
    if score_rec:
        score_rec.active_block_id = None
        # Maybe lower score slightly or leave it to decay

    from app.services.threat_mitigation import threat_mitigation_service
    if ip_address in threat_mitigation_service._blocked_cache:
        del threat_mitigation_service._blocked_cache[ip_address]

    db.commit()
    db.refresh(block)
    
    audit_service.log_action(
        db=db,
        user_id=current_user.id,
        action="unblock_ip",
        resource=f"ip:{ip_address}",
        result="success"
    )
    
    return block
