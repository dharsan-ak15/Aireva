"""AQI endpoints."""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException, Query, status

from schemas.aqi import AQIDataSchema, HistoricalReading, StationSearchResult
from services import aqi_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/city", response_model=AQIDataSchema)
async def get_aqi_by_city(
    city: str = Query(..., min_length=1, max_length=100, description="City name"),
    country: str = Query("IN", min_length=2, max_length=3, description="ISO country code"),
):
    """Fetch latest air quality measurements for a city from OpenAQ."""
    cleaned_city = city.strip()
    if not cleaned_city:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="City name cannot be empty.",
        )

    data = await aqi_service.fetch_aqi_for_city(city=cleaned_city, country=country.upper())
    if not data:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Air quality data currently unavailable for {cleaned_city}. Please try again later.",
        )
    return data


@router.get("/station/{station_id}", response_model=AQIDataSchema)
async def get_aqi_by_station(station_id: str):
    """Fetch latest air quality measurements for a specific station ID."""
    data = await aqi_service.fetch_aqi_for_station(station_id)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unable to retrieve measurements for station {station_id}.",
        )
    return data


@router.get("/stations", response_model=list[StationSearchResult])
async def search_stations(
    city: str = Query(..., min_length=1, max_length=100),
    country: str = Query("IN", min_length=2, max_length=3),
):
    """Search monitoring stations in a city."""
    return await aqi_service.search_stations(city=city.strip(), country=country.upper())


@router.get("/history", response_model=list[HistoricalReading])
async def get_historical_readings(
    station_id: str = Query(..., min_length=1),
    parameter: str = Query("pm25", min_length=1, max_length=20),
    hours: int = Query(48, ge=1, le=168),
):
    """Fetch historical pollutant measurements for a station."""
    return await aqi_service.fetch_historical(
        station_id=station_id,
        parameter=parameter.lower(),
        hours=hours,
    )
