'use client';

import React from 'react';
import { MapPin, ChevronDown } from 'lucide-react';

export interface NavigationHeaderProps {
  locationName?: string;
  userName?: string;
}

export function NavigationHeader({
  locationName = 'Debra, Paschim Medinipur',
  userName = 'Prithibi',
}: NavigationHeaderProps) {
  return (
    <header className="w-full flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-slate-100 z-30">
      {/* Location Dropdown */}
      <button
        type="button"
        className="flex items-center gap-1.5 text-slate-800 hover:text-slate-900 transition-colors group cursor-pointer"
        aria-label="Change location"
      >
        <MapPin className="w-4 h-4 text-orange-500 fill-orange-500/20 group-hover:scale-110 transition-transform" />
        <span className="text-sm font-semibold tracking-tight truncate max-w-[210px] sm:max-w-none">
          {locationName}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-500 group-hover:translate-y-0.5 transition-transform" />
      </button>

      {/* Greeting */}
      <div className="flex items-center gap-1 text-slate-800 text-sm font-semibold">
        <span>Hi, {userName}</span>
        <span className="text-base" role="img" aria-label="waving hand">
          👋
        </span>
      </div>
    </header>
  );
}
