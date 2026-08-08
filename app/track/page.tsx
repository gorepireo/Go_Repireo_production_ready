'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  Bell, 
  Phone, 
  Star, 
  Headphones, 
  CheckCircle2, 
  Clock, 
  Navigation, 
  Activity, 
  Snowflake,
  ShieldCheck,
  Target
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/context/AuthContext';
import SkeletonLoader from '@/components/SkeletonLoader';

const LiveTrackingGoogleMap = dynamic(() => import('@/components/LiveTrackingGoogleMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 text-xs font-bold">
      Loading Real Google Maps Tile...
    </div>
  )
});

// Haversine Formula for exact geographical distance calculation in KM
function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate Completion Percentage based on Order Status & Remaining Distance
function calculateCompletionPercentage(status: string, remainingDistanceKm: number, initialDistanceKm: number = 5.0): number {
  const normalizedStatus = (status || '').toLowerCase();
  
  if (normalizedStatus === 'completed' || normalizedStatus === 'delivered') return 100;
  if (normalizedStatus === 'working' || normalizedStatus === 'work_in_progress') return 90;
  if (normalizedStatus === 'pending' || normalizedStatus === 'created') return 20;
  if (normalizedStatus === 'assigned' || normalizedStatus === 'confirmed') return 40;
  
  // For 'on_the_way' / 'shipping' / 'in_progress':
  // Progress scales from 50% up to 85% as worker approaches destination!
  const progressRatio = Math.max(0, Math.min(1, 1 - remainingDistanceKm / initialDistanceKm));
  return Math.round(50 + progressRatio * 35);
}

