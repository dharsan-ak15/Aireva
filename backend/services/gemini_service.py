"""Gemini AI service."""

from __future__ import annotations

import json
import logging
from typing import Optional

from core.config import settings
from prompts.templates import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from schemas.ai import AIResponse, AIRecommendationItem

logger = logging.getLogger(__name__)


class GeminiService:
    """Wrapper around the google-genai SDK."""

    MODEL = "gemini-2.0-flash"

    def __init__(self) -> None:
        self._client = None
        if settings.GEMINI_API_KEY:
            try:
                import google.genai as genai
                self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
                logger.info("Gemini client initialised (model=%s)", self.MODEL)
            except Exception as exc:
                logger.warning("Gemini client init failed: %s", exc)

    def is_configured(self) -> bool:
        return self._client is not None

    async def ask(
        self,
        question: str,
        profile: Optional[dict] = None,
        aqi_data: Optional[dict] = None,
    ) -> AIResponse:
        if not self._client:
            logger.info("Gemini not configured – using deterministic fallback")
            return self._deterministic_fallback(question, profile, aqi_data)

        try:
            user_prompt = USER_PROMPT_TEMPLATE.format(
                question=question,
                profile=json.dumps(profile or {}, default=str, indent=2),
                aqi_data=json.dumps(aqi_data, default=str, indent=2)
                if aqi_data
                else "Data unavailable at this time",
            )

            from google.genai import types

            response = self._client.models.generate_content(
                model=self.MODEL,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    temperature=0.3,
                    max_output_tokens=1500,
                ),
            )

            raw_text = response.text or "{}"
            parsed = json.loads(raw_text)

            recs = [
                AIRecommendationItem(
                    action=r.get("action", ""),
                    reason=r.get("reason", ""),
                    priority=r.get("priority", "medium"),
                )
                for r in parsed.get("recommendations", [])
            ]

            return AIResponse(
                summary=parsed.get("summary", ""),
                air_quality_context=parsed.get("air_quality_context", ""),
                recommendations=recs,
                alternatives=parsed.get("alternatives", []),
                limitations=parsed.get("limitations", []),
                is_ai_generated=True,
                model_used=self.MODEL,
                raw=parsed,
            )

        except Exception as exc:
            logger.warning("Gemini API call failed: %s – using fallback", exc)
            return self._deterministic_fallback(question, profile, aqi_data)

    def _deterministic_fallback(
        self,
        question: str,
        profile: Optional[dict],
        aqi_data: Optional[dict],
    ) -> AIResponse:
        """Return a rules-based response without claiming it's AI-generated."""
        from decision_engine.rules import generate_recommendations
        from models.user import UserProfile
        from schemas.aqi import AQIDataSchema

        limitations = [
            "AI assistance is currently unavailable.",
            "Recommendations are based on deterministic rules, not personalised AI analysis.",
        ]

        recs: list[AIRecommendationItem] = []
        aqi_category = None

        try:
            if profile:
                user = UserProfile(**profile)
                aqi = AQIDataSchema(**aqi_data) if aqi_data else None
                rule_recs = generate_recommendations(user, aqi)
                recs = [
                    AIRecommendationItem(
                        action=r.action,
                        reason=r.reason,
                        priority=r.priority.value,
                    )
                    for r in rule_recs
                ]
                if aqi and (aqi.cpcb_category or aqi.computed_category):
                    aqi_category = (aqi.cpcb_category or aqi.computed_category)
        except Exception as exc:
            logger.debug("Fallback rules generation error: %s", exc)

        aqi_context = (
            f"Air quality category: {aqi_category.value if aqi_category else 'unknown'}. "
            "Values are OpenAQ measurements – not official CPCB AQI."
            if aqi_data
            else "No live AQI data available."
        )

        return AIResponse(
            summary=(
                "Based on current air quality conditions and your profile, "
                "the following guidance applies. "
                "(Note: AI assistant unavailable; rules-based guidance only.)"
            ),
            air_quality_context=aqi_context,
            recommendations=recs,
            alternatives=["Check back later when AI assistance is available."],
            limitations=limitations,
            is_ai_generated=False,
            model_used=None,
        )
