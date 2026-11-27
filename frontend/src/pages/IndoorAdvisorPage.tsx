import { useCallback, useEffect, useState } from 'react';
import { Check, Info, IndianRupee, RefreshCw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useUserStore, useIndoorStore } from '../store';
import { fetchIndoorChecklist } from '../services/api';
import { cn } from '../utils';
import type { IndoorChecklistItem } from '../types';
import toast from 'react-hot-toast';

const CATEGORY_COLORS: Record<string, string> = {
  ventilation: 'bg-sky-50 text-sky-700 border-sky-200',
  purification: 'bg-teal-50 text-teal-700 border-teal-200',
  cleaning: 'bg-green-50 text-green-700 border-green-200',
  cooking: 'bg-orange-50 text-orange-700 border-orange-200',
  prevention: 'bg-purple-50 text-purple-700 border-purple-200',
};

const COST_LABELS: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  free: { label: 'Free', icon: Check, color: 'text-emerald-700' },
  low: { label: 'Low cost', icon: IndianRupee, color: 'text-lime-700' },
  medium: { label: 'Medium cost', icon: IndianRupee, color: 'text-amber-700' },
  high: { label: 'High cost', icon: IndianRupee, color: 'text-rose-700' },
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  involved: 'Requires effort',
};

function ChecklistCard({ item, onToggle }: { item: IndoorChecklistItem; onToggle: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cost = COST_LABELS[item.estimatedCost] ?? COST_LABELS.medium;
  const CostIcon = cost.icon;

  return (
    <div className={cn(
      'card p-4 transition-all duration-200',
      item.isCompleted && 'opacity-60 bg-gray-50'
    )}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(item.id)}
          className={cn(
            'w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
            item.isCompleted
              ? 'bg-forest-600 border-forest-600'
              : 'border-gray-300 hover:border-forest-400'
          )}
        >
          {item.isCompleted && <Check className="w-3.5 h-3.5 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={cn(
                'font-medium text-gray-900 text-sm',
                item.isCompleted && 'line-through text-gray-500'
              )}>
                {item.title}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', CATEGORY_COLORS[item.category])}>
                  {item.category}
                </span>
                <span className={cn('inline-flex items-center gap-1 text-xs', cost.color)}>
                  <CostIcon className="w-3 h-3" />
                  {cost.label}
                </span>
                <span className="text-xs text-gray-500">• {DIFFICULTY_LABELS[item.difficulty]}</span>
              </div>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="btn-ghost p-1 rounded-lg shrink-0"
              aria-label="More info"
            >
              <Info className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <p className="text-xs text-gray-600 mt-2 leading-relaxed">{item.description}</p>

          {expanded && (
            <div className="mt-3 space-y-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div>
                <p className="text-xs font-semibold text-gray-700">Why it matters</p>
                <p className="text-xs text-gray-600 mt-0.5">{item.whyItMatters}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700">Expected benefit</p>
                <p className="text-xs text-forest-700 mt-0.5">{item.expectedBenefit}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700">Maintenance</p>
                <p className="text-xs text-gray-600 mt-0.5">{item.maintenanceFrequency}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IndoorAdvisorPage() {
  const profile = useUserStore((s) => s.profile);
  const { checklist, setChecklist, toggleItem } = useIndoorStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = ['all', 'ventilation', 'purification', 'cleaning', 'cooking', 'prevention'];

  const load = useCallback(async () => {
    if (!profile) return;
    setIsLoading(true);
    setError(null);
    try {
      const items = await fetchIndoorChecklist(profile);
      setChecklist(items);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load checklist';
      setError(msg);
      toast.error('Could not load indoor checklist');
    } finally {
      setIsLoading(false);
    }
  }, [profile, setChecklist]);

  useEffect(() => {
    if (profile && checklist.length === 0) load();
  }, [profile, checklist.length, load]);

  const filtered = activeCategory === 'all'
    ? checklist
    : checklist.filter((i) => i.category === activeCategory);

  const completedCount = checklist.filter((i) => i.isCompleted).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">Indoor Air Quality Advisor</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Personalized checklist for your home in {profile?.location?.city || 'your city'}
            </p>
          </div>
          <button onClick={load} disabled={isLoading} className="btn-secondary text-sm flex items-center gap-2">
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {checklist.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Improvements implemented</span>
              <span className="font-medium">{completedCount}/{checklist.length}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Important disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
        <strong>Note:</strong> Houseplants cannot replace mechanical air filtration. Permanent sealing of a home
        is not recommended — balanced ventilation is essential. These guidelines are general advice, not medical recommendations.
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap capitalize transition-all',
              activeCategory === cat
                ? 'bg-teal-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-200 hover:text-teal-700'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="card p-12 text-center">
          <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">Building your personalized indoor checklist…</p>
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="card p-8 text-center">
          <p className="text-gray-900 font-medium mb-2">Could not load checklist</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button onClick={load} className="btn-primary">Retry</button>
        </div>
      )}

      {/* Checklist */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((item) => (
            <ChecklistCard key={item.id} item={item} onToggle={toggleItem} />
          ))}
        </div>
      )}

      {!isLoading && !error && checklist.length === 0 && (
        <div className="card p-12 text-center">
          <p className="font-medium text-gray-900 mb-2">No checklist yet</p>
          <p className="text-sm text-gray-500 mb-4">Generate your personalized indoor air quality improvement plan.</p>
          <button onClick={load} className="btn-primary">Generate Checklist</button>
        </div>
      )}
    </div>
  );
}
