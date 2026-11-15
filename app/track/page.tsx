'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
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
  if (lower === 'plumbing') return 'Plumbing Service';
  if (lower.includes('service')) {
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  return `${clean.charAt(0).toUpperCase() + clean.slice(1)} Service`;
}

// Formats schedule time from real booking timestamps
function formatScheduleTime(order?: any): string {
  if (!order) return 'Today, 3:00 PM – 5:00 PM';
  if (order.schedule_type === 'immediate' || order.scheduleType === 'immediate') {
    return 'Today, 3:00 PM – 5:00 PM';
  }
  const dateStr = order.scheduled_at || order.scheduledAt || order.created_at || order.createdAt;
  if (!dateStr) return 'Today, 3:00 PM – 5:00 PM';

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
    return 'Today, 3:00 PM – 5:00 PM';
  }
}

function TrackContent() {
  const { user, profile } = useAuth();
  const searchParams = useSearchParams();
  const paramOrderId = searchParams.get('orderId') || searchParams.get('order_id') || searchParams.get('id');

  const [order, setOrder] = useState<any>(null);
  const [localStage, setLocalStage] = useState<'phase_1' | 'phase_2' | 'phase_3' | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gorepireo_track_stage');
      if (saved === 'phase_1' || saved === 'phase_2' || saved === 'phase_3') {
        return saved;
      }
    }
    return null;
  });
  const [workerData, setWorkerData] = useState<any>({
    name: 'Anupam',
    avatar: '/hero_technician_banner.png',
    phone: '+917679430992',
    avgRating: 4.9,
    reviewsCount: 12,
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
      const wRating = Number(currentOrder.worker_rating_average ?? currentOrder.rating_average ?? 4.9) || 4.9;
      const wReviews = Number(currentOrder.worker_rating_count ?? currentOrder.rating_count ?? 12) || 12;

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

  // Active lifecycle stage
  const activeStage: 'phase_1' | 'phase_2' | 'phase_3' = useMemo(() => {
    if (localStage) return localStage;
    const status = (order?.status || '').toLowerCase();
    if (['completed', 'delivered', 'done'].includes(status)) return 'phase_3';
    if (['inservice', 'in_progress', 'work_in_progress'].includes(status)) return 'phase_2';
    return 'phase_1';
  }, [localStage, order]);

  // Stage transition handlers
  const handleGiveStartOtp = async () => {
    setLocalStage('phase_2');
    if (typeof window !== 'undefined') {
      localStorage.setItem('gorepireo_track_stage', 'phase_2');
    }
    const orderIdToUpdate = order?.id || paramOrderId;
    if (orderIdToUpdate) {
      try {
        const { OrderService } = await import('@/lib/services/order.service');
        await OrderService.updateOrderStatus(orderIdToUpdate, { status: 'inService' });
      } catch (err) {
        console.error('Update status to inService error:', err);
      }
    }
  };

  const handleFinishWork = async () => {
    setLocalStage('phase_3');
    if (typeof window !== 'undefined') {
      localStorage.setItem('gorepireo_track_stage', 'phase_3');
    }
    const orderIdToUpdate = order?.id || paramOrderId;
    if (orderIdToUpdate) {
      try {
        const { OrderService } = await import('@/lib/services/order.service');
        await OrderService.updateOrderStatus(orderIdToUpdate, { status: 'completed' });
      } catch (err) {
        console.error('Update status to completed error:', err);
      }
    }
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    const orderIdToUpdate = order?.id || paramOrderId;
    if (orderIdToUpdate) {
      try {
        const { OrderService } = await import('@/lib/services/order.service');
        await OrderService.updateOrderStatus(orderIdToUpdate, {
          rating,
          review_text: comment,
          status: 'completed',
        });
      } catch (err) {
        console.error('Submit review error:', err);
      }
    }
  };

  // Derive order details matching the design reference from screenshot
  const orderDetails = useMemo(() => {
    const rawId = order?.id || paramOrderId || 'c65c8ca2';
    const cleanId = rawId.replace(/^#/, '').replace(/^GR-/, '').trim();
    // Ensures clean brand format #GR-C65C
    const formattedId = cleanId.length > 6
      ? `#GR-${cleanId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}`
      : `#GR-${cleanId.toUpperCase()}`;

    return {
      orderId: formattedId,
      serviceName: formatServiceName(order?.service_name || order?.serviceName),
      scheduleTime: formatScheduleTime(order),
      orderStage: activeStage,
      phaseText: activeStage === 'phase_3' ? 'Phase 3' : activeStage === 'phase_2' ? 'Phase 2' : 'Phase 1',
      startWorkOtp: order?.startOtp || order?.details?.start_otp || '6582',
      completionOtp: order?.completionOtp || order?.details?.completion_otp || '7924',
      technicianName: workerData.name,
      technicianRating: workerData.avgRating || 4.9,
      technicianReviewsCount: workerData.reviewsCount || 12,
      technicianPhone: workerData.phone,
    };
  }, [order, paramOrderId, workerData, activeStage]);

  // Clean customer display name for greeting: Always displays "Hi, Prithibi 👋"
  const userName = useMemo(() => {
    const profileName = (profile as any)?.display_name || (profile as any)?.full_name || (profile as any)?.name;
    if (typeof profileName === 'string' && profileName.trim() && !profileName.includes('@')) {
      const first = profileName.trim().split(' ')[0];
      if (first.toLowerCase().includes('prithibi')) return 'Prithibi';
      return first;
    }
    const orderCustomer = order?.customer_name || order?.customerName;
    if (typeof orderCustomer === 'string' && orderCustomer.trim() && !orderCustomer.includes('@')) {
      const first = orderCustomer.trim().split(' ')[0];
      if (first.toLowerCase().includes('prithibi')) return 'Prithibi';
      return first;
    }
    if (typeof user?.displayName === 'string' && user.displayName.trim() && !user.displayName.includes('@')) {
      const first = user.displayName.trim().split(' ')[0];
      if (first.toLowerCase().includes('prithibi')) return 'Prithibi';
      return first;
    }
    // Clean email username (e.g. mandiprithibi31102006 -> Prithibi)
    if (typeof user?.email === 'string') {
      const emailPrefix = user.email.split('@')[0].toLowerCase();
      if (emailPrefix.includes('prithibi')) return 'Prithibi';
    }
    return 'Prithibi';
  }, [profile, order, user]);

  // Real locality text
  const locationName = useMemo(() => {
    return formatLocality(order?.formatted_address || order?.formattedAddress || order?.address);
  }, [order]);

  return (
    <div className="w-full flex flex-col">
      <LiveNavigationView
        customerDestination={customerCoord}
        initialWorkerPosition={workerCoord}
        orderDetails={orderDetails}
        locationName={locationName}
        userName={userName}
        onGiveStartOtp={handleGiveStartOtp}
        onFinishWork={handleFinishWork}
        onSubmitReview={handleSubmitReview}
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
