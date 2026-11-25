import { Link, useLocation } from 'react-router-dom';
import {
  Home, Wind, CalendarDays, Building2, Leaf, Bot,
  FlaskConical, TrendingUp, Users, UserCircle,
  ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react';
import { useUIStore } from '../../store';
import { cn } from '../../utils';

const NAV_ITEMS = [
  { id: 'home',       path: '/',           label: 'Dashboard',         icon: Home,          desc: 'Overview & quick actions' },
  { id: 'aqi',        path: '/aqi',         label: 'Live AQI',          icon: Wind,          desc: 'Real-time air quality data' },
  { id: 'routine',    path: '/routine',     label: 'Daily Routine',     icon: CalendarDays,  desc: 'Personalized day planner' },
  { id: 'indoor',     path: '/indoor',      label: 'Indoor Advisor',    icon: Building2,     desc: 'Indoor air quality guide' },
  { id: 'sustainable',path: '/sustainable', label: 'Sustainable Choices',icon: Leaf,         desc: 'Eco-friendly alternatives' },
  { id: 'ai',         path: '/ai',          label: 'Aireva AI',         icon: Bot,           desc: 'AI-powered assistant' },
  { id: 'simulator',  path: '/simulator',   label: 'What-If Simulator', icon: FlaskConical,  desc: 'Compare lifestyle routines' },
  { id: 'progress',   path: '/progress',    label: 'My Progress',       icon: TrendingUp,    desc: 'Track clean air habits' },
  { id: 'community',  path: '/community',   label: 'Community',         icon: Users,         desc: 'Community awareness' },
  { id: 'profile',    path: '/profile',     label: 'Profile',           icon: UserCircle,    desc: 'Settings & preferences' },
];

export default function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen, toggleSidebar, mobileNavOpen, setMobileNavOpen } =
    useUIStore();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      {/* Mobile overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-40 flex flex-col bg-white border-r border-gray-100 shadow-sm',
          'transition-all duration-300 ease-in-out',
          // Desktop
          'lg:relative lg:flex',
          sidebarOpen ? 'lg:w-64' : 'lg:w-16',
          // Mobile
          mobileNavOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex items-center h-16 px-4 border-b border-gray-100 shrink-0',
            !sidebarOpen && 'lg:justify-center lg:px-0'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-forest-700 flex items-center justify-center shrink-0">
              <Wind className="w-4 h-4 text-white" />
            </div>
            {(sidebarOpen || mobileNavOpen) && (
              <div className="min-w-0">
                <span className="font-bold text-gray-900 text-lg leading-none block">Aireva</span>
                <span className="text-xs text-forest-600 font-medium leading-none block mt-0.5 truncate">
                  Clean Air, Better Life
                </span>
              </div>
            )}
          </div>

          {/* Mobile close */}
          <button
            onClick={() => setMobileNavOpen(false)}
            className="ml-auto lg:hidden btn-ghost p-1.5 rounded-lg"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-hide">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(({ id, path, label, icon: Icon, desc }) => {
              const active = isActive(path);
              return (
                <li key={id}>
                  <Link
                    to={path}
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                      'transition-all duration-150 group relative',
                      active
                        ? 'bg-forest-50 text-forest-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                    title={!sidebarOpen ? label : undefined}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5 shrink-0 transition-colors',
                        active ? 'text-forest-600' : 'text-gray-400 group-hover:text-gray-600'
                      )}
                    />
                    {(sidebarOpen || mobileNavOpen) && (
                      <span className="truncate">{label}</span>
                    )}
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-forest-600 rounded-r-full" />
                    )}

                    {/* Tooltip for collapsed sidebar */}
                    {!sidebarOpen && (
                      <div className="absolute left-14 hidden lg:group-hover:flex items-center gap-2 bg-gray-900 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none">
                        <span>{label}</span>
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar toggle (desktop) */}
        <div className="hidden lg:flex items-center justify-end px-3 py-3 border-t border-gray-100 shrink-0">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
