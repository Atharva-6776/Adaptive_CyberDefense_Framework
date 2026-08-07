from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.schemas.mtd import MTDStatusResponse, HoneypotLogEntry
from app.services.mtd_service import mtd_service
from app.utils.deps import get_db, get_current_user
from app.models.user import User

router = APIRouter(prefix="/mtd", tags=["Moving Target Defense"])


@router.get("/status", response_model=MTDStatusResponse)
def get_mtd_status(current_user: User = Depends(get_current_user)):
    """
    Retrieve current MTD operational status, dynamic route registry mappings,
    decoy configurations, and historical path rotations.
    Requires authenticated user (any role).
    """
    return mtd_service.get_status()


@router.get("/honeypot/logs", response_model=list[HoneypotLogEntry])
def get_honeypot_logs(current_user: User = Depends(get_current_user)):
    """
    Retrieve honeypot telemetry log database of decoy triggered alarms.
    Requires authenticated user (any role).
    """
    return mtd_service.honeypot_logs


@router.post("/rotate", status_code=status.HTTP_200_OK)
def trigger_manual_rotation(current_user: User = Depends(get_current_user)):
    """
    Manually trigger an immediate dynamic API path rotation.
    Requires authenticated user.
    """
    mtd_service.rotate_paths()
    return {"message": "MTD path rotation triggered successfully", "status": mtd_service.get_status()}
