from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.settings import SystemSettingsResponse, SystemSettingsUpdate
from app.services.settings_service import settings_service
from app.utils.deps import get_db, get_current_user

router = APIRouter(prefix="/settings", tags=["System Settings & Preferences"])


def get_client_ip(request: Request) -> str:
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.get("", response_model=SystemSettingsResponse)
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve current system preferences, notification channels, security thresholds,
    and user account configuration. Mask secret credentials.
    Requires authenticated user.
    """
    return settings_service.get_system_settings(db, current_user)


@router.put("", response_model=SystemSettingsResponse)
def update_settings(
    update_data: SystemSettingsUpdate,
    req: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update system preferences, notification settings, security thresholds, or MTD parameters.
    Only admin users can alter security or MTD parameters.
    Records changes in AuditLog.
    """
    # Enforce RBAC for sensitive security/MTD configuration changes
    is_sensitive_update = (
        update_data.security is not None
        or update_data.mtd_enabled is not None
        or update_data.mtd_rotation_interval_seconds is not None
    )
    if is_sensitive_update and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required to modify security thresholds or MTD configuration",
        )

    client_ip = get_client_ip(req)
    return settings_service.update_system_settings(
        db=db,
        user=current_user,
        update=update_data,
        ip_address=client_ip,
    )
