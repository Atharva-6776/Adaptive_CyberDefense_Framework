from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.schemas.auth import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    RefreshTokenRequest,
    LogoutResponse,
    PasswordResetRequest,
    PasswordResetConfirm,
)
from app.services.auth_service import AuthService
from app.utils.deps import get_db, get_current_user, reusable_oauth2
from app.models.user import User
from app.core.rate_limit import limiter

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user with email, password, and role.
    """
    try:
        user = AuthService.register_user(db, user_data)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(login_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    """
    Authenticate user credentials and issue Access & Refresh tokens.
    """
    try:
        user = AuthService.authenticate_user(db, login_data.email, login_data.password)
        ip_address = request.client.host if request.client else None
        device_info = request.headers.get("User-Agent")
        tokens = AuthService.create_tokens_for_user(db, user, ip_address, device_info)
        return tokens
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/refresh", response_model=TokenResponse)
def refresh(refresh_data: RefreshTokenRequest, request: Request, db: Session = Depends(get_db)):
    """
    Refresh JWT access token using a valid refresh token.
    """
    try:
        ip_address = request.client.host if request.client else None
        device_info = request.headers.get("User-Agent")
        tokens = AuthService.refresh_access_token(db, refresh_data.refresh_token, ip_address, device_info)
        return tokens
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post("/logout", response_model=LogoutResponse)
def logout(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db),
    access_token: str = Depends(reusable_oauth2),
    current_user: User = Depends(get_current_user)
):
    """
    Logout user by blacklisting access and refresh tokens.
    """
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing access token"
        )
    AuthService.logout(db, access_token, refresh_data.refresh_token)
    return LogoutResponse(message="Successfully logged out")


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Retrieve authenticated user profile.
    """
    return current_user


@router.post("/password-reset-request", status_code=status.HTTP_200_OK)
@limiter.limit("3/minute")
def request_password_reset(data: PasswordResetRequest, request: Request, db: Session = Depends(get_db)):
    """
    Request a password reset token.
    """
    AuthService.request_password_reset(db, data.email)
    return {"message": "If the email is registered, a password reset token has been generated."}


@router.post("/password-reset-confirm", status_code=status.HTTP_200_OK)
@limiter.limit("3/minute")
def confirm_password_reset(data: PasswordResetConfirm, request: Request, db: Session = Depends(get_db)):
    """
    Confirm password reset with the token.
    """
    try:
        AuthService.confirm_password_reset(db, data.token, data.new_password)
        return {"message": "Password successfully reset."}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
