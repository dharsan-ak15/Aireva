"""Open-Meteo Geocoding + Air Quality client (free, no API key required)."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional

import httpx

logger = logging.getLogger(__name__)

_GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"
_AQ_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
_TIMEOUT = httpx.Timeout(10.0, connect=5.0)


class OpenMeteoClient:
    """Async client for Open-Meteo Geocoding and Air Quality (CAMS) API."""

    async def geocode_city(
        self, city: str, country: str = "IN"
    ) -> Optional[dict[str, Any]]:
        """Resolve a city name to latitude, longitude, and admin state."""
        params = {"name": city, "count": 5, "language": "en", "format": "json"}
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                r = await client.get(_GEOCODE_URL, params=params)
                r.raise_for_status()
                results = r.json().get("results") or []
                if not results:
                    return None
                # Prefer matching country code
                for item in results:
                    if str(item.get("country_code", "")).upper() == country.upper():
                        return item
                return results[0]
        except Exception as exc:
            logger.warning("Open-Meteo geocoding failed for %s: %s", city, exc)
            return None

    async def get_current_air_quality(
        self, latitude: float, longitude: float
    ) -> Optional[dict[str, Any]]:
        """Fetch current pollutant concentrations from Open-Meteo Air Quality API."""
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,ozone",
            "timezone": "UTC",
        }
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                r = await client.get(_AQ_URL, params=params)
                r.raise_for_status()
                return r.json()
        except Exception as exc:
            logger.warning("Open-Meteo current AQ failed: %s", exc)
            return None

    async def get_hourly_history(
        self, latitude: float, longitude: float, hours: int = 48
    ) -> Optional[dict[str, Any]]:
        """Fetch past hourly pollutant concentrations."""
        past_days = max(1, min(7, (hours + 23) // 24))
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": "pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,ozone",
            "past_days": past_days,
            "forecast_days": 1,
            "timezone": "UTC",
        }
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                r = await client.get(_AQ_URL, params=params)
                r.raise_for_status()
                data = r.json()
                # Filter out future forecast hours
                hourly = data.get("hourly") or {}
                times = hourly.get("time") or []
                now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M")
                valid_indices = [i for i, t in enumerate(times) if t <= now_iso]
                if valid_indices:
                    trimmed = {
                        k: [v[i] for i in valid_indices[-hours:]]
                        for k, v in hourly.items()
                        if isinstance(v, list)
                    }
                    data["hourly"] = trimmed
                return data
        except Exception as exc:
            logger.warning("Open-Meteo historical AQ failed: %s", exc)
            return None
