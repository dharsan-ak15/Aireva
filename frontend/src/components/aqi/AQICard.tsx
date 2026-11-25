// ============================================================
// Aireva – AQI Card Component
// ============================================================
import React from 'react';
import { RefreshCw, AlertTriangle, WifiOff, MapPin, Clock } from 'lucide-react';
import type { AQIData } from '../../types';
import { getAQICategoryInfo, formatRelativeTime, formatDateTime } from '../../utils';
import { cn } from '../../utils';
import { Card } from '../ui';

interface AQICardProps {
  data: AQIData | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

function AQIGauge({ value, color }: { value: number; color: string }) {
  // SVG arc gauge — 0-500 AQI range
  const radius = 70;
  const cx = 90;
  const cy = 90;
  const startAngle = -210; // degrees
  const endAngle = 30;
  const range = endAngle - startAngle; // 240 deg
  const fraction = Math.min(1, Math.max(0, value / 500));
  const fillAngle = startAngle + range * fraction;

  function polarToCartesian(angle: number, r: number) {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  function describeArc(start: number, end: number, r: number) {
    const s = polarToCartesian(start, r);
    const e = polarToCartesian(end, r);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  }

  return (
    <svg width="180" height="120" viewBox="0 0 180 120" className="overflow-visible">
      {/* Background arc */}
      <path
        d={describeArc(startAngle, endAngle, radius)}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="12"
        strokeLinecap="round"
      />
      {/* Filled arc */}
      {fraction > 0 && (
        <path
          d={describeArc(startAngle, fillAngle, radius)}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
        />
      )}
      {/* Center value */}
      <text
        x={cx}
        y={cy + 8}
        textAnchor="middle"
        fontSize="30"
        fontWeight="800"
        fill="#111827"
      >
        {value}
      </text>
      <text x={cx} y={cy + 24} textAnchor="middle" fontSize="10" fill="#6b7280">
        AQI
      </text>
    </svg>
  );
}

function SkeletonLoader() {
  return (
    <Card className="p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="h-8 w-8 bg-gray-200 rounded-full" />
      </div>
      <div className="flex flex-col items-center py-4">
        <div className="h-28 w-44 bg-gray-200 rounded-xl mb-4" />
        <div className="h-6 w-24 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-48 bg-gray-200 rounded" />
      </div>
    </Card>
  );
}

export default function AQICard({ data, isLoading, error, onRefresh }: AQICardProps) {
  if (isLoading) return <SkeletonLoader />;

  if (error && !data) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Air Quality Index</h3>
          <button
            onClick={onRefresh}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <div className="flex flex-col items-center py-6 text-center">
          <WifiOff className="h-12 w-12 text-gray-300 mb-3" />
          <p className="font-medium text-gray-600 mb-1">Data Unavailable</p>
          <p className="text-sm text-gray-400 max-w-xs">{error}</p>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center py-8 text-center">
          <WifiOff className="h-12 w-12 text-gray-300 mb-3" />
          <p className="font-medium text-gray-600">No AQI data available</p>
          <button
            onClick={onRefresh}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-forest-700 hover:underline"
          >
            <RefreshCw className="h-4 w-4" />
            Fetch data
          </button>
        </div>
      </Card>
    );
  }

  const category = data.aqiCategory ?? 'unknown';
  const info = getAQICategoryInfo(category);
  const aqiValue = data.aqiValue ?? 0;

  return (
    <Card className={cn('p-6 border-2', info.border)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <MapPin className="h-4 w-4 text-forest-700" />
          <span className="font-medium truncate max-w-[180px]">{data.stationName}</span>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          title="Refresh data"
        >
          <RefreshCw className={cn('h-4 w-4 text-gray-400', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Stale warning */}
      {data.isStale && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3 text-xs text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          Data is older than 2 hours — may not reflect current conditions.
        </div>
      )}

      {/* Gauge + Category */}
      <div className="flex flex-col items-center py-2">
        {data.aqiValue !== undefined ? (
          <>
            <AQIGauge value={aqiValue} color={info.color} />
            <span
              className={cn(
                'inline-block mt-1 px-4 py-1 rounded-full text-sm font-semibold',
                info.bg,
                info.text
              )}
            >
              {info.label}
            </span>
            <p className="mt-2 text-xs text-gray-500 text-center max-w-xs">{info.description}</p>
          </>
        ) : (
          <div className="py-4 text-center">
            <p className="text-4xl font-black text-gray-300 mb-2">—</p>
            <p className="text-sm text-gray-500">AQI index not available</p>
            <p className="text-xs text-gray-400 mt-1">Individual pollutant readings below</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Updated {formatRelativeTime(data.lastUpdated)}
        </div>
        <span className="bg-gray-100 px-2 py-0.5 rounded-full font-medium">
          {data.aqiSource ?? data.dataProvider}
        </span>
      </div>

      {/* Full timestamp tooltip */}
      <p className="text-center text-xs text-gray-300 mt-1">
        {formatDateTime(data.lastUpdated)}
      </p>
    </Card>
  );
}
