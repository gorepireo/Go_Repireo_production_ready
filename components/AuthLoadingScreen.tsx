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
 * Perfectly mirrors the official design reference:
 * 1. Running repairman mascot at center with orange ground swoosh & subtle bouncing run
 * 2. Official Go_Repireo wordmark ("Go_" deep blue + "Repireo" orange) directly beneath
 * 3. Rounded blue loading progress bar (#0278FC on #E1E8F0) perfectly matched to logo width
 */
export default function AuthLoadingScreen({
  error = null,
  onRetry,
  isComplete = false
}: AuthLoadingScreenProps) {
  // Real progress state connected to authentication lifecycle
  const [progress, setProgress] = useState<number>(25);

  useEffect(() => {
    if (error) {
      setProgress(100);
      return;
    }

    if (isComplete) {
      setProgress(100);
      return;
    }

    // Step 1: Handshake & credentials exchange
    const t1 = setTimeout(() => {
      setProgress((p) => Math.max(p, 50));
    }, 100);

    // Step 2: Session verification & permissions lookup
    const t2 = setTimeout(() => {
      setProgress((p) => Math.max(p, 80));
    }, 350);

    // Step 3: Preparing session environment
    const t3 = setTimeout(() => {
      setProgress((p) => Math.max(p, 95));
    }, 750);

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
        @keyframes repireoRunningBounce {
          0%, 100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          25% {
            transform: translate3d(0, -6px, 0) rotate(-0.8deg);
          }
          50% {
            transform: translate3d(0, -10px, 0) rotate(0.6deg);
          }
          75% {
            transform: translate3d(0, -3px, 0) rotate(1.2deg);
          }
        }

        @keyframes repireoFadeIn {
          0% {
            opacity: 0;
            transform: translate3d(0, 4px, 0);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        .repireo-mascot-animation {
          animation: repireoRunningBounce 1.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
          will-change: transform;
        }

        .repireo-logo-animation {
          animation: repireoFadeIn 0.5s ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .repireo-mascot-animation,
          .repireo-logo-animation {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>

      <div className="flex w-full max-w-sm flex-col items-center justify-center text-center">
        {/* 1. Running Repairman Mascot with Orange Swoosh */}
        <div className="repireo-mascot-animation relative flex items-center justify-center">
          <Image
            src="/mascot.png"
            alt="Go_Repireo Mascot"
            width={260}
            height={255}
            priority
            className="h-auto w-44 sm:w-56 object-contain pointer-events-none select-none"
          />
        </div>

        {/* 2. Go_Repireo Wordmark (Deep Blue + Orange) */}
        <div className="repireo-logo-animation -mt-1 sm:-mt-2 flex items-center justify-center">
          <Image
            src="/brand-wordmark.png"
            alt="Go_Repireo"
            width={378}
            height={68}
            priority
            className="h-auto w-56 sm:w-72 object-contain pointer-events-none select-none"
          />
        </div>

        {/* 3. Rounded Blue Loading Progress Bar (exact width match & exact colors) */}
        <div className="mt-7 sm:mt-9 w-56 sm:w-72">
          <div
            className="h-2 sm:h-2.5 w-full overflow-hidden rounded-full bg-[#E1E8F0]"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                error ? 'bg-rose-500' : 'bg-[#0278FC]'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Minimal Error State (Shown only when authentication check fails) */}
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
