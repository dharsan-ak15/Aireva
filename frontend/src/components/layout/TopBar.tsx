import { Menu, Bell, RefreshCw } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useUIStore, useAQIStore, useUserStore } from '../../store';
import { formatRelativeTime, getGreeting } from '../../utils';

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  '/':            { title: 'Dashboard', subtitle: 'Your air quality overview' },
  '/aqi':         { title: 'Live AQI Monitor', subtitle: 'Real-time pollution data' },
  '/routine':     { title: 'Daily Routine Planner', subtitle: 'Personalized day schedule' },
  '/indoor':      { title: 'Indoor Air Advisor', subtitle: 'Improve your home air quality' },
  '/sustainable': { title: 'Sustainable Choices', subtitle: 'Eco-friendly lifestyle alternatives' },
  '/ai':          { title: 'Aireva AI Assistant', subtitle: 'Ask me anything about air quality' },
  '/simulator':   { title: 'What-If Simulator', subtitle: 'Compare lifestyle routines' },
  '/progress':    { title: 'My Progress', subtitle: 'Track your clean air habits' },
  '/community':   { title: 'Community Awareness', subtitle: 'Local pollution & sustainability' },
  '/profile':     { title: 'Profile & Settings', subtitle: 'Your preferences & account' },
};

export default function TopBar() {
  const { setMobileNavOpen } = useUIStore();
  const { currentData, lastFetched } = useAQIStore();
  const profile = useUserStore((s) => s.profile);
  const location = useLocation();
  const page = PAGE_TITLES[location.pathname] ?? { title: 'Aireva' };

  return (
    <header className="h-16 flex items-center gap-4 px-4 lg:px-6 border-b border-gray-100 bg-white shrink-0">
      {/* Mobile menu toggle */}
      <button
        onClick={() => setMobileNavOpen(true)}
        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-gray-900 truncate">{page.title}</h1>
        {page.subtitle && (
          <p className="text-xs text-gray-500 truncate hidden sm:block">{page.subtitle}</p>
        )}
      </div>

      {/* AQI data freshness */}
      {lastFetched && (
        <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
          <RefreshCw className="w-3 h-3" />
          <span>Updated {formatRelativeTime(lastFetched)}</span>
        </div>
      )}

      {/* Location badge */}
      {profile?.location?.city && (
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-forest-700 bg-forest-50 px-3 py-1.5 rounded-full border border-forest-200">
          <span className="font-medium">{profile.location.city}</span>
          {profile.location.state && (
            <span className="text-forest-500">, {profile.location.state}</span>
          )}
        </div>
      )}

      {/* Notifications placeholder */}
      <button
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors relative"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
      </button>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-forest-100 border-2 border-forest-200 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-forest-700">
          {profile?.name ? profile.name[0].toUpperCase() : 'U'}
        </span>
      </div>
    </header>
  );
}
