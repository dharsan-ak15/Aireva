"""Gemini AI assistant endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from schemas.ai import AIAskRequest, AIResponse
from services.gemini_service import GeminiService

router = APIRouter()
_gemini = GeminiService()


@router.post("/ask", response_model=AIResponse)
async def ask_ai(payload: AIAskRequest):
    """Ask BreatheWise / Aireva AI a natural-language question with verified context."""
    question = payload.question.strip()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty.",
        )

    profile_dict = payload.profile.model_dump() if payload.profile else None
    aqi_dict = payload.aqi_data.model_dump() if payload.aqi_data else None
    return await _gemini.ask(question=question, profile=profile_dict, aqi_data=aqi_dict)
