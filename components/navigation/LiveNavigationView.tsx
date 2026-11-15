'use client';

import React from 'react';
import { Coordinate, NavigationOrderDetails } from '../../lib/navigation/types';
import { NavigationHeader } from './NavigationHeader';
import { NavigationMap } from './NavigationMap';
import { NavigationControlCard, ExtendedNavigationOrderDetails } from './NavigationControlCard';

export interface LiveNavigationViewProps {
  customerDestination?: Coordinate;
  initialWorkerPosition?: Coordinate;
  orderDetails?: Partial<ExtendedNavigationOrderDetails>;
  locationName?: string;
  userName?: string;
  distanceRemainingMeters?: number;
  durationRemainingSeconds?: number;
  onGiveStartOtp?: () => Promise<void> | void;
  onFinishWork?: () => Promise<void> | void;
  onSubmitReview?: (rating: number, text: string) => Promise<void> | void;
  onCall?: (phone?: string) => void;
  onChat?: () => void;
}

export function LiveNavigationView({
  customerDestination = [22.3955519, 87.5615995],
  initialWorkerPosition = [22.3680, 87.5450],
  orderDetails,
  locationName = 'Debra, Paschim Medinipur',
  userName = 'Prithibi',
  distanceRemainingMeters = 3700,
  durationRemainingSeconds = 480,
  onGiveStartOtp,
  onFinishWork,
  onSubmitReview,
  onCall,
  onChat,
}: LiveNavigationViewProps) {
  return (
    <div className="flex flex-col min-h-[calc(100dvh-84px)] bg-slate-50 text-slate-900 select-none">
      {/* 1. Header (Debra, Paschim Medinipur / Hi, Prithibi) */}
      <NavigationHeader locationName={locationName} userName={userName} />

      {/* 2. Ola Maps / MapLibre View with Floating Top Metric Pill */}
      <main className="relative flex-1 w-full flex flex-col">
        <NavigationMap
          customerDestination={customerDestination}
          workerPosition={initialWorkerPosition}
          distanceRemainingMeters={distanceRemainingMeters}
          durationRemainingSeconds={durationRemainingSeconds}
          className="w-full h-[320px] min-h-[280px] sm:h-[400px]"
        />

        {/* 3. Bottom Delivery & Order Control Card (Clean & Minimal) */}
        <div className="w-full relative z-20">
          <NavigationControlCard
            orderDetails={orderDetails}
            onGiveStartOtp={onGiveStartOtp}
            onFinishWork={onFinishWork}
            onSubmitReview={onSubmitReview}
            onCall={onCall}
            onChat={onChat}
          />
        </div>
      </main>
    </div>
  );
}

export default LiveNavigationView;
