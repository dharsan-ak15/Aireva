import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, MapPin, AlertTriangle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAQIStore, useUserStore } from '../store';
import { fetchAQIByCity, fetchAQIByStation, fetchHistoricalReadings, searchStations } from '../services/api';
import { getAQICategoryInfo, getPollutantInfo, getPollutantLevel, formatRelativeTime, formatDateTime, cn } from '../utils';
import type { PollutantReading, HistoricalReading, StationSearchResult } from '../types';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';

function getCountryCode(country?: string): string {
  const normalized = (country || 'IN').trim().toUpperCase();
  return normalized.length <= 3 ? normalized : 'IN';
}

// ─── AQI Gauge ────────────────────────────────────────────────
function AQIGauge({ value, category }: { value: number; category: string }) {
  const info = getAQICategoryInfo(category as any);
  const pct = Math.min((value / 500) * 100, 100);
  const circumference = 2 * Math.PI * 54;
  const dash = (pct / 100) * circumference;

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#f3f4f6" strokeWidth="10" />
        <circle
          cx="60" cy="60" r="54"
          fill="none"
          stroke={info.color}
          strokeWidth="10"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-gray-900">{value}</span>
        <span className={cn('text-sm font-semibold mt-0.5', info.text)}>{info.label}</span>
        <span className="text-xs text-gray-400 mt-0.5">AQI</span>
      </div>
    </div>
  );
}

