"""User profile endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from models.user import UserProfile
from services import user_service

router = APIRouter()


@router.post("/profile", response_model=UserProfile)
async def save_user_profile(profile: UserProfile):
    """Save or update a user profile (Firestore when configured, else local JSON)."""
    return await user_service.save_profile(profile)


@router.get("/profile/{user_id}", response_model=UserProfile)
async def get_user_profile(user_id: str):
    """Retrieve a saved user profile by ID."""
    profile = await user_service.get_profile(user_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile {user_id} not found.",
        )
    return profile
