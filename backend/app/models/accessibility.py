import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


def get_utc_now():
    return datetime.now(timezone.utc)


class UserAccessibilitySettings(Base):
    __tablename__ = "user_accessibility_settings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # UI Accessibility Preferences Synced with AccessibilityContext.jsx
    font_scale = Column(Float, default=1.0, nullable=False)
    dark_mode = Column(Boolean, default=False, nullable=False)
    high_contrast = Column(Boolean, default=False, nullable=False)
    highlight_links = Column(Boolean, default=False, nullable=False)
    dyslexia_font = Column(Boolean, default=False, nullable=False)
    reading_mode = Column(Boolean, default=False, nullable=False)
    line_spacing = Column(Float, default=1.6, nullable=False)
    large_controls = Column(Boolean, default=False, nullable=False)
    reduced_motion = Column(Boolean, default=False, nullable=False)
    focus_enhanced = Column(Boolean, default=False, nullable=False)
    written_notifications = Column(Boolean, default=True, nullable=False)
    caption_mode = Column(Boolean, default=True, nullable=False)
    tts_rate = Column(Float, default=1.0, nullable=False)

    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="accessibility_settings")

    def __repr__(self):
        return f"<UserAccessibilitySettings user_id={self.user_id} font_scale={self.font_scale} high_contrast={self.high_contrast}>"
