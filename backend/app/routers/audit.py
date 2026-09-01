from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel

from app.utils.deps import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.utils.deps import RequirePermission

router = APIRouter(prefix="/audit", tags=["audit"])

class AuditLogOut(BaseModel):
    id: int
    user_id: int | None
    action: str
    resource: str
    timestamp: datetime
    result: str
    metadata_json: str | None

    class Config:
        from_attributes = True

class AuditLogPaginated(BaseModel):
    items: List[AuditLogOut]
    total: int
    skip: int
    limit: int

require_system_administration = RequirePermission("system_administration")

@router.get("/logs", response_model=AuditLogPaginated)
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_system_administration),
    action: str = None,
    resource: str = None,
    skip: int = 0,
    limit: int = 100
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if resource:
        query = query.filter(AuditLog.resource == resource)
        
    total = query.count()
    items = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return AuditLogPaginated(items=items, total=total, skip=skip, limit=limit)
