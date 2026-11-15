'use client';

import React from 'react';
import { RouteStatsPill } from './RouteStatsPill';

export interface NavigationMapProps {
  distanceRemainingMeters?: number;
  durationRemainingSeconds?: number;
  isRecalculating?: boolean;
  className?: string;
  mapEmbedUrl?: string;
}

export function NavigationMap({
  distanceRemainingMeters,
  durationRemainingSeconds,
  isRecalculating = false,
  className = 'h-[380px] sm:h-[440px] w-full',
  mapEmbedUrl = 'https://www.google.com/maps/d/u/0/embed?mid=1h8jNUpcrqrUd_ndQ92GpFEICwL0PD74&ehbc=2E312F',
}: NavigationMapProps) {
  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {/* 1. Official Google My Maps Embed added by user */}
      <iframe
        src={mapEmbedUrl}
        width="100%"
        height="100%"
        className="w-full h-full border-0 absolute inset-0"
        allowFullScreen
        loading="lazy"
        title="GoRepireo Live Delivery Map"
      />

      {/* 2. Floating Top Route Stats Pill (e.g. 3.7 km • 8 min) */}
      <RouteStatsPill
        distanceRemainingMeters={distanceRemainingMeters}
        durationRemainingSeconds={durationRemainingSeconds}
        isRecalculating={isRecalculating}
      />
    </div>
  );
}

export default NavigationMap;
