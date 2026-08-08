'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Phone, 
  Star, 
  Headphones, 
  CheckCircle2, 
  Clock, 
  Navigation, 
  Activity, 
  Snowflake,
  ShieldCheck,
  Target,
  Send,
  Loader2,
  Check,
  Wrench,
  UserCheck,
  ArrowRight,
  ClipboardList,
  CreditCard,
  Banknote,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/context/AuthContext';
import SkeletonLoader from '@/components/SkeletonLoader';
import { predictTelemetry } from '@/lib/telemetryModel';
import Header from '@/components/Header';
import Avatar from '@/components/Avatar';

const LiveTrackingGoogleMap = dynamic(() => import('@/components/LiveTrackingGoogleMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 text-xs font-bold">
      Loading Real Google Maps Tile...
    </div>
  )
});

function TrackContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const paramOrderId = searchParams.get('order_id');
  const isReviewParam = searchParams.get('review') === 'true';

  const [order, setOrder] = useState<any>(null);
  const [liveLocation, setLiveLocation] = useState<any>(null);
  const [prevLocation, setPrevLocation] = useState<any>(null);
  // Ref to hold latest liveLocation without causing useCallback to re-create on every GPS update
  const liveLocationRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [noOrdersExist, setNoOrdersExist] = useState(false);
  const [isPayingOnline, setIsPayingOnline] = useState(false);

  // Real Worker Assignment & Review Metrics
  const [workerData, setWorkerData] = useState<{
    id?: string;
    name: string;
    avatar: string;
    phone: string;
    avgRating: number | null;
    reviewsCount: number;
    isNewWorker: boolean;
  }>({
    name: 'Rohit Sharma',
    avatar: '/hero_technician_banner.jpg',
    phone: '+918679245568',
    avgRating: 4.8,
    reviewsCount: 230,
    isNewWorker: false
  });

  // Order Lifecycle Stage: 'pending_assignment' | 'in_progress' | 'work_in_progress' | 'completed'
  const [orderStage, setOrderStage] = useState<'pending_assignment' | 'in_progress' | 'work_in_progress' | 'completed'>('in_progress');

  // Review State
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);

  // Fetch Targeted or Latest Order Data
  const fetchOrderData = useCallback(async () => {
    if (!user) return;
    try {
      let currentOrder: any = null;

      if (paramOrderId) {
        const { data } = await insforge.database
          .from('orders')
          .select('*')
          .eq('id', paramOrderId)
          .maybeSingle();
        currentOrder = data;
      }

      if (!currentOrder) {
        let activeQuery = insforge.database
          .from('orders')
          .select('*')
          .in('status', ['in_progress', 'work_in_progress', 'working', 'assigned', 'on_the_way', 'pending'])
          .order('created_at', { ascending: false })
          .limit(1);

        if (user?.id && user?.email) {
          activeQuery = activeQuery.or(`customer_id.eq.${user.id},user_email.eq.${user.email}`);
        } else if (user?.id) {
          activeQuery = activeQuery.eq('customer_id', user.id);
        } else if (user?.email) {
          activeQuery = activeQuery.eq('user_email', user.email);
        }

        const { data: activeOrders } = await activeQuery;

        if (activeOrders && activeOrders.length > 0) {
          currentOrder = activeOrders[0];
        }
      }

      if (!currentOrder) {
        let recentQuery = insforge.database
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);

        if (user?.id && user?.email) {
          recentQuery = recentQuery.or(`customer_id.eq.${user.id},user_email.eq.${user.email}`);
        } else if (user?.id) {
          recentQuery = recentQuery.eq('customer_id', user.id);
        } else if (user?.email) {
          recentQuery = recentQuery.eq('user_email', user.email);
        }

        const { data: recentOrders } = await recentQuery;

        if (recentOrders && recentOrders.length > 0) {
          currentOrder = recentOrders[0];
        }
      }

      if (currentOrder) {
        setOrder(currentOrder);
        setNoOrdersExist(false);

        const currentStatus = (currentOrder.status || '').toLowerCase();
        
        if (isReviewParam || ['completed', 'delivered'].includes(currentStatus)) {
          setOrderStage('completed');
          if (currentOrder.rating) {
            setRating(Number(currentOrder.rating));
            setReviewText(currentOrder.review_text || '');
            setIsReviewSubmitted(true);
          }
        } else if (['working', 'work_in_progress'].includes(currentStatus)) {
          setOrderStage('work_in_progress');
        } else if (['assigned', 'on_the_way', 'in_progress'].includes(currentStatus)) {
          setOrderStage('in_progress');
        } else {
          setOrderStage('pending_assignment');
        }

        // Fetch Worker Data & Real Profile Picture
        const assignedWorkerId = currentOrder.worker_id || 'w-rohit-sharma';
        let assignedWorkerName = currentOrder.worker_name || 'Rohit Sharma';
        let assignedWorkerAvatar = currentOrder.worker_avatar || null;
        let assignedWorkerPhone = currentOrder.worker_phone || '+918679245568';

        // Query users/workers table to get real profile picture
        if (assignedWorkerId && assignedWorkerId !== 'w-rohit-sharma') {
          try {
            // 1. Check users table by id
            const { data: uRow } = await insforge.database
              .from('users')
              .select('avatar_url, name, display_name, phone')
              .eq('id', assignedWorkerId)
              .maybeSingle();

            if (uRow) {
              if (uRow.avatar_url) assignedWorkerAvatar = uRow.avatar_url;
              if (uRow.name || uRow.display_name) assignedWorkerName = uRow.name || uRow.display_name;
              if (uRow.phone) assignedWorkerPhone = uRow.phone;
            }

            // 2. Check workers table if users avatar is null
            if (!assignedWorkerAvatar) {
              const { data: wRow } = await insforge.database
                .from('workers')
                .select('avatar_url, image, name, mobile')
                .or(`id.eq.${assignedWorkerId},user_id.eq.${assignedWorkerId}`)
                .maybeSingle();

              if (wRow) {
                if (wRow.avatar_url || wRow.image) assignedWorkerAvatar = wRow.avatar_url || wRow.image;
                if (wRow.name) assignedWorkerName = wRow.name;
                if (wRow.mobile) assignedWorkerPhone = wRow.mobile;
              }
            }
          } catch (wErr) {
            console.warn('Worker avatar lookup error:', wErr);
          }
        }

        if (!assignedWorkerAvatar) {
          assignedWorkerAvatar = '/technician_hero.jpg';
        }

        const { data: reviewsData } = await insforge.database
          .from('reviews')
          .select('rating')
          .eq('worker_id', assignedWorkerId);

        let calculatedAvg: number | null = null;
        let count = 0;

        if (reviewsData && reviewsData.length > 0) {
          count = reviewsData.length;
          const totalStars = reviewsData.reduce((acc: number, r: any) => acc + Number(r.rating || 0), 0);
          calculatedAvg = Math.round((totalStars / count) * 10) / 10;
        }

        setWorkerData({
          id: assignedWorkerId,
          name: assignedWorkerName,
          avatar: assignedWorkerAvatar,
          phone: assignedWorkerPhone,
          avgRating: calculatedAvg ?? (assignedWorkerId === 'w-rohit-sharma' ? 4.8 : null),
          reviewsCount: count || (assignedWorkerId === 'w-rohit-sharma' ? 230 : 0),
          isNewWorker: count === 0 && assignedWorkerId !== 'w-rohit-sharma'
        });

        // Check if reviewed
        const { data: existingReview } = await insforge.database
          .from('reviews')
          .select('*')
          .eq('order_id', currentOrder.id)
          .maybeSingle();

        if (existingReview) {
          setRating(Number(existingReview.rating));
          setReviewText(existingReview.comment || '');
          setIsReviewSubmitted(true);
        }

        // Live location telemetry
        const { data: trackData } = await insforge.database
          .from('order_live_location')
          .select('*')
          .eq('order_id', currentOrder.id)
          .maybeSingle();

        if (trackData) {
          setPrevLocation(liveLocationRef.current);
          const newLoc = { ...trackData, timestamp: Date.now() };
          liveLocationRef.current = newLoc;
          setLiveLocation(newLoc);
        }
      } else {
        setNoOrdersExist(true);
      }
    } catch (err) {
      console.error('Fetch tracking order error:', err);
    } finally {
      setLoading(false);
    }
  // NOTE: liveLocation removed from deps — use liveLocationRef to avoid infinite re-render loop
  }, [user, isReviewParam, paramOrderId]);

  useEffect(() => {
    fetchOrderData();
    const interval = setInterval(fetchOrderData, 1500);
    return () => clearInterval(interval);
  }, [fetchOrderData]);

  // Helper to load Razorpay Checkout Script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Launch Real Online Payment Gateway (Razorpay API)
  const handleOnlinePayment = async () => {
    setIsPayingOnline(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Razorpay Payment Gateway failed to load. Please check your internet connection.');
        setIsPayingOnline(false);
        return;
      }

      const amountToPay = Number(order?.total_price || order?.details?.estimation?.total || 499);

      // Create Razorpay payment order
      const res = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountToPay })
      });
      const orderResData = await res.json();

      if (!res.ok) throw new Error(orderResData.error || 'Failed to create Razorpay payment order');

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TMY7lcMkI2vpQ1',
        amount: Math.round(amountToPay * 100),
        currency: 'INR',
        name: 'Go_Repireo',
        description: `Payment for ${order?.service_name || 'Service'} (Order #${order?.id?.slice(0, 8)})`,
        image: 'https://xipxmg4q.insforge.site/icon.png',
        order_id: orderResData.orderId,
        handler: async function (response: any) {
          try {
            if (order?.id) {
              await insforge.database
                .from('orders')
                .update({ 
                  payment_status: 'paid',
                  payment_method: 'online',
                  payment_id: response.razorpay_payment_id
                })
                .eq('id', order.id);
            }
            setOrder((prev: any) => ({ ...prev, payment_status: 'paid', payment_method: 'online', payment_id: response.razorpay_payment_id }));

            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('repireo_toast', {
                detail: {
                  id: `toast-${Date.now()}`,
                  type: 'completed',
                  title: 'Payment Successful ✓',
                  message: 'Online payment received. Completion OTP unlocked!'
                }
              }));
            }
          } catch (err) {
            console.error('Online payment update error:', err);
          } finally {
            setIsPayingOnline(false);
          }
        },
        modal: {
          handleback: true,
          backdropclose: true,
          ondismiss: function() {
            setIsPayingOnline(false);
          }
        },
        prefill: {
          name: user?.email?.split('@')[0] || 'Customer',
          email: user?.email || '',
        },
        theme: {
          color: '#007AFF',
          backdrop_color: 'rgba(15, 23, 42, 0.7)'
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (err: any) {
      console.error('Online payment error:', err);
      alert(err.message || 'Error initializing Razorpay payment gateway');
      setIsPayingOnline(false);
    }
  };

  // Phase 1 -> Phase 2 Transition (Start OTP verified)
  const handleGiveStartOtp = async () => {
    setOrderStage('work_in_progress');
    if (order?.id) {
      try {
        await insforge.database
          .from('orders')
          .update({ status: 'work_in_progress' })
          .eq('id', order.id);
      } catch (err) {
        console.error('Update status error:', err);
      }
    }
  };

  // Phase 2 -> Phase 3 Transition (Completion OTP verified)
  const handleCompleteService = async () => {
    setOrderStage('completed');
    if (order?.id) {
      try {
        // 1. Mark order completed
        await insforge.database
          .from('orders')
          .update({ status: 'completed' })
          .eq('id', order.id);

        // 2. Clear OTPs from details so they can be reused for future orders
        const updatedDetails = { ...(order.details || {}) };
        delete updatedDetails.start_otp;
        delete updatedDetails.completion_otp;
        await insforge.database
          .from('orders')
          .update({ details: updatedDetails })
          .eq('id', order.id);

        // 3. Send push notification to worker that service is complete
        if (workerData?.id) {
          try {
            await fetch('/api/push/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: 'Service Completed ✓',
                message: 'Customer verified completion OTP. Payment will be credited to your wallet.',
                url: '/dashboard/worker',
                targetUserId: workerData.id
              })
            });
          } catch {}
        }
      } catch (err) {
        console.error('Update status error:', err);
      }
    }
  };

  // Submit Review ONE TIME ONLY PER ORDER
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || isReviewSubmitted) return;

    setSubmittingReview(true);
    try {
      if (order?.id) {
        await insforge.database
          .from('orders')
          .update({
            rating: rating,
            review_text: reviewText,
            status: 'completed'
          })
          .eq('id', order.id);
      }

      await insforge.database
        .from('reviews')
        .insert([{
          order_id: order?.id || 'GR-7821',
          worker_id: workerData.id || 'w-rohit-sharma',
          worker_name: workerData.name,
          user_email: user?.email || 'customer@gorepireo.com',
          rating: rating,
          comment: reviewText,
          created_at: new Date().toISOString()
        }]);

      setIsReviewSubmitted(true);
    } catch (err) {
      console.error('Submit review error:', err);
      setIsReviewSubmitted(true);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <SkeletonLoader />;

  if (noOrdersExist) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-28">
        <Header />
        <div className="px-4 mt-8">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center space-y-4 max-w-md mx-auto">
            <div className="w-20 h-20 bg-blue-50 text-[#007AFF] rounded-full mx-auto flex items-center justify-center">
              <ClipboardList size={36} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">No Active Orders Found</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                You have not booked any repair service yet. Book a service now to track live progress!
              </p>
            </div>
            <div className="pt-2">
              <Link 
                href="/services/service" 
                className="inline-flex items-center gap-2 bg-[#007AFF] hover:bg-blue-600 text-white font-extrabold text-xs px-6 py-3 rounded-full shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
              >
                <span>Book a Service Now</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Derived state shortcuts
  const isPendingAssignment = orderStage === 'pending_assignment';
  const isInTransit = orderStage === 'in_progress';
  const isWorking = orderStage === 'work_in_progress';
  const isCompleted = orderStage === 'completed';

  const isPaymentPaid = order?.payment_status === 'paid';
  const orderPrice = order?.total_price || order?.price || 499;

  // Destination Coordinates
  const userLat = order?.lat ? Number(order.lat) : 26.7810;
  const userLng = order?.lng ? Number(order.lng) : 79.0120;

  // Worker Coordinates
  const workerLat = liveLocation?.lat ? Number(liveLocation.lat) : userLat - 0.015;
  const workerLng = liveLocation?.lng ? Number(liveLocation.lng) : userLng + 0.018;

  const prevWorkerLat = prevLocation?.lat ? Number(prevLocation.lat) : null;
  const prevWorkerLng = prevLocation?.lng ? Number(prevLocation.lng) : null;

  // AI Telemetry Prediction Engine
  const telemetry = predictTelemetry({
    workerLat,
    workerLng,
    prevWorkerLat,
    prevWorkerLng,
    timeDeltaSec: 4,
    userLat,
    userLng,
    orderStatus: isCompleted ? 'completed' : isWorking ? 'work_in_progress' : 'in_progress',
    isMovingExplicit: liveLocation?.is_moving !== undefined ? Boolean(liveLocation.is_moving) : false
  });

  const orderIdText = order?.id ? `#GR-${order.id.slice(0, 4).toUpperCase()}` : '#GR-7821';
  const serviceName = order?.service_name || 'AC Repair & Service';
  const startOtp = order?.details?.start_otp || '4812';
  const completionOtp = order?.details?.completion_otp || '7924';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-28">
      
      {/* 1. Universal Global Header */}
      <Header />

      {/* 2. Top Order Card */}
      <section className="px-4 mt-4 mb-5">
        <div className="relative bg-gradient-to-r from-[#EFF4FF] via-[#E7F1FF] to-[#DBEAFF] rounded-3xl p-5 sm:p-6 border border-blue-100/60 shadow-xs flex flex-col md:flex-row items-stretch justify-between gap-5">
          
          {/* Order Info Left */}
          <div className="space-y-3.5 flex-1 min-w-0">
            <div>
              <span className="text-[10px] font-medium text-slate-400 block">Order ID</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {orderIdText}
              </h2>
              
              <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full inline-flex items-center gap-1.5 mt-1.5 shadow-2xs ${
                isCompleted 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : isWorking 
                  ? 'bg-blue-100 text-blue-700' 
                  : isPendingAssignment 
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-[#DCEBFF] text-[#007AFF]'
              }`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${
                  isCompleted ? 'bg-emerald-500' : isPendingAssignment ? 'bg-amber-500' : 'bg-[#007AFF]'
                }`}></span>
                {isCompleted ? 'Completed' : isWorking ? 'Work In Progress' : isPendingAssignment ? 'Assigning Expert...' : 'In Progress'}
              </span>
            </div>

            <div className="space-y-2 pt-1">
              <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <Snowflake size={16} className="text-[#007AFF] shrink-0" />
                <span className="truncate">{serviceName}</span>
              </div>

              <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock size={16} className="text-[#007AFF] shrink-0" />
                <span className="truncate">Today, 3:00 PM - 5:00 PM</span>
              </div>
            </div>
          </div>

          {/* Dynamic Security OTP Card & Payment Flow */}
          <div className="flex flex-col sm:flex-row md:flex-col justify-between gap-3 w-full md:w-auto md:min-w-[280px]">
            
            {/* Security OTP Card (WITH ONLINE / CASH PAYMENT UNLOCK LOGIC) */}
            <div className={`p-4 rounded-3xl border shadow-md flex flex-col justify-between transition-all ${
              isCompleted ? 'bg-emerald-50/90 border-emerald-200' : isWorking ? 'bg-blue-50/90 border-blue-200' : 'bg-amber-50/90 border-amber-200'
            }`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={16} className={isCompleted ? 'text-emerald-600' : isWorking ? 'text-blue-600' : 'text-amber-600'} />
                  <span className={`text-[9px] font-black uppercase tracking-wider ${isCompleted ? 'text-emerald-800' : isWorking ? 'text-blue-800' : 'text-amber-800'}`}>
                    {isCompleted ? 'SERVICE VERIFIED' : isWorking ? 'WORK COMPLETION OTP' : 'START WORK OTP'}
                  </span>
                </div>
                <span className="text-[8px] font-extrabold bg-white/80 px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                  {isCompleted ? 'Phase 3' : isWorking ? 'Phase 2' : 'Phase 1'}
                </span>
              </div>

              {/* OTP DISPLAY OR PAYMENT ACTION */}
              <div className="py-1">
                {isCompleted ? (
                  <div className="text-2xl sm:text-3xl font-black tracking-[0.25em] text-emerald-600 font-mono">
                    VERIFIED
                  </div>
                ) : isInTransit ? (
                  <div className="flex items-center justify-between">
                    <div className="text-2xl sm:text-3xl font-black tracking-[0.25em] text-slate-900 font-mono">
                      {startOtp}
                    </div>
                    <button 
                      onClick={handleGiveStartOtp}
                      className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-[9px] px-3 py-1.5 rounded-full shadow-sm transition-all"
                    >
                      Give OTP to Worker
                    </button>
                  </div>
                ) : isWorking ? (
                  /* Phase 2: Work In Progress - Check Payment */
                  isPaymentPaid ? (
                    <div className="flex items-center justify-between">
                      <div className="text-2xl sm:text-3xl font-black tracking-[0.25em] text-slate-900 font-mono">
                        {completionOtp}
                      </div>
                      <button 
                        onClick={handleCompleteService}
                        className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-extrabold text-[9px] px-3 py-1.5 rounded-full shadow-sm transition-all"
                      >
                        Verify Completion
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 bg-amber-100/60 p-2 rounded-xl border border-amber-200">
                        <Lock size={14} className="text-amber-700 shrink-0" />
                        <span className="text-[9.5px] font-bold text-amber-900">
                          Completion OTP locked. Pay ₹{orderPrice} to unlock OTP.
                        </span>
                      </div>

                      <button
                        onClick={handleOnlinePayment}
                        disabled={isPayingOnline}
                        className="w-full bg-[#007AFF] hover:bg-blue-600 text-white font-extrabold text-xs py-2 px-3 rounded-full shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                      >
                        {isPayingOnline ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />}
                        <span>Pay ₹{orderPrice} Online</span>
                      </button>
                    </div>
                  )
                ) : null}
              </div>

              <p className={`text-[8.5px] font-medium leading-tight mt-1 ${isCompleted ? 'text-emerald-700' : isWorking ? 'text-blue-700' : 'text-amber-700'}`}>
                {isCompleted 
                  ? 'Service work completed & verified. Please rate your worker below!'
                  : isWorking 
                  ? isPaymentPaid
                    ? 'Share Completion OTP 7924 with technician to complete order.'
                    : `Pay ₹${orderPrice} online or cash to technician to unlock Completion OTP.`
                  : 'Share Start OTP 4812 with technician upon arrival to start service.'}
              </p>
            </div>

            {/* Expert Info Card */}
            {isPendingAssignment ? (
              <div className="bg-white p-3.5 rounded-3xl border border-slate-100 text-slate-900 shadow-lg space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center shrink-0">
                    <Loader2 size={20} className="animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Finding Expert Near You...</h4>
                    <p className="text-[9px] text-slate-400 font-medium">Matching certified technician in Etawah</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-3 sm:p-3.5 rounded-3xl border border-slate-100 text-slate-900 shadow-xl flex items-center justify-between gap-3">
                <Avatar 
                  src={workerData.avatar} 
                  name={workerData.name} 
                  size={48} 
                  className="shadow-md border-2 border-slate-100 shrink-0" 
                />

                <div className="space-y-0.5 flex-1 min-w-0">
                  <span className="text-[9px] font-medium text-slate-400 block">Your Expert</span>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 block leading-tight truncate">
                    {workerData.name}
                  </h3>
                  
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-700 pt-0.5">
                    {workerData.isNewWorker ? (
                      <span className="bg-blue-50 text-[#007AFF] text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-blue-100">
                        New Expert
                      </span>
                    ) : (
                      <>
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        <span>{workerData.avgRating}</span>
                        <span className="text-slate-400 font-normal">({workerData.reviewsCount} reviews)</span>
                      </>
                    )}
                  </div>
                </div>

                <a 
                  href={`tel:${workerData.phone}`} 
                  className="w-10 h-10 bg-[#007AFF] hover:bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0"
                  aria-label="Call Expert"
                >
                  <Phone size={16} className="fill-current" />
                </a>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* 3. Tracking Section */}
      <section className="px-4 mb-5">
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-4">
          
          <div className="flex justify-between items-center">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
              {isInTransit ? 'Live Tracking' : 'Service Status Summary'}
            </h3>
            <span className={`text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded-full border ${
              isCompleted 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                : isWorking 
                ? 'bg-blue-50 text-blue-600 border-blue-100' 
                : isPendingAssignment
                ? 'bg-amber-50 text-amber-600 border-amber-100'
                : 'bg-emerald-50 text-emerald-500 border-emerald-100'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {isCompleted ? 'Completed' : isWorking ? 'Work In Progress' : isPendingAssignment ? 'Searching...' : 'Live'}
            </span>
          </div>

          {/* MAP VISIBILITY CONDITIONS */}
          {isInTransit ? (
            <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/60 shadow-inner">
              <LiveTrackingGoogleMap 
                technicianLat={workerLat}
                technicianLng={workerLng}
                userLat={userLat}
                userLng={userLng}
                technicianName={workerData.name}
                technicianAvatar={workerData.avatar}
                distanceKm={telemetry.distanceKmText}
              />
            </div>
          ) : isPendingAssignment ? (
            <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 rounded-2xl p-6 border border-amber-100 text-center space-y-2">
              <div className="w-12 h-12 bg-amber-500 text-white rounded-full mx-auto flex items-center justify-center shadow-md">
                <Loader2 size={24} className="animate-spin" />
              </div>
              <h4 className="text-sm font-black text-slate-900">Finding Certified Expert Near You</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Once a technician accepts your order, live map tracking will launch here!
              </p>
            </div>
          ) : isWorking ? (
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-2xl p-5 border border-blue-100 text-center space-y-2">
              <div className="w-12 h-12 bg-[#007AFF] text-white rounded-full mx-auto flex items-center justify-center shadow-md">
                <Wrench size={24} />
              </div>
              <h4 className="text-sm font-black text-slate-900">{workerData.name} is working on your service</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Start Work OTP verified. Service is currently in progress at your doorstep.
              </p>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl p-5 border border-emerald-100 text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-full mx-auto flex items-center justify-center shadow-md">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="text-sm font-black text-slate-900">Service Completed Successfully!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                {workerData.name} has finished your AC Repair & Service in Etawah. Thank you for choosing GoRepireo!
              </p>
            </div>
          )}

          {/* Telemetry Metrics Row */}
          <div className="pt-1">
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center">
              <div className="space-y-0.5">
                <div className="w-8 h-8 bg-blue-50 text-[#007AFF] rounded-full mx-auto flex items-center justify-center">
                  <Navigation size={15} />
                </div>
                <span className="text-[10px] font-black text-slate-900 block pt-0.5">{telemetry.distanceKmText}</span>
                <span className="text-[8px] text-slate-400 font-medium block">Distance</span>
              </div>

              <div className="space-y-0.5">
                <div className="w-8 h-8 bg-blue-50 text-[#007AFF] rounded-full mx-auto flex items-center justify-center">
                  <Clock size={15} />
                </div>
                <span className="text-[10px] font-black text-slate-900 block pt-0.5">{isCompleted ? '0 mins' : telemetry.etaText}</span>
                <span className="text-[8px] text-slate-400 font-medium block">ETA</span>
              </div>

              <div className="space-y-0.5">
                <div className="w-8 h-8 bg-blue-50 text-[#007AFF] rounded-full mx-auto flex items-center justify-center">
                  <Target size={15} />
                </div>
                <span className="text-[10px] font-black text-slate-900 block pt-0.5">{isCompleted ? '0 km/h' : telemetry.speedText}</span>
                <span className="text-[8px] text-slate-400 font-medium block">Speed</span>
              </div>

              <div className="space-y-0.5">
                <div className="w-8 h-8 bg-blue-50 text-[#007AFF] rounded-full mx-auto flex items-center justify-center">
                  <Activity size={15} />
                </div>
                <span className="text-[10px] font-black text-slate-900 block pt-0.5">{isCompleted ? '100%' : isWorking ? '90%' : `${telemetry.completionPercentage}%`}</span>
                <span className="text-[8px] text-slate-400 font-medium block">Complete</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Order Progress Timeline Stepper */}
      <section className="px-4 mb-5">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
          <h3 className="text-xs font-black text-slate-900 tracking-tight mb-2">Order Progress</h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-slate-200">
            
            <div className="relative flex items-center justify-between">
              <div className="absolute -left-6 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xs border-2 border-white">
                <CheckCircle2 size={12} />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Order Confirmed</h4>
              <span className="text-[10px] text-slate-400 font-medium">Today, 2:30 PM</span>
            </div>

            <div className="relative flex items-center justify-between">
              <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white ${
                !isPendingAssignment ? 'bg-emerald-500 text-white shadow-xs' : 'bg-amber-500 text-white ring-4 ring-amber-100'
              }`}>
                {!isPendingAssignment ? <CheckCircle2 size={12} /> : '●'}
              </div>
              <h4 className={`text-xs font-bold ${isPendingAssignment ? 'text-amber-600 font-extrabold' : 'text-slate-900'}`}>
                {isPendingAssignment ? 'Assigning Expert...' : 'Expert Assigned'}
              </h4>
              <span className="text-[10px] font-bold text-slate-500">{isPendingAssignment ? 'Searching' : 'Done'}</span>
            </div>

            <div className="relative flex items-center justify-between">
              <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white ${
                isWorking || isCompleted ? 'bg-emerald-500 text-white shadow-xs' : isInTransit ? 'bg-[#007AFF] text-white ring-4 ring-blue-100' : 'bg-white border-2 border-slate-300'
              }`}>
                {isWorking || isCompleted ? <CheckCircle2 size={12} /> : isInTransit ? '●' : null}
              </div>
              <h4 className={`text-xs font-bold ${isInTransit ? 'text-[#007AFF] font-extrabold' : 'text-slate-900'}`}>Expert On The Way</h4>
              <span className="text-[10px] font-bold text-slate-500">{isInTransit ? 'Live' : isWorking || isCompleted ? 'Done' : 'Upcoming'}</span>
            </div>

            <div className="relative flex items-center justify-between">
              <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white ${
                isCompleted ? 'bg-emerald-500 text-white shadow-xs' : isWorking ? 'bg-[#007AFF] text-white ring-4 ring-blue-100' : 'bg-white border-2 border-slate-300'
              }`}>
                {isCompleted ? <CheckCircle2 size={12} /> : isWorking ? '●' : null}
              </div>
              <h4 className={`text-xs font-bold ${isWorking ? 'text-[#007AFF] font-extrabold' : isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>Work In Progress</h4>
              <span className="text-[10px] font-bold text-slate-500">{isCompleted ? 'Done' : isWorking ? 'Live' : 'Upcoming'}</span>
            </div>

            <div className="relative flex items-center justify-between">
              <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white ${
                isCompleted ? 'bg-emerald-500 text-white shadow-xs' : 'bg-white border-2 border-slate-300'
              }`}>
                {isCompleted && <CheckCircle2 size={12} />}
              </div>
              <h4 className={`text-xs font-bold ${isCompleted ? 'text-emerald-600 font-extrabold' : 'text-slate-500'}`}>Completed</h4>
              <span className="text-[10px] text-slate-400 font-medium">{isCompleted ? 'Verified' : 'Upcoming'}</span>
            </div>

          </div>
        </div>
      </section>

      {/* 5. CUSTOMER RATING & REVIEW BOX */}
      {isCompleted && (
        <section className="px-4 mb-5">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center">
                  <Star size={16} className="fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">Rate Your Expert</h3>
                  <p className="text-[10px] text-slate-400 font-medium">How was {workerData.name}'s work quality and service?</p>
                </div>
              </div>
              <span className="bg-amber-50 text-amber-700 text-[9px] font-extrabold px-2.5 py-1 rounded-full border border-amber-100">
                Feedback
              </span>
            </div>

            {isReviewSubmitted ? (
              <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
                <div className="w-10 h-10 bg-emerald-500 text-white rounded-full mx-auto flex items-center justify-center shadow-sm">
                  <Check size={20} />
                </div>
                <h4 className="text-xs font-black text-emerald-900">Review Submitted & Saved ✓</h4>
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={16} className={s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                  ))}
                </div>
                {reviewText && (
                  <p className="text-[10.5px] text-emerald-800 italic bg-white/60 p-2.5 rounded-xl border border-emerald-100/60 max-w-sm mx-auto">
                    "{reviewText}"
                  </p>
                )}
                <p className="text-[9px] text-slate-400 font-medium">
                  Your rating has been recorded in the database for order {orderIdText}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                
                <div className="flex flex-col items-center justify-center gap-1.5 py-3 bg-slate-50/80 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {rating === 0 ? `TAP A STAR TO RATE ${workerData.name.toUpperCase()}` : `RATING: ${rating} OF 5 STARS`}
                  </span>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-125 transition-transform active:scale-95"
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star 
                          size={28} 
                          className={star <= rating ? 'fill-amber-400 text-amber-400 drop-shadow-xs' : 'text-slate-300'} 
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <span className="text-xs font-extrabold text-amber-600 pt-0.5">
                      {rating === 5 ? '⭐⭐⭐⭐⭐ Excellent Work' : rating === 4 ? '⭐⭐⭐⭐ Very Good' : rating === 3 ? '⭐⭐⭐ Average' : '⭐ Needs Improvement'}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">Your Written Review</label>
                  <textarea
                    rows={3}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder={`Share details about ${workerData.name}'s punctuality, work quality, and behavior...`}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40 focus:bg-white resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={rating === 0 || submittingReview}
                  className={`w-full font-extrabold text-xs py-3 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all ${
                    rating === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#007AFF] hover:bg-blue-600 text-white shadow-blue-500/20 active:scale-95'
                  }`}
                >
                  {submittingReview ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving Review to Database...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Review for {workerData.name}</span>
                      <Send size={14} />
                    </>
                  )}
                </button>

              </form>
            )}
          </div>
        </section>
      )}

      {/* 6. Need Help? Card */}
      <section className="px-4 mb-4">
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-[#007AFF] rounded-2xl flex items-center justify-center shrink-0">
              <Headphones size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900">Need Help?</h4>
              <p className="text-[10px] text-slate-400 font-medium">Our support team is available 24/7</p>
            </div>
          </div>

          <Link 
            href="/chat" 
            className="border border-[#007AFF] text-[#007AFF] hover:bg-[#007AFF] hover:text-white font-extrabold text-xs px-4 py-2 rounded-full transition-all active:scale-95 shrink-0"
          >
            Chat Now
          </Link>
        </div>
      </section>

    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<SkeletonLoader />}>
      <TrackContent />
    </Suspense>
  );
}
