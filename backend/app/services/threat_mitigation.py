import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.threat_block import ThreatBlock
from app.services.mtd_service import mtd_service

logger = logging.getLogger("security")


def to_naive_utc(dt: datetime) -> datetime:
    """Helper to convert any datetime (aware or naive) to naive UTC datetime."""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


class ThreatMitigationService:
    def __init__(self):
        # Cache for blocked IPs to avoid DB hits on every request:
        # ip_address -> expires_at (naive UTC datetime)
        self._blocked_cache: Dict[str, datetime] = {}

    def record_event(self, db: Session, ip_address: str, reason: str) -> Optional[ThreatBlock]:
        """
        Records a suspicious decoy/honeypot event for the given IP address.
        Evaluates the window threshold, blocks the IP if breached.
        All database operations use naive UTC datetimes.
        """
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        
        # Look up existing record or create new
        block_record = db.query(ThreatBlock).filter(ThreatBlock.ip_address == ip_address).first()
        if not block_record:
            block_record = ThreatBlock(
                ip_address=ip_address,
                reason=reason,
                threat_score=0,
                hit_count=0,
                status="active",
                first_seen=now,
                last_seen=now
            )
            db.add(block_record)
            db.flush()  # Get ID without committing

        # Ensure values in record are naive UTC (for database consistency)
        block_record.first_seen = to_naive_utc(block_record.first_seen)
        block_record.last_seen = to_naive_utc(block_record.last_seen)
        block_record.blocked_at = to_naive_utc(block_record.blocked_at)
        block_record.expires_at = to_naive_utc(block_record.expires_at)

        # If already blocked, check if block has expired
        if block_record.status == "blocked":
            if block_record.expires_at and now > block_record.expires_at:
                # Transition to expired first, so we can re-evaluate
                block_record.status = "expired"
                if ip_address in self._blocked_cache:
                    del self._blocked_cache[ip_address]
            else:
                # Already active block, increment counts and return
                block_record.threat_score += 1
                block_record.hit_count += 1
                block_record.last_seen = now
                db.commit()
                return block_record

        # Increment counts
        block_record.threat_score += 1
        block_record.hit_count += 1
        block_record.last_seen = now
        block_record.reason = reason

        # Count events in the configured window from mtd_service.honeypot_logs
        window_start = now - timedelta(seconds=settings.THREAT_DETECTION_WINDOW_SECONDS)
        recent_hits = 0
        
        for log in mtd_service.honeypot_logs:
            # Convert log timestamp to naive UTC for safe comparison
            log_time = to_naive_utc(log.timestamp)
            if log.ip_address == ip_address and log_time >= window_start:
                recent_hits += 1

        # Check if threshold is breached
        if recent_hits >= settings.THREAT_HONEYPOT_THRESHOLD:
            # Block the IP
            block_duration = timedelta(seconds=settings.THREAT_BLOCK_DURATION_SECONDS)
            expires_at = now + block_duration
            
            block_record.status = "blocked"
            block_record.blocked_at = now
            block_record.expires_at = expires_at
            
            # Update cache
            self._blocked_cache[ip_address] = expires_at
            
            logger.warning(
                f"ATTACK MITIGATION: IP {ip_address} has triggered {recent_hits} decoy events "
                f"within {settings.THREAT_DETECTION_WINDOW_SECONDS}s. "
                f"IP blacklisted for {settings.THREAT_BLOCK_DURATION_SECONDS}s (until {expires_at} UTC)."
            )
        else:
            block_record.status = "active"

        db.commit()
        return block_record

    def is_ip_blocked(self, db: Session, ip_address: str) -> bool:
        """
        Checks if the given IP address is currently blacklisted.
        Handles cache lookup, DB lookup, and auto-expiration.
        All operations use naive UTC datetimes.
        """
        now = datetime.now(timezone.utc).replace(tzinfo=None)

        # 1. Check in-memory cache first
        if ip_address in self._blocked_cache:
            expires_at = self._blocked_cache[ip_address]
            if now <= expires_at:
                return True
            else:
                del self._blocked_cache[ip_address]

        # 2. Check Database
        block_record = db.query(ThreatBlock).filter(
            ThreatBlock.ip_address == ip_address,
            ThreatBlock.status == "blocked"
        ).first()

        if block_record:
            # Force/ensure expires_at is naive UTC from DB
            db_expires_at = to_naive_utc(block_record.expires_at)
            if db_expires_at and now > db_expires_at:
                # Expired in database
                block_record.status = "expired"
                db.commit()
                logger.info(f"Block expired for IP {ip_address}. IP is now unblocked.")
                return False
            else:
                # Active block in DB, populate cache
                self._blocked_cache[ip_address] = db_expires_at
                return True

        return False


# Singleton ThreatMitigationService instance
threat_mitigation_service = ThreatMitigationService()
