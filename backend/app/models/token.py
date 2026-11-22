import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, Boolean
from app.database import Base


def get_utc_now():
    return datetime.now(timezone.utc)


class RevokedToken(Base):
    """
    Database blacklist for revoked JWT refresh and access tokens (Feature 2 & 3).
    When a user logs out, their refresh token is stored here so it cannot be reused.
    """
    __tablename__ = "revoked_tokens"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    token = Column(Text, unique=True, index=True, nullable=False)
    token_type = Column(String(50), default="refresh", nullable=False)  # "refresh" or "access"
    user_id = Column(String(36), nullable=True, index=True)
    revoked_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<RevokedToken user_id={self.user_id} token_type={self.token_type}>"


class PasswordResetToken(Base):
    """
    Single-use password reset tokens / OTPs with 15-minute expiry (Feature 7).
    """
    __tablename__ = "password_reset_tokens"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    token_hash = Column(String(128), nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<PasswordResetToken email={self.email} used={self.used}>"
