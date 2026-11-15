'use client';

import React, { useState } from 'react';
import {
  Wrench,
  Calendar,
  Shield,
  Phone,
  MessageSquare,
  Headphones,
  Play,
  Pause,
  Square,
  RefreshCw,
  Signal,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  NavigationStatus,
  NavigationOrderDetails,
  GPSStatus,
} from '../../lib/navigation/types';

export interface NavigationControlCardProps {
  orderDetails?: Partial<NavigationOrderDetails>;
  navigationStatus: NavigationStatus;
  gpsStatus: GPSStatus;
  gpsAccuracy?: number;
  accuracyWarning?: boolean;
  isRecalculating?: boolean;
  onStartNavigation: () => void;
  onPauseNavigation: () => void;
  onResumeNavigation: () => void;
  onStopNavigation: () => void;
  onRecalculate: () => void;
  onCall?: (phoneNumber?: string) => void;
  onChat?: () => void;
}

export function NavigationControlCard({
  orderDetails,
  navigationStatus,
  gpsStatus,
  gpsAccuracy,
  accuracyWarning = false,
  isRecalculating = false,
  onStartNavigation,
  onPauseNavigation,
  onResumeNavigation,
  onStopNavigation,
  onRecalculate,
  onCall,
  onChat,
}: NavigationControlCardProps) {
  const [copiedOtp, setCopiedOtp] = useState<boolean>(false);

  const orderId = orderDetails?.orderId || '#GR-C65C';
  const serviceName = orderDetails?.serviceName || 'Plumbing Service';
  const scheduleTime = orderDetails?.scheduleTime || 'Today, 3:00 PM – 5:00 PM';
  const phaseText = orderDetails?.phaseText || 'Phase 1';
  const startWorkOtp = orderDetails?.startWorkOtp || '4812';
  const technicianName = orderDetails?.technicianName || 'Anupam';
  const technicianRating = orderDetails?.technicianRating || 4.9;
  const technicianReviews = orderDetails?.technicianReviewsCount || 12;

  const handleCopyOtp = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(startWorkOtp);
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    }
  };

  return (
    <div className="w-full bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.08)] border-t border-slate-100 p-5 space-y-4 max-w-md mx-auto">
      {/* 1. Header Row: Order ID & Status Badge */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">{orderId}</h1>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full font-bold text-xs shadow-sm border border-blue-100">
          <span className="text-sm">🚚</span>
          <span>Worker On The Way</span>
        </div>
      </div>

      {/* 2. Service Title */}
      <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
        <Wrench className="w-4 h-4 text-slate-400" />
        <span>{serviceName}</span>
      </div>

      {/* 3. Schedule & Phase */}
      <div className="flex items-center justify-between text-xs text-slate-700 pb-1">
        <div className="flex items-center gap-2 font-medium">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>{scheduleTime}</span>
        </div>
        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 font-bold rounded-md">
          {phaseText}
        </span>
      </div>

      {/* 4. Start Work OTP Box (Exact match from reference image) */}
      <div className="bg-[#FFF7ED] border border-orange-100 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-orange-500 fill-orange-500/20" />
          <span className="text-xs font-bold text-orange-900">Start Work OTP</span>
        </div>

        <div className="text-2xl font-black tracking-widest text-slate-900 px-3">
          {startWorkOtp}
        </div>

        <button
          type="button"
          onClick={handleCopyOtp}
          className="px-4 py-2 bg-[#F97316] hover:bg-orange-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
        >
          {copiedOtp ? 'Copied!' : 'Give OTP'}
        </button>
      </div>

      {/* 5. Expert Profile Row */}
      <div className="flex items-center justify-between py-1 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          {/* Avatar with blue collar */}
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-blue-100 border-2 border-white shadow-md flex items-center justify-center flex-shrink-0">
            <img
              src="/hero_technician_banner.png"
              alt={technicianName}
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                // Fallback to stylized vector
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-blue-600 text-white font-bold text-base">
              {technicianName.charAt(0)}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Your Expert
            </div>
            <div className="text-sm font-bold text-slate-900">{technicianName}</div>
            <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
              <span className="text-amber-500">★</span>
              <span className="font-bold text-slate-900">{technicianRating}</span>
              <span className="text-slate-400">({technicianReviews} reviews)</span>
            </div>
          </div>
        </div>

        {/* Call & Chat Circular Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onCall?.(orderDetails?.technicianPhone)}
            aria-label="Call Expert"
            className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-800 active:scale-95 transition-all"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onChat?.()}
            aria-label="Chat with Expert"
            className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-800 active:scale-95 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 6. Live Navigation Actions Toolbar */}
      <div className="pt-1 space-y-2.5">
        {/* GPS Status Indicator */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 font-medium">
            <Signal
              className={`w-3.5 h-3.5 ${
                gpsStatus === 'locked' && !accuracyWarning
                  ? 'text-emerald-500'
                  : gpsStatus === 'searching'
                  ? 'text-amber-500 animate-pulse'
                  : 'text-slate-400'
              }`}
            />
            <span>
              GPS:{' '}
              {gpsStatus === 'locked'
                ? accuracyWarning
                  ? `Low Accuracy (±${Math.round(gpsAccuracy || 0)}m)`
                  : `Locked (±${Math.round(gpsAccuracy || 0)}m)`
                : gpsStatus === 'searching'
                ? 'Searching satellites...'
                : gpsStatus === 'denied'
                ? 'Permission Denied'
                : 'Standby'}
            </span>
          </div>

          {isRecalculating ? (
            <span className="text-blue-600 font-bold flex items-center gap-1 animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" /> Recalculating
            </span>
          ) : (
            <span className="capitalize font-semibold text-slate-700">{navigationStatus}</span>
          )}
        </div>

        {/* Primary Navigation Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {navigationStatus === 'idle' || navigationStatus === 'arrived' ? (
            <button
              type="button"
              onClick={onStartNavigation}
              className="col-span-2 flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-md transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Live Navigation</span>
            </button>
          ) : (
            <>
              {navigationStatus === 'navigating' ? (
                <button
                  type="button"
                  onClick={onPauseNavigation}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onResumeNavigation}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Resume</span>
                </button>
              )}

              <button
                type="button"
                onClick={onStopNavigation}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                <Square className="w-3.5 h-3.5 fill-slate-700" />
                <span>End</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 7. Need Help? Banner */}
      <div className="bg-[#FFFDF7] border border-orange-100 rounded-2xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-500 flex-shrink-0">
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Need Help?</div>
            <div className="text-[10px] text-slate-500">Our support team is available 24/7</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onChat?.()}
          className="px-3.5 py-1.5 border border-orange-300 hover:bg-orange-50 text-orange-600 font-bold text-xs rounded-xl transition-all"
        >
          Chat Now
        </button>
      </div>
    </div>
  );
}
