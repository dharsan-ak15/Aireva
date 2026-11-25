// ============================================================
// Aireva – useRecommendations Custom Hook
// ============================================================
import { useEffect, useCallback } from 'react';
import { useUserStore, useAQIStore, useRecommendationStore } from '../store';
import { fetchRecommendations } from '../services/api';

export function useRecommendations() {
  const profile = useUserStore((s) => s.profile);
  const aqiData = useAQIStore((s) => s.currentData);
  const {
    recommendations,
    isLoading,
    error,
    setRecommendations,
    setLoading,
    setError,
  } = useRecommendationStore();

  const fetchData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const recs = await fetchRecommendations(profile, aqiData);
      setRecommendations(recs);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch recommendations.';
      setError(message);
    }
  }, [profile, aqiData, setRecommendations, setLoading, setError]);

  // Refetch when AQI data or profile changes
  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile?.id, aqiData?.lastUpdated]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    recommendations,
    isLoading,
    error,
    refresh: fetchData,
  };
}