export default function TrackPage() {
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [liveLocation, setLiveLocation] = useState<any>(null);
  const [prevLocation, setPrevLocation] = useState<any>(null);
  const [calculatedSpeed, setCalculatedSpeed] = useState<number>(28); // default city speed in km/h
  const [loading, setLoading] = useState(true);

  // Fetch Latest Order
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

        // Fetch live worker tracking data for this order
        const { data: trackData } = await insforge.database
          .from('order_live_location')
          .select('*')
          .eq('order_id', currentOrder.id)
          .maybeSingle();

        if (trackData) {
          if (liveLocation && (liveLocation.lat !== trackData.lat || liveLocation.lng !== trackData.lng)) {
            // Calculate live speed based on position change over time delta
            const distDeltaKm = calculateHaversineDistanceKm(liveLocation.lat, liveLocation.lng, trackData.lat, trackData.lng);
            const timeDeltaHours = (Date.now() - (liveLocation.timestamp || Date.now() - 5000)) / (1000 * 3600);
            if (timeDeltaHours > 0 && distDeltaKm > 0) {
              const liveKmh = Math.min(60, Math.max(15, Math.round(distDeltaKm / timeDeltaHours)));
              setCalculatedSpeed(liveKmh);
            }
            setPrevLocation(liveLocation);
          }
          setLiveLocation({ ...trackData, timestamp: Date.now() });
        }
      }
    } catch (err) {
      console.error('Fetch tracking order error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, liveLocation]);

  useEffect(() => {
    fetchLatestOrder();
    const interval = setInterval(fetchLatestOrder, 5000);
    return () => clearInterval(interval);
  }, [fetchLatestOrder]);

  if (loading) {
    return <SkeletonLoader />;
  }

  // Destination Coordinates (User address or default Etawah)
  const userLat = order?.lat ? Number(order.lat) : 26.7810;
  const userLng = order?.lng ? Number(order.lng) : 79.0120;

  // Worker Current Coordinates
  const workerLat = liveLocation?.lat ? Number(liveLocation.lat) : userLat - 0.015;
  const workerLng = liveLocation?.lng ? Number(liveLocation.lng) : userLng + 0.018;

  // Dynamic Telemetry Calculations
  const distanceKmNum = calculateHaversineDistanceKm(workerLat, workerLng, userLat, userLng);
  const distanceKmText = distanceKmNum.toFixed(1);

  // Speed (km/h)
  const currentSpeed = liveLocation?.speed ? Math.round(Number(liveLocation.speed)) : calculatedSpeed;

  // ETA (minutes) = (distance / speed) * 60
  const etaMinutesNum = Math.max(1, Math.round((distanceKmNum / Math.max(15, currentSpeed)) * 60));
  const etaText = `${etaMinutesNum} mins`;

  // Completion Rate (%) according to order stage and distance left
  const completionPercentage = calculateCompletionPercentage(order?.status || 'in_progress', distanceKmNum);

  const orderIdText = order?.id ? `#GR-${order.id.slice(0, 4).toUpperCase()}` : '#GR-7821';
  const serviceName = order?.service_name || 'AC Repair & Service';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-28 pt-4">
      
      {/* 1. Header Bar */}
      <header className="px-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link 
            href="/" 
            className="w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 transition-all shrink-0"
          >
            <ArrowLeft size={18} />
          </Link>

          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
              Track Order
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Stay updated with your service in real time</p>
          </div>
        </div>

        <button className="relative p-2 text-slate-700 bg-white border border-slate-100 hover:bg-slate-50 rounded-full shadow-xs transition-colors">
          <Bell size={18} />
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white">
            3
          </span>
        </button>
      </header>

      {/* 2. Top Order Card (Light Blue Gradient matching Mockup) */}
      <section className="px-4 mb-5">
        <div className="relative bg-gradient-to-r from-[#EFF4FF] via-[#E7F1FF] to-[#DBEAFF] rounded-3xl p-5 sm:p-6 border border-blue-100/60 shadow-xs overflow-hidden flex flex-col sm:block justify-between gap-4">
          
          {/* Background AC Repair Image Fade on Right */}
          <div className="absolute right-0 top-0 bottom-0 w-[55%] pointer-events-none flex items-center justify-end overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600" 
              alt="AC Service Background" 
              className="w-full h-full object-cover opacity-20 mix-blend-multiply rounded-r-3xl"
            />
          </div>

          {/* Order Info Left */}
          <div className="relative z-10 space-y-3.5 sm:max-w-[58%] pb-1 sm:pb-0">
            <div>
              <span className="text-[10px] font-medium text-slate-400 block">Order ID</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {orderIdText}
              </h2>
              <span className="bg-[#DCEBFF] text-[#007AFF] text-[10px] font-extrabold px-3 py-1 rounded-full inline-flex items-center gap-1.5 mt-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#007AFF] animate-pulse"></span>
                In Progress
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

          {/* Floating White Expert Card (Responsive Placement to Avoid Text Overlap) */}
          <div className="relative sm:absolute sm:bottom-4 sm:right-4 z-20 bg-white p-3 sm:p-3.5 rounded-3xl border border-slate-100 text-slate-900 shadow-xl flex items-center justify-between gap-3 w-full sm:w-auto sm:min-w-[240px]">
            {/* Circular Expert Avatar */}
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-slate-100 shrink-0 shadow-2xs">
              <img 
                src="/hero_technician_banner.jpg" 
                alt="Rohit Sharma" 
                className="w-full h-full object-cover object-top"
              />
            </div>

            {/* Expert Details */}
            <div className="space-y-0.5 flex-1 min-w-0">
              <span className="text-[9px] font-medium text-slate-400 block">Your Expert</span>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 block leading-tight truncate">Rohit Sharma</h3>
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-700 pt-0.5">
                <Star size={11} className="fill-amber-400 text-amber-400" />
                <span>4.8</span>
                <span className="text-slate-400 font-normal">(230 reviews)</span>
              </div>
            </div>

            {/* Phone Button */}
            <a 
              href="tel:+918679245568" 
              className="w-10 h-10 bg-[#007AFF] hover:bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0"
              aria-label="Call Expert"
            >
              <Phone size={16} className="fill-current" />
            </a>
          </div>

        </div>
      </section>

      {/* 3. Live Tracking Card */}
      <section className="px-4 mb-5">
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-4">
          
          {/* Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">Live Tracking</h3>
            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </span>
          </div>

          {/* Interactive Map Visual using Real Google Map Tiles */}
          <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/60 shadow-inner">
            <LiveTrackingGoogleMap 
              technicianLat={workerLat}
              technicianLng={workerLng}
              userLat={userLat}
              userLng={userLng}
              technicianName="Rohit Sharma"
              distanceKm={distanceKmText}
            />
          </div>

          {/* Dynamic Telemetry Metrics Row */}
          <div className="pt-1">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Expert is on the way</h4>
                <p className="text-[10px] text-slate-400 font-medium">Arriving in <strong className="text-[#007AFF] font-black text-sm">{etaText}</strong></p>
              </div>
            </div>

            {/* 4 Dynamic Calculated Metrics Grid */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center">
              
              {/* 1. Calculated Destination Distance */}
              <div className="space-y-0.5">
                <div className="w-8 h-8 bg-blue-50 text-[#007AFF] rounded-full mx-auto flex items-center justify-center">
                  <Navigation size={15} />
                </div>
                <span className="text-[10px] font-black text-slate-900 block pt-0.5">{distanceKmText} km</span>
                <span className="text-[8px] text-slate-400 font-medium block">Distance</span>
              </div>

              {/* 2. Calculated ETA from Speed & Distance */}
              <div className="space-y-0.5">
                <div className="w-8 h-8 bg-blue-50 text-[#007AFF] rounded-full mx-auto flex items-center justify-center">
                  <Clock size={15} />
                </div>
                <span className="text-[10px] font-black text-slate-900 block pt-0.5">{etaText}</span>
                <span className="text-[8px] text-slate-400 font-medium block">ETA</span>
              </div>

              {/* 3. Live Worker Movement Speed */}
              <div className="space-y-0.5">
                <div className="w-8 h-8 bg-blue-50 text-[#007AFF] rounded-full mx-auto flex items-center justify-center">
                  <Target size={15} />
                </div>
                <span className="text-[10px] font-black text-slate-900 block pt-0.5">{currentSpeed} km/h</span>
                <span className="text-[8px] text-slate-400 font-medium block">Speed</span>
              </div>

              {/* 4. Completion Rate (%) based on Order Status & Progress */}
              <div className="space-y-0.5">
                <div className="w-8 h-8 bg-blue-50 text-[#007AFF] rounded-full mx-auto flex items-center justify-center">
                  <Activity size={15} />
                </div>
                <span className="text-[10px] font-black text-slate-900 block pt-0.5">{completionPercentage}%</span>
                <span className="text-[8px] text-slate-400 font-medium block">Complete</span>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 4. Order Status Timeline Stepper (5 Steps) */}
      <section className="px-4 mb-5">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
          <h3 className="text-xs font-black text-slate-900 tracking-tight mb-2">Order Progress</h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-slate-200">
            
            {/* Step 1: Order Confirmed */}
            <div className="relative flex items-center justify-between">
              <div className="absolute -left-6 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xs border-2 border-white">
                <CheckCircle2 size={12} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Order Confirmed</h4>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Today, 2:30 PM</span>
            </div>

            {/* Step 2: Expert Assigned */}
            <div className="relative flex items-center justify-between">
              <div className="absolute -left-6 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xs border-2 border-white">
                <CheckCircle2 size={12} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Expert Assigned</h4>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Today, 2:32 PM</span>
            </div>

            {/* Step 3: Expert On The Way (Active) */}
            <div className="relative flex items-center justify-between">
              <div className="absolute -left-6 w-5 h-5 bg-[#007AFF] text-white rounded-full flex items-center justify-center text-[9px] shadow-md border-2 border-white ring-4 ring-blue-100">
                ●
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-[#007AFF]">Expert On The Way</h4>
              </div>
              <span className="text-[10px] font-bold text-[#007AFF]">Live</span>
            </div>

            {/* Step 4: Work In Progress */}
            <div className="relative flex items-center justify-between opacity-60">
              <div className="absolute -left-6 w-5 h-5 bg-white border-2 border-slate-300 rounded-full"></div>
              <div>
                <h4 className="text-xs font-medium text-slate-600">Work In Progress</h4>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Upcoming</span>
            </div>

            {/* Step 5: Completed */}
            <div className="relative flex items-center justify-between opacity-60">
              <div className="absolute -left-6 w-5 h-5 bg-white border-2 border-slate-300 rounded-full"></div>
              <div>
                <h4 className="text-xs font-medium text-slate-600">Completed</h4>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Upcoming</span>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Need Help? Card */}
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
