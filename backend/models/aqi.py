"""AQI domain models (internal representation)."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AQICategoryEnum(str, Enum):
    GOOD = "good"
    SATISFACTORY = "satisfactory"
    MODERATE = "moderate"
    POOR = "poor"
    VERY_POOR = "very_poor"
    SEVERE = "severe"
    UNKNOWN = "unknown"


class PollutantReading(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    parameter: str
    value: float
    unit: str
    last_updated: Optional[datetime] = None
    # OpenAQ measurement – NOT a CPCB-computed AQI sub-index
    source_label: str = "OpenAQ measurement"


class AQIData(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    station_id: str
    station_name: str
    city: str
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    # Raw pollutant readings from OpenAQ
    readings: list[PollutantReading] = []

    # CPCB AQI – only populated when official AQI parameter is returned by OpenAQ
    cpcb_aqi: Optional[int] = None
    cpcb_category: Optional[AQICategoryEnum] = None
    cpcb_source: str = "CPCB (via OpenAQ)"

    # Computed sub-index AQI from CPCB breakpoints (our own calculation)
    computed_aqi: Optional[int] = None
    computed_category: Optional[AQICategoryEnum] = None

    is_stale: bool = False
    last_updated: Optional[datetime] = None
