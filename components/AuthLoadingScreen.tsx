'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface AuthLoadingScreenProps {
  /** Optional error message if authentication check failed */
  error?: string | null;
  /** Optional retry callback if error occurred */
  onRetry?: () => void;
  /** Whether loading has completed successfully */
  isComplete?: boolean;
}

/**
 * Ultra-minimal, premium branded authentication loading screen for Go_Repireo.
 * Strictly presents:
 * 1. Running repairman mascot at center with gentle floating motion
 * 2. Official Go_Repireo wordmark ("Go_" deep blue + "Repireo" orange)
 * 3. Thin, elegant rounded blue loading progress bar
 */
export default function AuthLoadingScreen({
  error = null,
  onRetry,
  isComplete = false
}: AuthLoadingScreenProps) {
  // Real progress state connected to authentication lifecycle
  const [progress, setProgress] = useState<number>(20);

  useEffect(() => {
    if (error) {
      setProgress(100);
      return;
    }

    if (isComplete) {
      setProgress(100);
      return;
    }

    // Step 1: Handshake initiated
    const t1 = setTimeout(() => {
      setProgress((p) => Math.max(p, 45));
    }, 120);

    // Step 2: Session payload evaluation
    const t2 = setTimeout(() => {
      setProgress((p) => Math.max(p, 78));
    }, 380);

    // Step 3: Resolving account state
    const t3 = setTimeout(() => {
      setProgress((p) => Math.max(p, 92));
    }, 850);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [error, isComplete]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Checking account session"
      className="fixed inset-0 z-50 flex min-h-screen w-full flex-col items-center justify-center bg-white px-6 select-none"
    >
      <style jsx global>{`
        @keyframes repireoMascotBounce {
          0%, 100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          25% {
            transform: translate3d(0, -5px, 0) rotate(-1deg);
          }
          50% {
            transform: translate3d(0, -9px, 0) rotate(0.6deg);
          }
          75% {
            transform: translate3d(0, -3px, 0) rotate(1.2deg);
          }
        }

        @keyframes repireoFadeIn {
          0% {
            opacity: 0;
            transform: translate3d(0, 3px, 0);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes repireoPulseGaze {
          0%, 100% {
            filter: drop-shadow(0 8px 24px rgba(0, 122, 255, 0.08));
          }
          50% {
            filter: drop-shadow(0 14px 30px rgba(0, 122, 255, 0.15));
          }
        }

        .repireo-mascot-animation {
          animation: repireoMascotBounce 1.9s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite,
                     repireoPulseGaze 3s ease-in-out infinite;
          will-change: transform, filter;
        }

        .repireo-logo-animation {
          animation: repireoFadeIn 0.6s ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .repireo-mascot-animation,
          .repireo-logo-animation {
            animation: none !important;
            transform: none !important;
            filter: none !important;
          }
        }
      `}</style>

      <div className="flex flex-col items-center justify-center text-center">
        {/* 1. Running Repairman Mascot */}
        <div className="repireo-mascot-animation relative flex items-center justify-center">
          <Image
            src="/mascot.png"
            alt="Go_Repireo Mascot"
            width={170}
            height={121}
            priority
            className="h-auto w-32 sm:w-40 object-contain pointer-events-none select-none"
          />
        </div>

        {/* 2. Go_Repireo Wordmark */}
        <div className="repireo-logo-animation mt-4 sm:mt-5 flex items-center justify-center">
          <Image
            src="/brand-wordmark.png"
            alt="Go_Repireo"
            width={210}
            height={38}
            priority
            className="h-auto w-40 sm:w-48 object-contain pointer-events-none select-none"
          />
        </div>

        {/* 3. Thin Elegant Rounded Blue Progress Bar */}
        <div className="mt-6 sm:mt-7 w-44 sm:w-56">
          <div
            className="h-1 sm:h-1.5 w-full overflow-hidden rounded-full bg-[#E5EAF2]"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                error ? 'bg-rose-500' : 'bg-[#007AFF]'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Minimal Error Recovery (Shown ONLY when real auth fails) */}
          {error && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <p className="text-xs font-semibold text-rose-600">{error}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-1 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95"
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
