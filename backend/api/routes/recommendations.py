"""Daily recommendation endpoints."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter

from decision_engine.rules import generate_recommendations
from models.recommendations import Recommendation
from models.user import UserProfile
from schemas.aqi import AQIDataSchema

router = APIRouter()


class DailyRecommendationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    profile: UserProfile
    aqi_data: Optional[AQIDataSchema] = None


@router.post("/daily", response_model=list[Recommendation])
async def get_daily_recommendations(payload: DailyRecommendationRequest):
    """Generate personalized daily recommendations from user profile and verified AQI data."""
    return generate_recommendations(profile=payload.profile, aqi_data=payload.aqi_data)
