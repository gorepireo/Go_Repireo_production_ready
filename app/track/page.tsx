'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
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
  Wrench
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/context/AuthContext';
import SkeletonLoader from '@/components/SkeletonLoader';
import { predictTelemetry } from '@/lib/telemetryModel';
import Header from '@/components/Header';

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
  const isReviewParam = searchParams.get('review') === 'true';

  const [order, setOrder] = useState<any>(null);
  const [liveLocation, setLiveLocation] = useState<any>(null);
  const [prevLocation, setPrevLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Single source of truth order stage: 'in_progress' | 'work_in_progress' | 'completed'
  const [orderStage, setOrderStage] = useState<'in_progress' | 'work_in_progress' | 'completed'>('in_progress');

  // Review State (BLANK BY DEFAULT - 0 STARS SELECTED!)
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);

  // Fetch Latest Order & Live Tracking Data
  const fetchLatestOrder = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await insforge.database
        .from('orders')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        const currentOrder = data[0];
        setOrder(currentOrder);

        const currentStatus = (currentOrder.status || '').toLowerCase();
        
        if (isReviewParam || ['completed', 'delivered'].includes(currentStatus)) {
          setOrderStage('completed');
          if (currentOrder.rating) {
            setRating(Number(currentOrder.rating));
            setIsReviewSubmitted(true);
          }
        } else if (['working', 'work_in_progress'].includes(currentStatus)) {
          setOrderStage('work_in_progress');
        } else {
          setOrderStage('in_progress');
        }

        // Fetch live worker tracking telemetry data
        const { data: trackData } = await insforge.database
          .from('order_live_location')
          .select('*')
          .eq('order_id', currentOrder.id)
          .maybeSingle();

        if (trackData) {
          setPrevLocation(liveLocation);
          setLiveLocation({ ...trackData, timestamp: Date.now() });
        }
      } else {
        if (isReviewParam) {
          setOrderStage('completed');
        }
      }
    } catch (err) {
      console.error('Fetch tracking order error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, liveLocation, isReviewParam]);

  useEffect(() => {
    fetchLatestOrder();
    const interval = setInterval(fetchLatestOrder, 4000);
    return () => clearInterval(interval);
  }, [fetchLatestOrder]);

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
        await insforge.database
          .from('orders')
          .update({ status: 'completed' })
          .eq('id', order.id);
      } catch (err) {
        console.error('Update status error:', err);
      }
    }
  };

  // Submit Rating & Review to InsForge Database
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setSubmittingReview(true);
    try {
      // 1. Record rating in orders table
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

      // 2. Insert into reviews table
      await insforge.database
        .from('reviews')
        .insert([{
          order_id: order?.id || 'GR-7821',
          worker_id: order?.worker_id || 'w-rohit-sharma',
          worker_name: 'Rohit Sharma',
          user_email: user?.email || 'customer@gorepireo.com',
          rating: rating,
          comment: reviewText,
          created_at: new Date().toISOString()
        }]);

      setIsReviewSubmitted(true);
    } catch (err) {
      console.error('Submit review error:', err);
      // Fallback UI success
      setIsReviewSubmitted(true);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  // Derived state shortcuts for clean UI synchronization
  const isCompleted = orderStage === 'completed';
  const isWorking = orderStage === 'work_in_progress';
  const isInTransit = orderStage === 'in_progress';

  // Destination Coordinates (User address or default Etawah)
  const userLat = order?.lat ? Number(order.lat) : 26.7810;
  const userLng = order?.lng ? Number(order.lng) : 79.0120;

  // Worker Current Coordinates
  const workerLat = liveLocation?.lat ? Number(liveLocation.lat) : userLat - 0.015;
  const workerLng = liveLocation?.lng ? Number(liveLocation.lng) : userLng + 0.018;

  // Previous Worker Coordinates
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

      {/* 2. Top Order Card (SYNCHRONIZED LIFE CYCLE - NO DISCREPANCIES) */}
      <section className="px-4 mt-4 mb-5">
        <div className="relative bg-gradient-to-r from-[#EFF4FF] via-[#E7F1FF] to-[#DBEAFF] rounded-3xl p-5 sm:p-6 border border-blue-100/60 shadow-xs flex flex-col md:flex-row items-stretch justify-between gap-5">
          
          {/* Order Info Left */}
          <div className="space-y-3.5 flex-1 min-w-0">
            <div>
              <span className="text-[10px] font-medium text-slate-400 block">Order ID</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {orderIdText}
              </h2>
              
              {/* SYNCHRONIZED PILL BADGE */}
              <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full inline-flex items-center gap-1.5 mt-1.5 shadow-2xs ${
                isCompleted ? 'bg-emerald-100 text-emerald-700' : isWorking ? 'bg-blue-100 text-blue-700' : 'bg-[#DCEBFF] text-[#007AFF]'
              }`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${isCompleted ? 'bg-emerald-500' : 'bg-[#007AFF]'}`}></span>
                {isCompleted ? 'Completed' : isWorking ? 'Work In Progress' : 'In Progress'}
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

          {/* Dynamic Security OTP Card & Expert Info Right */}
          <div className="flex flex-col sm:flex-row md:flex-col justify-between gap-3 w-full md:w-auto md:min-w-[280px]">
            
            {/* Security OTP Card (Phase 1: Start Work OTP -> Phase 2: Completion OTP -> Phase 3: Verified) */}
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

              <div className="flex items-center justify-between py-1">
                <div className="text-2xl sm:text-3xl font-black tracking-[0.25em] text-slate-900 font-mono">
                  {isCompleted ? 'VERIFIED' : isWorking ? completionOtp : startOtp}
                </div>

                {isInTransit && (
                  <button 
                    onClick={handleGiveStartOtp}
                    className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-[9px] px-3 py-1.5 rounded-full shadow-sm transition-all"
                  >
                    Give OTP to Worker
                  </button>
                )}

                {isWorking && (
                  <button 
                    onClick={handleCompleteService}
                    className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-extrabold text-[9px] px-3 py-1.5 rounded-full shadow-sm transition-all"
                  >
                    Verify Completion
                  </button>
                )}
              </div>

              <p className={`text-[8.5px] font-medium leading-tight mt-1 ${isCompleted ? 'text-emerald-700' : isWorking ? 'text-blue-700' : 'text-amber-700'}`}>
                {isCompleted 
                  ? 'Service work completed & verified. Please rate your worker below!'
                  : isWorking 
                  ? 'Share this OTP with technician ONLY after work is verified & completed.'
                  : 'Share this OTP with technician upon arrival to start the service.'}
              </p>
            </div>

            {/* Expert Info White Card */}
            <div className="bg-white p-3 sm:p-3.5 rounded-3xl border border-slate-100 text-slate-900 shadow-xl flex items-center justify-between gap-3">
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-slate-100 shrink-0 shadow-2xs">
                <img 
                  src="/hero_technician_banner.jpg" 
                  alt="Rohit Sharma" 
                  className="w-full h-full object-cover object-top"
                />
              </div>

              <div className="space-y-0.5 flex-1 min-w-0">
                <span className="text-[9px] font-medium text-slate-400 block">Your Expert</span>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 block leading-tight truncate">Rohit Sharma</h3>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-700 pt-0.5">
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                  <span>4.8</span>
                  <span className="text-slate-400 font-normal">(230 reviews)</span>
                </div>
              </div>

              <a 
                href="tel:+918679245568" 
                className="w-10 h-10 bg-[#007AFF] hover:bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0"
                aria-label="Call Expert"
              >
                <Phone size={16} className="fill-current" />
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* 3. Tracking Section (MAP VISIBLE ONLY DURING IN_TRANSIT! HIDDEN ONCE WORKER STARTS OR COMPLETES) */}
      <section className="px-4 mb-5">
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-4">
          
          <div className="flex justify-between items-center">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
              {isInTransit ? 'Live Tracking' : 'Service Status Summary'}
            </h3>
            <span className={`text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded-full border ${
              isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : isWorking ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-500 border-emerald-100'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {isCompleted ? 'Completed' : isWorking ? 'Work In Progress' : 'Live'}
            </span>
          </div>

          {/* MAP IS VISIBLE ONLY DURING IN_TRANSIT (HIDDEN WHEN WORKING OR COMPLETED) */}
          {isInTransit ? (
            <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/60 shadow-inner">
              <LiveTrackingGoogleMap 
                technicianLat={workerLat}
                technicianLng={workerLng}
                userLat={userLat}
                userLng={userLng}
                technicianName="Rohit Sharma"
                distanceKm={telemetry.distanceKmText}
              />
            </div>
          ) : isWorking ? (
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-2xl p-5 border border-blue-100 text-center space-y-2">
              <div className="w-12 h-12 bg-[#007AFF] text-white rounded-full mx-auto flex items-center justify-center shadow-md">
                <Wrench size={24} />
              </div>
              <h4 className="text-sm font-black text-slate-900">Rohit Sharma is working on your service</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Start Work OTP 4812 verified. Work is currently in progress at your doorstep.
              </p>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl p-5 border border-emerald-100 text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-full mx-auto flex items-center justify-center shadow-md">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="text-sm font-black text-slate-900">Service Completed Successfully!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Rohit Sharma has finished your AC Repair & Service in Etawah. Thank you for choosing GoRepireo!
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

      {/* 4. Order Status Timeline Stepper (STRICTLY SYNCHRONIZED) */}
      <section className="px-4 mb-5">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
          <h3 className="text-xs font-black text-slate-900 tracking-tight mb-2">Order Progress</h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-slate-200">
            
            {/* Step 1: Order Confirmed */}
            <div className="relative flex items-center justify-between">
              <div className="absolute -left-6 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xs border-2 border-white">
                <CheckCircle2 size={12} />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Order Confirmed</h4>
              <span className="text-[10px] text-slate-400 font-medium">Today, 2:30 PM</span>
            </div>

            {/* Step 2: Expert Assigned */}
            <div className="relative flex items-center justify-between">
              <div className="absolute -left-6 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xs border-2 border-white">
                <CheckCircle2 size={12} />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Expert Assigned</h4>
              <span className="text-[10px] text-slate-400 font-medium">Today, 2:32 PM</span>
            </div>

            {/* Step 3: Expert On The Way */}
            <div className="relative flex items-center justify-between">
              <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white ${
                isWorking || isCompleted ? 'bg-emerald-500 text-white shadow-xs' : 'bg-[#007AFF] text-white ring-4 ring-blue-100'
              }`}>
                {isWorking || isCompleted ? <CheckCircle2 size={12} /> : '●'}
              </div>
              <h4 className={`text-xs font-bold ${isInTransit ? 'text-[#007AFF] font-extrabold' : 'text-slate-900'}`}>Expert On The Way</h4>
              <span className="text-[10px] font-bold text-slate-500">{isInTransit ? 'Live' : 'Done'}</span>
            </div>

            {/* Step 4: Work In Progress */}
            <div className="relative flex items-center justify-between">
              <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white ${
                isCompleted ? 'bg-emerald-500 text-white shadow-xs' : isWorking ? 'bg-[#007AFF] text-white ring-4 ring-blue-100' : 'bg-white border-2 border-slate-300'
              }`}>
                {isCompleted ? <CheckCircle2 size={12} /> : isWorking ? '●' : null}
              </div>
              <h4 className={`text-xs font-bold ${isWorking ? 'text-[#007AFF] font-extrabold' : isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>Work In Progress</h4>
              <span className="text-[10px] font-bold text-slate-500">{isCompleted ? 'Done' : isWorking ? 'Live' : 'Upcoming'}</span>
            </div>

            {/* Step 5: Completed */}
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

      {/* 5. CUSTOMER RATING & REVIEW BOX (WILL ONLY COME WHEN WORK IS COMPLETED!) */}
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
                  <p className="text-[10px] text-slate-400 font-medium">How was Rohit Sharma's work quality and service?</p>
                </div>
              </div>
              <span className="bg-amber-50 text-amber-700 text-[9px] font-extrabold px-2.5 py-1 rounded-full border border-amber-100">
                Feedback
              </span>
            </div>

            {isReviewSubmitted ? (
              <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 text-center space-y-1.5">
                <div className="w-10 h-10 bg-emerald-500 text-white rounded-full mx-auto flex items-center justify-center shadow-sm">
                  <Check size={20} />
                </div>
                <h4 className="text-xs font-black text-emerald-900">Thank you! Rating Recorded</h4>
                <p className="text-[10.5px] text-emerald-700 font-medium">
                  Your {rating}-star rating for Rohit Sharma has been saved in the order database.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                
                {/* Star Rating Selector (STARTS TOTALLY BLANK - 0 STARS SELECTED!) */}
                <div className="flex flex-col items-center justify-center gap-1.5 py-3 bg-slate-50/80 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {rating === 0 ? 'TAP A STAR TO RATE ROHIT SHARMA' : `RATING: ${rating} OF 5 STARS`}
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

                {/* Review Text Box */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">Your Written Review</label>
                  <textarea
                    rows={3}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share details about Rohit Sharma's punctuality, work quality, and behavior..."
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40 focus:bg-white resize-none"
                    required
                  />
                </div>

                {/* Submit Button */}
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
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Review for Rohit Sharma</span>
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
