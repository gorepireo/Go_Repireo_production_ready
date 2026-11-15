'use client';

import React, { useState } from 'react';
import {
  Wrench,
  Calendar,
  Shield,
  Phone,
  MessageSquare,
  Headphones,
  CheckCircle2,
  Star,
  Loader2,
  Send,
} from 'lucide-react';
import { NavigationOrderDetails } from '../../lib/navigation/types';

export interface ExtendedNavigationOrderDetails extends NavigationOrderDetails {
  completionOtp?: string;
  orderStage?: 'phase_1' | 'phase_2' | 'phase_3';
}

export interface NavigationControlCardProps {
  orderDetails?: Partial<ExtendedNavigationOrderDetails>;
  onGiveStartOtp?: () => Promise<void> | void;
  onFinishWork?: () => Promise<void> | void;
  onSubmitReview?: (rating: number, text: string) => Promise<void> | void;
  onCall?: (phoneNumber?: string) => void;
  onChat?: () => void;
}

// Formats long UUIDs cleanly into the short brand format e.g. #GR-C65C
function formatOrderId(rawId?: string): string {
  if (!rawId) return '#GR-C65C';
  const clean = rawId.replace(/^#/, '').trim();
  if (clean.length > 8) {
    const shortCode = clean.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
    return `#GR-${shortCode}`;
  }
  return `#${clean.toUpperCase()}`;
}

export function NavigationControlCard({
  orderDetails,
  onGiveStartOtp,
  onFinishWork,
  onSubmitReview,
  onCall,
  onChat,
}: NavigationControlCardProps) {
  const [copiedOtp, setCopiedOtp] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Review State
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isReviewSubmitting, setIsReviewSubmitting] = useState<boolean>(false);
  const [isReviewDone, setIsReviewDone] = useState<boolean>(false);

  const orderId = formatOrderId(orderDetails?.orderId);
  const serviceName = orderDetails?.serviceName || 'Plumbing Service';
  const scheduleTime = orderDetails?.scheduleTime || 'Immediate Arrival • On The Way';
  const startWorkOtp = orderDetails?.startWorkOtp || '6582';
  const completionOtp = orderDetails?.completionOtp || '7924';
  const technicianName = orderDetails?.technicianName || 'Anupam';
  const technicianRating = orderDetails?.technicianRating || 4.9;
  const technicianReviews = orderDetails?.technicianReviewsCount || 12;

  // Determine active stage
  const stage = orderDetails?.orderStage || 'phase_1';
  const isPhase1 = stage === 'phase_1';
  const isPhase2 = stage === 'phase_2';
  const isPhase3 = stage === 'phase_3';

  const handleGiveOtpClick = async () => {
    // Copy OTP to clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(startWorkOtp);
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    }

    // Advance order to Phase 2 (Work In Progress)
    if (onGiveStartOtp) {
      try {
        setIsProcessing(true);
        await onGiveStartOtp();
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleFinishWorkClick = async () => {
    // Advance order to Phase 3 (Completed)
    if (onFinishWork) {
      try {
        setIsProcessing(true);
        await onFinishWork();
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleReviewSubmitClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmitReview || isReviewDone) return;
    try {
      setIsReviewSubmitting(true);
      await onSubmitReview(selectedRating, reviewComment);
      setIsReviewDone(true);
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.08)] border-t border-slate-100 p-5 space-y-4 max-w-md mx-auto">
      {/* 1. Header Row: Order ID & Status Badge */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">{orderId}</h1>

        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs shadow-sm border ${
            isPhase3
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : isPhase2
              ? 'bg-blue-50 text-blue-700 border-blue-100'
              : 'bg-blue-50 text-blue-600 border-blue-100'
          }`}
        >
          <span className="text-sm">
            {isPhase3 ? '✅' : isPhase2 ? '🛠️' : '🚚'}
          </span>
          <span>
            {isPhase3
              ? 'Service Completed'
              : isPhase2
              ? 'Work In Progress'
              : 'Worker On The Way'}
          </span>
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
        <span
          className={`px-2.5 py-0.5 font-bold rounded-md ${
            isPhase3
              ? 'bg-emerald-100 text-emerald-800'
              : isPhase2
              ? 'bg-blue-100 text-blue-800'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {isPhase3 ? 'Phase 3' : isPhase2 ? 'Phase 2' : 'Phase 1'}
        </span>
      </div>

      {/* 4. Dynamic OTP Verification Box (Phase 1 -> Phase 2 -> Phase 3) */}
      {isPhase1 && (
        <div className="bg-[#FFF7ED] border border-orange-100 rounded-2xl p-3.5 flex items-center justify-between shadow-sm transition-all">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-500 fill-orange-500/20" />
            <span className="text-xs font-bold text-orange-900">Start Work OTP</span>
          </div>

          <div className="text-2xl font-black tracking-widest text-slate-900 px-3">
            {startWorkOtp}
          </div>

          <button
            type="button"
            onClick={handleGiveOtpClick}
            disabled={isProcessing}
            className="px-4 py-2 bg-[#F97316] hover:bg-orange-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : copiedOtp ? (
              'Copied!'
            ) : (
              'Give OTP'
            )}
          </button>
        </div>
      )}

      {isPhase2 && (
        <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5 flex items-center justify-between shadow-sm transition-all">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600 fill-blue-500/20" />
            <div>
              <span className="text-xs font-bold text-blue-950 block">Work Completion OTP</span>
              <span className="text-[10px] text-blue-700">Share when job is done</span>
            </div>
          </div>

          <div className="text-2xl font-black tracking-widest text-slate-900 px-3">
            {completionOtp}
          </div>

          <button
            type="button"
            onClick={handleFinishWorkClick}
            disabled={isProcessing}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              'Finish Work'
            )}
          </button>
        </div>
      )}

      {isPhase3 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between shadow-sm transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-900">Service Completed</span>
          </div>

          <div className="text-sm font-black tracking-widest text-emerald-700 font-mono">
            VERIFIED ✓
          </div>

          <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl">
            Done
          </span>
        </div>
      )}

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
            <div className="flex items-center gap-1 text-xs text-slate-600 font-medium pt-0.5">
              {technicianReviews > 0 ? (
                <>
                  <span className="text-amber-500">★</span>
                  <span className="font-bold text-slate-900">{technicianRating}</span>
                  <span className="text-slate-400">({technicianReviews} reviews)</span>
                </>
              ) : (
                <span className="text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Verified Partner
                </span>
              )}
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

      {/* 6. Rating & Review Form (Unlocks in Phase 3 after completion) */}
      {isPhase3 && (
        <form onSubmit={handleReviewSubmitClick} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">Rate your service experience</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setSelectedRating(star)}
                  className="p-0.5 hover:scale-125 transition-transform"
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= selectedRating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Leave a short review for Anupam..."
              className="flex-1 text-xs px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isReviewSubmitting || isReviewDone}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1 disabled:opacity-50"
            >
              {isReviewSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isReviewDone ? (
                'Saved ✓'
              ) : (
                <>
                  <span>Submit</span>
                  <Send className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

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

export default NavigationControlCard;
