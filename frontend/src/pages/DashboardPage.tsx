import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wind, CalendarDays, Bot, ArrowRight, RefreshCw,
  MapPin, Lightbulb, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useUserStore, useRecommendationStore, useProgressStore } from '../store';
import { useAQI } from '../hooks/useAQI';
import { useRecommendations } from '../hooks/useRecommendations';
import AQICard from '../components/aqi/AQICard';
import PollutantCard from '../components/aqi/PollutantCard';
import WeeklyProgressChart from '../components/charts/WeeklyProgressChart';
import { getGreeting, cn } from '../utils';

const EDUCATION_TIPS = [
  {
    title: 'What is PM2.5?',
    body: 'Fine particulate matter under 2.5 micrometers — about 30x thinner than a human hair. It can penetrate deep into lungs and enter the bloodstream.',
  },
  {
    title: 'Why Winter Smog Peaks',
    body: 'Cold winter air traps pollutants near the ground (thermal inversion), while calm winds prevent dispersion.',
  },
  {
    title: 'Indoor vs Outdoor Air',
    body: 'Cooking smoke, incense, and mosquito coils can spike indoor PM2.5 above outdoor levels. Cross-ventilate when outdoor air is clearer.',
  },
];

export default function DashboardPage() {
  const profile = useUserStore((s) => s.profile);
  const { data: aqiData, isLoading: aqiLoading, error: aqiError, refresh: refreshAQI } = useAQI();
  const { recommendations, isLoading: recsLoading, refresh: refreshRecs } = useRecommendations();
  const toggleComplete = useRecommendationStore((s) => s.toggleComplete);
  const getWeekProgress = useProgressStore((s) => s.getWeekProgress);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % EDUCATION_TIPS.length);
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const topRecs = recommendations.slice(0, 3);
  const topPollutants = aqiData?.pollutants?.slice(0, 4) ?? [];
  const weekProgress = getWeekProgress();
  const tip = EDUCATION_TIPS[tipIndex];

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="card p-6 bg-gradient-to-r from-forest-800 to-forest-700 text-white border-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{getGreeting(profile?.name)}</h2>
            <p className="text-forest-100 text-sm mt-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>
                {profile?.location?.city || 'Select your city'}
                {profile?.location?.state ? `, ${profile.location.state}` : ''}
              </span>
              <span className="mx-1.5 opacity-60">•</span>
              <span className="capitalize">{profile?.category?.replace('_', ' ') || 'Personal'} profile</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/aqi"
              className="bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Wind className="w-4 h-4" />
              Live AQI
            </Link>
            <Link
              to="/ai"
              className="bg-white text-forest-800 hover:bg-forest-50 text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Bot className="w-4 h-4" />
              Ask BreatheWise AI
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Live AQI + Top Pollutants */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AQICard
            data={aqiData}
            isLoading={aqiLoading}
            error={aqiError}
            onRefresh={refreshAQI}
          />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="section-title">Key Pollutants</h3>
            <Link to="/aqi" className="text-sm font-medium text-forest-700 hover:text-forest-800 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {aqiLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card p-4 animate-pulse h-32 bg-gray-100" />
              ))}
            </div>
          ) : topPollutants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topPollutants.map((p) => (
                <PollutantCard key={p.parameter} reading={p} />
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No pollutant readings loaded yet.</p>
              <button onClick={refreshAQI} className="btn-secondary text-xs mt-3">
                Fetch Live Readings
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations + Weekly Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Today's Priority Actions</h3>
              <p className="text-xs text-gray-500">Personalized for your household & commute</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshRecs}
                disabled={recsLoading}
                className="btn-ghost p-2 rounded-lg"
                aria-label="Refresh recommendations"
              >
                <RefreshCw className={cn('w-4 h-4', recsLoading && 'animate-spin')} />
              </button>
              <Link to="/routine" className="text-sm font-medium text-forest-700 hover:text-forest-800 flex items-center gap-1">
                Full routine <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {recsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : topRecs.length > 0 ? (
            <div className="space-y-3">
              {topRecs.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => toggleComplete(rec.id)}
                  className={cn(
                    'flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all',
                    rec.isCompleted
                      ? 'bg-gray-50 border-gray-100 opacity-65'
                      : 'bg-white border-gray-100 hover:border-forest-200'
                  )}
                >
                  <CheckCircle2
                    className={cn(
                      'w-5 h-5 shrink-0 mt-0.5',
                      rec.isCompleted ? 'text-forest-600' : 'text-gray-300'
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm font-medium text-gray-900', rec.isCompleted && 'line-through')}>
                      {rec.action}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{rec.reason}</p>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-semibold px-2 py-0.5 rounded-full shrink-0',
                      rec.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : rec.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    )}
                  >
                    {rec.priority}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarDays className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-3">Generate your personalized daily routine.</p>
              <button onClick={refreshRecs} className="btn-primary text-sm">
                Generate Routine
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Weekly Progress</h3>
              <Link to="/progress" className="text-xs font-medium text-forest-700 hover:underline">
                Details
              </Link>
            </div>
            <WeeklyProgressChart data={weekProgress} />
          </div>

          <div className="card p-5 bg-sky-50 border-sky-100">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                  Air Quality Insight
                </p>
                <h4 className="font-semibold text-gray-900 text-sm mt-1">{tip.title}</h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{tip.body}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
