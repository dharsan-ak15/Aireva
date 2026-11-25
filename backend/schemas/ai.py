"""AI request/response schemas."""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, ConfigDict

from models.user import UserProfile
from schemas.aqi import AQIDataSchema


class AIAskRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    question: str
    profile: Optional[UserProfile] = None
    aqi_data: Optional[AQIDataSchema] = None


class AIRecommendationItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    action: str
    reason: str
    priority: str = "medium"


class AIResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    summary: str
    air_quality_context: str
    recommendations: list[AIRecommendationItem] = []
    alternatives: list[str] = []
    limitations: list[str] = []
    is_ai_generated: bool = True
    model_used: Optional[str] = None
    raw: Optional[Any] = None
