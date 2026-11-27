import { useCallback, useEffect, useState } from 'react';
import { Check, Clock, ArrowRight, RefreshCw, AlertCircle, Sun, Cloud, Sunset, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserStore, useAQIStore, useRecommendationStore } from '../store';
import { fetchRecommendations } from '../services/api';
import { getAQICategoryInfo, getGreeting, cn } from '../utils';
import type { Recommendation, TimeOfDay } from '../types';
import toast from 'react-hot-toast';

const TIME_ICONS: Record<TimeOfDay, React.ElementType> = {
  morning: Sun,
  afternoon: Cloud,
  evening: Sunset,
  night: Moon,
  all_day: Clock,
};

const PRIORITY_STYLES = {
  high: 'border-l-4 border-red-400 bg-red-50',
  medium: 'border-l-4 border-yellow-400 bg-yellow-50',
  low: 'border-l-4 border-green-400 bg-green-50',
};

function RecommendationCard({
  rec,
  onToggle,
}: {
  rec: Recommendation;
  onToggle: (id: string) => void;
}) {
  const TimeIcon = TIME_ICONS[rec.timeOfDay] ?? Clock;

  return (
    <div
      className={cn(
        'card p-4 transition-all duration-200',
        rec.isCompleted ? 'opacity-60' : '',
        PRIORITY_STYLES[rec.priority]
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(rec.id)}
          className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
            rec.isCompleted
              ? 'bg-forest-600 border-forest-600'
              : 'border-gray-300 hover:border-forest-500'
          )}
          aria-label={rec.isCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          {rec.isCompleted && <Check className="w-3 h-3 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <TimeIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-500 capitalize">{rec.timeOfDay.replace('_', ' ')}</span>
            <span
              className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full',
                rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              )}
            >
              {rec.priority} priority
            </span>
          </div>

          <p className={cn(
            'font-medium text-gray-900 text-sm',
            rec.isCompleted && 'line-through text-gray-500'
          )}>
            {rec.action}
          </p>

          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{rec.reason}</p>

          {rec.benefit && (
            <p className="text-xs text-forest-700 font-medium mt-1">✓ {rec.benefit}</p>
          )}

          {rec.alternativeAction && (
            <p className="text-xs text-gray-500 mt-1">
              <span className="font-medium">Alternative:</span> {rec.alternativeAction}
            </p>
          )}

          {rec.influencedBy && (
            <p className="text-xs text-gray-400 mt-1 italic">
              Based on: {rec.influencedBy}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-400">
              Confidence: {rec.confidence}
            </span>
            {rec.dataTimestamp && (
              <span className="text-xs text-gray-400">
                • Data from {new Date(rec.dataTimestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoutinePlannerPage() {
  const profile = useUserStore((s) => s.profile);
  const { currentData: aqiData } = useAQIStore();
  const { recommendations, isLoading, error, setRecommendations, toggleComplete, setLoading, setError, lastGenerated } =
    useRecommendationStore();
  const [activeTab, setActiveTab] = useState<TimeOfDay | 'all'>('all');

  const generate = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const recs = await fetchRecommendations(profile, aqiData);
      setRecommendations(recs);
      toast.success('Routine updated!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate recommendations';
      setError(msg);
      toast.error('Could not load recommendations');
    }
  }, [profile, aqiData, setLoading, setRecommendations, setError]);

  useEffect(() => {
    if (profile && recommendations.length === 0) {
      generate();
    }
  }, [profile, recommendations.length, generate]);

  const filtered = activeTab === 'all'
    ? recommendations
    : recommendations.filter((r) => r.timeOfDay === activeTab);

  const completedCount = recommendations.filter((r) => r.isCompleted).length;
  const totalCount = recommendations.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const TABS: { id: TimeOfDay | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'morning', label: 'Morning' },
    { id: 'afternoon', label: 'Afternoon' },
    { id: 'evening', label: 'Evening' },
    { id: 'night', label: 'Night' },
  ];

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">
              {getGreeting(profile?.name)} — Today's Plan
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Personalized for{' '}
              <span className="font-medium text-gray-700">
                {profile?.category?.replace('_', ' ')} in {profile?.location?.city || 'your location'}
              </span>
            </p>
            {aqiData ? (
              <div className="flex items-center gap-2 mt-2">
                <span className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full border',
                  `aqi-${aqiData.aqiCategory?.replace('_', '-') ?? 'unknown'}`
                )}>
                  {aqiData.aqiCategory
                    ? getAQICategoryInfo(aqiData.aqiCategory).label
                    : 'AQI Unknown'}
                  {aqiData.aqiValue !== undefined && ` (${aqiData.aqiValue})`}
                </span>
                <span className="text-xs text-gray-400">{aqiData.city}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>No live AQI data — recommendations based on profile only</span>
              </div>
            )}
          </div>

          <button
            onClick={generate}
            disabled={isLoading}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            Regenerate
          </button>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Today's progress</span>
              <span className="font-medium">{completedCount}/{totalCount} completed ({pct}%)</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-forest-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tab filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
              activeTab === tab.id
                ? 'bg-forest-700 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-forest-200 hover:text-forest-700'
            )}
          >
            {tab.label}
            {tab.id !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({recommendations.filter((r) => r.timeOfDay === tab.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Recommendations */}
      {isLoading && (
        <div className="card p-12 text-center">
          <RefreshCw className="w-8 h-8 text-forest-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">Generating your personalized routine…</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="card p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-300 mx-auto mb-3" />
          <p className="font-medium text-gray-900 mb-1">Could not load recommendations</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button onClick={generate} className="btn-primary">Retry</button>
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && recommendations.length === 0 && (
        <div className="card p-12 text-center">
          <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h3 className="font-medium text-gray-900 mb-2">No routine generated yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Click "Regenerate" to create your personalized daily routine based on current air quality and your profile.
          </p>
          <button onClick={generate} className="btn-primary">Generate My Routine</button>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} onToggle={toggleComplete} />
          ))}
        </div>
      )}

      {/* Last generated note */}
      {lastGenerated && (
        <p className="text-xs text-gray-400 text-center">
          Routine generated {new Date(lastGenerated).toLocaleString('en-IN')} •
          Based on your profile and {aqiData ? 'live AQI data' : 'profile-only rules'}
        </p>
      )}

      {/* Ask AI link */}
      <div className="card p-5 bg-forest-50 border-forest-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-forest-900 text-sm">Need more personalized advice?</p>
            <p className="text-xs text-forest-700 mt-0.5">Ask Aireva AI for a customized routine</p>
          </div>
          <Link to="/ai" className="btn-primary text-sm flex items-center gap-2">
            Ask AI <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
