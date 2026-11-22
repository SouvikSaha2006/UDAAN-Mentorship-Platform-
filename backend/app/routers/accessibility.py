from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.accessibility import UserAccessibilitySettings
from app.schemas.accessibility import (
    AccessibilitySettingsResponse,
    AccessibilitySettingsUpdate,
)
from app.utils.security import get_current_user

router = APIRouter(prefix="/accessibility", tags=["Accessibility Settings"])


@router.get("", response_model=AccessibilitySettingsResponse)
def get_user_accessibility_settings(
    user_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Feature 2 & 3: Retrieve accessibility preferences with ownership guard.
    """
    target_user_id = current_user.id
    if user_id and user_id != current_user.id:
        if current_user.role not in [UserRole.ADMIN, UserRole.SUPPORT]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only view your own accessibility settings.",
            )
        target_user_id = user_id

    settings = db.query(UserAccessibilitySettings).filter(
        UserAccessibilitySettings.user_id == target_user_id
    ).first()
    
    if not settings:
        settings = UserAccessibilitySettings(user_id=target_user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


@router.put("", response_model=AccessibilitySettingsResponse)
def update_user_accessibility_settings(
    payload: AccessibilitySettingsUpdate,
    user_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Feature 2 & 3: Update accessibility preferences with ownership guard.
    """
    target_user_id = current_user.id
    if user_id and user_id != current_user.id:
        if current_user.role not in [UserRole.ADMIN, UserRole.SUPPORT]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only modify your own accessibility settings.",
            )
        target_user_id = user_id

    settings = db.query(UserAccessibilitySettings).filter(
        UserAccessibilitySettings.user_id == target_user_id
    ).first()

    if not settings:
        settings = UserAccessibilitySettings(user_id=target_user_id)
        db.add(settings)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(settings, field) and value is not None:
            setattr(settings, field, value)

    db.commit()
    db.refresh(settings)
    return settings
