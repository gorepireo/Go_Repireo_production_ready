'use client';

import React, { useEffect, useState } from 'react';
import { Coordinate, NavigationOrderDetails } from '../../lib/navigation/types';
import { useGeolocation } from '../../lib/navigation/hooks/useGeolocation';
import { useNavigation } from '../../lib/navigation/hooks/useNavigation';
import { NavigationHeader } from './NavigationHeader';
import { NavigationMap } from './NavigationMap';
import { NavigationControlCard } from './NavigationControlCard';

export interface LiveNavigationViewProps {
  customerDestination: Coordinate; // [lat, lng]
  initialWorkerPosition?: Coordinate; // [lat, lng]
  orderDetails?: Partial<NavigationOrderDetails>;
  locationName?: string;
  userName?: string;
  onCall?: (phone?: string) => void;
  onChat?: () => void;
}

export function LiveNavigationView({
  customerDestination,
  initialWorkerPosition,
  orderDetails,
  locationName = 'Debra, Paschim Medinipur',
  userName = 'Prithibi',
  onCall,
  onChat,
}: LiveNavigationViewProps) {
  // 1. Standalone Browser GPS Tracking Hook
  const {
    position: gpsPosition,
    status: gpsStatus,
    accuracyWarning,
    startWatching,
    stopWatching,
  } = useGeolocation({
    enableHighAccuracy: true,
    autoStart: true,
  });

  // Effective worker coordinate (GPS priority, then prop fallback, then relative to customer)
  const currentWorkerCoord: Coordinate = gpsPosition
    ? [gpsPosition.lat, gpsPosition.lng]
    : initialWorkerPosition || [
        customerDestination[0] - 0.012,
        customerDestination[1] - 0.015,
      ];

  // 2. Navigation Engine Hook (Zero Firebase, Standalone Routing)
  const {
    navigationStatus,
    route,
    progress,
    isRecalculating,
    error: navigationError,
    isVoiceMuted,
    startNavigation,
    pauseNavigation,
    resumeNavigation,
    stopNavigation,
    recalculateRoute,
    toggleVoice,
    updateWorkerPosition,
  } = useNavigation({
    destination: customerDestination,
    initialWorkerPosition: currentWorkerCoord,
    enableVoice: true,
  });

  // Automatically feed GPS updates into navigation logic
  useEffect(() => {
    if (gpsPosition) {
      updateWorkerPosition(gpsPosition);
    }
  }, [gpsPosition, updateWorkerPosition]);

  // Initial route fetch on mount
  useEffect(() => {
    recalculateRoute(currentWorkerCoord);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 select-none">
      {/* 1. Header (Debra, Paschim Medinipur / Hi, Prithibi) */}
      <NavigationHeader locationName={locationName} userName={userName} />

      {/* 2. Map Section with Floating Top Pill */}
      <main className="relative flex-1 w-full flex flex-col">
        <NavigationMap
          workerPosition={currentWorkerCoord}
          destination={customerDestination}
          route={route}
          gpsAccuracy={gpsPosition?.accuracy}
          workerHeading={gpsPosition?.heading}
          isRecalculating={isRecalculating}
          distanceRemainingMeters={progress?.distanceRemainingMeters ?? route?.distanceMeters}
          durationRemainingSeconds={progress?.durationRemainingSeconds ?? route?.durationSeconds}
          workerName={orderDetails?.technicianName || 'Anupam'}
          isVoiceMuted={isVoiceMuted}
          onToggleVoice={toggleVoice}
          className="flex-1 w-full min-h-[360px]"
        />

        {/* 3. Bottom Delivery & Order Control Card */}
        <div className="w-full relative z-20">
          <NavigationControlCard
            orderDetails={orderDetails}
            navigationStatus={navigationStatus}
            gpsStatus={gpsStatus}
            gpsAccuracy={gpsPosition?.accuracy}
            accuracyWarning={accuracyWarning}
            isRecalculating={isRecalculating}
            onStartNavigation={() => startNavigation(currentWorkerCoord)}
            onPauseNavigation={pauseNavigation}
            onResumeNavigation={resumeNavigation}
            onStopNavigation={stopNavigation}
            onRecalculate={() => recalculateRoute(currentWorkerCoord)}
            onCall={onCall}
            onChat={onChat}
          />
        </div>
      </main>
    </div>
  );
}
export default LiveNavigationView;
