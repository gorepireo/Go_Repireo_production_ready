'use client';

import React from 'react';
import { Navigation, Loader2 } from 'lucide-react';
import { formatDistance, formatDuration } from '../../lib/navigation/utils/geo';

export interface RouteStatsPillProps {
  distanceRemainingMeters?: number;
  durationRemainingSeconds?: number;
  isRecalculating?: boolean;
  statusText?: string;
}

export function RouteStatsPill({
  distanceRemainingMeters,
  durationRemainingSeconds,
  isRecalculating = false,
  statusText,
}: RouteStatsPillProps) {
  const distFormatted =
    distanceRemainingMeters !== undefined ? formatDistance(distanceRemainingMeters) : '4.0 km';
  const durFormatted =
    durationRemainingSeconds !== undefined ? formatDuration(durationRemainingSeconds) : '6 min';

  return (
    <div className="absolute top-4 left-4 z-[500] pointer-events-none select-none">
      <div className="flex items-center gap-2.5 px-3.5 py-2 bg-white/95 backdrop-blur-md rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-slate-100 text-slate-800 transition-all duration-300">
        {/* Blue Navigation Circle Icon */}
        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
          {isRecalculating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5 rotate-45 fill-white" />
          )}
        </div>

        {/* Dynamic Route Metric Text */}
        <span className="text-xs sm:text-sm font-bold tracking-tight text-slate-800 whitespace-nowrap">
          {isRecalculating ? (
            <span className="text-blue-600 font-semibold animate-pulse">Rerouting...</span>
          ) : statusText ? (
            statusText
          ) : (
            `${distFormatted} • ${durFormatted}`
          )}
        </span>
      </div>
    </div>
  );
}
