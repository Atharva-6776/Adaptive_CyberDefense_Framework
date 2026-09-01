from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel

from app.core.config import settings
from app.utils.deps import get_db, require_admin, RequirePermission
from app.models.notification_log import NotificationLog
from app.models.user import User
from app.services.audit_service import audit_service

require_notification_configuration = RequirePermission("notification_configuration")

router = APIRouter(prefix="/notifications", tags=["notifications"])

class NotificationLogOut(BaseModel):
    id: int
    event_type: str
    recipient_channel: str
    status: str
    timestamp: datetime
    failure_reason: str | None = None
    reference_id: str | None = None

    class Config:
        from_attributes = True

@router.get("/logs", response_model=List[NotificationLogOut])
def get_notification_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    skip: int = 0,
    limit: int = 100
):
    return db.query(NotificationLog).order_by(NotificationLog.timestamp.desc()).offset(skip).limit(limit).all()

@router.get("/config")
def get_notification_config(
    current_user: User = Depends(require_admin)
):
    return {
        "global_dispatch_enabled": settings.ALERT_DISPATCH_ENABLED,
        "cooldown_seconds": settings.ALERT_COOLDOWN_SECONDS,
        "providers": {
            "email": {
                "enabled": settings.ALERT_EMAIL_ENABLED,
                "configured": bool(settings.ALERT_EMAIL_SMTP_HOST)
            },
            "slack": {
                "enabled": settings.ALERT_SLACK_ENABLED,
                "configured": bool(settings.ALERT_SLACK_WEBHOOK_URL)
            }
        }
    }

class NotificationConfigUpdate(BaseModel):
    global_dispatch_enabled: bool | None = None
    email_enabled: bool | None = None
    slack_enabled: bool | None = None

@router.put("/config")
def update_notification_config(
    update_data: NotificationConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_notification_configuration)
):
    if update_data.global_dispatch_enabled is not None:
        settings.ALERT_DISPATCH_ENABLED = update_data.global_dispatch_enabled
    if update_data.email_enabled is not None:
        settings.ALERT_EMAIL_ENABLED = update_data.email_enabled
    if update_data.slack_enabled is not None:
        settings.ALERT_SLACK_ENABLED = update_data.slack_enabled
        
    audit_service.log_action(
        db=db,
        user_id=current_user.id,
        action="update_notification_config",
        resource="notification_service",
        result="success",
        metadata=update_data.model_dump(exclude_unset=True)
    )
    
    return {"message": "Notification configuration updated successfully"}
