"""AQI data service – fetches, validates and caches AQI readings."""

from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from services.openaq_client import OpenAQClient
from services.open_meteo_client import OpenMeteoClient
from services.aqi_history_store import get_readings as get_archived_readings
from services.aqi_history_store import record_readings
from services.cache import get as cache_get, set as cache_set
from decision_engine.classifier import calculate_aqi, classify_aqi
from models.aqi import AQIData, PollutantReading, AQICategoryEnum
from schemas.aqi import AQIDataSchema, StationSearchResult, HistoricalReading

logger = logging.getLogger(__name__)

# Validation constants
_MAX_PM_CONC = 2000.0        # µg/m³ – anything above is sensor error
_MAX_GAS_CONC = 5000.0       # ppb/µg/m³ – generous upper bound for gases
_STALE_HOURS = 2

_client = OpenAQClient()
_meteo = OpenMeteoClient()


def _archive_snapshot(data: AQIDataSchema) -> None:
    timestamp = data.last_updated or datetime.now(timezone.utc)
    record_readings(
        data.station_id,
        [
            HistoricalReading(
                timestamp=reading.last_updated or timestamp,
                parameter=reading.parameter,
                value=reading.value,
                unit=reading.unit,
            )
            for reading in data.readings
        ],
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def fetch_aqi_for_city(city: str, country: str = "IN") -> Optional[AQIDataSchema]:
    """Return AQI data for the most recent station in *city*."""
    cache_key = f"aqi:city:{country}:{city.lower()}"
    cached = cache_get(cache_key)
    if cached is not None:
        logger.debug("Cache hit: %s", cache_key)
        return cached

    locations = await _client.search_locations(city=city, country=country, limit=5)
    if locations:
        result = await _fetch_for_location(locations[0])
        if result:
            _archive_snapshot(result)
            cache_set(cache_key, result)
            return result

    # Live fallback: Open-Meteo Air Quality (CAMS) – free, no API key required
    logger.info("OpenAQ unavailable for city=%s; using Open-Meteo Air Quality", city)
    result = await _fetch_open_meteo_for_city(city=city, country=country)
    if result:
        _archive_snapshot(result)
        cache_set(cache_key, result)
    return result


async def fetch_aqi_for_station(station_id: str) -> Optional[AQIDataSchema]:
    """Return AQI data for a specific station id."""
    cache_key = f"aqi:station:{station_id}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    try:
        loc_id = int(station_id)
    except ValueError:
        logger.warning("Invalid station_id (not an integer): %s", station_id)
        return None

    # Build a minimal location dict
    loc = {"id": loc_id, "name": station_id, "locality": "", "country": {"code": "IN"}}
    result = await _fetch_for_location(loc)
    if result:
        _archive_snapshot(result)
        cache_set(cache_key, result)
    return result


async def search_stations(city: str, country: str = "IN") -> list[StationSearchResult]:
    """Return a list of monitoring stations for *city*."""
    cache_key = f"stations:{country}:{city.lower()}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    locations = await _client.search_locations(city=city, country=country, limit=20)
    if not locations:
        geo = await _meteo.geocode_city(city=city, country=country)
        if not geo:
            return []
        lat = geo["latitude"]
        lon = geo["longitude"]
        return [
            StationSearchResult(
                station_id=f"om:{lat:.4f},{lon:.4f}",
                station_name=f"{geo.get('name', city)} (Open-Meteo CAMS Grid)",
                city=geo.get("name", city),
                country=geo.get("country_code", country),
                latitude=lat,
                longitude=lon,
                parameters=["pm25", "pm10", "no2", "so2", "co", "o3"],
            )
        ]

    results = []
    for loc in locations:
        coords = loc.get("coordinates") or {}
        results.append(
            StationSearchResult(
                station_id=str(loc.get("id", "")),
                station_name=loc.get("name", "Unknown"),
                city=loc.get("locality", city),
                country=loc.get("country", {}).get("code", country),
                latitude=coords.get("latitude"),
                longitude=coords.get("longitude"),
                parameters=[
                    s.get("parameter", {}).get("name", "")
                    for s in loc.get("sensors", [])
                    if s.get("parameter")
                ],
            )
        )

    cache_set(cache_key, results)
    return results


async def fetch_historical(
    station_id: str,
    parameter: str,
    hours: int = 24,
) -> list[HistoricalReading]:
    """Return historical readings for a parameter over *hours* hours."""
    if station_id.startswith("om:"):
        readings = await _fetch_open_meteo_history(
            station_id=station_id, parameter=parameter, hours=hours
        )
    else:
        now = datetime.now(timezone.utc)
        date_from = (now - timedelta(hours=hours)).isoformat()
        date_to = now.isoformat()

        try:
            loc_id = int(station_id)
        except ValueError:
            readings = []
        else:
            raw = await _client.get_location_measurements(
                location_id=loc_id,
                parameter=parameter,
                date_from=date_from,
                date_to=date_to,
            ) or []
            readings = []
            for item in raw:
                try:
                    value = float(item.get("value", 0.0))
                    if not _validate_concentration(parameter, value):
                        continue
                    dt_raw = item.get("period", {}).get("datetimeTo", {}).get("utc") or item.get("date", {}).get("utc")
                    if dt_raw is None:
                        continue
                    readings.append(
                        HistoricalReading(
                            timestamp=datetime.fromisoformat(dt_raw.replace("Z", "+00:00")),
                            parameter=parameter,
                            value=value,
                            unit=item.get("unit", "µg/m³"),
                        )
                    )
                except Exception as exc:
                    logger.debug("Skipping bad historical reading: %s", exc)

    record_readings(station_id, readings)
    archived = get_archived_readings(station_id, parameter, hours)
    merged = {
        reading.timestamp.isoformat(): reading
        for reading in [*archived, *readings]
    }
    return sorted(merged.values(), key=lambda reading: reading.timestamp)


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

async def _fetch_for_location(loc: dict) -> Optional[AQIDataSchema]:
    loc_id = loc.get("id")
    if loc_id is None:
        return None

    sensors_raw = await _client.get_latest_measurements(location_id=int(loc_id))
    if sensors_raw is None:
        return None

    readings: list[PollutantReading] = []
    latest_dt: Optional[datetime] = None
    reading_dict: dict[str, float] = {}

    for sensor in sensors_raw:
        param_obj = sensor.get("parameter") or {}
        param_name = param_obj.get("name", "").lower().replace(".", "")
        unit = param_obj.get("units", "µg/m³")

        latest = sensor.get("latest") or {}
        raw_value = latest.get("value")
        if raw_value is None:
            continue

        try:
            value = float(raw_value)
        except (TypeError, ValueError):
            continue

        if not _validate_concentration(param_name, value):
            logger.debug("Rejecting implausible value %s=%s", param_name, value)
            continue

        dt_str = latest.get("datetime") or latest.get("date")
        dt = None
        if dt_str:
            try:
                dt = datetime.fromisoformat(str(dt_str).replace("Z", "+00:00"))
                if latest_dt is None or dt > latest_dt:
                    latest_dt = dt
            except ValueError:
                pass

        if param_name == "aqi":
            logger.info("Ignoring AQI value with unverified scale for location=%s", loc_id)
            continue

        readings.append(
            PollutantReading(
                parameter=param_name,
                value=value,
                unit=unit,
                last_updated=dt,
                source_label="OpenAQ measurement",
            )
        )
        reading_dict[param_name] = value

    # Determine staleness
    is_stale = False
    if latest_dt:
        age = datetime.now(timezone.utc) - latest_dt.replace(tzinfo=timezone.utc) if latest_dt.tzinfo is None else datetime.now(timezone.utc) - latest_dt
        is_stale = age > timedelta(hours=_STALE_HOURS)

    # Compute our own AQI if we have enough parameters
    computed_aqi = calculate_aqi(reading_dict) if reading_dict else None
    computed_category = classify_aqi(computed_aqi) if computed_aqi is not None else None

    coords = loc.get("coordinates") or {}

    return AQIDataSchema(
        station_id=str(loc_id),
        station_name=loc.get("name", "Unknown Station"),
        city=loc.get("locality", ""),
        country=loc.get("country", {}).get("code", "IN") if isinstance(loc.get("country"), dict) else loc.get("country", "IN"),
        latitude=coords.get("latitude"),
        longitude=coords.get("longitude"),
        readings=readings,
        cpcb_aqi=None,
        cpcb_category=None,
        cpcb_source="Official CPCB AQI unavailable from OpenAQ",
        computed_aqi=computed_aqi,
        computed_category=computed_category,
        is_stale=is_stale,
        last_updated=latest_dt,
    )


def _validate_concentration(parameter: str, value: float) -> bool:
    """Return False for obviously implausible concentration values."""
    if value < 0:
        return False
    pm_params = {"pm25", "pm10", "pm1", "pm2.5"}
    if any(p in parameter for p in pm_params):
        return value <= _MAX_PM_CONC
    return value <= _MAX_GAS_CONC


_METEO_PARAM_MAP = {
    "pm2_5": ("pm25", "µg/m³"),
    "pm10": ("pm10", "µg/m³"),
    "nitrogen_dioxide": ("no2", "µg/m³"),
    "sulphur_dioxide": ("so2", "µg/m³"),
    "carbon_monoxide": ("co", "mg/m³"),
    "ozone": ("o3", "µg/m³"),
}

_REVERSE_METEO_PARAM = {
    "pm25": ("pm2_5", "µg/m³"),
    "pm10": ("pm10", "µg/m³"),
    "no2": ("nitrogen_dioxide", "µg/m³"),
    "so2": ("sulphur_dioxide", "µg/m³"),
    "co": ("carbon_monoxide", "mg/m³"),
    "o3": ("ozone", "µg/m³"),
}


async def _fetch_open_meteo_for_city(city: str, country: str = "IN") -> Optional[AQIDataSchema]:
    geo = await _meteo.geocode_city(city=city, country=country)
    if not geo:
        return None

    lat = float(geo["latitude"])
    lon = float(geo["longitude"])
    aq = await _meteo.get_current_air_quality(latitude=lat, longitude=lon)
    if not aq or not aq.get("current"):
        return None

    current = aq["current"]
    time_str = current.get("time")
    dt = (
        datetime.fromisoformat(time_str).replace(tzinfo=timezone.utc)
        if time_str
        else datetime.now(timezone.utc)
    )
    is_stale = (datetime.now(timezone.utc) - dt) > timedelta(hours=_STALE_HOURS)

    readings: list[PollutantReading] = []
    reading_dict: dict[str, float] = {}

    for meteo_key, (param_name, unit) in _METEO_PARAM_MAP.items():
        raw_val = current.get(meteo_key)
        if raw_val is None:
            continue
        val = float(raw_val)
        # Open-Meteo reports CO in µg/m³; convert to mg/m³ for CPCB scale
        if meteo_key == "carbon_monoxide":
            val = round(val / 1000.0, 2)
        if not _validate_concentration(param_name, val):
            continue

        readings.append(
            PollutantReading(
                parameter=param_name,
                value=round(val, 2),
                unit=unit,
                last_updated=dt,
                source_label="Open-Meteo (CAMS)",
            )
        )
        reading_dict[param_name] = val

    computed_aqi = calculate_aqi(reading_dict) if reading_dict else None
    computed_category = classify_aqi(computed_aqi) if computed_aqi is not None else None

    return AQIDataSchema(
        station_id=f"om:{lat:.4f},{lon:.4f}",
        station_name=f"{geo.get('name', city)} Regional Grid",
        city=geo.get("name", city),
        country=geo.get("country_code", country),
        latitude=lat,
        longitude=lon,
        readings=readings,
        cpcb_aqi=None,
        cpcb_category=None,
        cpcb_source="Official CPCB AQI unavailable from Open-Meteo",
        computed_aqi=computed_aqi,
        computed_category=computed_category,
        is_stale=is_stale,
        last_updated=dt,
        data_provider="Open-Meteo Air Quality (CAMS)",
    )


async def _fetch_open_meteo_history(
    station_id: str, parameter: str, hours: int = 48
) -> list[HistoricalReading]:
    try:
        coords_part = station_id.replace("om:", "")
        lat_str, lon_str = coords_part.split(",")
        lat, lon = float(lat_str), float(lon_str)
    except Exception:
        return []

    meteo_info = _REVERSE_METEO_PARAM.get(parameter.lower().replace(".", ""))
    if not meteo_info:
        return []
    meteo_key, unit = meteo_info

    data = await _meteo.get_hourly_history(latitude=lat, longitude=lon, hours=hours)
    if not data or not data.get("hourly"):
        return []

    hourly = data["hourly"]
    times = hourly.get("time") or []
    values = hourly.get(meteo_key) or []

    results: list[HistoricalReading] = []
    for t_str, raw_val in zip(times, values):
        if raw_val is None:
            continue
        val = float(raw_val)
        if meteo_key == "carbon_monoxide":
            val = round(val / 1000.0, 2)
        if not _validate_concentration(parameter, val):
            continue
        dt = datetime.fromisoformat(t_str).replace(tzinfo=timezone.utc)
        results.append(
            HistoricalReading(
                timestamp=dt,
                parameter=parameter,
                value=round(val, 2),
                unit=unit,
            )
        )
    return results
