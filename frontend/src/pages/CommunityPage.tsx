import { Users, Flame, Trees, Bus, Megaphone, Info } from 'lucide-react';
import { useUserStore, useAQIStore } from '../store';

const COMMUNITY_GUIDES = [
  {
    id: 'waste_burning',
    title: 'Prevent Open Waste & Leaf Burning',
    icon: Flame,
    description:
      'Neighborhood dry-leaf and garbage burning causes severe localized PM2.5 spikes in winter evenings. Encourage RWAs to set up leaf composting pits.',
    action: 'Report open burning to your local municipal helpline or RWA.',
  },
  {
    id: 'public_transit',
    title: 'Shared School & Office Transit',
    icon: Bus,
    description:
      'Coordinated carpools and school buses cut peak-hour roadside exhaust around residential gates and schools.',
    action: 'Start a neighborhood or workplace carpool group.',
  },
  {
    id: 'urban_greening',
    title: 'Protect Mature Trees & Urban Green Buffers',
    icon: Trees,
    description:
      'Mature native trees help trap coarse road dust and cool microclimates. Avoid damaging street-side tree roots during construction.',
    action: 'Water young saplings and support local tree-protection drives.',
  },
  {
    id: 'awareness',
    title: 'Share Verified Local AQI Alerts',
    icon: Megaphone,
    description:
      'Help elderly neighbors, outdoor workers, and domestic staff stay informed on severe smog days and share N95 masks when possible.',
    action: 'Share verified monitoring station updates with your RWA group.',
  },
];

export default function CommunityPage() {
  const profile = useUserStore((s) => s.profile);
  const aqiData = useAQIStore((s) => s.currentData);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">
              Community Clean-Air Awareness
              {profile?.location?.city ? ` — ${profile.location.city}` : ''}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Practical collective actions for families, RWAs, schools, and local communities.
            </p>
          </div>
        </div>

        {aqiData && (
          <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-600 flex items-center gap-2">
            <Info className="w-4 h-4 text-forest-600 shrink-0" />
            <span>
              Verified station context for <strong>{aqiData.city}</strong> ({aqiData.stationName}) from{' '}
              <strong>{aqiData.dataProvider}</strong>.
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {COMMUNITY_GUIDES.map((g) => {
          const Icon = g.icon;
          return (
            <div key={g.id} className="card p-5 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{g.title}</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{g.description}</p>
              <p className="text-xs font-medium text-forest-700 pt-1">Action: {g.action}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
