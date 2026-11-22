from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.accessibility import UserAccessibilitySettings
from app.schemas.accessibility import (
    AccessibilitySettingsResponse,
    AccessibilitySettingsUpdate,
)
from app.utils.security import get_current_user

router = APIRouter(prefix="/accessibility", tags=["Accessibility Settings"])


@router.get("", response_model=AccessibilitySettingsResponse)
def get_user_accessibility_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = db.query(UserAccessibilitySettings).filter(
        UserAccessibilitySettings.user_id == current_user.id
    ).first()
    
    if not settings:
        # Create default
        settings = UserAccessibilitySettings(user_id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


@router.put("", response_model=AccessibilitySettingsResponse)
def update_user_accessibility_settings(
    payload: AccessibilitySettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = db.query(UserAccessibilitySettings).filter(
        UserAccessibilitySettings.user_id == current_user.id
    ).first()

    if not settings:
        settings = UserAccessibilitySettings(user_id=current_user.id)
        db.add(settings)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(settings, field) and value is not None:
            setattr(settings, field, value)

    db.commit()
    db.refresh(settings)
    return settings
