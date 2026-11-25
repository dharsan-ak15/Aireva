// ============================================================
// Aireva – useAQI Custom Hook
// ============================================================
import { useEffect, useCallback, useRef } from 'react';
import { useUserStore, useAQIStore } from '../store';
import { fetchAQIByCity } from '../services/api';
import { isDataStale } from '../utils';

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export function useAQI() {
  const profile = useUserStore((s) => s.profile);
  const { currentData, isLoading, error, lastFetched, setAQIData, setLoading, setError } =
    useAQIStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!profile?.location?.city) return;
    setLoading(true);
    try {
      const data = await fetchAQIByCity(profile.location.city, 'IN');
      setAQIData(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch air quality data.';
      setError(message);
    }
  }, [profile?.location?.city, setAQIData, setLoading, setError]);

  // Initial fetch
  useEffect(() => {
    if (profile?.location?.city) {
      fetchData();
    }
  }, [profile?.location?.city]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 10 minutes
  useEffect(() => {
    if (!profile?.location?.city) return;
    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [profile?.location?.city, fetchData]);

  const isStale =
    lastFetched ? isDataStale(lastFetched, 2) : false;

  return {
    data: currentData,
    isLoading,
    error,
    refresh: fetchData,
    isStale,
  };
}
