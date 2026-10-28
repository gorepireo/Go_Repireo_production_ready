'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin, RefreshCw } from 'lucide-react';

interface NotServiceableYetProps {
  currentLocationName?: string;
  onOpenLocationPicker?: () => void;
  onRefresh?: () => void;
  isChecking?: boolean;
}

export default function NotServiceableYet({
  currentLocationName,
  onOpenLocationPicker,
  onRefresh,
  isChecking = false,
}: NotServiceableYetProps) {
  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 sm:py-10 flex flex-col items-center text-center animate-in fade-in duration-300">
      
      {/* 1. Top 3D Character Illustration */}
      <div className="relative w-full max-w-[340px] sm:max-w-[400px] aspect-[4/3] mb-2 flex items-center justify-center">
        <Image
          src="/images/not_there_yet_hero.png"
          alt="We will be there soon"
          width={400}
          height={300}
          priority
          className="w-full h-auto object-contain drop-shadow-sm select-none pointer-events-none"
        />
      </div>

      {/* 2. Main Heading & Subtitle */}
      <div className="space-y-1.5 mt-2">
        <h1 className="text-3xl sm:text-4xl font-black text-[#0B1736] tracking-tight">
          We&apos;re Not There Yet!
        </h1>
        <p className="text-lg sm:text-xl font-bold text-[#1D5BD8] tracking-tight">
          But we&apos;ll be there soon.
        </p>
      </div>

      {/* 3. Friendly Description Message */}
      <p className="text-sm sm:text-base text-slate-500 font-medium mt-4 max-w-md leading-relaxed px-2">
        Our team is currently preparing to serve you.
        <br className="hidden sm:inline" />
        We&apos;re working hard to get everything ready so you can enjoy a smooth and hassle-free experience.
      </p>

      {/* 4. Detected Location Badge & Change Location CTA */}
      <div className="w-full mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
        {onOpenLocationPicker && (
          <button
            onClick={onOpenLocationPicker}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#007AFF] hover:bg-[#0066D6] text-white font-bold text-sm px-5 py-3 rounded-xl shadow-sm transition-all active:scale-95"
          >
            <MapPin size={16} />
            <span>Change Location</span>
          </button>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isChecking}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm px-4 py-3 rounded-xl border border-slate-200/80 shadow-2xs transition-all active:scale-95 disabled:opacity-60"
          >
            <RefreshCw size={15} className={isChecking ? 'animate-spin text-[#007AFF]' : 'text-slate-400'} />
            <span>{isChecking ? 'Checking...' : 'Re-check GPS'}</span>
          </button>
        )}
      </div>

      {currentLocationName && (
        <p className="text-[11px] text-slate-400 mt-3 font-medium flex items-center gap-1">
          <span>Detected area:</span>
          <span className="font-semibold text-slate-600">{currentLocationName}</span>
        </p>
      )}

    </div>
  );
}
