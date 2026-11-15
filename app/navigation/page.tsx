'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamic import with SSR disabled for Leaflet map integration
const LiveNavigationView = dynamic(
  () => import('../../components/navigation/LiveNavigationView'),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Loading Live Navigation...</p>
      </div>
    ),
  }
);

export default function NavigationPage() {
  // Debra & Balichak coordinates matching reference UI (Paschim Medinipur)
  const customerDestination: [number, number] = [22.3855, 87.563]; // Debra customer location
  const initialWorkerPosition: [number, number] = [22.368, 87.545]; // Balichak worker location

  const orderDetails = {
    orderId: '#GR-C65C',
    serviceName: 'Plumbing Service',
    scheduleTime: 'Today, 3:00 PM – 5:00 PM',
    phaseText: 'Phase 1',
    startWorkOtp: '4812',
    technicianName: 'Anupam',
    technicianRating: 4.9,
    technicianReviewsCount: 12,
    technicianPhone: '+919876543210',
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center">
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[844px] sm:max-h-[880px] sm:rounded-3xl sm:shadow-2xl overflow-hidden flex flex-col relative sm:border sm:border-slate-200">
        <LiveNavigationView
          customerDestination={customerDestination}
          initialWorkerPosition={initialWorkerPosition}
          orderDetails={orderDetails}
          locationName="Debra, Paschim Medinipur"
          userName="Prithibi"
          onCall={(phone) => {
            if (typeof window !== 'undefined') {
              window.location.href = `tel:${phone || '+919876543210'}`;
            }
          }}
          onChat={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/chat';
            }
          }}
        />
      </div>
    </div>
  );
}
