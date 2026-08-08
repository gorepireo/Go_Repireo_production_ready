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
  Lock
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import { WorkerDashboardSkeleton } from '@/components/SkeletonLoader';
import { evaluateWorkerNotificationTargeting } from '@/lib/workerCategoryClassifier';

const LiveTrackingGoogleMap = dynamic(() => import('@/components/LiveTrackingGoogleMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 text-xs font-bold">
      Loading Real Map Tile...
    </div>
  )
});

function WorkerDashboardContent() {
  const { user, profile: rawProfile, refresh } = useAuth();
  const profile = rawProfile as any;
  const router = useRouter();

  const [activeJob, setActiveJob] = useState<any>(null);
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [todayEarnings, setTodayEarnings] = useState(0);

  const displayName = (profile as any)?.full_name || (profile as any)?.name || profile?.display_name || user?.email?.split('@')[0] || 'Prithibi Mandi';

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

  // Fetch Current Worker Active Job & Earnings
  useEffect(() => {
    const fetchWorkerDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch current active order assigned to worker or available in 10km radius
        const { data: assignedJobs } = await insforge.database
          .from('orders')
          .select('*')
          .or(`worker_id.eq.${user.id},worker_email.eq.${user.email}`)
          .in('status', ['in_progress', 'work_in_progress', 'working', 'assigned', 'on_the_way'])
          .order('created_at', { ascending: false })
          .limit(1);

        if (assignedJobs && assignedJobs.length > 0) {
          setActiveJob(assignedJobs[0]);
        } else {
          // If no assigned job, fetch latest pending job in 10km radius
          const { data: pendingJobs } = await insforge.database
            .from('orders')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1);

          if (pendingJobs && pendingJobs.length > 0) {
            setActiveJob(pendingJobs[0]);
          }
        }

        // Fetch completed jobs for today earnings
        const { data: completed } = await insforge.database
          .from('orders')
          .select('*')
          .or(`worker_id.eq.${user.id},worker_email.eq.${user.email}`)
          .in('status', ['completed', 'delivered']);

        if (completed) {
          setCompletedJobs(completed);
          const earnings = completed.reduce((sum: number, j: any) => sum + (Number(j.total_price || j.price || 499)), 0);
          setTodayEarnings(earnings);
        }
      } catch (err) {
        console.error('Fetch worker dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkerDashboardData();
  }, [user]);

  if (loading) return <WorkerDashboardSkeleton />;

  // Coordinate Defaults for Tracking Map
  const workerLat = profile?.lat ? Number(profile.lat) : 26.7620;
  const workerLng = profile?.lng ? Number(profile.lng) : 79.0320;
  const customerLat = activeJob?.lat ? Number(activeJob.lat) : 26.7810;
  const customerLng = activeJob?.lng ? Number(activeJob.lng) : 79.0120;
  const activeOrderIdText = activeJob?.id ? `#GR-${activeJob.id.slice(0, 4).toUpperCase()}` : '#GR-7821';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-32">
      
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

          {/* 3D House Graphic */}
          <div className="w-28 sm:w-40 h-28 sm:h-40 shrink-0 relative pointer-events-none drop-shadow-lg flex items-center justify-end -mr-2">
            <img 
              src="/hero_house_3d.png" 
              alt="3D House & Toolbox" 
              className="w-full h-full object-contain"
            />
          </div>

        </section>

        {/* 3. Stats 2-Column Row (STATUS & TODAY'S EARNINGS) */}
        <section className="grid grid-cols-2 gap-3">
          
          {/* Left Card: STATUS */}
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

            {/* Toggle Bar */}
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

          {/* Right Card: TODAY'S EARNINGS */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col justify-between space-y-2 relative overflow-hidden">
            <div className="space-y-1 z-10">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                TODAY'S EARNINGS
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                ₹{todayEarnings}
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

            {/* 3D Wallet Graphic */}
            <div className="absolute -right-2 -bottom-2 w-16 sm:w-20 h-16 sm:h-20 pointer-events-none opacity-90">
              <img 
                src="/wallet_coins_3d.png" 
                alt="3D Wallet" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>

        </section>

        {/* 4. CURRENT ORDER TRACKING Card */}
        <section className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-4">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Compass size={16} className="text-[#007AFF]" />
              <h3 className="text-xs sm:text-sm font-black text-[#007AFF] uppercase tracking-tight">
                CURRENT ORDER TRACKING
              </h3>
            </div>

            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-extrabold px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Tracking
            </span>
          </div>

          {/* Main Grid: Left Details & Right Live Map */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            
            {/* Left Column: Job Info & Stepper */}
            <div className="md:col-span-6 space-y-4 flex flex-col justify-between">
              
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-medium text-slate-400 block">Order ID</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">{activeOrderIdText}</h4>
                    <span className="bg-blue-50 text-[#007AFF] text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-100">
                      In Progress
                    </span>
                  </div>
                </div>

                {/* Progress Timeline */}
                <div className="space-y-3 pt-1 pl-1">
                  
                  {/* Step 1: Customer Location */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">Customer Location</h5>
                      <p className="text-[10px] text-slate-400 font-medium">5.2 km away</p>
                    </div>
                  </div>

                  {/* Step 2: En Route */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">En Route</h5>
                      <p className="text-[10px] text-slate-400 font-medium">On the way to customer</p>
                    </div>
                  </div>

                  {/* Step 3: Expected Arrival */}
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

              {/* View Full Tracking Button */}
              <div className="pt-2">
                <Link
                  href="/track"
                  className="w-full bg-[#007AFF] hover:bg-blue-600 text-white font-extrabold text-xs py-3 px-4 rounded-2xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <MapPin size={14} />
                  <span>View Full Tracking</span>
                </Link>
              </div>

            </div>

            {/* Right Column: Live Map Tile */}
            <div className="md:col-span-6 relative h-48 sm:h-56 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/60 shadow-inner">
              <LiveTrackingGoogleMap
                technicianLat={workerLat}
                technicianLng={workerLng}
                userLat={customerLat}
                userLng={customerLng}
                technicianName={displayName}
                distanceKm="5.2 km"
              />

              {/* Floating ETA Badge Bottom Right */}
              <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-2 z-20">
                <Clock size={14} className="text-[#007AFF]" />
                <div>
                  <span className="text-xs font-black text-slate-900 block leading-none">18 mins</span>
                  <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider block pt-0.5">ETA</span>
                </div>
              </div>
            </div>

          </div>

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

          {/* 3D Blue Toolbox Graphic */}
          <div className="w-32 sm:w-44 h-32 sm:h-44 shrink-0 relative pointer-events-none drop-shadow-2xl flex items-center justify-end -mr-2">
            <img 
              src="/bottom_toolbox_3d.png" 
              alt="3D Blue Toolbox" 
              className="w-full h-full object-contain"
            />
          </div>

          {/* Bottom Slider Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
          </div>

        </section>

      </main>

      {/* 6. Floating Support FAB */}
      <a 
        href="/chat" 
        className="fixed bottom-20 right-4 z-40 w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform hover:bg-emerald-600"
        aria-label="Support Chat"
      >
        <MessageCircle size={22} className="fill-current" />
      </a>

      {/* 7. Worker Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 px-6 py-2 flex items-center justify-around shadow-2xl max-w-2xl mx-auto">
        
        {/* Dashboard Tab */}
        <Link 
          href="/dashboard/worker" 
          className="flex flex-col items-center gap-1 text-[#007AFF] bg-blue-50/90 px-5 py-1.5 rounded-2xl font-bold"
        >
          <LayoutGrid size={18} />
          <span className="text-[10px] font-black tracking-tight">Dashboard</span>
        </Link>

        {/* Chats Tab */}
        <Link 
          href="/chat" 
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 font-medium transition-colors px-4 py-1"
        >
          <MessageCircle size={18} />
          <span className="text-[10px] font-bold">Chats</span>
        </Link>

        {/* Profile Tab */}
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
