from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.utils.deps import get_db, RequirePermission
from app.models.rbac import Role, Permission
from app.models.user import User

router = APIRouter(prefix="/rbac", tags=["RBAC Configuration"])

require_admin = RequirePermission("system_administration")

@router.get("/roles", status_code=status.HTTP_200_OK)
def get_roles(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    """Get all roles and their permissions."""
    roles = db.query(Role).all()
    return [{"name": r.name, "permissions": [p.name for p in r.permissions]} for r in roles]

@router.post("/roles/{role_name}/permissions", status_code=status.HTTP_200_OK)
def assign_permission(role_name: str, permission_name: str, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    """Assign a permission to a role."""
    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    permission = db.query(Permission).filter(Permission.name == permission_name).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
        
    if permission not in role.permissions:
        role.permissions.append(permission)
        db.commit()
    return {"message": "Permission assigned successfully"}

@router.delete("/roles/{role_name}/permissions/{permission_name}", status_code=status.HTTP_200_OK)
def remove_permission(role_name: str, permission_name: str, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    """Remove a permission from a role."""
    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    permission = db.query(Permission).filter(Permission.name == permission_name).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
        
    if permission in role.permissions:
        role.permissions.remove(permission)
        db.commit()
    return {"message": "Permission removed successfully"}
