'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/context/AuthContext';
import { Coordinate } from '@/lib/navigation/types';

// Dynamically load LiveNavigationView without SSR for clean Leaflet map loading
const LiveNavigationView = dynamic(
  () => import('@/components/navigation/LiveNavigationView'),
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

function TrackContent() {
  const { user, profile } = useAuth();
  const searchParams = useSearchParams();
  const paramOrderId = searchParams.get('orderId') || searchParams.get('order_id') || searchParams.get('id');

  const [order, setOrder] = useState<any>(null);
  const [workerData, setWorkerData] = useState<any>({
    name: 'Anupam',
    avatar: '/hero_technician_banner.png',
    phone: '+919876543210',
    avgRating: 4.9,
    reviewsCount: 12,
  });

  // Coordinates: Default to Debra & Balichak from reference UI (Paschim Medinipur)
  const [customerCoord, setCustomerCoord] = useState<Coordinate>([22.3855, 87.5630]); // Debra
  const [workerCoord, setWorkerCoord] = useState<Coordinate>([22.3680, 87.5450]); // Balichak

  useEffect(() => {
    let unsubscribeOrder: any = null;

    const loadOrder = async () => {
      try {
        const { OrderService } = await import('@/lib/services/order.service');
        const targetUserId = user?.id || profile?.id;

        const handleUpdate = (currentOrder: any) => {
          if (!currentOrder) return;
          setOrder(currentOrder);

          if (currentOrder.worker_name || currentOrder.workerName) {
            setWorkerData({
              name: currentOrder.worker_name || currentOrder.workerName || 'Anupam',
              avatar: currentOrder.worker_avatar || currentOrder.workerAvatarUrl || '/hero_technician_banner.png',
              phone: currentOrder.worker_phone || currentOrder.workerPhone || '+919876543210',
              avgRating: currentOrder.workerRatingAverage || 4.9,
              reviewsCount: currentOrder.workerRatingCount || 12,
            });
          }

          const cLat = Number(currentOrder.latitude ?? currentOrder.lat ?? currentOrder.address?.latitude);
          const cLng = Number(currentOrder.longitude ?? currentOrder.lng ?? currentOrder.address?.longitude);
          if (!isNaN(cLat) && !isNaN(cLng) && cLat !== 0 && cLng !== 0) {
            setCustomerCoord([cLat, cLng]);
            // If worker coordinate not yet set, place worker nearby
            setWorkerCoord([cLat - 0.012, cLng - 0.015]);
          }
        };

        if (paramOrderId) {
          unsubscribeOrder = OrderService.subscribeToOrder(paramOrderId, handleUpdate);
        } else if (targetUserId) {
          unsubscribeOrder = OrderService.subscribeToUserActiveOrder(targetUserId, handleUpdate);
        }
      } catch (err) {
        console.warn('[Track] Could not load active order, falling back to default:', err);
      }
    };

    loadOrder();

    return () => {
      if (unsubscribeOrder) unsubscribeOrder();
    };
  }, [user, profile, paramOrderId]);

  // Derive order details matching the design reference from screenshot
  const orderDetails = useMemo(() => {
    const rawId = order?.id || paramOrderId || 'GR-C65C';
    const formattedId = rawId.startsWith('#') ? rawId : `#${rawId}`;

    return {
      orderId: formattedId,
      serviceName: order?.service_name || order?.serviceName || 'Plumbing Service',
      scheduleTime: order?.booking_time || order?.bookingDate || 'Today, 3:00 PM – 5:00 PM',
      phaseText: order?.status === 'work_in_progress' ? 'Phase 2' : order?.status === 'completed' ? 'Phase 3' : 'Phase 1',
      startWorkOtp: order?.details?.start_otp || order?.startOtp || '4812',
      technicianName: workerData.name,
      technicianRating: workerData.avgRating,
      technicianReviewsCount: workerData.reviewsCount,
      technicianPhone: workerData.phone,
    };
  }, [order, paramOrderId, workerData]);

  // User first name for greeting
  const userName = useMemo(() => {
    const rawName = (profile as any)?.full_name || (profile as any)?.name;
    if (typeof rawName === 'string' && rawName.trim()) {
      return rawName.trim().split(' ')[0];
    }
    if (typeof user?.email === 'string') {
      return user.email.split('@')[0];
    }
    return 'Prithibi';
  }, [profile, user]);

  // Locality text
  const locationName = useMemo(() => {
    if (order?.address?.city || order?.city) {
      return `${order.address?.city || order.city}, ${order.address?.state || 'Paschim Medinipur'}`;
    }
    return 'Debra, Paschim Medinipur';
  }, [order]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between pb-16">
      <div className="w-full flex-1 flex flex-col">
        <LiveNavigationView
          customerDestination={customerCoord}
          initialWorkerPosition={workerCoord}
          orderDetails={orderDetails}
          locationName={locationName}
          userName={userName}
          onCall={(phone) => {
            if (typeof window !== 'undefined') {
              window.location.href = `tel:${phone || workerData.phone || '+919876543210'}`;
            }
          }}
          onChat={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/chat';
            }
          }}
        />
      </div>

      {/* Global Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading Order Tracking...</p>
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
