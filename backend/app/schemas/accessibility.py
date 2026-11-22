from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class AccessibilitySettingsBase(BaseModel):
    font_scale: float = Field(1.0, ge=0.5, le=2.0, alias="fontScale")
    dark_mode: bool = Field(False, alias="darkMode")
    high_contrast: bool = Field(False, alias="highContrast")
    highlight_links: bool = Field(False, alias="highlightLinks")
    dyslexia_font: bool = Field(False, alias="dyslexiaFont")
    reading_mode: bool = Field(False, alias="readingMode")
    line_spacing: float = Field(1.6, ge=1.0, le=3.0, alias="lineSpacing")
    large_controls: bool = Field(False, alias="largeControls")
    reduced_motion: bool = Field(False, alias="reducedMotion")
    focus_enhanced: bool = Field(False, alias="focusEnhanced")
    written_notifications: bool = Field(True, alias="writtenNotifications")
    caption_mode: bool = Field(True, alias="captionMode")
    tts_rate: float = Field(1.0, ge=0.5, le=2.5, alias="ttsRate")

    model_config = ConfigDict(populate_by_name=True)


class AccessibilitySettingsUpdate(BaseModel):
    font_scale: Optional[float] = Field(None, ge=0.5, le=2.0, alias="fontScale")
    dark_mode: Optional[bool] = Field(None, alias="darkMode")
    high_contrast: Optional[bool] = Field(None, alias="highContrast")
    highlight_links: Optional[bool] = Field(None, alias="highlightLinks")
    dyslexia_font: Optional[bool] = Field(None, alias="dyslexiaFont")
    reading_mode: Optional[bool] = Field(None, alias="readingMode")
    line_spacing: Optional[float] = Field(None, ge=1.0, le=3.0, alias="lineSpacing")
    large_controls: Optional[bool] = Field(None, alias="largeControls")
    reduced_motion: Optional[bool] = Field(None, alias="reducedMotion")
    focus_enhanced: Optional[bool] = Field(None, alias="focusEnhanced")
    written_notifications: Optional[bool] = Field(None, alias="writtenNotifications")
    caption_mode: Optional[bool] = Field(None, alias="captionMode")
    tts_rate: Optional[float] = Field(None, ge=0.5, le=2.5, alias="ttsRate")

    model_config = ConfigDict(populate_by_name=True)


class AccessibilitySettingsResponse(AccessibilitySettingsBase):
    id: str
    user_id: str = Field(..., alias="userId")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
