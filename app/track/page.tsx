'use client';

import { useState, useEffect } from 'react';
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
  ShieldCheck
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

export default function TrackPage() {
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLatestOrder();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchLatestOrder = async () => {
    try {
      const { data } = await insforge.database
        .from('orders')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        setOrder(data[0]);
      }
    } catch (err) {
      console.error('Fetch latest order error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <SkeletonLoader />;
  }

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

      {/* 2. Top Order Card (Light Blue Gradient) */}
      <section className="px-4 mb-5">
        <div className="relative bg-gradient-to-br from-[#EEF5FF] via-[#E2EEFF] to-[#D5E5FF] rounded-3xl p-5 sm:p-6 border border-blue-100/70 shadow-xs overflow-hidden">
          
          {/* Order Data Left */}
          <div className="space-y-3 max-w-[62%] sm:max-w-[65%]">
            <div>
              <span className="text-[9px] font-medium text-slate-500 block">Order ID</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {orderIdText}
              </h2>
              <span className="bg-[#007AFF]/20 text-[#007AFF] text-[9px] font-extrabold px-2.5 py-0.5 rounded-full inline-block mt-1">
                In Progress
              </span>
            </div>

            <div>
              <span className="text-[9px] font-medium text-slate-500 block">Service</span>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                <Snowflake size={14} className="text-[#007AFF]" />
                <span>{serviceName}</span>
              </div>
            </div>

            <div>
              <span className="text-[9px] font-medium text-slate-500 block">Scheduled Time</span>
              <p className="text-xs font-black text-slate-900 mt-0.5">
                Today, 3:00 PM - 5:00 PM
              </p>
            </div>
          </div>

          {/* Technician Image & Floating Card Right */}
          <div className="absolute right-0 bottom-0 top-0 w-[42%] max-w-[190px] sm:max-w-[240px] pointer-events-none flex items-end justify-end">
            <img 
              src="/hero_technician_banner.jpg" 
              alt="Rohit Sharma" 
              className="w-full h-full object-cover object-top rounded-r-3xl"
            />
          </div>

          {/* Floating White Card for Technician Info */}
          <div className="absolute bottom-3 right-3 z-10 bg-white/95 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-white text-slate-900 shadow-md flex items-center justify-between gap-3 min-w-[150px]">
            <div className="space-y-0.5">
              <span className="text-[8px] font-semibold text-slate-400 block">Your Expert</span>
              <h3 className="text-xs font-black text-slate-900 block leading-tight">Rohit Sharma</h3>
              <div className="flex items-center gap-1 text-[9px] font-bold text-slate-700 pt-0.5">
                <Star size={10} className="fill-amber-400 text-amber-400" />
                <span>4.8</span>
                <span className="text-slate-400 font-normal">(230 reviews)</span>
              </div>
            </div>

            <a 
              href="tel:+918679245568" 
              className="w-8 h-8 bg-[#007AFF] hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0"
              aria-label="Call Expert"
            >
              <Phone size={14} className="fill-current" />
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
              technicianLat={order?.lat ? Number(order.lat) - 0.015 : 26.7620}
              technicianLng={order?.lng ? Number(order.lng) + 0.018 : 79.0320}
              userLat={order?.lat ? Number(order.lat) : 26.7810}
              userLng={order?.lng ? Number(order.lng) : 79.0120}
              technicianName="Rohit Sharma"
              distanceKm="2.4"
            />
          </div>

          {/* Telemetry Metrics Row */}
          <div className="pt-1">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Expert is on the way</h4>
                <p className="text-[10px] text-slate-400 font-medium">Arriving in <strong className="text-[#007AFF] font-black text-sm">18 mins</strong></p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center">
              <div className="space-y-0.5">
                <div className="w-7 h-7 bg-blue-50 text-[#007AFF] rounded-full mx-auto flex items-center justify-center text-xs">🛵</div>
                <span className="text-[10px] font-black text-slate-900 block pt-0.5">2.4 km</span>
                <span className="text-[8px] text-slate-400 font-medium block">Distance</span>
              </div>

              <div className="space-y-0.5">
                <div className="w-7 h-7 bg-blue-50 text-[#007AFF] rounded-full mx-auto flex items-center justify-center text-xs">🕒</div>
                <span className="text-[10px] font-black text-slate-900 block pt-0.5">18 mins</span>
                <span className="text-[8px] text-slate-400 font-medium block">ETA</span>
              </div>

              <div className="space-y-0.5">
                <div className="w-7 h-7 bg-blue-50 text-[#007AFF] rounded-full mx-auto flex items-center justify-center text-xs">🎯</div>
                <span className="text-[10px] font-black text-slate-900 block pt-0.5">28 km/h</span>
                <span className="text-[8px] text-slate-400 font-medium block">Speed</span>
              </div>

              <div className="space-y-0.5">
                <div className="w-7 h-7 bg-blue-50 text-[#007AFF] rounded-full mx-auto flex items-center justify-center text-xs">📊</div>
                <span className="text-[10px] font-black text-slate-900 block pt-0.5">85%</span>
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
              <div className="absolute -left-6 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs shadow-xs border-2 border-white">
                ✓
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Order Confirmed</h4>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Today, 2:30 PM</span>
            </div>

            {/* Step 2: Expert Assigned */}
            <div className="relative flex items-center justify-between">
              <div className="absolute -left-6 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs shadow-xs border-2 border-white">
                ✓
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
