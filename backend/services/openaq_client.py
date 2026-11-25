"""OpenAQ API v3 client using HTTPX."""

from __future__ import annotations

import logging
from typing import Any, Optional

import httpx

from core.config import settings

logger = logging.getLogger(__name__)

_TIMEOUT = httpx.Timeout(10.0, connect=5.0)


class OpenAQClient:
    """Thin async wrapper around the OpenAQ v3 REST API."""

    def __init__(self) -> None:
        headers: dict[str, str] = {"Accept": "application/json"}
        if settings.OPENAQ_API_KEY:
            headers["X-API-Key"] = settings.OPENAQ_API_KEY
        self._base = settings.OPENAQ_BASE_URL.rstrip("/")
        self._headers = headers

    # ------------------------------------------------------------------
    # Public methods
    # ------------------------------------------------------------------

    async def search_locations(
        self,
        city: str,
        country: str = "IN",
        limit: int = 20,
    ) -> Optional[list[dict[str, Any]]]:
        """Search for monitoring stations in a country/city."""
        if not settings.OPENAQ_API_KEY:
            return None
        params = {
            "iso": country.upper(),
            "limit": 100,
        }
        results = await self._get("/locations", params)
        if not results:
            return results
        city_lower = city.lower().strip()
        matched = [
            loc
            for loc in results
            if city_lower in str(loc.get("locality") or "").lower()
            or city_lower in str(loc.get("name") or "").lower()
        ]
        return matched[:limit] if matched else results[:limit]

    async def get_latest_measurements(
        self,
        location_id: int,
    ) -> Optional[list[dict[str, Any]]]:
        """Fetch latest sensor readings for a location."""
        params = {"limit": 100}
        return await self._get(f"/locations/{location_id}/sensors", params)

    async def get_location_measurements(
        self,
        location_id: int,
        parameter: str,
        date_from: str,
        date_to: str,
        limit: int = 500,
    ) -> Optional[list[dict[str, Any]]]:
        """Fetch historical measurements for a location + parameter."""
        params = {
            "parameter": parameter,
            "date_from": date_from,
            "date_to": date_to,
            "limit": limit,
            "order_by": "datetime",
            "sort_order": "asc",
        }
        return await self._get(f"/locations/{location_id}/measurements", params)

    async def health_check(self) -> bool:
        """Return True if OpenAQ API is reachable."""
        try:
            async with httpx.AsyncClient(
                headers=self._headers, timeout=_TIMEOUT
            ) as client:
                r = await client.get(f"{self._base}/locations", params={"limit": 1})
                return r.status_code < 500
        except Exception as exc:
            logger.warning("OpenAQ health-check failed: %s", exc)
            return False

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    async def _get(
        self, path: str, params: dict[str, Any]
    ) -> Optional[list[dict[str, Any]]]:
        url = f"{self._base}{path}"
        try:
            async with httpx.AsyncClient(
                headers=self._headers, timeout=_TIMEOUT
            ) as client:
                logger.debug("OpenAQ GET %s params=%s", url, params)
                response = await client.get(url, params=params)

                if response.status_code == 429:
                    logger.warning("OpenAQ rate-limited (429) for %s", url)
                    return None

                if response.status_code == 404:
                    logger.info("OpenAQ 404 for %s", url)
                    return []

                response.raise_for_status()
                data = response.json()

                logger.debug(
                    "OpenAQ %s → status=%s results=%s",
                    url,
                    response.status_code,
                    len(data.get("results", [])),
                )
                return data.get("results", [])

        except httpx.TimeoutException:
            logger.warning("OpenAQ timeout for %s", url)
            return None
        except httpx.HTTPStatusError as exc:
            logger.warning("OpenAQ HTTP error %s for %s", exc.response.status_code, url)
            return None
        except Exception as exc:
            logger.error("OpenAQ unexpected error for %s: %s", url, exc)
            return None
