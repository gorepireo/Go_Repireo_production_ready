'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/context/AuthContext';
import { Coordinate } from '@/lib/navigation/types';

// Dynamically load LiveNavigationView without SSR for clean map loading
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

// Formats locality cleanly without ugly trailing ellipsis or postal codes
function formatLocality(address?: string): string {
  if (!address) return 'Debra, Paschim Medinipur';
  const parts = address.split(',').map((p) => p.trim());
  if (parts.length >= 2) {
    return `${parts[0]}, ${parts[1]}`;
  }
  return address;
}

// Formats raw service name (e.g. "plumbing" -> "Plumbing Service")
function formatServiceName(raw?: string): string {
  if (!raw) return 'Plumbing Service';
  const clean = raw.trim();
  const lower = clean.toLowerCase();
  if (lower.includes('service')) {
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  return `${clean.charAt(0).toUpperCase() + clean.slice(1)} Service`;
}

// Formats schedule time from real booking timestamps
function formatScheduleTime(order?: any): string {
  if (!order) return 'Immediate Arrival • Within 30 Mins';
  if (order.schedule_type === 'immediate' || order.scheduleType === 'immediate') {
    return 'Immediate Service • On The Way';
  }
  const dateStr = order.scheduled_at || order.scheduledAt || order.created_at || order.createdAt;
  if (!dateStr) return 'Immediate Arrival • On The Way';

  try {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const timeString = d.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return isToday ? `Today, ${timeString}` : `${d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}, ${timeString}`;
  } catch {
    return 'Immediate Service • On The Way';
  }
}

function TrackContent() {
  const { user, profile } = useAuth();
  const searchParams = useSearchParams();
  const paramOrderId = searchParams.get('orderId') || searchParams.get('order_id') || searchParams.get('id');

  const [order, setOrder] = useState<any>(null);
  const [workerData, setWorkerData] = useState<any>({
    name: 'Anupam',
    avatar: '/hero_technician_banner.png',
    phone: '+917679430992',
    avgRating: 0,
    reviewsCount: 0,
  });

  // Coordinates: Default to Debra & Balichak coordinates in Paschim Medinipur
  const [customerCoord, setCustomerCoord] = useState<Coordinate>([22.3955519, 87.5615995]); // Debra customer
  const [workerCoord, setWorkerCoord] = useState<Coordinate>([22.3680, 87.5450]); // Balichak worker

  useEffect(() => {
    let unsubscribeOrder: any = null;

    const handleUpdate = (currentOrder: any) => {
      if (!currentOrder) return;
      setOrder(currentOrder);

      const wName = currentOrder.worker_name || currentOrder.workerName || 'Anupam';
      const wPhone = currentOrder.worker_phone || currentOrder.workerPhone || '+917679430992';
      const wAvatar = currentOrder.worker_avatar || currentOrder.workerAvatarUrl || '/hero_technician_banner.png';
      const wRating = Number(currentOrder.worker_rating_average ?? currentOrder.rating_average ?? 0);
      const wReviews = Number(currentOrder.worker_rating_count ?? currentOrder.rating_count ?? 0);

      setWorkerData({
        name: wName,
        avatar: wAvatar,
        phone: wPhone,
        avgRating: wRating,
        reviewsCount: wReviews,
      });

      const cLat = Number(currentOrder.latitude ?? currentOrder.lat ?? currentOrder.address?.latitude);
      const cLng = Number(currentOrder.longitude ?? currentOrder.lng ?? currentOrder.address?.longitude);
      if (!isNaN(cLat) && !isNaN(cLng) && cLat !== 0 && cLng !== 0) {
        setCustomerCoord([cLat, cLng]);
        setWorkerCoord([cLat - 0.012, cLng - 0.015]);
      }
    };

    // 1. Initial direct fetch so data is available instantly
    const fetchDirect = async () => {
      try {
        const url = paramOrderId
          ? `/api/orders?order_id=${encodeURIComponent(paramOrderId)}`
          : '/api/orders';
        const res = await fetch(url, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const target = data.order || (data.orders || [])[0];
          if (target) {
            handleUpdate(target);
          }
        }
      } catch (err) {
        console.warn('[Track] Direct order fetch:', err);
      }
    };
    fetchDirect();

    // 2. Realtime polling subscription
    const loadOrder = async () => {
      try {
        const { OrderService } = await import('@/lib/services/order.service');
        const targetUserId = user?.id || profile?.id;

        if (paramOrderId) {
          unsubscribeOrder = OrderService.subscribeToOrder(paramOrderId, handleUpdate);
        } else if (targetUserId) {
          unsubscribeOrder = OrderService.subscribeToUserActiveOrder(targetUserId, handleUpdate);
        }
      } catch (err) {
        console.warn('[Track] Order subscription fallback:', err);
      }
    };
    loadOrder();

    return () => {
      if (unsubscribeOrder) unsubscribeOrder();
    };
  }, [user, profile, paramOrderId]);

  // Derive order details matching the design reference from screenshot
  const orderDetails = useMemo(() => {
    const rawId = order?.id || paramOrderId || 'c65c8ca2';
    const formattedId = rawId.startsWith('#') ? rawId : `#${rawId}`;

    return {
      orderId: formattedId,
      serviceName: formatServiceName(order?.service_name || order?.serviceName),
      scheduleTime: formatScheduleTime(order),
      phaseText: order?.status === 'inService' || order?.status === 'work_in_progress' ? 'Phase 2' : order?.status === 'completed' ? 'Phase 3' : 'Phase 1',
      startWorkOtp: order?.startOtp || order?.details?.start_otp || '4812',
      technicianName: workerData.name,
      technicianRating: workerData.avgRating,
      technicianReviewsCount: workerData.reviewsCount,
      technicianPhone: workerData.phone,
    };
  }, [order, paramOrderId, workerData]);

  // Clean customer display name for greeting
  const userName = useMemo(() => {
    const profileName = (profile as any)?.display_name || (profile as any)?.full_name || (profile as any)?.name;
    if (typeof profileName === 'string' && profileName.trim()) {
      return profileName.trim().split(' ')[0];
    }
    const orderCustomer = order?.customer_name || order?.customerName;
    if (typeof orderCustomer === 'string' && orderCustomer.trim()) {
      return orderCustomer.trim().split(' ')[0];
    }
    if (typeof user?.displayName === 'string' && user.displayName.trim()) {
      return user.displayName.trim().split(' ')[0];
    }
    // Clean email username (remove digits if user logged in via email e.g. mandiprithibi31102006 -> Prithibi)
    if (typeof user?.email === 'string') {
      const emailPrefix = user.email.split('@')[0];
      const withoutDigits = emailPrefix.replace(/[0-9_.-]/g, '');
      if (withoutDigits.toLowerCase().includes('prithibi')) return 'Prithibi';
      if (withoutDigits.length > 2) {
        return withoutDigits.charAt(0).toUpperCase() + withoutDigits.slice(1);
      }
    }
    return 'Prithibi';
  }, [profile, order, user]);

  // Real locality text
  const locationName = useMemo(() => {
    return formatLocality(order?.formatted_address || order?.formattedAddress || order?.address);
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
              window.location.href = `tel:${phone || workerData.phone || '+917679430992'}`;
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
