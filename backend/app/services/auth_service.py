import logging
from datetime import datetime, timezone
import jwt
from sqlalchemy.orm import Session

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models.user import User, TokenBlacklist
from app.schemas.auth import UserRegister, TokenResponse

logger = logging.getLogger("security")


class AuthService:
    @staticmethod
    def register_user(db: Session, user_data: UserRegister) -> User:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            logger.warning(f"Registration attempt failed: Email {user_data.email} already exists.")
            raise ValueError("Email already registered")

        hashed = hash_password(user_data.password)
        new_user = User(
            email=user_data.email,
            hashed_password=hashed,
            role=user_data.role or "user"
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        logger.info(f"User registered successfully: ID {new_user.id}, Email {new_user.email}, Role {new_user.role}")
        return new_user

    @staticmethod
    def authenticate_user(db: Session, email: str, plain_password: str) -> User:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            logger.warning(f"Authentication failed: User with email {email} not found.")
            raise ValueError("Incorrect email or password")

        if not user.is_active:
            logger.warning(f"Authentication failed: User {email} is inactive.")
            raise ValueError("User account is inactive")

        if not verify_password(plain_password, user.hashed_password):
            logger.warning(f"Authentication failed: Incorrect password for {email}.")
            raise ValueError("Incorrect email or password")

        logger.info(f"User authenticated successfully: ID {user.id}, Email {user.email}")
        return user

    @staticmethod
    def create_tokens_for_user(user: User) -> TokenResponse:
        access_token = create_access_token(user_id=user.id, role=user.role)
        refresh_token = create_refresh_token(user_id=user.id, role=user.role)
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )

    @staticmethod
    def blacklist_token(db: Session, token: str, token_type: str) -> None:
        try:
            # We try to decode the token to find its expiration date
            # Ignore expiration exception when blacklisting expired tokens
            secret_key = None
            # We can decode without verification just to inspect, or verify with lax options
            payload = jwt.decode(token, options={"verify_signature": False})
            exp_timestamp = payload.get("exp")
            expires_at = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc) if exp_timestamp else datetime.now(timezone.utc)
        except Exception:
            expires_at = datetime.now(timezone.utc)

        # Check if already blacklisted
        existing = db.query(TokenBlacklist).filter(TokenBlacklist.token == token).first()
        if not existing:
            blacklist_entry = TokenBlacklist(
                token=token,
                token_type=token_type,
                expires_at=expires_at
            )
            db.add(blacklist_entry)
            db.commit()
            logger.info(f"Token blacklisted successfully: Type {token_type}")

    @staticmethod
    def is_token_blacklisted(db: Session, token: str) -> bool:
        # Check database
        blacklisted = db.query(TokenBlacklist).filter(TokenBlacklist.token == token).first()
        if blacklisted:
            return True
        return False

    @staticmethod
    def refresh_access_token(db: Session, refresh_token: str) -> str:
        # Check if blacklisted
        if AuthService.is_token_blacklisted(db, refresh_token):
            logger.warning("Attempted to refresh access token using a blacklisted refresh token.")
            raise ValueError("Refresh token has been revoked")

        try:
            payload = decode_token(refresh_token, is_refresh=True)
            if payload.get("type") != "refresh":
                raise ValueError("Invalid token type")
        except jwt.InvalidTokenError as e:
            logger.warning(f"Token refresh failed: {str(e)}")
            raise ValueError(str(e))

        user_id = payload.get("user_id")
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise ValueError("User not found or inactive")

        # Generate a new access token
        new_access_token = create_access_token(user_id=user.id, role=user.role)
        logger.info(f"Token refreshed successfully for user ID {user.id}")
        return new_access_token

    @staticmethod
    def logout(db: Session, access_token: str, refresh_token: str) -> None:
        # Blacklist both tokens
        AuthService.blacklist_token(db, access_token, "access")
        AuthService.blacklist_token(db, refresh_token, "refresh")
        logger.info("User logged out successfully and tokens revoked.")
