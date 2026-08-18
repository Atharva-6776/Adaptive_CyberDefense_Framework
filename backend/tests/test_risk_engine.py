"""
Tests for the Risk Engine — scoring, classification, decay, escalation, blocks.
"""
import time
import pytest
from datetime import datetime, timedelta
from app.models.threat_event import ThreatEvent, ThreatScore
from app.models.threat_block import ThreatBlock
from app.services.risk_engine import (
    RiskEngine,
    classify_threat_level,
    apply_decay,
    DECAY_RATE_PER_HOUR,
    EVENT_WEIGHTS,
)


# ── helpers ────────────────────────────────────────────────────────────────────

def fresh_engine():
    return RiskEngine()


# ── 1. Score calculation ───────────────────────────────────────────────────────

def test_score_calculation_single_event(client, db_session):
    engine = fresh_engine()
    score_rec, level = engine.record_event(
        db=db_session,
        ip_address="1.1.1.1",
        event_type="honeypot_hit",
        source="test",
    )
    assert score_rec.current_score == pytest.approx(EVENT_WEIGHTS["honeypot_hit"], abs=1.0)
    assert level == classify_threat_level(EVENT_WEIGHTS["honeypot_hit"])


def test_score_calculation_accumulates(client, db_session):
    engine = fresh_engine()
    ip = "1.1.1.2"
    engine.record_event(db=db_session, ip_address=ip, event_type="failed_login", source="test")
    engine.record_event(db=db_session, ip_address=ip, event_type="failed_login", source="test")
    score_rec, _ = engine.record_event(
        db=db_session, ip_address=ip, event_type="failed_login", source="test"
    )
    # three failed logins = 30 points (minus decay which is near-zero within test)
    assert score_rec.current_score >= 29.0


# ── 2. Threat level classification ────────────────────────────────────────────

def test_threat_level_low():
    assert classify_threat_level(0.0) == "LOW"
    assert classify_threat_level(24.9) == "LOW"


def test_threat_level_medium():
    assert classify_threat_level(25.0) == "MEDIUM"
    assert classify_threat_level(49.9) == "MEDIUM"


def test_threat_level_high():
    assert classify_threat_level(50.0) == "HIGH"
    assert classify_threat_level(79.9) == "HIGH"


def test_threat_level_critical():
    assert classify_threat_level(80.0) == "CRITICAL"
    assert classify_threat_level(200.0) == "CRITICAL"


# ── 3. Multiple event correlation ─────────────────────────────────────────────

def test_multiple_event_types_correlate(client, db_session):
    engine = fresh_engine()
    ip = "1.1.1.3"
    engine.record_event(db=db_session, ip_address=ip, event_type="failed_login", source="auth")
    engine.record_event(db=db_session, ip_address=ip, event_type="honeypot_hit", source="mtd")
    score_rec, _ = engine.record_event(
        db=db_session, ip_address=ip, event_type="expired_alias_access", source="mtd"
    )
    # 10 + 40 + 15 = 65 → HIGH
    assert score_rec.current_score >= 60.0
    assert score_rec.threat_level == "HIGH"

    events = db_session.query(ThreatEvent).filter(ThreatEvent.ip_address == ip).all()
    assert len(events) == 3


# ── 4. Score decay over time ───────────────────────────────────────────────────

def test_decay_reduces_score():
    last_updated = datetime.utcnow() - timedelta(hours=2)
    decayed = apply_decay(60.0, last_updated)
    assert decayed == pytest.approx(60.0 - 2 * DECAY_RATE_PER_HOUR, abs=0.5)


def test_decay_does_not_go_below_zero():
    last_updated = datetime.utcnow() - timedelta(hours=100)
    assert apply_decay(10.0, last_updated) == 0.0


# ── 5. Escalation to HIGH ─────────────────────────────────────────────────────

