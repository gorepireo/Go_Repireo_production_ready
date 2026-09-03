'use client';

import { useState, useEffect, Suspense } from 'react';
import { db } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { 
  CheckCircle2, 
  CalendarDays, 
  User as UserIcon, 
  ChevronRight, 
  ArrowRight, 
  Settings,
  Clock,
  Wrench,
  Snowflake,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

import { UserDashboardSkeleton } from '@/components/SkeletonLoader';

function UserDashboardContent() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      const targetEmail = (user?.email || profile?.email || (typeof window !== 'undefined' ? localStorage.getItem('repireo_user_email') : '') || '').toLowerCase().trim();
      const targetUserId = user?.id || profile?.id;

      if (user?.email && typeof window !== 'undefined') {
        localStorage.setItem('repireo_user_email', user.email);
      }

      try {
        const { data, error } = await db.database
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (isMounted && data) {
          const userOrders = data.filter((o: any) => {
            if (targetUserId && (o.customer_id === targetUserId || o.user_id === targetUserId)) return true;
            if (targetEmail) {
              const uEmail = (o.user_email || '').toLowerCase().trim();
              const cEmail = (o.customer_email || '').toLowerCase().trim();
              const dEmail = (o.details?.user_email || o.details?.customer_email || o.details?.email || '').toLowerCase().trim();
              if (uEmail === targetEmail || cEmail === targetEmail || dEmail === targetEmail) return true;
            }
            return false;
          });

          const finalOrders = userOrders.length > 0 ? userOrders : data;
          setOrders(finalOrders);
          const total = finalOrders.reduce((sum: number, order: any) => sum + (Number(order.total_price || order.price) || 0), 0);
          setTotalSpent(total);
        }
        if (error) console.error('Fetch error:', error);
      } catch (err) {
        console.error('Fetch orders error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrders();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', fetchOrders);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', fetchOrders);
    };
  }, [user, profile]);

  const completedOrdersCount = orders.filter(o => ['delivered', 'completed'].includes((o.status || '').toLowerCase())).length;
  const completionPercentage = orders.length > 0 ? Math.round((completedOrdersCount / orders.length) * 100) : 0;
  const clientId = user?.id ? user.id.slice(0, 4).toUpperCase() : 'B8DC';
  const getCleanUserName = () => {
    const rawName = (profile as any)?.full_name || (profile as any)?.name || (typeof window !== 'undefined' ? localStorage.getItem('repireo_user_name') : null);
    if (rawName && typeof rawName === 'string' && rawName.trim() && !rawName.includes('@')) {
      return rawName.trim();
    }
    const profileDisp = profile?.display_name;
    if (profileDisp && typeof profileDisp === 'string' && profileDisp.trim() && !profileDisp.includes('@')) {
      return profileDisp.trim();
    }
    if (user?.email || profile?.email) {
      const targetE = (user?.email || profile?.email || '').split('@')[0];
      const alphaOnly = targetE.replace(/[0-9]/g, '');
      if (alphaOnly.length >= 3) {
        return alphaOnly.charAt(0).toUpperCase() + alphaOnly.slice(1);
      }
      return targetE;
    }
    return 'User';
  };

  const userName = getCleanUserName();
  const avatarUrl = profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  if (loading && !user) return <UserDashboardSkeleton />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-28 pt-4">
      
      {/* 1. Header Profile Row */}
      <section className="px-4 mb-5">
        <div className="flex items-center justify-between pt-2">
          
          {/* Avatar & Greeting */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img 
                src={avatarUrl} 
                alt={userName}
                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-400">Welcome back</p>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate leading-snug">
                {userName}
              </h1>
              <p className="text-[10px] text-slate-400 font-medium truncate">Manage your services and account</p>
            </div>
          </div>
          
          {/* Settings Action Button */}
          <Link 
            href="/dashboard/user/settings" 
            className="w-10 h-10 bg-white rounded-2xl shadow-xs border border-slate-100 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all text-slate-700 shrink-0"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* 2. Wallet Balance Card (Royal Blue with Diagonal Ribbon) */}
      <section className="px-4 mb-5">
        <div className="relative bg-gradient-to-r from-[#0B409C] via-[#0052D4] to-[#4364F7] rounded-3xl p-5 sm:p-6 text-white overflow-hidden shadow-xl min-h-[160px] flex flex-col justify-between">
          
          {/* Diagonal Orange "COMING SOON" Ribbon Banner */}
          <div className="absolute -right-8 top-6 rotate-45 bg-gradient-to-r from-[#FF9900] to-[#FF5500] text-white font-black text-[9px] uppercase tracking-widest px-9 py-1 shadow-md z-20 pointer-events-none">
            COMING SOON
          </div>

          <div className="relative z-10 space-y-1">
            <span className="text-[9px] font-black text-blue-200 uppercase tracking-widest block">
              WALLET BALANCE
            </span>
            <span className="text-[10px] text-blue-100 font-medium block">
              Available Balance
            </span>
            
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight pt-0.5">
              ₹{totalSpent.toFixed(2)}
            </h2>

            <div className="pt-2">
              <button 
                disabled 
                className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white border border-white/30 text-[10px] font-extrabold px-4 py-1.5 rounded-full cursor-not-allowed opacity-90"
              >
                <span>Add Money</span>
              </button>
            </div>
          </div>

          {/* 3D Wallet Graphic */}
          <div className="absolute right-2 -bottom-2 w-32 sm:w-40 h-32 sm:h-40 pointer-events-none z-10 opacity-90 flex items-end justify-end">
            <img 
              src="/wallet_coins_3d.png" 
              alt="Wallet Coins" 
              className="w-full h-full object-contain"
            />
          </div>

        </div>
      </section>

      {/* 3. Stats 2x2 Grid */}
      <section className="px-4 mb-5">
        <div className="grid grid-cols-2 gap-3">
          
          {/* Total Orders */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-[#007AFF] rounded-2xl flex items-center justify-center shrink-0">
                <CalendarDays size={20} />
              </div>
              <div>
                <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400">TOTAL ORDERS</span>
                <span className="block text-base sm:text-lg font-black text-slate-900 leading-none">{orders.length}</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-300" />
          </div>

          {/* Completed Rate */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400">COMPLETED</span>
                <span className="block text-base sm:text-lg font-black text-slate-900 leading-none">{completionPercentage}%</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-300" />
          </div>

          {/* Member Status */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400">MEMBER SINCE</span>
                <span className="block text-base sm:text-lg font-black text-slate-900 leading-none">NEW</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-300" />
          </div>

          {/* Client ID */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 text-amber-500 rounded-2xl flex items-center justify-center shrink-0">
                <UserIcon size={20} />
              </div>
              <div>
                <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400">CLIENT ID</span>
                <span className="block text-base sm:text-lg font-black text-slate-900 leading-none uppercase">{clientId}</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-300" />
          </div>

        </div>
      </section>

      {/* 4. Service Requests Section (SHOWS HISTORY IF ORDERS EXIST, OTHERWISE SHOWS EMPTY STATE) */}
      <section className="px-4 mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">SERVICE REQUESTS</h3>
          <Link href="/track" className="text-[10px] font-bold text-[#007AFF] flex items-center gap-0.5 hover:underline">
            Track Latest <ChevronRight size={12} />
          </Link>
        </div>

        {orders.length === 0 ? (
          /* Empty State: No Service Request Has Been Done */
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-24 sm:w-28 h-24 sm:h-28 shrink-0 flex items-center justify-center drop-shadow-md">
              <img src="/clipboard_3d.png" alt="Service Requests" className="w-full h-full object-contain" />
            </div>

            <div className="space-y-1.5 flex-1">
              <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                No Service Request Has Been Done
              </h4>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium leading-relaxed max-w-[240px]">
                You have not requested any repair or maintenance service yet.
              </p>

              <div className="pt-2">
                <Link 
                  href="/services/service" 
                  className="inline-flex items-center gap-2 bg-[#007AFF] hover:bg-blue-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-full shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                >
                  <span>Book a Service</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* List of All Previous & Active Service Orders */
          <div className="space-y-3">
            {orders.map((ord) => {
              const statusLower = (ord.status || 'in_progress').toLowerCase();
              const isComp = ['completed', 'delivered'].includes(statusLower);
              const isWork = ['working', 'work_in_progress'].includes(statusLower);
              const orderIdStr = `#GR-${(ord.id || '7821').slice(0, 4).toUpperCase()}`;

              return (
                <Link 
                  key={ord.id} 
                  href={`/track?order_id=${ord.id}`}
                  className="block bg-white rounded-3xl p-4 border border-slate-100 shadow-xs hover:border-blue-200 transition-all group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isComp ? 'bg-emerald-50 text-emerald-600' : isWork ? 'bg-blue-50 text-[#007AFF]' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {isComp ? <CheckCircle2 size={20} /> : <Snowflake size={20} />}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{orderIdStr}</span>
                          <span className={`text-[8px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                            isComp ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : isWork ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {isComp ? 'Completed' : isWork ? 'Work In Progress' : 'In Progress'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-700 truncate">{ord.service_name || 'AC Repair & Service'}</h4>
                        <p className="text-[9.5px] text-slate-400 font-medium">
                          {ord.created_at ? new Date(ord.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-black text-slate-900">₹{ord.total_price || ord.price || 499}</span>
                      <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}

export default function UserDashboard() {
  return (
    <Suspense fallback={<UserDashboardSkeleton />}>
      <UserDashboardContent />
    </Suspense>
  );
}
