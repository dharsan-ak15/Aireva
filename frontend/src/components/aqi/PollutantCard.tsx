// ============================================================
// Aireva – Individual Pollutant Reading Card
// ============================================================
import React from 'react';
import type { PollutantReading } from '../../types';
import { getPollutantInfo, getPollutantLevel, formatNumber } from '../../utils';
import { cn } from '../../utils';
import { ProgressBar } from '../ui';

interface PollutantCardProps {
  reading: PollutantReading;
}

const LEVEL_STYLES = {
  safe: {
    badge: 'bg-emerald-100 text-emerald-700',
    bar: 'bg-emerald-500',
    ring: 'ring-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Safe',
  },
  moderate: {
    badge: 'bg-yellow-100 text-yellow-700',
    bar: 'bg-yellow-500',
    ring: 'ring-yellow-200',
    dot: 'bg-yellow-500',
    label: 'Moderate',
  },
  unsafe: {
    badge: 'bg-red-100 text-red-700',
    bar: 'bg-red-500',
    ring: 'ring-red-200',
    dot: 'bg-red-500',
    label: 'High',
  },
};

export default function PollutantCard({ reading }: PollutantCardProps) {
  const info = getPollutantInfo(reading.parameter);
  const level = getPollutantLevel(reading);
  const style = LEVEL_STYLES[level];
  const pct = Math.min(100, Math.round((reading.value / (info.safeLimit * 2)) * 100));

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-gray-100 p-4 ring-1 transition-all hover:shadow-sm',
        style.ring
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className={cn('h-2 w-2 rounded-full', style.dot)} />
            <span className="text-sm font-bold text-gray-900">{info.label}</span>
          </div>
          <p className="text-xs text-gray-400">{info.fullName}</p>
        </div>
        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', style.badge)}>
          {style.label}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-3xl font-black text-gray-900">{formatNumber(reading.value)}</span>
        <span className="text-xs text-gray-500">{info.unit}</span>
      </div>

      {/* Progress bar */}
      <ProgressBar value={pct} color={style.bar} className="mb-2" />

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>0</span>
        <span>Limit: {info.safeLimit} {info.unit}</span>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 mt-3 leading-relaxed">{info.description}</p>
    </div>
  );
}
