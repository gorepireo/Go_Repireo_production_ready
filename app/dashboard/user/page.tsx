'use client';

import { useState, useEffect, Suspense } from 'react';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/context/AuthContext';
import { 
  ShoppingBag, 
  CheckCircle2, 
  CalendarDays, 
  User as UserIcon, 
  ChevronRight, 
  ArrowRight, 
  Plus, 
  Settings,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';

import { UserDashboardSkeleton } from '@/components/SkeletonLoader';

function UserDashboardContent() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      const { data, error } = await insforge.database
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setOrders(data);
        const total = data.reduce((sum, order) => sum + (Number(order.total_price) || 0), 0);
        setTotalSpent(total);
      }
      if (error) console.error('Fetch error:', error);
      setLoading(false);
    };

    fetchOrders();
  }, [user]);

  const completedOrdersCount = orders.filter(o => o.status === 'delivered' || o.status === 'completed').length;
  const completionPercentage = orders.length > 0 ? Math.round((completedOrdersCount / orders.length) * 100) : 0;
  const clientId = user?.id ? user.id.slice(0, 4).toUpperCase() : 'B8DC';
  const userName = profile?.display_name || user?.email?.split('@')[0] || 'Prithibi Mandi';
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
                className="w-13 h-13 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
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
                <Plus size={13} />
              </button>
            </div>
          </div>

          {/* 3D Wallet Graphic on Right */}
          <div className="absolute right-1 -bottom-2 w-36 sm:w-44 h-36 sm:h-44 pointer-events-none drop-shadow-xl z-10 flex items-end justify-end">
            <img src="/wallet_coins_3d.png" alt="Wallet" className="w-full h-full object-contain" />
          </div>
        </div>
      </section>

      {/* 3. Quick Stats Grid (2x2 Grid) */}
      <section className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          
          {/* Total Orders */}
          <Link href="/track" className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-100 flex items-center justify-between hover:border-blue-200 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-[#007AFF] rounded-2xl flex items-center justify-center shrink-0">
                <ShoppingBag size={20} />
              </div>
              <div>
                <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400">TOTAL ORDERS</span>
                <span className="block text-base sm:text-lg font-black text-slate-900 leading-none">{orders.length}</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-300 group-hover:text-[#007AFF] transition-colors" />
          </Link>

          {/* Completed Orders */}
          <Link href="/track" className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-100 flex items-center justify-between hover:border-emerald-200 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400">COMPLETED ORDERS</span>
                <span className="block text-base sm:text-lg font-black text-emerald-600 leading-none">{completionPercentage}%</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </Link>

          {/* Member Since */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center shrink-0">
                <CalendarDays size={20} />
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

      {/* 4. Service Requests Section */}
      <section className="px-4 mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">SERVICE REQUESTS</h3>
          <Link href="/track" className="text-[10px] font-bold text-[#007AFF] flex items-center gap-0.5 hover:underline">
            View All <ChevronRight size={12} />
          </Link>
        </div>

        {/* Empty State Card matching Reference Image */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          
          {/* 3D Clipboard Graphic */}
          <div className="w-24 sm:w-28 h-24 sm:h-28 shrink-0 flex items-center justify-center drop-shadow-md">
            <img src="/clipboard_3d.png" alt="Service Requests" className="w-full h-full object-contain" />
          </div>

          {/* Text Content & CTA */}
          <div className="space-y-1.5 flex-1">
            <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              No Active Service Requests
            </h4>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium leading-relaxed max-w-[240px]">
              You don't have any active service requests right now.
            </p>

            <div className="pt-2">
              <Link 
                href="/services" 
                className="inline-flex items-center gap-2 bg-[#007AFF] hover:bg-blue-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-full shadow-md shadow-blue-500/20 active:scale-95 transition-all"
              >
                <span>Book a Service</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Floating WhatsApp Button */}
      <Link
        href="/whatsapp"
        className="fixed bottom-20 right-4 z-40 bg-[#25D366] hover:bg-[#20ba5a] text-white w-12 h-12 rounded-full shadow-xl shadow-emerald-500/30 flex items-center justify-center active:scale-90 transition-all border-2 border-white"
        aria-label="WhatsApp Support"
      >
        <MessageCircle size={24} className="fill-white stroke-none" />
      </Link>

    </div>
  );
}

export default function UserDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <UserDashboardContent />
    </Suspense>
  );
}
