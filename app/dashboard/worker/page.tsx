'use client';

import { useState, useEffect, Suspense } from 'react';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/context/AuthContext';
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
  ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import { WorkerDashboardSkeleton } from '@/components/SkeletonLoader';

const LiveTrackingGoogleMap = dynamic(() => import('@/components/LiveTrackingGoogleMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 text-xs font-bold">
      Loading Real Map Tile...
    </div>
  )
});

function WorkerDashboardContent() {
  const { user, profile: rawProfile } = useAuth();
  const profile = rawProfile as any;
  const router = useRouter();

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
  const [cashCollected, setCashCollected] = useState(false);

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

  // Continuous 7-Second Worker Live Location Sync Loop (Runs until work starts)
  useEffect(() => {
    if (!activeJob || activeJob.status !== 'in_progress') return;

    const orderId = activeJob.id;
    let stepCount = 0;

    const syncLiveLocation = () => {
      const currentAvatar = (profile as any)?.avatar_url || (profile as any)?.avatar || user?.user_metadata?.avatar_url || '/technician_hero.jpg';

      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const currentLat = pos.coords.latitude;
            const currentLng = pos.coords.longitude;
            setLiveDeviceGps({ lat: currentLat, lng: currentLng });

            try {
              // Delete previous stored location for this order
              await insforge.database
                .from('order_live_location')
                .delete()
                .eq('order_id', orderId);

              // Store new live location
              await insforge.database
                .from('order_live_location')
                .insert([{
                  order_id: orderId,
                  lat: currentLat,
                  lng: currentLng,
                  worker_name: displayName,
                  worker_avatar: currentAvatar,
                  is_moving: true,
                  updated_at: new Date().toISOString()
                }]);
            } catch (err) {
              console.warn('Worker location sync error:', err);
            }
          },
          async () => {
            // Geolocation fallback (e.g. desktop/testing mode)
            stepCount++;
            const baseLat = activeJob?.worker_lat ? Number(activeJob.worker_lat) : 26.7620;
            const baseLng = activeJob?.worker_lng ? Number(activeJob.worker_lng) : 79.0320;
            const custLat = activeJob?.lat ? Number(activeJob.lat) : 26.7810;
            const custLng = activeJob?.lng ? Number(activeJob.lng) : 79.0120;
            
            // Interpolate position towards customer home
            const progress = Math.min(0.95, stepCount * 0.05);
            const currentLat = baseLat + (custLat - baseLat) * progress;
            const currentLng = baseLng + (custLng - baseLng) * progress;

            try {
              await insforge.database
                .from('order_live_location')
                .delete()
                .eq('order_id', orderId);

              await insforge.database
                .from('order_live_location')
                .insert([{
                  order_id: orderId,
                  lat: currentLat,
                  lng: currentLng,
                  worker_name: displayName,
                  worker_avatar: currentAvatar,
                  is_moving: true,
                  updated_at: new Date().toISOString()
                }]);
            } catch (err) {
              console.warn('Fallback location sync error:', err);
            }
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }
    };

    // Run immediately on active job detection
    syncLiveLocation();

    // Repeat every 7 seconds until work starts
    const intervalId = setInterval(syncLiveLocation, 7000);

    return () => clearInterval(intervalId);
  }, [activeJob?.id, activeJob?.status, displayName, profile, user]);

  // Toggle Online / Offline Status
  const handleToggleOnline = async () => {
    const newStatus = !isAvailable;
    setIsAvailable(newStatus);
    if (user?.id) {
      try {
        await insforge.database
          .from('users')
          .update({ is_available: newStatus })
          .eq('id', user.id);
      } catch (err) {
        console.error('Toggle status error:', err);
      }
    }
  };

  // Fetch Current Worker Active Job, Previous Orders & Lifetime Earnings
  const fetchWorkerDashboardData = async () => {
    const workerId = user?.id || profile?.id;
    const workerEmail = user?.email || profile?.email;

    try {
      // 1. Fetch active order assigned to worker
      let assignedJobs: any[] = [];

      if (workerId) {
        const { data: byId } = await insforge.database
          .from('orders')
          .select('*')
          .eq('worker_id', workerId)
          .in('status', ['in_progress', 'work_in_progress', 'working', 'assigned', 'on_the_way'])
          .order('created_at', { ascending: false })
          .limit(1);
        if (byId && byId.length > 0) {
          assignedJobs = byId;
        }
      }

      if (assignedJobs.length === 0 && workerEmail) {
        const { data: byEmail } = await insforge.database
          .from('orders')
          .select('*')
          .eq('worker_email', workerEmail)
          .in('status', ['in_progress', 'work_in_progress', 'working', 'assigned', 'on_the_way'])
          .order('created_at', { ascending: false })
          .limit(1);
        if (byEmail && byEmail.length > 0) {
          assignedJobs = byEmail;
        }
      }

      // 2. Check localStorage for any locally accepted job as fallback
      if (assignedJobs.length === 0 && typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('accepted_job_') && localStorage.getItem(key) === 'true') {
            const acceptedId = key.replace('accepted_job_', '');
            const { data: localOrder } = await insforge.database
              .from('orders')
              .select('*')
              .eq('id', acceptedId)
              .maybeSingle();

            if (localOrder && ['pending', 'in_progress', 'work_in_progress', 'working', 'assigned', 'on_the_way'].includes(localOrder.status)) {
              assignedJobs = [{
                ...localOrder,
                status: 'in_progress',
                worker_id: workerId || localOrder.worker_id
              }];
              break;
            }
          }
        }
      }

      if (assignedJobs && assignedJobs.length > 0) {
        setActiveJob(assignedJobs[0]);
      } else {
        // ONLY check for unassigned pending orders if worker has no active accepted order
        const { data: pendingJobs } = await insforge.database
          .from('orders')
          .select('*')
          .eq('status', 'pending')
          .or('accepted.is.null,accepted.eq.false')
          .order('created_at', { ascending: false })
          .limit(1);

        if (pendingJobs && pendingJobs.length > 0) {
          const isLocallyAccepted = typeof window !== 'undefined' && localStorage.getItem(`accepted_job_${pendingJobs[0].id}`) === 'true';
          if (isLocallyAccepted) {
            setActiveJob({
              ...pendingJobs[0],
              status: 'in_progress',
              accepted: true,
              worker_id: workerId
            });
          } else {
            setActiveJob(pendingJobs[0]);
          }
        } else {
          setActiveJob(null);
        }
      }

      // 3. Fetch ALL completed jobs for total LIFETIME EARNINGS & previous orders list
      let completedQuery = insforge.database
        .from('orders')
        .select('*')
        .in('status', ['completed', 'delivered'])
        .order('created_at', { ascending: false });

      if (workerId && workerEmail) {
        completedQuery = completedQuery.or(`worker_id.eq.${workerId},worker_email.eq.${workerEmail}`);
      } else if (workerId) {
        completedQuery = completedQuery.eq('worker_id', workerId);
      } else if (workerEmail) {
        completedQuery = completedQuery.eq('worker_email', workerEmail);
      }

      const { data: completed } = await completedQuery;

      if (completed) {
        setCompletedJobs(completed);
        const total = completed.reduce((sum: number, j: any) => sum + (Number(j.total_price || j.price || 499)), 0);
        setLifetimeEarnings(total);
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
    const workerId = user?.id || profile?.id || 'w-rohit-sharma';
    const targetId = jobId || activeJob?.id;

    if (!targetId) {
      console.error('No job ID to accept');
      return;
    }

    const workerAvatar = 
      (profile as any)?.avatar_url || 
      (profile as any)?.avatar || 
      user?.user_metadata?.avatar_url || 
      (typeof window !== 'undefined' ? localStorage.getItem('repireo_cached_avatar') : null) || 
      null;
    const workerPhone = (profile as any)?.phone || '+918679245568';
    const nowIso = new Date().toISOString();

    try {
      // 1. Fetch current order state from DB to check if it's already accepted by someone else
      const { data: existingOrder } = await insforge.database
        .from('orders')
        .select('*')
        .eq('id', targetId)
        .maybeSingle();

      // If order exists and is ALREADY accepted by ANOTHER worker
      if (existingOrder && (existingOrder.accepted === true || existingOrder.status !== 'pending')) {
        const isCurrentWorker = existingOrder.worker_id === workerId || (user?.email && existingOrder.worker_email === user.email);
        
        if (!isCurrentWorker) {
          // Another worker accepted it first!
          const otherWorkerName = existingOrder.worker_name || 'another technician';
          console.warn(`⚠️ Order was already accepted by ${otherWorkerName}`);

          if (typeof window !== 'undefined') {
            localStorage.removeItem(`accepted_job_${targetId}`);
            window.dispatchEvent(new CustomEvent('repireo_toast', {
              detail: {
                id: `toast-${Date.now()}`,
                type: 'info',
                title: 'Order Already Accepted',
                message: `Order was accepted by ${otherWorkerName}. It has been removed from your workspace.`
              }
            }));
          }

          setActiveJob(null);
          fetchWorkerDashboardData();
          return;
        }
      }

      // 2. Perform DB update for THIS worker
      const updateData: any = {
        status: 'in_progress',
        accepted: true,
        accepted_at: nowIso,
        worker_name: displayName,
        worker_avatar: workerAvatar,
        worker_phone: workerPhone,
        worker_email: user?.email || profile?.email || null
      };

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workerId);
      if (isUuid) {
        updateData.worker_id = workerId;
      }

      const { error: updateError } = await insforge.database
        .from('orders')
        .update(updateData)
        .eq('id', targetId);

      if (updateError) {
        console.error('❌ DB order update error:', updateError.message, updateError);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('repireo_toast', {
            detail: {
              id: `toast-${Date.now()}`,
              type: 'info',
              title: 'Acceptance Error',
              message: `Could not update order status: ${updateError.message}`
            }
          }));
        }
        return;
      }

      // 3. Mark in localStorage & update local activeJob state
      if (typeof window !== 'undefined') {
        localStorage.setItem(`accepted_job_${targetId}`, 'true');
      }

      setActiveJob((prev: any) => ({
        ...(prev || {}),
        ...existingOrder,
        id: targetId,
        status: 'in_progress',
        accepted: true,
        accepted_at: nowIso,
        worker_id: workerId,
        worker_name: displayName,
        worker_avatar: workerAvatar,
        worker_phone: workerPhone,
        worker_email: user?.email || profile?.email
      }));

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

      await insforge.database
        .from('order_tracking')
        .insert([{
          order_id: targetId,
          status: 'in_progress',
          note: `Order accepted by expert ${displayName} at ${new Date().toLocaleTimeString()}. En route to customer.`
        }]);

      const wLat = liveDeviceGps?.lat || (profile?.lat ? Number(profile.lat) : 26.7620);
      const wLng = liveDeviceGps?.lng || (profile?.lng ? Number(profile.lng) : 79.0320);

      await insforge.database
        .from('order_live_location')
        .upsert([{
          order_id: targetId,
          lat: wLat,
          lng: wLng,
          worker_name: displayName,
          is_moving: true,
          updated_at: nowIso
        }]);

    } catch (err) {
      console.error('Accept job error:', err);
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
    const cLat = activeJob?.lat ? Number(activeJob.lat) : 26.7810;
    const cLng = activeJob?.lng ? Number(activeJob.lng) : 79.0120;

    if (liveDeviceGps) {
      // Save live worker GPS coordinates to DB
      if (activeJob?.id) {
        try {
          await insforge.database.from('order_live_location').upsert([{
            order_id: activeJob.id,
            lat: liveDeviceGps.lat,
            lng: liveDeviceGps.lng,
            worker_name: displayName,
            updated_at: new Date().toISOString()
          }]);
        } catch (e) {
          console.warn('Upsert location error:', e);
        }
      }

      openNativeGoogleMapsApp(liveDeviceGps.lat, liveDeviceGps.lng, cLat, cLng);
    } else if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const actualLat = pos.coords.latitude;
          const actualLng = pos.coords.longitude;
          setLiveDeviceGps({ lat: actualLat, lng: actualLng });

          if (activeJob?.id) {
            try {
              await insforge.database.from('order_live_location').upsert([{
                order_id: activeJob.id,
                lat: actualLat,
                lng: actualLng,
                worker_name: displayName,
                updated_at: new Date().toISOString()
              }]);
            } catch (e) {
              console.warn('Upsert location error:', e);
            }
          }

          openNativeGoogleMapsApp(actualLat, actualLng, cLat, cLng);
        },
        (err) => {
          console.warn('GPS error fallback:', err);
          const fallbackLat = profile?.lat ? Number(profile.lat) : 26.7620;
          const fallbackLng = profile?.lng ? Number(profile.lng) : 79.0320;
          openNativeGoogleMapsApp(fallbackLat, fallbackLng, cLat, cLng);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      const fallbackLat = profile?.lat ? Number(profile.lat) : 26.7620;
      const fallbackLng = profile?.lng ? Number(profile.lng) : 79.0320;
      openNativeGoogleMapsApp(fallbackLat, fallbackLng, cLat, cLng);
    }
  };

  // Verify Start Work OTP
  const handleVerifyStartOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    const expectedStartOtp = activeJob?.details?.start_otp || '4812';

    if (startOtpInput.trim() !== expectedStartOtp.trim()) {
      setOtpError('Incorrect Start OTP. Ask customer for the 4-digit Start OTP.');
      return;
    }

    setVerifyingOtp(true);
    try {
      if (activeJob?.id) {
        await insforge.database
          .from('orders')
          .update({ 
            status: 'work_in_progress',
            worker_id: user?.id,
            worker_email: user?.email,
            worker_name: displayName
          })
          .eq('id', activeJob.id);
      }
      setActiveJob({ ...activeJob, status: 'work_in_progress' });
      setStartOtpInput('');
    } catch (err) {
      console.error('Verify Start OTP error:', err);
      setActiveJob({ ...activeJob, status: 'work_in_progress' });
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Handle Worker Confirming Cash Collection
  const handleConfirmCashPaid = async () => {
    setCashCollected(true);
    if (activeJob?.id) {
      try {
        await insforge.database
          .from('orders')
          .update({ 
            payment_status: 'paid',
            payment_method: 'cash'
          })
          .eq('id', activeJob.id);
      } catch (err) {
        console.error('Cash payment update error:', err);
      }
    }
  };

  // Verify Work Completion OTP
  const handleVerifyCompletionOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    const expectedCompletionOtp = activeJob?.details?.completion_otp || '7924';

    if (completionOtpInput.trim() !== expectedCompletionOtp.trim()) {
      setOtpError('Incorrect Completion OTP. Ask customer for the 4-digit Completion OTP.');
      return;
    }

    setVerifyingOtp(true);
    try {
      if (activeJob?.id) {
        await insforge.database
          .from('orders')
          .update({ 
            status: 'completed',
            payment_status: 'paid'
          })
          .eq('id', activeJob.id);
      }
      const jobPrice = Number(activeJob?.total_price || activeJob?.price || 499);
      setLifetimeEarnings(prev => prev + jobPrice);
      setActiveJob({ ...activeJob, status: 'completed', payment_status: 'paid' });
      setCompletionOtpInput('');
      fetchWorkerDashboardData();
    } catch (err) {
      console.error('Verify Completion OTP error:', err);
      setActiveJob({ ...activeJob, status: 'completed' });
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (loading) return <WorkerDashboardSkeleton />;

  // Worker Live Device Coordinates for Tracking Map
  const workerLat = liveDeviceGps?.lat ? liveDeviceGps.lat : (profile?.lat ? Number(profile.lat) : 26.7620);
  const workerLng = liveDeviceGps?.lng ? liveDeviceGps.lng : (profile?.lng ? Number(profile.lng) : 79.0320);
  const customerLat = activeJob?.lat ? Number(activeJob.lat) : 26.7810;
  const customerLng = activeJob?.lng ? Number(activeJob.lng) : 79.0120;
  const activeOrderIdText = activeJob?.id ? `#GR-${activeJob.id.slice(0, 4).toUpperCase()}` : '#GR-7821';
  
  const currentStatus = (activeJob?.status || '').toLowerCase();
  const isPendingJob = currentStatus === 'pending';
  const isWorking = ['working', 'work_in_progress'].includes(currentStatus);
  const isCompletedJob = ['completed', 'delivered'].includes(currentStatus);
  const isPaid = activeJob?.payment_status === 'paid' || cashCollected;

  // Extract Client Problem Description & Customer Uploaded Media Attachments (NO DUMMY FALLBACKS)
  const problemDescription = activeJob?.details?.description || activeJob?.description || 'Service requested as per customer order details.';
  const rawAttachments = activeJob?.details?.attachments || activeJob?.attachments;
  const mediaAttachments: string[] = Array.isArray(rawAttachments) ? rawAttachments.filter((url: any) => typeof url === 'string' && url.length > 0) : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-32 font-sans">
      
      {/* 1. Global Header Bar */}
      <Header />

      <main className="px-4 mt-4 space-y-4 max-w-2xl mx-auto">

        {/* 2. Welcome Back Hero Banner */}
        <section className="relative bg-gradient-to-r from-[#EBF3FE] via-[#E6F0FA] to-[#DCEBFF] rounded-3xl p-5 sm:p-6 border border-blue-100/80 shadow-xs flex items-center justify-between overflow-hidden">
          <div className="space-y-1 z-10 max-w-[210px] sm:max-w-xs">
            <span className="text-[11px] font-medium text-slate-500 block">Welcome back,</span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight flex items-center gap-1.5">
              <span>{displayName}!</span>
              <span className="text-xl">👋</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-relaxed pt-0.5">
              Manage your jobs, track requests and grow your earnings.
            </p>
          </div>

          <div className="w-28 sm:w-40 h-28 sm:h-40 shrink-0 relative pointer-events-none drop-shadow-lg flex items-center justify-end -mr-2">
            <img 
              src="/hero_house_3d.png" 
              alt="3D House & Toolbox" 
              className="w-full h-full object-contain"
            />
          </div>
        </section>

        {/* 3. Stats 2-Column Row (STATUS & LIFETIME EARNINGS) */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                STATUS
              </span>
              <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none">
              {isAvailable ? 'Online' : 'Offline'}
            </h3>

            <div className="bg-slate-50 rounded-2xl p-2 flex items-center justify-between border border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-600 pl-1">Go Online</span>
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

          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col justify-between space-y-2 relative overflow-hidden">
            <div className="space-y-1 z-10">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
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

            <div className="absolute -right-2 -bottom-2 w-16 sm:w-20 h-16 sm:h-20 pointer-events-none opacity-90">
              <img 
                src="/wallet_coins_3d.png" 
                alt="3D Wallet" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </section>

        {/* 4. CURRENT ORDER TRACKING SECTION */}
        <section className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Compass size={16} className="text-[#007AFF]" />
              <h3 className="text-xs sm:text-sm font-black text-[#007AFF] uppercase tracking-tight">
                {activeJob ? 'CURRENT ORDER TRACKING' : completedJobs.length > 0 ? 'PREVIOUS COMPLETED ORDERS' : 'SERVICE ORDERS'}
              </h3>
            </div>

            <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
              activeJob ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${activeJob ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              {activeJob ? (isPendingJob ? 'Awaiting Acceptance' : 'Live Tracking') : `${completedJobs.length} Orders Completed`}
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
                <p className="text-[10px] text-slate-500 font-medium">Customer Location: Etawah, UP (5.2 km away)</p>

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
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs py-3 rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check size={16} />
                  <span>Accept Order</span>
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
            /* SCENARIO B: ACCEPTED LIVE ORDER IN PROGRESS */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                <div className="md:col-span-6 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 block">Order ID</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <h4 className="text-lg font-black text-slate-900 tracking-tight">{activeOrderIdText}</h4>
                        <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          isWorking ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {isWorking ? 'Work In Progress' : 'In Progress'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-1 pl-1">
                      <div className="flex items-start gap-2.5">
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">Customer Location</h5>
                          <p className="text-[10px] text-slate-400 font-medium">5.2 km away</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">En Route</h5>
                          <p className="text-[10px] text-slate-400 font-medium">On the way to customer</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-4 h-4 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-700">Expected Arrival</h5>
                          <p className="text-[10px] text-slate-400 font-medium">18 mins</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleGetRoute}
                      className="w-full bg-[#007AFF] hover:bg-blue-600 text-white font-extrabold text-xs py-3 px-4 rounded-2xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <Navigation size={15} />
                      <span>Get Route</span>
                      <ExternalLink size={13} className="opacity-80" />
                    </button>
                  </div>
                </div>

                <div className="md:col-span-6 relative h-48 sm:h-56 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/60 shadow-inner">
                  <LiveTrackingGoogleMap
                    technicianLat={workerLat}
                    technicianLng={workerLng}
                    userLat={customerLat}
                    userLng={customerLng}
                    technicianName={displayName}
                    technicianAvatar={(profile as any)?.avatar_url || (profile as any)?.avatar || activeJob?.worker_avatar}
                    distanceKm="5.2 km"
                  />

                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-2 z-20">
                    <Clock size={14} className="text-[#007AFF]" />
                    <div>
                      <span className="text-xs font-black text-slate-900 block leading-none">18 mins</span>
                      <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider block pt-0.5">ETA</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* INLINE OTP VERIFICATION CARD */}
              <div className="pt-3 border-t border-slate-100">
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
                  <form onSubmit={handleVerifyStartOtp} className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-amber-600" />
                        <h4 className="text-xs font-black text-amber-900 uppercase tracking-tight">VERIFY START WORK OTP</h4>
                      </div>
                      <span className="text-[8.5px] font-extrabold bg-amber-200/60 text-amber-800 px-2.5 py-0.5 rounded-full">Phase 1</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        maxLength={4}
                        value={startOtpInput}
                        onChange={(e) => setStartOtpInput(e.target.value)}
                        placeholder="Enter 4-digit Start OTP"
                        className="flex-1 bg-white border border-amber-200 text-slate-900 text-xs font-bold px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/40 text-center tracking-[0.2em]"
                        required
                      />
                      <button
                        type="submit"
                        disabled={verifyingOtp || startOtpInput.length < 4}
                        className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition-all whitespace-nowrap ${
                          startOtpInput.length === 4 ? 'bg-amber-500 hover:bg-amber-600 text-white active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {verifyingOtp ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Verify Start OTP'}
                      </button>
                    </div>

                    {otpError && <p className="text-[10px] font-bold text-red-600">{otpError}</p>}
                  </form>
                ) : (
                  <div className="bg-blue-50/80 rounded-2xl p-4 border border-blue-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-[#007AFF]" />
                        <h4 className="text-xs font-black text-blue-900 uppercase tracking-tight">WORK IN PROGRESS & COMPLETION</h4>
                      </div>
                      <span className="text-[8.5px] font-extrabold bg-blue-200/60 text-blue-800 px-2.5 py-0.5 rounded-full">Phase 2</span>
                    </div>

                    {!isPaid && (
                      <div className="bg-white p-3 rounded-xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <Banknote size={18} className="text-emerald-600 shrink-0" />
                          <div>
                            <span className="text-xs font-black text-slate-900 block">Cash Payment Required</span>
                            <span className="text-[9.5px] text-slate-500">Collect ₹499 cash from customer upon service completion</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleConfirmCashPaid}
                          className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[9.5px] px-3 py-2 rounded-xl shadow-sm active:scale-95 transition-all shrink-0 whitespace-nowrap"
                        >
                          Customer Paid Cash (₹499) 💵
                        </button>
                      </div>
                    )}

                    <form onSubmit={handleVerifyCompletionOtp} className="space-y-2">
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

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          value={completionOtpInput}
                          onChange={(e) => setCompletionOtpInput(e.target.value)}
                          placeholder="Enter 4-digit Completion OTP"
                          className="flex-1 bg-white border border-blue-200 text-slate-900 text-xs font-bold px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40 text-center tracking-[0.2em]"
                          required
                        />
                        <button
                          type="submit"
                          disabled={verifyingOtp || completionOtpInput.length < 4}
                          className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition-all whitespace-nowrap ${
                            completionOtpInput.length === 4 ? 'bg-[#007AFF] hover:bg-blue-600 text-white active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {verifyingOtp ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Verify Completion'}
                        </button>
                      </div>

                      {otpError && <p className="text-[10px] font-bold text-red-600">{otpError}</p>}
                    </form>
                  </div>
                )}
              </div>
            </div>
          ) : completedJobs.length > 0 ? (
            /* SCENARIO B: NO ACTIVE ORDER, BUT PREVIOUS COMPLETED ORDERS EXIST */
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
            /* SCENARIO C: NO ORDERS AT ALL */
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

        {/* 5. More Jobs. More Earnings Banner Card */}
        <section className="relative bg-gradient-to-r from-[#0B1736] via-[#102A6B] to-[#0F172A] rounded-3xl p-6 text-white overflow-hidden shadow-xl min-h-[170px] flex items-center justify-between">
          <div className="space-y-3 z-10 max-w-[210px] sm:max-w-xs">
            <div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                More <span className="text-[#38BDF8]">Jobs.</span><br />
                More <span className="text-[#38BDF8]">Earnings.</span>
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-300 font-medium leading-relaxed mt-1">
                Stay active to receive more missions and grow your earnings.
              </p>
            </div>

            <div>
              <button 
                onClick={() => router.push('/services')}
                className="bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs py-2.5 px-5 rounded-full shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <span>Explore Jobs</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="w-32 sm:w-44 h-32 sm:h-44 shrink-0 relative pointer-events-none drop-shadow-2xl flex items-center justify-end -mr-2">
            <img 
              src="/bottom_toolbox_3d.png" 
              alt="3D Blue Toolbox" 
              className="w-full h-full object-contain"
            />
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
          </div>
        </section>

      </main>

      {/* 6. Customer Uploaded Media Lightbox Modal */}
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

      {/* 7. Worker Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 px-6 py-2 flex items-center justify-around shadow-2xl max-w-2xl mx-auto">
        <Link 
          href="/dashboard/worker" 
          className="flex flex-col items-center gap-1 text-[#007AFF] bg-blue-50/90 px-5 py-1.5 rounded-2xl font-bold"
        >
          <LayoutGrid size={18} />
          <span className="text-[10px] font-black tracking-tight">Dashboard</span>
        </Link>

        <Link 
          href="/chat" 
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 font-medium transition-colors px-4 py-1"
        >
          <MessageCircle size={18} />
          <span className="text-[10px] font-bold">Chats</span>
        </Link>

        <Link 
          href="/dashboard/worker/settings" 
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 font-medium transition-colors px-4 py-1"
        >
          <User size={18} />
          <span className="text-[10px] font-bold">Profile</span>
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
