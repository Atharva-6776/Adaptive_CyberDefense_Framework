import logging
from typing import Generator, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import decode_token
from app.models.user import User
from app.services.auth_service import AuthService

logger = logging.getLogger("security")

# OAuth2 scheme config. Token url can point to /api/v1/auth/login
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False  # Allow custom error handling for unauthenticated requests
)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check blacklist
    if AuthService.is_token_blacklisted(db, token):
        logger.warning("Revoked access token presented.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been blacklisted/revoked",
        )

    try:
        payload = decode_token(token, is_refresh=False)
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        if not user_id or token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token claims",
            )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
        
    return user


from app.core.rbac import ROLE_PERMISSIONS

class RequirePermission:
    def __init__(self, required_permission: str):
        self.required_permission = required_permission

    def __call__(self, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
        from app.models.rbac import Role
        
        role = db.query(Role).filter(Role.name == current_user.role).first()
        user_permissions = [p.name for p in role.permissions] if role else []
        
        if self.required_permission not in user_permissions:
            logger.warning(
                f"Unauthorized permission access attempt: User {current_user.email} (role: {current_user.role}) "
                f"tried accessing '{self.required_permission}'. Allowed: {user_permissions}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for this user's permissions"
            )
        return current_user


# Backwards compatibility wrappers or specific permission checkers
require_admin = RequirePermission("system_administration")
require_analyst_or_admin = RequirePermission("threat_management")
