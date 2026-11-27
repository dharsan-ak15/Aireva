"""AQI request/response schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from models.aqi import AQICategoryEnum, PollutantReading


class StationSearchResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    station_id: str
    station_name: str
    city: str
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    parameters: list[str] = []


class AQIDataSchema(BaseModel):
    """Public-facing AQI response schema."""

    model_config = ConfigDict(populate_by_name=True)

    station_id: str
    station_name: str
    city: str
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    # Raw OpenAQ measurements – NOT CPCB AQI sub-indices
    readings: list[PollutantReading] = []

    # Only populated when the provider identifies a verified official value
    cpcb_aqi: Optional[int] = None
    cpcb_category: Optional[AQICategoryEnum] = None
    cpcb_source: str = "Official CPCB AQI unavailable"

    # Our computed AQI from CPCB breakpoints
    computed_aqi: Optional[int] = None
    computed_category: Optional[AQICategoryEnum] = None

    is_stale: bool = False
    last_updated: Optional[datetime] = None
    data_provider: str = "OpenAQ v3"


class HistoricalReading(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    timestamp: datetime
    parameter: str
    value: float
    unit: str
