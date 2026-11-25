// ============================================================
// Aireva – Pollutant Grid
// ============================================================
import React from 'react';
import type { PollutantReading } from '../../types';
import PollutantCard from './PollutantCard';
import { Wind } from 'lucide-react';
import { EmptyState } from '../ui';

interface PollutantGridProps {
  pollutants: PollutantReading[];
  isLoading: boolean;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
      <div className="flex justify-between mb-3">
        <div>
          <div className="h-4 w-16 bg-gray-200 rounded mb-1" />
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
        <div className="h-5 w-14 bg-gray-200 rounded-full" />
      </div>
      <div className="h-8 w-20 bg-gray-200 rounded mb-3" />
      <div className="h-2 w-full bg-gray-200 rounded-full mb-2" />
      <div className="h-3 w-full bg-gray-200 rounded" />
    </div>
  );
}

export default function PollutantGrid({ pollutants, isLoading }: PollutantGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (pollutants.length === 0) {
    return (
      <EmptyState
        icon={<Wind className="h-12 w-12" />}
        title="No pollutant data"
        description="Individual pollutant readings are not available for this station right now."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {pollutants.map((reading) => (
        <PollutantCard key={reading.parameter} reading={reading} />
      ))}
    </div>
  );
}
