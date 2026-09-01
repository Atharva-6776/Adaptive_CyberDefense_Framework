import json
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog

logger = logging.getLogger("audit_service")

class AuditService:
    def log_action(
        self,
        db: Session,
        user_id: Optional[int],
        action: str,
        resource: str,
        result: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        try:
            metadata_json = json.dumps(metadata) if metadata else None
            audit_entry = AuditLog(
                user_id=user_id,
                action=action,
                resource=resource,
                result=result,
                metadata_json=metadata_json,
                timestamp=datetime.now(timezone.utc)
            )
            db.add(audit_entry)
            db.commit()
            db.refresh(audit_entry)
            logger.info(f"Audit log recorded: {action} on {resource} by User {user_id}")
            return audit_entry
        except Exception as e:
            logger.error(f"Failed to record audit log: {e}")
            db.rollback()
            raise

audit_service = AuditService()
