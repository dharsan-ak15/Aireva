from datetime import datetime, timezone

import pytest

from services import aqi_service


@pytest.mark.asyncio
async def test_unverified_openaq_aqi_is_not_reported_as_official(monkeypatch):
    timestamp = datetime.now(timezone.utc).isoformat()

    class FakeOpenAQClient:
        async def get_latest_measurements(self, location_id):
            return [
                {
                    "parameter": {"name": "aqi", "units": "index"},
                    "latest": {"value": 74, "datetime": timestamp},
                },
                {
                    "parameter": {"name": "pm25", "units": "µg/m³"},
                    "latest": {"value": 28, "datetime": timestamp},
                },
            ]

    monkeypatch.setattr(aqi_service, "_client", FakeOpenAQClient())
    monkeypatch.setattr(aqi_service, "calculate_aqi", lambda readings: 52)

    result = await aqi_service._fetch_for_location({"id": 123, "country": {"code": "IN"}})

    assert result is not None
    assert result.cpcb_aqi is None
    assert result.cpcb_category is None
    assert result.computed_aqi == 52
    assert [reading.parameter for reading in result.readings] == ["pm25"]