"""CPCB India AQI classification and sub-index calculation."""

from __future__ import annotations

from typing import Optional

from models.aqi import AQICategoryEnum

# CPCB India National Air Quality Index breakpoints:
# (lo_conc, hi_conc, lo_aqi, hi_aqi)
CPCB_BREAKPOINTS: dict[str, list[tuple[float, float, int, int]]] = {
    "pm25": [
        (0, 30, 0, 50),
        (30, 60, 51, 100),
        (60, 90, 101, 200),
        (90, 120, 201, 300),
        (120, 250, 301, 400),
        (250, 500, 401, 500),
    ],
    "pm10": [
        (0, 50, 0, 50),
        (50, 100, 51, 100),
        (100, 250, 101, 200),
        (250, 350, 201, 300),
        (350, 430, 301, 400),
        (430, 600, 401, 500),
    ],
    "no2": [
        (0, 40, 0, 50),
        (40, 80, 51, 100),
        (80, 180, 101, 200),
        (180, 280, 201, 300),
        (280, 400, 301, 400),
        (400, 800, 401, 500),
    ],
    "so2": [
        (0, 40, 0, 50),
        (40, 80, 51, 100),
        (80, 380, 101, 200),
        (380, 800, 201, 300),
        (800, 1600, 301, 400),
        (1600, 2100, 401, 500),
    ],
    "co": [
        (0, 1.0, 0, 50),
        (1.0, 2.0, 51, 100),
        (2.0, 10.0, 101, 200),
        (10.0, 17.0, 201, 300),
        (17.0, 34.0, 301, 400),
        (34.0, 50.0, 401, 500),
    ],
    "o3": [
        (0, 50, 0, 50),
        (50, 100, 51, 100),
        (100, 168, 101, 200),
        (168, 208, 201, 300),
        (208, 748, 301, 400),
        (748, 1000, 401, 500),
    ],
}


def calculate_sub_index(parameter: str, concentration: Optional[float]) -> Optional[int]:
    """Calculate CPCB AQI sub-index for a single pollutant concentration."""
    if concentration is None or concentration < 0:
        return None

    param = parameter.lower().replace(".", "").strip()
    breakpoints = CPCB_BREAKPOINTS.get(param)
    if not breakpoints:
        return None

    for lo_c, hi_c, lo_i, hi_i in breakpoints:
        if lo_c <= concentration <= hi_c:
            aqi = ((hi_i - lo_i) / (hi_c - lo_c)) * (concentration - lo_c) + lo_i
            return round(aqi)

    # Above highest breakpoint
    if concentration > breakpoints[-1][1]:
        return 500
    return None


def calculate_aqi(readings: dict[str, Optional[float]]) -> Optional[int]:
    """Calculate overall CPCB AQI as the maximum sub-index across available pollutants."""
    if not readings:
        return None

    sub_indices: list[int] = []
    for param, conc in readings.items():
        sub = calculate_sub_index(param, conc)
        if sub is not None:
            sub_indices.append(sub)

    return max(sub_indices) if sub_indices else None


def classify_aqi(aqi_value: Optional[int]) -> AQICategoryEnum:
    """Classify an integer AQI value into CPCB India categories."""
    if aqi_value is None or aqi_value < 0:
        return AQICategoryEnum.UNKNOWN
    if aqi_value <= 50:
        return AQICategoryEnum.GOOD
    if aqi_value <= 100:
        return AQICategoryEnum.SATISFACTORY
    if aqi_value <= 200:
        return AQICategoryEnum.MODERATE
    if aqi_value <= 300:
        return AQICategoryEnum.POOR
    if aqi_value <= 400:
        return AQICategoryEnum.VERY_POOR
    return AQICategoryEnum.SEVERE