def test_escalation_to_high_creates_block(client, db_session):
    engine = fresh_engine()
    ip = "1.1.1.4"
    # honeypot_hit (40) + honeypot_hit (40) = 80 → CRITICAL
    # But first hit alone is 40 → MEDIUM, second is 80 → CRITICAL
    # Let's use a single blacklisted_token_usage (50) → HIGH
    score_rec, level = engine.record_event(
        db=db_session, ip_address=ip, event_type="blacklisted_token_usage", source="auth"
    )
    assert level == "HIGH"
    block = db_session.query(ThreatBlock).filter(ThreatBlock.ip_address == ip).first()
    assert block is not None
    assert block.status == "blocked"
    # HIGH block = 5 minutes = 300 seconds
    diff = (block.expires_at - block.blocked_at).total_seconds()
    assert diff == pytest.approx(300, abs=5)


# ── 6. Escalation to CRITICAL ─────────────────────────────────────────────────

def test_escalation_to_critical_creates_long_block(client, db_session):
    engine = fresh_engine()
    ip = "1.1.1.5"
    # blacklisted_token_usage (50) → HIGH; honeypot_hit (40) pushes over 80 → CRITICAL
    engine.record_event(db=db_session, ip_address=ip, event_type="blacklisted_token_usage", source="auth")
    score_rec, level = engine.record_event(
        db=db_session, ip_address=ip, event_type="honeypot_hit", source="mtd"
    )
    assert level == "CRITICAL"

    block = db_session.query(ThreatBlock).filter(ThreatBlock.ip_address == ip).first()
    assert block is not None
    assert block.status == "blocked"
    # CRITICAL block = 30 minutes = 1800 seconds
    diff = (block.expires_at - block.blocked_at).total_seconds()
    assert diff == pytest.approx(1800, abs=10)


# ── 7. Temporary block creation ───────────────────────────────────────────────

def test_block_created_and_in_db(client, db_session):
    engine = fresh_engine()
    ip = "1.1.1.6"
    engine.record_event(db=db_session, ip_address=ip, event_type="blacklisted_token_usage", source="auth")

    block = db_session.query(ThreatBlock).filter(ThreatBlock.ip_address == ip).first()
    assert block is not None
    assert block.status == "blocked"
    assert block.expires_at > block.blocked_at


# ── 8. Block expiry via recalculate ───────────────────────────────────────────

def test_recalculate_decays_scores(client, db_session):
    engine = fresh_engine()
    ip = "1.1.1.7"
    # Plant a score record with old timestamp directly
    score_rec = ThreatScore(
        ip_address=ip,
        current_score=60.0,
        threat_level="HIGH",
        last_updated=datetime.utcnow() - timedelta(hours=10),
    )
    db_session.add(score_rec)
    db_session.commit()

    updated = engine.recalculate_all(db_session)
    assert updated >= 1

    db_session.refresh(score_rec)
    assert score_rec.current_score < 60.0


# ── 9. Independent IP scoring ─────────────────────────────────────────────────

def test_independent_ip_scoring(client, db_session):
    engine = fresh_engine()
    engine.record_event(db=db_session, ip_address="2.2.2.1", event_type="honeypot_hit", source="mtd")
    engine.record_event(db=db_session, ip_address="2.2.2.2", event_type="failed_login", source="auth")

    score1 = db_session.query(ThreatScore).filter(ThreatScore.ip_address == "2.2.2.1").first()
    score2 = db_session.query(ThreatScore).filter(ThreatScore.ip_address == "2.2.2.2").first()

    assert score1 is not None
    assert score2 is not None
    assert score1.current_score != score2.current_score
    assert score1.ip_address != score2.ip_address


# ── 10. Dashboard metrics correctness ────────────────────────────────────────

def test_metrics_endpoint_correctness(client, db_session):
    engine = fresh_engine()
    # Register a user + login to get a token
    client.post("/api/v1/auth/register", json={
        "email": "admin@test.com", "password": "testpassword", "role": "admin"
    })
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "admin@test.com", "password": "testpassword"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Generate some events
    engine.record_event(db=db_session, ip_address="3.3.3.1", event_type="honeypot_hit", source="mtd")
    engine.record_event(db=db_session, ip_address="3.3.3.2", event_type="failed_login", source="auth")

    resp = client.get("/api/v1/security/metrics", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "active_blocks" in data
    assert "critical_threats" in data
    assert "honeypot_hits_24h" in data
    assert "failed_logins_24h" in data
    assert "average_threat_score" in data
    assert "top_offending_ips" in data
    assert data["honeypot_hits_24h"] >= 1
    assert data["failed_logins_24h"] >= 1
