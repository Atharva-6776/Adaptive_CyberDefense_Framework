import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.alerts import AlertCreate, AlertUpdateStatus, AlertResponse
from app.services.alert_service import alert_service
from app.utils.deps import get_db, get_current_user, RequirePermission
from app.models.user import User
from app.services.audit_service import audit_service

logger = logging.getLogger("alerts_router")

router = APIRouter(prefix="/alerts", tags=["Safety Violation Alerts"])

require_alert_resolution = RequirePermission("alert_resolution")


@router.get("", response_model=List[AlertResponse])
def list_alerts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retrieve all safety alerts sorted by newest first."""
    alerts = alert_service.get_alerts(db)
    return [AlertResponse.model_validate(alert) for alert in alerts]


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def create_manual_alert(alert_data: AlertCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Register a new safety violation alert manually or from external triggers."""
    try:
        alert = alert_service.create_alert(db, alert_data)
        return AlertResponse.model_validate(alert)
    except Exception as e:
        logger.error(f"Error creating safety alert: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retrieve details for a single alert."""
    alert = alert_service.get_alert_by_id(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return AlertResponse.model_validate(alert)


@router.put("/{alert_id}/resolve", response_model=AlertResponse)
def resolve_alert_status(alert_id: int, update_data: AlertUpdateStatus, db: Session = Depends(get_db), current_user: User = Depends(require_alert_resolution)):
    """Update status of a safety alert (e.g. resolve it or mark as investigating)."""
    alert = alert_service.update_alert_status(db, alert_id, update_data.status)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    logger.info(f"Updated status for Alert {alert_id} to '{update_data.status}' by {current_user.email}")
    
    audit_service.log_action(
        db=db,
        user_id=current_user.id,
        action="resolve_alert",
        resource=f"alert:{alert_id}",
        result="success",
        metadata={"new_status": update_data.status}
    )
    
    return AlertResponse.model_validate(alert)
