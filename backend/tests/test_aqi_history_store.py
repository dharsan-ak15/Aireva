from datetime import datetime, timedelta, timezone

from schemas.aqi import HistoricalReading
from services.aqi_history_store import get_readings, record_readings


def test_record_readings_deduplicates_and_filters_by_window(tmp_path):
    db_path = tmp_path / "history.sqlite3"
    recent = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    old = recent - timedelta(days=8)

    record_readings(
        "station-1",
        [
            HistoricalReading(timestamp=recent, parameter="pm25", value=18, unit="µg/m³"),
            HistoricalReading(timestamp=recent, parameter="pm25", value=20, unit="µg/m³"),
            HistoricalReading(timestamp=old, parameter="pm25", value=35, unit="µg/m³"),
        ],
        db_path,
    )

    readings = get_readings("station-1", "pm25", 168, db_path)

    assert len(readings) == 1
    assert readings[0].value == 20