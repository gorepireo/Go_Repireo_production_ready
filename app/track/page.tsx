'use client';

import { useState, useEffect } from 'react';
import SkeletonLoader from '@/components/SkeletonLoader';
import { 
  ShieldCheck, 
  Activity,
  Bell,
  ChevronDown,
  RefreshCw,
  ChevronUp
} from 'lucide-react';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/context/AuthContext';

export default function TrackPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data } = await insforge.database
        .from('orders')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false });
      
      if (data) {
        setOrders(data);
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Currently we want to show the "No Active Detection" state as per the mockup.
  // In a real scenario, this would be conditional on orders.length === 0.
  // We'll build the empty state layout perfectly.

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-6">
      
      {/* Hero Section */}
      <section className="px-4 mb-6">
        <div className="relative flex items-center justify-between min-h-[160px] overflow-hidden">
          <div className="relative z-10 max-w-[58%] sm:max-w-[65%] pt-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-[0.95] tracking-tight text-[#0A1629]">
              SIGNAL<br />
              <span className="text-[#007AFF]">TRACK.</span>
            </h1>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-[180px] mt-3">
              Track, analyze and monitor your assets with real-time signal data.
            </p>
          </div>

          {/* Hero Image - Properly Positioned */}
          <div className="absolute right-0 top-0 bottom-0 w-[42%] max-w-[220px] h-full z-0 pointer-events-none flex items-center justify-end">
            <img src="/track_satellite_3d.png" alt="Satellite" className="w-full h-full object-contain object-right drop-shadow-xl" />
          </div>
        </div>
      </section>

      {/* Dropdown */}
      <section className="px-4 mb-4 relative z-20">
        <button className="w-full bg-white rounded-full h-16 flex items-center justify-between px-6 shadow-[0_5px_15px_-5px_rgba(0,0,0,0.03)] border border-slate-100 active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#007AFF]" />
            </div>
            <div className="text-left">
              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Select Asset Group</span>
              <span className="block text-sm font-black text-slate-900 tracking-tight">All Active Signals</span>
            </div>
          </div>
          <ChevronDown className="w-5 h-5 text-[#007AFF]" />
        </button>
      </section>

      {/* Main Empty State Card */}
      <section className="px-4 mb-6">
        <div className="bg-gradient-to-b from-white to-blue-50/50 rounded-3xl p-6 relative overflow-hidden shadow-sm border border-slate-100 min-h-[360px] flex flex-col items-center justify-center text-center">
          
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 z-10">
            <Activity className="w-8 h-8 text-[#007AFF]" />
          </div>

          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight z-10">
            NO ACTIVE DETECTION
          </h2>
          <p className="text-[10px] text-slate-500 max-w-[180px] mt-2 mb-8 z-10">
            No signal activity detected. Your assets are currently stable.
          </p>

          <button className="w-full bg-[#0A1629] text-white h-12 rounded-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider active:scale-95 transition-transform z-10">
            REFRESH SIGNAL <RefreshCw size={14} />
          </button>

          {/* Radar Background Image */}
          <div className="absolute bottom-16 left-0 right-0 h-48 z-0 pointer-events-none opacity-90 flex justify-center items-end">
            <img src="/track_radar_3d.png" alt="Radar" className="w-[120%] max-w-[400px] h-full object-contain object-bottom" />
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="px-4 mb-10">
        <div className="bg-gradient-to-b from-white to-blue-50/30 rounded-3xl p-6 flex justify-between items-start border border-slate-100 shadow-[0_5px_15px_-5px_rgba(0,0,0,0.02)] divide-x divide-slate-100">
          
          <div className="flex flex-col items-center text-center px-2 flex-1">
            <div className="w-8 h-8 bg-[#007AFF] rounded-full flex items-center justify-center text-white mb-3 shadow-md shadow-blue-500/20">
              <ShieldCheck size={16} />
            </div>
            <h4 className="text-[8px] font-black text-slate-900 uppercase tracking-tight mb-1">SECURE & ENCRYPTED</h4>
            <p className="text-[7px] text-slate-500 leading-tight px-1">Your data is safe with us</p>
          </div>

          <div className="flex flex-col items-center text-center px-2 flex-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#007AFF] mb-3">
              <Activity size={24} strokeWidth={2.5} />
            </div>
            <h4 className="text-[8px] font-black text-slate-900 uppercase tracking-tight mb-1">REAL-TIME UPDATES</h4>
            <p className="text-[7px] text-slate-500 leading-tight px-1">Live signal monitoring 24/7</p>
          </div>

          <div className="flex flex-col items-center text-center px-2 flex-1">
            <div className="w-8 h-8 bg-[#007AFF] rounded-full flex items-center justify-center text-white mb-3 shadow-md shadow-blue-500/20">
              <Bell size={16} className="fill-current" />
            </div>
            <h4 className="text-[8px] font-black text-slate-900 uppercase tracking-tight mb-1">SMART ALERTS</h4>
            <p className="text-[7px] text-slate-500 leading-tight px-1">Get notified on signal changes</p>
          </div>

        </div>
      </section>

      {/* Back to Top */}
      <section className="flex flex-col items-center justify-center mb-8">
        <button onClick={scrollToTop} className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md shadow-slate-200/50 text-slate-400 active:scale-90 transition-transform mb-2">
          <ChevronUp size={20} />
        </button>
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">BACK TO TOP</span>
      </section>
    </div>
  );
}
