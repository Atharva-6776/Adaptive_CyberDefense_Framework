from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.schemas.auth import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    RefreshTokenRequest,
    LogoutResponse,
)
from app.services.auth_service import AuthService
from app.utils.deps import get_db, get_current_user, reusable_oauth2
from app.models.user import User

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
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user credentials and issue Access & Refresh tokens.
    """
    try:
        user = AuthService.authenticate_user(db, login_data.email, login_data.password)
        tokens = AuthService.create_tokens_for_user(user)
        return tokens
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/refresh", response_model=TokenResponse)
def refresh(refresh_data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Refresh JWT access token using a valid refresh token.
    """
    try:
        new_access_token = AuthService.refresh_access_token(db, refresh_data.refresh_token)
        return TokenResponse(
            access_token=new_access_token,
            refresh_token=refresh_data.refresh_token,
            token_type="bearer"
        )
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
