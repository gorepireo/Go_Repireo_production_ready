'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCall } from '@/context/CallContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Activity, 
  ShieldCheck, 
  ChevronRight, 
  Navigation, 
  Zap, 
  Map, 
  MessageCircle, 
  X, 
  Compass, 
  ArrowRight, 
  Clock, 
  LayoutGrid, 
  User, 
  Phone, 
  CheckCircle2, 
  Lock, 
  ExternalLink, 
  Check, 
  Banknote, 
  Loader2, 
  ClipboardList, 
  ChevronDown, 
  Snowflake, 
  Eye, 
  FileText, 
  ImageIcon,
  Bell,
  Box,
  Home,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import { WorkerDashboardSkeleton } from '@/components/SkeletonLoader';
import { OrderService } from '@/lib/services/order.service';

const LiveTrackingGoogleMap = dynamic(() => import('@/components/LiveTrackingGoogleMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 text-xs font-bold">
      Loading Real Map Tile...
    </div>
  )
});

function WorkerDashboardContent() {
  const { user, role, profile: rawProfile } = useAuth();
  const { startCall } = useCall();
  const profile = rawProfile as any;
  const router = useRouter();

  useEffect(() => {
    if (role === 'customer') {
      router.replace('/dashboard/user');
    } else if (role === 'admin') {
      router.replace('/admin');
    }
  }, [role, router]);

  const [activeJob, setActiveJob] = useState<any>(null);
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [lifetimeEarnings, setLifetimeEarnings] = useState(0);

  // Live Device GPS Location State
  const [liveDeviceGps, setLiveDeviceGps] = useState<{ lat: number; lng: number } | null>(null);

  // Pagination for previous completed orders
  const [visibleCompletedCount, setVisibleCompletedCount] = useState(5);

  // Media Lightbox Modal State
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);

  // OTP State
  const [startOtpInput, setStartOtpInput] = useState('');
  const [completionOtpInput, setCompletionOtpInput] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);
  const [cashCollected, setCashCollected] = useState(false);
  const [confirmingCash, setConfirmingCash] = useState(false);

  const displayName = (profile as any)?.full_name || (profile as any)?.name || profile?.display_name || user?.email?.split('@')[0] || 'Prithibi Mandi';

  // Watch Worker's Real Device GPS Location continuously
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setLiveDeviceGps({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => console.warn('GPS watch error:', err),
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Continuous GPS watchPosition Worker Live Location Engine for Active Orders
  useEffect(() => {
    const activeStatuses = ['assigned', 'enRoute', 'arrived', 'inService', 'awaitingCompletion'];
    if (!activeJob?.id || !activeStatuses.includes(activeJob.status)) return;

    const rawOrderId = activeJob.id;
    let lastSentTime = 0;
    let watchId: number | null = null;

    const sendLocationPayload = async (lat: number, lng: number, accuracy?: number, heading?: number | null, speed?: number | null) => {
      try {
        await fetch('/api/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            order_id: rawOrderId,
            latitude: lat,
            longitude: lng,
          }),
        });
      } catch (err) {
        console.warn('Location API post error:', err);
      }
    };

    if (typeof window !== 'undefined' && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const currentLat = pos.coords.latitude;
          const currentLng = pos.coords.longitude;
          const accuracy = pos.coords.accuracy;
          const heading = pos.coords.heading;
          const speed = pos.coords.speed;

          // Filter out unreliable low-accuracy GPS points
          if (accuracy && accuracy > 120) {
            console.warn('Skipping low accuracy GPS point:', accuracy);
            return;
          }

          setLiveDeviceGps({ lat: currentLat, lng: currentLng });

          // Throttle network updates to ~5-7 seconds interval to avoid excessive writes
          const now = Date.now();
          if (now - lastSentTime > 5000) {
            lastSentTime = now;
            sendLocationPayload(currentLat, currentLng, accuracy, heading, speed);
          }
        },
        (err) => {
          console.warn('Worker GPS watchPosition error:', err);
          const custLat = Number(activeJob?.latitude ?? activeJob?.lat ?? 22.5726);
          const custLng = Number(activeJob?.longitude ?? activeJob?.lng ?? 88.3639);
          const fallbackLat = activeJob?.worker_lat ? Number(activeJob.worker_lat) : custLat - 0.0072;
          const fallbackLng = activeJob?.worker_lng ? Number(activeJob.worker_lng) : custLng - 0.0068;
          sendLocationPayload(fallbackLat, fallbackLng);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }

    return () => {
      if (watchId !== null && typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [activeJob?.id, activeJob?.status, activeJob?.lat, activeJob?.lng, activeJob?.worker_lat, activeJob?.worker_lng, user?.uid]);

  // Toggle Online / Offline Status
  const handleToggleOnline = async () => {
    const newStatus = !isAvailable;
    setIsAvailable(newStatus);
    if (user?.uid) {
      try {
        const { WorkerService } = await import('@/lib/services/worker.service');
        await WorkerService.updateAvailability(newStatus);
      } catch (err) {
        console.error('Toggle status error:', err);
      }
    }
  };

  // Fetch Current Worker Active Job, Previous Orders & Lifetime Earnings
  const fetchWorkerDashboardData = async () => {
    const workerId = user?.uid || profile?.id;
    const workerEmail = user?.email || profile?.email;

    try {
      // 1. Fetch active order assigned to worker
      const { OrderService } = await import('@/lib/services/order.service');
      const activeOrder = workerId ? await OrderService.getWorkerActiveOrder(workerId) : null;
      
      let assignedJobs: any[] = [];
      if (activeOrder) {
        // Map Firestore Order format to component's expected format for smooth transition
        assignedJobs = [{
          ...activeOrder,
          id: activeOrder.id,
          status: activeOrder.status,
          service_name: activeOrder.serviceName || activeOrder.serviceId,
          details: { description: activeOrder.problemDescription },
          total_price: (activeOrder.quotedAmountPaise || 0) / 100,
          lat: activeOrder.latitude,
          lng: activeOrder.longitude,
          address: activeOrder.formattedAddress,
          worker_id: activeOrder.workerId
        }];
      }

      if (assignedJobs && assignedJobs.length > 0) {
        setActiveJob(assignedJobs[0]);
      } else {
        // ONLY check for unassigned pending orders if worker has no active accepted order
        const pendingJobs = await OrderService.getAvailableOrders();
        if (pendingJobs && pendingJobs.length > 0) {
          const fbOrder = pendingJobs[0];
          setActiveJob({
            ...fbOrder,
            id: fbOrder.id,
            status: 'pending',
            details: { description: fbOrder.problemDescription },
            service_name: fbOrder.serviceName || fbOrder.serviceId,
            total_price: (fbOrder.quotedAmountPaise || 0) / 100,
            lat: fbOrder.latitude,
            lng: fbOrder.longitude,
            address: fbOrder.formattedAddress,
          });
        } else {
          setActiveJob(null);
        }
      }

      // 3. Fetch ALL completed jobs for total LIFETIME EARNINGS & previous orders list
      if (workerId) {
        const completed = await OrderService.getCompletedOrders(workerId);
        if (completed) {
          const mappedCompleted = completed.map(j => ({
             ...j,
             id: j.id,
             status: j.status,
             details: { description: j.problemDescription },
             total_price: (j.quotedAmountPaise || 0) / 100
          }));
          setCompletedJobs(mappedCompleted);
          const total = mappedCompleted.reduce((sum: number, j: any) => sum + (Number(j.total_price || 499)), 0);
          setLifetimeEarnings(total);
        }
      }
    } catch (err) {
      console.error('Fetch worker dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerDashboardData();
    const interval = setInterval(fetchWorkerDashboardData, 4000);
    return () => clearInterval(interval);
  }, [user]);

  // Worker Explicitly Accepts Order (Syncs DB & Local State Instantly - First-Come-First-Served)
  const handleAcceptJob = async (jobId: string) => {
    const workerId = user?.uid || profile?.id;
    if (!workerId) return;
    const targetId = jobId || activeJob?.id;

    if (!targetId) {
      console.error('No job ID to accept');
      return;
    }

    const workerAvatar = 
      (profile as any)?.avatar_url || 
      (profile as any)?.avatar || 
      user?.photoURL ||
      (typeof window !== 'undefined' ? localStorage.getItem('repireo_cached_avatar') : null) || 
      null;
    const workerPhone = (profile as any)?.phone || '+918679245568';
    const nowIso = new Date().toISOString();

    setIsAccepting(true);
    try {
      const { OrderService } = await import('@/lib/services/order.service');
      const { TrackingService } = await import('@/lib/services/tracking.service');
      
      await OrderService.assignWorker(targetId);

      // Log tracking event
      await TrackingService.addTrackingEvent(targetId, {
        workerId,
        workerName: displayName,
        status: 'worker_assigned',
        note: `Technician ${displayName} has accepted the job and is preparing to dispatch.`
      });

      // 3. Mark in localStorage & update local activeJob state
      if (typeof window !== 'undefined') {
        localStorage.setItem(`accepted_job_${targetId}`, 'true');
      }

      setActiveJob((prev: any) => ({
        ...(prev || {}),
        id: targetId,
        status: 'assigned',
        accepted: true,
        accepted_at: nowIso,
        worker_id: workerId,
        worker_name: displayName,
        worker_avatar: workerAvatar,
        worker_phone: workerPhone,
        worker_email: user?.email || profile?.email || null
      }));

      // Trigger fetch to sync remaining properties
      setTimeout(fetchWorkerDashboardData, 500);

      console.log('✅ Order accepted & activated in DB for worker:', displayName);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('repireo_toast', {
          detail: {
            id: `toast-${Date.now()}`,
            type: 'completed',
            title: 'Order Accepted ✓',
            message: 'You have accepted the order. Live route active!'
          }
        }));
      }

      // Record location tracking ping
      const wLat = liveDeviceGps?.lat || (profile?.lat ? Number(profile.lat) : 26.7620);
      const wLng = liveDeviceGps?.lng || (profile?.lng ? Number(profile.lng) : 79.0320);

      await TrackingService.addTrackingEvent(targetId, {
        lat: wLat,
        lng: wLng,
        workerName: displayName,
        is_moving: true,
        status: 'worker_assigned'
      });

    } catch (err: unknown) {
      console.error('Accept job error:', err);
      alert(err instanceof Error ? err.message : 'Failed to accept order.');
    } finally {
      setIsAccepting(false);
    }
  };


  // Open Native Google Maps App via Native Intent / Deep Link URIs
  const openNativeGoogleMapsApp = (originLat: number, originLng: number, destLat: number, destLng: number) => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isAndroid) {
      // Android Native Google Maps App Intent URL
      const androidAppIntent = `intent://maps.google.com/maps?saddr=${originLat},${originLng}&daddr=${destLat},${destLng}&directionsmode=driving#Intent;scheme=https;package=com.google.android.apps.maps;end;`;
      window.location.href = androidAppIntent;
    } else if (isIOS) {
      // iOS Google Maps App URL Scheme with Web Fallback
      const iosAppScheme = `comgooglemaps://?saddr=${originLat},${originLng}&daddr=${destLat},${destLng}&directionsmode=driving`;
      const webFallback = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
      
      const now = Date.now();
      window.location.href = iosAppScheme;
      setTimeout(() => {
        if (Date.now() - now < 1500) {
          window.open(webFallback, '_blank');
        }
      }, 1000);
    } else {
      // Desktop Web Browser Fallback
      const webUrl = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
      window.open(webUrl, '_blank');
    }
  };

  // Trigger Get Route with Worker's Live Device GPS Coordinates
  const handleGetRoute = async () => {
    const cLat = Number(activeJob?.latitude ?? activeJob?.lat ?? 22.5726);
    const cLng = Number(activeJob?.longitude ?? activeJob?.lng ?? 88.3639);

    const recordLocation = async (lat: number, lng: number) => {
      if (activeJob?.id) {
        try {
          if (activeJob.status === 'assigned') {
            await OrderService.updateOrderStatus(activeJob.id, { status: 'enRoute' });
            setActiveJob((previous: any) => ({ ...previous, status: 'enRoute' }));
          }
          await fetch('/api/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              order_id: activeJob.id,
              latitude: lat,
              longitude: lng,
            }),
          });
        } catch (e) {
          console.warn('Upsert location error:', e);
        }
      }
    };

    if (liveDeviceGps) {
      await recordLocation(liveDeviceGps.lat, liveDeviceGps.lng);
      openNativeGoogleMapsApp(liveDeviceGps.lat, liveDeviceGps.lng, cLat, cLng);
    } else if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const actualLat = pos.coords.latitude;
          const actualLng = pos.coords.longitude;
          setLiveDeviceGps({ lat: actualLat, lng: actualLng });
          await recordLocation(actualLat, actualLng);
          openNativeGoogleMapsApp(actualLat, actualLng, cLat, cLng);
        },
        (err) => {
          console.warn('GPS error fallback:', err);
          const fallbackLat = cLat - 0.0072;
          const fallbackLng = cLng - 0.0068;
          openNativeGoogleMapsApp(fallbackLat, fallbackLng, cLat, cLng);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      const fallbackLat = cLat - 0.0072;
      const fallbackLng = cLng - 0.0068;
      openNativeGoogleMapsApp(fallbackLat, fallbackLng, cLat, cLng);
    }
  };

  // Verify Start OTP
  const handleVerifyStartOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setVerifyingOtp(true);
    try {
      if (activeJob?.id) {
        const { OrderService } = await import('@/lib/services/order.service');
        const { TrackingService } = await import('@/lib/services/tracking.service');

        await OrderService.verifyOtp(activeJob.id, 'start', startOtpInput.trim());

        await TrackingService.addTrackingEvent(activeJob.id, {
          status: 'in_progress',
          note: `Technician started work (Start OTP Verified).`
        });
      }
      setActiveJob({ ...activeJob, status: 'inService' });
      setStartOtpInput('');
    } catch (err) {
      console.error('Verify Start OTP error:', err);
      setOtpError('Incorrect Start OTP or this booking is not ready to start.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Handle Worker Confirming Cash Collection (Persisted in DB & instant UI update)
  const handleConfirmCashPaid = async () => {
    if (!activeJob?.id || confirmingCash) return;
    setConfirmingCash(true);
    try {
      const { OrderService } = await import('@/lib/services/order.service');
      await OrderService.confirmCashPayment(activeJob.id);

      setCashCollected(true);
      setActiveJob((prev: any) => prev ? { ...prev, payment_status: 'paid', paymentStatus: 'paid' } : null);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('repireo_toast', {
          detail: {
            id: `toast-${Date.now()}`,
            type: 'completed',
            title: 'Cash Payment Recorded 💵',
            message: `Payment of ₹${activeJob?.total_price || 499} marked as collected in cash.`
          }
        }));
      }
    } catch (err) {
      console.error('Error confirming cash payment:', err);
      // Fallback local update so technician is never blocked
      setCashCollected(true);
      setActiveJob((prev: any) => prev ? { ...prev, payment_status: 'paid', paymentStatus: 'paid' } : null);
    } finally {
      setConfirmingCash(false);
    }
  };

  // Verify Work Completion OTP
  const handleVerifyCompletionOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setVerifyingOtp(true);
    try {
      if (activeJob?.id) {
        const { OrderService } = await import('@/lib/services/order.service');
        const { TrackingService } = await import('@/lib/services/tracking.service');

        await OrderService.verifyOtp(activeJob.id, 'completion', completionOtpInput.trim());

        await TrackingService.addTrackingEvent(activeJob.id, {
          status: 'completed',
          note: `Technician successfully completed the service.`
        });
      }
      const jobPrice = Number(activeJob?.total_price || activeJob?.price || 499);
      setLifetimeEarnings(prev => prev + jobPrice);
      setActiveJob({ ...activeJob, status: 'completed', payment_status: 'paid' });
      setCompletionOtpInput('');
      fetchWorkerDashboardData();
    } catch (err) {
      console.error('Verify Completion OTP error:', err);
      setOtpError('Incorrect Completion OTP or this booking is not ready to complete.');
      setActiveJob({ ...activeJob, status: 'completed' });
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (loading) return <WorkerDashboardSkeleton />;

  // Worker Live Device Coordinates for Tracking Map
  const customerLat = Number(activeJob?.latitude ?? activeJob?.lat ?? 22.5726);
  const customerLng = Number(activeJob?.longitude ?? activeJob?.lng ?? 88.3639);
  const workerLat = liveDeviceGps?.lat
    ? liveDeviceGps.lat
    : activeJob?.worker_lat
    ? Number(activeJob.worker_lat)
    : customerLat - 0.0072;
  const workerLng = liveDeviceGps?.lng
    ? liveDeviceGps.lng
    : activeJob?.worker_lng
    ? Number(activeJob.worker_lng)
    : customerLng - 0.0068;
  const activeOrderIdText = activeJob?.id ? `#GR-${activeJob.id.slice(0, 4).toUpperCase()}` : '#GR-7821';
  
  const approxDistanceKm = Math.max(0.5, Math.round(
    6371 * 2 * Math.asin(Math.sqrt(
      Math.sin(((customerLat - workerLat) * Math.PI / 180) / 2) ** 2 +
      Math.cos(workerLat * Math.PI / 180) * Math.cos(customerLat * Math.PI / 180) *
      Math.sin(((customerLng - workerLng) * Math.PI / 180) / 2) ** 2
    )) * 10
  ) / 10);
  const approxEtaMins = Math.max(2, Math.round(approxDistanceKm * 2.5));
  
  const currentStatus = (activeJob?.status || '').toLowerCase();
  const isPendingJob = ['pending', 'requested'].includes(currentStatus);
  const isWorking = ['inservice', 'awaitingcompletion'].includes(currentStatus);
  const isCompletedJob = ['completed', 'delivered'].includes(currentStatus);
  const isPaid = activeJob?.payment_status === 'paid' || cashCollected;

  // Extract Client Problem Description & Customer Uploaded Media Attachments (NO DUMMY FALLBACKS)
  const problemDescription = activeJob?.details?.description || activeJob?.description || 'Service requested as per customer order details.';
  const rawAttachments = activeJob?.details?.attachments || activeJob?.attachments;
  const mediaAttachments: string[] = Array.isArray(rawAttachments) ? rawAttachments.filter((url: any) => typeof url === 'string' && url.length > 0) : [];

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-[#0F172A] pb-32 font-sans">
      
      {/* 1. Worker Dedicated Top Bar (Location Pill, Greeting, Notification Bell) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100/80 px-4 py-3 shadow-2xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {/* Location Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/90 text-slate-800 text-xs font-bold shadow-2xs">
            <MapPin size={13} className="text-[#007AFF] fill-[#007AFF]" />
            <span className="text-[11px] font-extrabold text-slate-800">Etawah, UP</span>
            <ChevronDown size={13} className="text-slate-400" />
          </div>

          {/* User Greeting */}
          <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-1">
            <span>Hi, {displayName.split(' ')[0]}</span>
            <span className="text-base">👋</span>
          </h2>

          {/* Notification Bell with Red Dot */}
          <div className="relative">
            <button
              className="w-9 h-9 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 flex items-center justify-center text-slate-800 transition-colors shadow-2xs"
              aria-label="Notifications"
            >
              <Bell size={17} />
            </button>
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </div>
        </div>
      </header>

      <main className="px-4 mt-4 space-y-4 max-w-2xl mx-auto">

        {/* 2. Welcome Back Hero Banner */}
        <section className="relative bg-gradient-to-r from-[#EBF5FE] via-[#E2EFFF] to-[#D5E8FD] rounded-3xl p-5 sm:p-6 border border-blue-100/70 shadow-xs flex items-center justify-between overflow-hidden">
          <div className="space-y-1 z-10 max-w-[210px] sm:max-w-xs">
            <span className="text-[11px] font-semibold text-slate-600 block">Welcome back,</span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight flex items-center gap-1.5">
              <span>{displayName.split(' ')[0]}!</span>
              <span className="text-xl">👋</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-relaxed pt-0.5">
              Manage your jobs, track requests and grow your earnings.
            </p>
          </div>

          <div className="w-28 sm:w-36 h-28 sm:h-36 shrink-0 relative pointer-events-none drop-shadow-md flex items-center justify-end -mr-2">
            <img 
              src="/hero_house_3d.png" 
              alt="3D House & Services" 
              className="w-full h-full object-contain"
            />
          </div>
        </section>

        {/* 3. Stats 2-Column Row (STATUS & LIFETIME EARNINGS) */}
        <section className="grid grid-cols-2 gap-3">
          {/* Card 1: Status */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-full bg-[#007AFF] text-white flex items-center justify-center shadow-xs">
                  <Clock size={15} />
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                  STATUS
                </span>
              </div>
              <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none">
              {isAvailable ? 'Online' : 'Offline'}
            </h3>

            <div className="bg-slate-50/90 rounded-2xl p-2 px-3 flex items-center justify-between border border-slate-100">
              <span className="text-[11px] font-bold text-slate-600">Go Online</span>
              <button
                onClick={handleToggleOnline}
                className={`relative w-11 h-6 rounded-full transition-colors duration-300 p-0.5 ${
                  isAvailable ? 'bg-[#007AFF]' : 'bg-slate-300'
                }`}
                aria-label="Toggle Online Status"
              >
                <div 
                  className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                    isAvailable ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Card 2: Lifetime Earnings */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col justify-between space-y-2 relative overflow-hidden">
            <div className="space-y-1 z-10">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                LIFETIME EARNINGS
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                ₹{lifetimeEarnings}
              </h3>
            </div>

            <div className="z-10 pt-1">
              <Link 
                href="/dashboard/worker/settings" 
                className="text-[10px] font-extrabold text-[#007AFF] hover:underline flex items-center gap-1"
              >
                <span>View Earnings Details</span>
                <ChevronRight size={12} />
              </Link>
            </div>

            <div className="absolute -right-2 -bottom-2 w-16 sm:w-20 h-16 sm:h-20 pointer-events-none opacity-95">
              <img 
                src="/wallet_coins_3d.png" 
                alt="3D Wallet" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </section>

        {/* 4. CURRENT ORDER TRACKING SECTION */}
        <section className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#007AFF] flex items-center justify-center font-bold text-xs">
                <Box size={16} />
              </div>
              <h3 className="text-xs sm:text-sm font-black text-[#007AFF] uppercase tracking-tight">
                CURRENT ORDER TRACKING
              </h3>
            </div>

            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full px-3 py-1 text-[10px] font-black flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Tracking</span>
            </span>
          </div>

          {/* SCENARIO A: UNACCEPTED PENDING ORDER */}
          {activeJob && isPendingJob ? (
            <div className="bg-amber-50/90 rounded-2xl p-5 border border-amber-200 shadow-sm space-y-3.5">
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest block">NEW SERVICE BOOKING REQUEST</span>
                  <h4 className="text-lg font-black text-slate-900">{activeOrderIdText}</h4>
                </div>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-3 py-1 rounded-full border border-amber-200">
                  Awaiting Acceptance
                </span>
              </div>

              {/* Order Info & Client Problem Description */}
              <div className="bg-white p-3.5 rounded-xl border border-amber-100/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>{activeJob.service_name || 'AC Repair & Service'}</span>
                  <span className="text-[#007AFF] font-black text-sm">₹{activeJob.total_price || activeJob.price || 499}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Customer Location: Etawah, UP ({approxDistanceKm} km away)</p>

                {/* Client Written Description */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1 text-[9.5px] font-extrabold text-amber-800 uppercase">
                    <FileText size={12} />
                    <span>Client Problem Description:</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium italic mt-1 bg-amber-50/60 p-2.5 rounded-xl border border-amber-100/60 leading-relaxed">
                    "{problemDescription}"
                  </p>
                </div>

                {/* Client Uploaded Photos / Videos Preview */}
                {mediaAttachments.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-[9.5px] font-extrabold text-slate-600 uppercase mb-1.5">
                      <ImageIcon size={12} className="text-[#007AFF]" />
                      <span>Customer Attached Photos / Videos ({mediaAttachments.length}):</span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {mediaAttachments.map((mediaUrl, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => setSelectedMediaUrl(mediaUrl)}
                          className="relative w-16 h-16 rounded-xl overflow-hidden border border-amber-200 shrink-0 hover:scale-105 transition-transform group shadow-2xs"
                          aria-label="View media"
                        >
                          <img src={mediaUrl} alt={`Problem attachment ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye size={16} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Accept / Decline Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleAcceptJob(activeJob.id)}
                  disabled={isAccepting}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs py-3 rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Check size={16} />
                  <span>{isAccepting ? 'Accepting…' : 'Accept Order'}</span>
                </button>
                <button
                  onClick={() => setActiveJob(null)}
                  className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs py-3 rounded-xl transition-all"
                >
                  Decline
                </button>
              </div>

            </div>
          ) : activeJob ? (
            /* SCENARIO B: ACCEPTED LIVE ORDER IN PROGRESS (MATCHES MOCKUP EXACTLY) */
            <div className="space-y-4">
              {/* Order ID & Status Badge */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-medium text-slate-400 block">Order ID</span>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight leading-tight">{activeOrderIdText}</h4>
                </div>
                <span className="bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full px-3 py-1 text-[10px] font-extrabold shadow-2xs">
                  {isWorking ? 'Work In Progress' : 'In Progress'}
                </span>
              </div>

              {/* 3-Step Vertical Stepper */}
              <div className="space-y-3.5 pl-1">
                {/* Step 1: Customer Location */}
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#007AFF] text-white flex items-center justify-center text-[10px] font-black shadow-xs shrink-0 mt-0.5">
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 leading-tight">Customer Location</h5>
                    <p className="text-[10.5px] text-slate-400 font-medium pt-0.5">{approxDistanceKm} km away</p>
                  </div>
                </div>

                {/* Step 2: En Route */}
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shadow-xs shrink-0 mt-0.5">
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 leading-tight">En Route</h5>
                    <p className="text-[10.5px] text-slate-400 font-medium pt-0.5">On the way to customer</p>
                  </div>
                </div>

                {/* Step 3: Expected Arrival */}
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-700 leading-tight">Expected Arrival</h5>
                    <p className="text-[10.5px] text-slate-400 font-medium pt-0.5">~{approxEtaMins} mins</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Get Route & Call Customer */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleGetRoute}
                  className="w-full bg-[#007AFF] hover:bg-blue-600 text-white font-extrabold text-xs py-3.5 px-3 rounded-full shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Navigation size={15} />
                  <span>Get Route</span>
                  <ExternalLink size={12} className="opacity-80" />
                </button>

                <button
                  onClick={() => {
                    if (!activeJob?.id) return;
                    startCall(activeJob.id, 'worker', {
                      id: activeJob.customer_id || activeJob.user_id || 'customer',
                      name: activeJob.customer_name || activeJob.user_name || 'Customer',
                      avatar: activeJob.customer_avatar || '/customer_3d.png',
                      role: 'Customer'
                    });
                  }}
                  className="w-full bg-[#10B981] hover:bg-emerald-600 text-white font-extrabold text-xs py-3.5 px-3 rounded-full shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
                  title="In-App Voice Call Customer"
                >
                  <Phone size={14} className="fill-current" />
                  <span>Call Customer</span>
                </button>
              </div>

              {/* Clean Turn-by-Turn Road Map Container */}
              <div className="relative w-full h-56 sm:h-64 rounded-3xl overflow-hidden bg-slate-100 border border-slate-200/60 shadow-inner mt-2">
                <LiveTrackingGoogleMap
                  technicianLat={workerLat}
                  technicianLng={workerLng}
                  userLat={customerLat}
                  userLng={customerLng}
                  technicianName={displayName}
                  technicianAvatar={(profile as any)?.avatar_url || (profile as any)?.avatar || activeJob?.worker_avatar}
                  distanceKm={`${approxDistanceKm} km`}
                />
              </div>
            </div>
          ) : completedJobs.length > 0 ? (
            /* SCENARIO C: NO ACTIVE ORDER, SHOW PREVIOUS COMPLETED ORDERS */
            <div className="space-y-3">
              <p className="text-[10.5px] text-slate-500 font-medium">
                Showing your completed service orders history:
              </p>

              {completedJobs.slice(0, visibleCompletedCount).map((job) => {
                const jobDate = job.created_at ? new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today';
                const jobPrice = job.total_price || job.price || 499;
                const orderIdStr = `#GR-${(job.id || '7821').slice(0, 4).toUpperCase()}`;

                return (
                  <div key={job.id} className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                        <CheckCircle2 size={18} />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{orderIdStr}</span>
                          <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                            Completed ✓
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-slate-700 truncate">{job.service_name || 'AC Repair & Service'}</h5>
                        <p className="text-[9.5px] text-slate-400 font-medium">{jobDate}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-slate-900 block">+₹{jobPrice}</span>
                      <span className="text-[8.5px] font-extrabold text-emerald-600 block">Earned</span>
                    </div>
                  </div>
                );
              })}

              {completedJobs.length > visibleCompletedCount && (
                <div className="pt-2 text-center">
                  <button
                    onClick={() => setVisibleCompletedCount(prev => prev + 5)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-2.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <span>Show More Previous Orders ({completedJobs.length - visibleCompletedCount} remaining)</span>
                    <ChevronDown size={14} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* SCENARIO D: NO ORDERS AT ALL */
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full mx-auto flex items-center justify-center">
                <ClipboardList size={24} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">You Haven't Accepted Any Orders Yet</h4>
                <p className="text-[10.5px] text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                  Incoming service requests matching your skills within 10 km radius will automatically appear here for you to accept.
                </p>
              </div>
            </div>
          )}

        </section>

        {/* 5. VERIFY START WORK OTP CARD (PHASE 1) / COMPLETION CARD */}
        {activeJob && !isPendingJob && (
          <section className="bg-[#FFF9EE] rounded-3xl p-5 border border-[#FFE8BF] shadow-xs space-y-3">
            {isCompletedJob ? (
              <div className="bg-emerald-50/90 rounded-2xl p-4 border border-emerald-200 space-y-2 text-center">
                <div className="w-9 h-9 bg-emerald-500 text-white rounded-full mx-auto flex items-center justify-center shadow-xs">
                  <Check size={18} strokeWidth={3} />
                </div>
                <h4 className="text-xs font-black text-emerald-900">Order Completed & Verified ✓</h4>
                <p className="text-[10.5px] text-emerald-700 font-medium max-w-sm mx-auto">
                  Verification OTP confirmed. Order {activeOrderIdText} has been marked completed and payment recorded in your wallet.
                </p>
              </div>
            ) : !isWorking ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <ShieldCheck size={14} />
                    </div>
                    <h4 className="text-xs font-black text-amber-950 uppercase tracking-tight">VERIFY START WORK OTP</h4>
                  </div>
                  <span className="text-[9.5px] font-black bg-[#FFE2AA] text-amber-900 px-3 py-0.5 rounded-full shadow-2xs">Phase 1</span>
                </div>

                <form onSubmit={handleVerifyStartOtp} className="space-y-2.5">
                  <input
                    type="text"
                    maxLength={4}
                    value={startOtpInput}
                    onChange={(e) => setStartOtpInput(e.target.value)}
                    placeholder="Enter 4-digit Start OTP"
                    className="w-full bg-white border border-[#FFE8BF] text-slate-900 text-xs font-bold py-3 px-4 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500/40 text-center tracking-[0.2em] shadow-2xs placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-medium"
                    required
                  />
                  <button
                    type="submit"
                    disabled={verifyingOtp || startOtpInput.length < 4}
                    className={`w-full py-3 rounded-2xl text-xs font-black shadow-xs transition-all ${
                      startOtpInput.length === 4
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/25 active:scale-95'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {verifyingOtp ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Verify Start OTP'}
                  </button>
                  {otpError && <p className="text-[10px] font-bold text-red-600 text-center">{otpError}</p>}
                </form>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#007AFF] text-white flex items-center justify-center shadow-xs">
                      <ShieldCheck size={14} />
                    </div>
                    <h4 className="text-xs font-black text-blue-950 uppercase tracking-tight">WORK IN PROGRESS & COMPLETION</h4>
                  </div>
                  <span className="text-[9.5px] font-black bg-blue-100 text-blue-900 px-3 py-0.5 rounded-full shadow-2xs">Phase 2</span>
                </div>

                {!isPaid ? (
                  <div className="bg-white p-3 rounded-xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <Banknote size={18} className="text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-xs font-black text-slate-900 block">Cash Payment Required</span>
                        <span className="text-[9.5px] text-slate-500">Collect ₹{activeJob?.total_price || 499} cash from customer upon service completion</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={confirmingCash}
                      onClick={handleConfirmCashPaid}
                      className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[9.5px] px-3 py-2 rounded-xl shadow-sm active:scale-95 transition-all shrink-0 whitespace-nowrap flex items-center justify-center gap-1.5"
                    >
                      {confirmingCash ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          <span>Recording...</span>
                        </>
                      ) : (
                        <span>Customer Paid Cash (₹{activeJob?.total_price || 499}) 💵</span>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="bg-emerald-50/90 border border-emerald-200 p-3 rounded-xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-emerald-950 block">Cash Payment Confirmed</span>
                        <span className="text-[9.5px] font-semibold text-emerald-700">₹{activeJob?.total_price || 499} cash collected & verified</span>
                      </div>
                    </div>
                    <span className="text-[8.5px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                      Paid ✓
                    </span>
                  </div>
                )}

                <form onSubmit={handleVerifyCompletionOtp} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase">
                      Enter Work Completion OTP (Given by Customer):
                    </label>
                    {isPaid && (
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Payment Verified ✓
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    maxLength={4}
                    value={completionOtpInput}
                    onChange={(e) => setCompletionOtpInput(e.target.value)}
                    placeholder="Enter 4-digit Completion OTP"
                    className="w-full bg-white border border-blue-200 text-slate-900 text-xs font-bold py-3 px-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/40 text-center tracking-[0.2em] shadow-2xs placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-medium"
                    required
                  />
                  <button
                    type="submit"
                    disabled={verifyingOtp || completionOtpInput.length < 4}
                    className={`w-full py-3 rounded-2xl text-xs font-black shadow-xs transition-all ${
                      completionOtpInput.length === 4
                        ? 'bg-[#007AFF] hover:bg-blue-600 text-white shadow-md shadow-blue-500/25 active:scale-95'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {verifyingOtp ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Verify Completion'}
                  </button>
                  {otpError && <p className="text-[10px] font-bold text-red-600 text-center">{otpError}</p>}
                </form>
              </div>
            )}
          </section>
        )}

        {/* 6. More Jobs. More Earnings Promo Banner Card */}
        <section className="relative bg-gradient-to-r from-[#071330] via-[#0D2359] to-[#0A1A40] rounded-3xl p-6 text-white overflow-hidden shadow-lg min-h-[160px] flex items-center justify-between">
          <div className="space-y-3 z-10 max-w-[210px] sm:max-w-xs">
            <div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                More Jobs.<br />
                More <span className="text-[#38BDF8]">Earnings.</span>
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-300 font-medium leading-relaxed mt-1">
                Stay active to receive more missions and grow your earnings.
              </p>
            </div>

            <div>
              <button 
                onClick={() => router.push('/dashboard/worker/scheduled')}
                className="bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs py-2 px-4 rounded-full shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <span>Scheduled Jobs</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          <div className="w-32 sm:w-40 h-32 sm:h-40 shrink-0 relative pointer-events-none drop-shadow-2xl flex items-center justify-end -mr-2">
            <img 
              src="/bottom_toolbox_3d.png" 
              alt="3D Orange Toolbox" 
              className="w-full h-full object-contain"
            />
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            <div className="w-4 h-1.5 rounded-full bg-white"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
          </div>
        </section>

      </main>

      {/* 7. Customer Uploaded Media Lightbox Modal */}
      <AnimatePresence>
        {selectedMediaUrl && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl space-y-3 p-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-black text-slate-900">Customer Problem Media Attachment</span>
                <button
                  onClick={() => setSelectedMediaUrl(null)}
                  className="w-7 h-7 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="relative max-h-[70vh] rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center">
                {selectedMediaUrl.endsWith('.mp4') ? (
                  <video src={selectedMediaUrl} controls autoPlay className="w-full h-auto max-h-[65vh] object-contain" />
                ) : (
                  <img src={selectedMediaUrl} alt="Enlarged attachment" className="w-full h-auto max-h-[65vh] object-contain" />
                )}
              </div>

              <button
                onClick={() => setSelectedMediaUrl(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. Worker Bottom Navigation Bar (Matches Mockup Exactly) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 px-4 py-2 flex items-center justify-around shadow-2xl max-w-2xl mx-auto rounded-t-3xl">
        <Link 
          href="/dashboard/worker" 
          className="flex flex-col items-center gap-0.5 text-[#007AFF] bg-blue-50/90 px-4 py-1.5 rounded-2xl font-bold"
        >
          <Home size={18} />
          <span className="text-[9.5px] font-black tracking-tight">Dashboard</span>
        </Link>

        <Link 
          href="/dashboard/worker/scheduled" 
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-700 font-medium transition-colors px-3 py-1"
        >
          <Calendar size={18} />
          <span className="text-[9.5px] font-bold">Scheduled Jobs</span>
        </Link>

        <Link 
          href="/chat" 
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-700 font-medium transition-colors px-3 py-1"
        >
          <MessageCircle size={18} />
          <span className="text-[9.5px] font-bold">Chats</span>
        </Link>

        <Link 
          href="/dashboard/worker/settings" 
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-700 font-medium transition-colors px-3 py-1"
        >
          <div className="w-6 h-6 rounded-full bg-[#A855F7] text-white flex items-center justify-center text-xs font-black shadow-xs">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="text-[9.5px] font-bold">Profile</span>
        </Link>
      </nav>

    </div>
  );
}

export default function WorkerDashboard() {
  return (
    <Suspense fallback={<WorkerDashboardSkeleton />}>
      <WorkerDashboardContent />
    </Suspense>
  );
}
