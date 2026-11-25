"""Indoor air quality advisor endpoints."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter

from decision_engine.indoor_advisor import generate_indoor_checklist
from models.recommendations import IndoorChecklistItem
from models.user import UserProfile

router = APIRouter()


class IndoorChecklistRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    profile: UserProfile


@router.post("/checklist", response_model=list[IndoorChecklistItem])
async def get_indoor_checklist(payload: IndoorChecklistRequest):
    """Generate a personalized indoor air quality checklist."""
    return generate_indoor_checklist(payload.profile)