// ─── Pollutant Card ───────────────────────────────────────────
function PollutantCard({ reading }: { reading: PollutantReading }) {
  const info = getPollutantInfo(reading.parameter);
  const level = getPollutantLevel(reading);
  const pct = Math.min((reading.value / (info.safeLimit * 2.5)) * 100, 100);

  const levelColors = {
    safe: { bar: 'bg-emerald-400', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    moderate: { bar: 'bg-yellow-400', text: 'text-yellow-700', badge: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    unsafe: { bar: 'bg-red-400', text: 'text-red-700', badge: 'bg-red-50 text-red-700 border-red-200' },
  };
  const colors = levelColors[level];

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-semibold text-gray-900 text-sm">{info.label}</span>
          <p className="text-xs text-gray-400 mt-0.5">{info.fullName}</p>
        </div>
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', colors.badge)}>
          {level === 'safe' ? 'Safe' : level === 'moderate' ? 'Moderate' : 'Elevated'}
        </span>
      </div>

      <div className="flex items-baseline gap-1 mb-3">
        <span className={cn('text-2xl font-bold', colors.text)}>
          {reading.value.toFixed(1)}
        </span>
        <span className="text-xs text-gray-500">{reading.unit}</span>
      </div>

      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors.bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-400">0</span>
        <span className="text-xs text-gray-400">Limit: {info.safeLimit} {info.unit}</span>
      </div>
      <p className="text-xs text-gray-500 mt-2 leading-relaxed">{info.description}</p>
    </div>
  );
}

// ─── Trend Chart ──────────────────────────────────────────────
function TrendChart({ data, parameter, source }: { data: HistoricalReading[]; parameter: string; source: string }) {
  const info = getPollutantInfo(parameter);

  if (!data.length) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-gray-500">No historical data available for {info.label}</p>
      </div>
    );
  }

  const chartData = data.map((r) => ({
    time: new Date(r.timestamp).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
    }),
    value: parseFloat(r.value.toFixed(1)),
  }));

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{info.label} Trend (7 days)</h3>
          <p className="text-xs text-gray-500">Historical measurements from monitoring station</p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-200">
          {info.unit}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            formatter={(v: number) => [`${v} ${info.unit}`, info.label]}
          />
          <ReferenceLine
            y={info.safeLimit}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            label={{ value: 'Limit', position: 'right', fontSize: 10, fill: '#d97706' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#16653a"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-400 mt-2">
        Source: {source}. These are raw concentration measurements, not official CPCB AQI values.
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function AQIMonitorPage() {
  const { currentData, isLoading, error, setAQIData, setLoading, setError, lastFetched } = useAQIStore();
  const profile = useUserStore((s) => s.profile);

  const [cityInput, setCityInput] = useState(profile?.location?.city || '');
  const [stations, setStations] = useState<StationSearchResult[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [historicalData, setHistoricalData] = useState<HistoricalReading[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [stationsLoading, setStationsLoading] = useState(false);
  const initialized = useRef(false);

  const loadHistory = useCallback(async (stationId: string) => {
    if (!stationId) return;
    setHistLoading(true);
    try {
      const history = await fetchHistoricalReadings(stationId, 'pm25', 168);
      setHistoricalData(history);
    } catch {
      setHistoricalData([]);
    } finally {
      setHistLoading(false);
    }
  }, []);

  const refresh = useCallback(async (city: string) => {
    if (!city.trim()) return;
    setLoading(true);
    try {
      const data = await fetchAQIByCity(city, getCountryCode(profile?.location?.country));
      setAQIData(data);
      await loadHistory(data.stationId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch AQI data';
      setError(msg);
      toast.error(msg);
    }
  }, [profile?.location?.country, setAQIData, setError, setLoading, loadHistory]);

  const searchForStations = async () => {
    if (!cityInput.trim()) return;
    setStationsLoading(true);
    try {
      const results = await searchStations(cityInput, getCountryCode(profile?.location?.country));
      setStations(results);
    } catch {
      toast.error('Could not search stations');
    } finally {
      setStationsLoading(false);
    }
  };

  const selectStation = async (stationId: string) => {
    setSelectedStation(stationId);
    if (!stationId) return;
    setLoading(true);
    try {
      const data = stationId.startsWith('om:')
        ? await fetchAQIByCity(cityInput, getCountryCode(profile?.location?.country))
        : await fetchAQIByStation(stationId);
      setAQIData(data);
      await loadHistory(data.stationId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch station data';
      setError(msg);
      toast.error(msg);
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (profile?.location?.city && !currentData) {
      void refresh(profile.location.city);
    } else if (currentData?.stationId) {
      void loadHistory(currentData.stationId);
    }
  }, [currentData, profile?.location?.city, loadHistory, refresh]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refresh(cityInput);
    searchForStations();
  };

  const aqiInfo = currentData?.aqiCategory
    ? getAQICategoryInfo(currentData.aqiCategory)
    : null;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="card p-5">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="Enter city name (e.g. Delhi, Mumbai, Bangalore)"
              className="input-field pl-9"
            />
          </div>
          <button type="submit" disabled={isLoading || stationsLoading || !cityInput.trim()} className="btn-primary">
            {isLoading || stationsLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>
        </form>

        {stations.length > 0 && (
          <div className="mt-3">
            <label className="text-xs font-medium text-gray-600 block mb-1.5">
              Available monitoring stations
            </label>
            <select
              className="select-field text-sm"
              value={selectedStation}
              onChange={(e) => selectStation(e.target.value)}
            >
              <option value="">Select a station (optional)</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.city}
                  {s.parameters.length > 0 && ` (${s.parameters.join(', ')})`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Data source: <strong>{currentData?.dataProvider || 'OpenAQ / Open-Meteo'}</strong>. These are raw concentration
          measurements. Official CPCB AQI values are only displayed when available from the CPCB data feed.
          Never interpret OpenAQ concentration values directly as CPCB AQI.
        </span>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card p-12 text-center">
          <RefreshCw className="w-8 h-8 text-forest-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">Fetching air quality data for {cityInput}…</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="card p-8 text-center border-red-100">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="font-medium text-gray-900 mb-1">Data Unavailable</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button onClick={() => refresh(cityInput)} className="btn-primary">
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </button>
        </div>
      )}

      {/* AQI Data Display */}
      {currentData && !isLoading && (
        <>
          {/* Station Info + AQI Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* AQI Gauge */}
            <div className="card p-6 md:col-span-1">
              {currentData.aqiValue !== undefined ? (
                <>
                  <AQIGauge
                    value={currentData.aqiValue}
                    category={currentData.aqiCategory || 'unknown'}
                  />
                  {currentData.isAqiEstimated && (
                    <p className="mt-2 text-xs text-center text-amber-700">
                      Estimate from pollutant readings using CPCB breakpoints; not an official CPCB reading.
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-2">Official AQI not available</p>
                  <p className="text-xs text-gray-400">Showing concentration measurements below</p>
                </div>
              )}

              {aqiInfo && (
                <p className="text-xs text-center text-gray-500 mt-3 leading-relaxed">
                  {aqiInfo.description}
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 space-y-1 text-xs text-gray-500">
                {currentData.aqiSource && (
                  <div className="flex justify-between">
                    <span>AQI Method</span>
                    <span className="font-medium text-gray-700">{currentData.aqiSource}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Data Provider</span>
                  <span className="font-medium text-gray-700">{currentData.dataProvider}</span>
                </div>
              </div>
            </div>

            {/* Station Details */}
            <div className="card p-5 md:col-span-2">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-900 text-lg">{currentData.stationName}</h2>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {currentData.city}, {currentData.state}
                    {currentData.latitude && ` (${currentData.latitude.toFixed(3)}, ${currentData.longitude?.toFixed(3)})`}
                  </p>
                </div>
                <button
                  onClick={() => refresh(cityInput)}
                  className="btn-ghost p-2 rounded-lg"
                  aria-label="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Data freshness */}
              <div className={cn(
                'flex items-center gap-2 text-xs rounded-lg px-3 py-2 mb-4',
                currentData.isStale
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              )}>
                {currentData.isStale ? (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                )}
                <span>
                  {currentData.isStale ? 'Stale data – ' : 'Last updated: '}
                  {formatDateTime(currentData.lastUpdated)}
                  {lastFetched && ` • Fetched ${formatRelativeTime(lastFetched)}`}
                </span>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {currentData.pollutants.slice(0, 6).map((p) => {
                  const info = getPollutantInfo(p.parameter);
                  const level = getPollutantLevel(p);
                  const levelColor = level === 'safe' ? 'text-emerald-600' : level === 'moderate' ? 'text-yellow-600' : 'text-red-600';
                  return (
                    <div key={p.parameter} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-xs text-gray-500 font-medium">{info.label}</p>
                      <p className={cn('text-xl font-bold mt-0.5', levelColor)}>
                        {p.value.toFixed(1)}
                      </p>
                      <p className="text-xs text-gray-400">{p.unit}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Full pollutant grid */}
          {currentData.pollutants.length > 0 && (
            <div>
              <h3 className="section-title mb-4">Pollutant Measurements</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentData.pollutants.map((p) => (
                  <PollutantCard key={p.parameter} reading={p} />
                ))}
              </div>
            </div>
          )}

          {/* Trend chart */}
          <div>
            <h3 className="section-title mb-4">Historical Trend</h3>
            {histLoading ? (
              <div className="card p-8 text-center">
                <RefreshCw className="w-6 h-6 text-forest-400 animate-spin mx-auto" />
              </div>
            ) : (
              <TrendChart data={historicalData} parameter="pm25" source={currentData.dataProvider} />
            )}
          </div>
        </>
      )}

      {/* Empty state */}
      {!currentData && !isLoading && !error && (
        <div className="card p-16 text-center">
          <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-2">Search for a City</h3>
          <p className="text-sm text-gray-500">
            Enter a city name above to fetch real-time air quality monitoring data.
          </p>
        </div>
      )}
    </div>
  );
}
