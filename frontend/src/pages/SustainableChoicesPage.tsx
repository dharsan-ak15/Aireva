import { useState } from 'react';
import { Leaf, Train, Users, Bike, Zap, Trash2, ShoppingBag, Info } from 'lucide-react';
import { useUserStore } from '../store';
import { estimateCO2PerDay, cn } from '../utils';

interface SustainableOption {
  id: string;
  title: string;
  category: 'transport' | 'household' | 'waste' | 'shopping';
  icon: React.ElementType;
  description: string;
  impactType: 'Calculated estimate' | 'Qualitative environmental benefit';
  benefit: string;
}

const SUSTAINABLE_OPTIONS: SustainableOption[] = [
  {
    id: 'metro_bus',
    title: 'Metro, Local Train, or Electric Bus',
    category: 'transport',
    icon: Train,
    description: 'Replaces single-occupancy car or motorcycle trips during daily commutes.',
    impactType: 'Calculated estimate',
    benefit: 'Typically ~0.04 kg CO2/passenger-km vs ~0.17 kg for a car or ~0.08 kg for a motorcycle.',
  },
  {
    id: 'carpool',
    title: 'Shared Commute / Carpooling',
    category: 'transport',
    icon: Users,
    description: 'Share daily office or school runs with colleagues or neighbors.',
    impactType: 'Calculated estimate',
    benefit: 'Sharing a car between 3 commuters cuts per-person tailpipe emissions by roughly two-thirds.',
  },
  {
    id: 'active_mobility',
    title: 'Walking or Cycling (When AQI Allows)',
    category: 'transport',
    icon: Bike,
    description: 'Best for short trips under 3 km when AQI is Good or Satisfactory.',
    impactType: 'Calculated estimate',
    benefit: 'Zero tailpipe emissions (0 kg CO2/km); switch to enclosed transit during Poor/Severe AQI.',
  },
  {
    id: 'trip_chaining',
    title: 'Combine Errands & Avoid Unnecessary Trips',
    category: 'transport',
    icon: Zap,
    description: 'Batch grocery, pharmacy, and school errands into one route.',
    impactType: 'Qualitative environmental benefit',
    benefit: 'Reduces cold-start engine emissions, which emit disproportionately higher NOx and particulates.',
  },
  {
    id: 'no_waste_burning',
    title: 'Prevent Open Leaf & Waste Burning',
    category: 'waste',
    icon: Trash2,
    description: 'Compost dry leaves and segregate wet/dry waste instead of burning.',
    impactType: 'Qualitative environmental benefit',
    benefit: 'Open waste burning releases dense PM2.5, dioxins, and black carbon directly at breathing height.',
  },
  {
    id: 'local_shopping',
    title: 'Energy-Efficient Appliances & Local Goods',
    category: 'shopping',
    icon: ShoppingBag,
    description: 'Choose BEE 5-star appliances, LED lighting, and locally sourced seasonal produce.',
    impactType: 'Qualitative environmental benefit',
    benefit: 'Lowers household electricity demand and freight transport emissions.',
  },
];

export default function SustainableChoicesPage() {
  const profile = useUserStore((s) => s.profile);
  const [filter, setFilter] = useState<string>('all');

  const currentMethod = profile?.lifestyle?.commuteMethod || 'public_transport';
  const duration = profile?.lifestyle?.commuteDurationMinutes ?? 30;
  const currentCO2 = estimateCO2PerDay(currentMethod, duration);
  const transitCO2 = estimateCO2PerDay('public_transport', duration);
  const savings =
    currentCO2 !== null && transitCO2 !== null ? Math.max(0, currentCO2 - transitCO2) : null;

  const filtered =
    filter === 'all'
      ? SUSTAINABLE_OPTIONS
      : SUSTAINABLE_OPTIONS.filter((o) => o.category === filter);

  return (
    <div className="space-y-6">
      {/* Personal Commute Comparison */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">Your Routine vs Sustainable Alternatives</h2>
            <p className="text-sm text-gray-500 mt-1">
              Current commute: <span className="font-medium capitalize text-gray-800">{currentMethod.replace('_', ' ')}</span> ({duration} min each way)
            </p>
          </div>
          <span className="badge bg-forest-50 text-forest-700 border border-forest-200">
            <Leaf className="w-3.5 h-3.5" />
            Calculated Estimate
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500">Current Commute Estimate</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {currentCO2 !== null ? `${currentCO2} kg` : 'N/A'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">CO2 / day (round trip)</p>
          </div>

          <div className="bg-forest-50 rounded-xl p-4 border border-forest-100">
            <p className="text-xs text-forest-700">Public Transit Estimate</p>
            <p className="text-2xl font-bold text-forest-800 mt-1">
              {transitCO2 !== null ? `${transitCO2} kg` : 'N/A'}
            </p>
            <p className="text-xs text-forest-600 mt-0.5">CO2 / day (round trip)</p>
          </div>

          <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
            <p className="text-xs text-teal-700">Potential Daily Reduction</p>
            <p className="text-2xl font-bold text-teal-800 mt-1">
              {savings !== null ? `${savings.toFixed(2)} kg` : 'N/A'}
            </p>
            <p className="text-xs text-teal-600 mt-0.5">Estimated CO2 avoided/day</p>
          </div>
        </div>

        <div className="flex items-start gap-2 mt-4 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
          <span>
            <strong>Transparency note:</strong> Transport figures are calculated estimates based on standard
            emission factors and an assumed 25 km/h average urban speed — not measured personal emissions or
            citywide AQI reductions.
          </span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {['all', 'transport', 'waste', 'shopping'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all',
              filter === cat
                ? 'bg-forest-700 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-forest-200'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((opt) => {
          const Icon = opt.icon;
          return (
            <div key={opt.id} className="card-hover p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 text-sm">{opt.title}</h3>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {opt.impactType}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{opt.description}</p>
                  <p className="text-xs text-forest-700 font-medium mt-2">{opt.benefit}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
