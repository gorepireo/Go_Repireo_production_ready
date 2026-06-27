'use client';

import { useState, useEffect, Suspense } from 'react';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/context/AuthContext';
import { ShoppingBag, CheckCircle2, CalendarDays, User as UserIcon, Activity, ChevronRight, ArrowRight, Plus, ChevronUp, Settings } from 'lucide-react';
import Link from 'next/link';
import Avatar from '@/components/Avatar';

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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const completedOrdersCount = orders.filter(o => o.status === 'delivered').length;
  const completionPercentage = orders.length > 0 ? Math.round((completedOrdersCount / orders.length) * 100) : 0;

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-24 pt-6">
      
      {/* Hero Section */}
      <section className="px-4 mb-6 relative">
        <div className="flex items-start justify-between pt-4">
          <div className="flex items-center gap-4">
            <Avatar src={profile?.avatar_url} name={profile?.display_name || profile?.email || 'User'} size={56} className="shadow-lg border-2 border-white" />
            <div>
              <h1 className="text-3xl md:text-5xl font-black leading-[0.95] tracking-tight text-[#0A1629] uppercase">
                {profile?.display_name || 'CLIENT'}<br />
                <span className="text-[#007AFF]">PORTAL.</span>
              </h1>
              <p className="text-xs text-slate-500 mt-2">Manage your services and account.</p>
            </div>
          </div>
          
          <Link href="/dashboard/user/settings" className="w-12 h-12 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all text-slate-400 hover:text-slate-900">
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Wallet Balance Card */}
      <section className="px-4 mb-6">
         <div className="relative bg-[#007AFF] rounded-3xl p-6 overflow-hidden min-h-[180px] shadow-lg shadow-blue-500/30 flex flex-col justify-between">
            {/* Coming Soon Overlay Tape */}
            <div className="absolute inset-0 z-20 bg-white/40 backdrop-blur-[2px] flex items-center justify-center overflow-hidden rounded-3xl pointer-events-auto">
               <div className="bg-[#FF9500] text-white px-16 py-2.5 -rotate-12 shadow-2xl border-y-[4px] border-dashed border-[#CC7700] transform scale-110 w-[150%] text-center flex items-center justify-center">
                 <span className="text-xl sm:text-2xl font-black uppercase tracking-widest drop-shadow-md whitespace-nowrap opacity-95">Coming Soon</span>
               </div>
            </div>

            {/* Background Wave Effect (CSS) */}
            <div className="absolute bottom-0 right-0 left-0 h-32 opacity-20 pointer-events-none overflow-hidden">
               <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="h-full w-full">
                 <path d="M-6.49,60.69 C157.16,-52.79 341.68,141.60 500.00,49.98 L500.00,150.00 L0.00,150.00 Z" stroke="none" fill="#ffffff"></path>
               </svg>
            </div>

            <div className="relative z-10 opacity-60">
               <div className="flex items-center gap-2 mb-2">
                 <span className="text-[9px] font-bold text-white/90 uppercase tracking-widest">WALLET BALANCE</span>
                 <span className="bg-blue-600/50 text-white text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full backdrop-blur-sm">AVAILABLE</span>
               </div>
               <h2 className="text-5xl font-black text-white tracking-tighter mb-4">₹{totalSpent.toFixed(2)}</h2>
               
               <button disabled className="bg-blue-600 text-white px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 w-max cursor-not-allowed">
                  ADD MONEY <Plus size={12} />
               </button>
            </div>

            <div className="absolute -right-4 -bottom-4 w-44 h-44 z-0 pointer-events-none drop-shadow-2xl flex items-center justify-center opacity-60">
               <img src="/wallet_shield_3d.png" alt="Secure Wallet" className="w-full h-full object-contain" />
            </div>
         </div>
      </section>

      {/* Stats Grid (2x2) */}
      <section className="px-4 mb-8">
         <div className="grid grid-cols-2 gap-3">
            {/* Total Orders */}
            <div className="bg-white rounded-3xl p-4 shadow-[0_5px_15px_-5px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                   <ShoppingBag className="w-5 h-5 text-[#007AFF] fill-current opacity-20 absolute" />
                   <ShoppingBag className="w-5 h-5 text-[#007AFF]" />
                 </div>
                 <div>
                   <span className="block text-[7px] font-black uppercase tracking-widest text-slate-400 mb-0.5">TOTAL ORDERS</span>
                   <span className="block text-xl font-black text-slate-900 leading-none">{orders.length}</span>
                 </div>
               </div>
               <ChevronRight size={14} className="text-slate-300" />
            </div>

            {/* Completed Orders */}
            <div className="bg-white rounded-3xl p-4 shadow-[0_5px_15px_-5px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                   <CheckCircle2 className="w-5 h-5 text-green-500" />
                 </div>
                 <div>
                   <span className="block text-[7px] font-black uppercase tracking-widest text-slate-400 mb-0.5">COMPLETED ORDERS</span>
                   <span className="block text-xl font-black text-green-500 leading-none">{completionPercentage}%</span>
                 </div>
               </div>
               <ChevronRight size={14} className="text-slate-300" />
            </div>

            {/* Member Since */}
            <div className="bg-white rounded-3xl p-4 shadow-[0_5px_15px_-5px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                   <CalendarDays className="w-5 h-5 text-[#007AFF]" />
                 </div>
                 <div>
                   <span className="block text-[7px] font-black uppercase tracking-widest text-slate-400 mb-0.5">MEMBER SINCE</span>
                   <span className="block text-lg font-black text-slate-900 leading-none">NEW</span>
                 </div>
               </div>
               <ChevronRight size={14} className="text-slate-300" />
            </div>

            {/* Client ID */}
            <div className="bg-white rounded-3xl p-4 shadow-[0_5px_15px_-5px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                   <UserIcon className="w-5 h-5 text-purple-500" />
                 </div>
                 <div>
                   <span className="block text-[7px] font-black uppercase tracking-widest text-slate-400 mb-0.5">CLIENT ID</span>
                   <span className="block text-lg font-black text-slate-900 leading-none uppercase">{user?.id ? user.id.slice(0, 4) : 'N/A'}</span>
                 </div>
               </div>
               <ChevronRight size={14} className="text-slate-300" />
            </div>
         </div>
      </section>

      {/* Service Requests */}
      <section className="px-4 mb-10">
         <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-1">SERVICE REQUESTS</h3>
         
         {/* Mocking the Empty State as per the design requirement */}
         <div className="bg-white rounded-[2rem] p-6 flex flex-col md:flex-row items-center md:items-start gap-6 shadow-[0_5px_20px_-5px_rgba(0,0,0,0.02)] border border-slate-100 relative overflow-hidden text-center md:text-left">
            <div className="w-32 h-32 shrink-0 drop-shadow-xl relative z-10 flex items-center justify-center -ml-4 -mt-2">
               <img src="/clipboard_3d.png" alt="Clipboard" className="w-full h-full object-contain mix-blend-multiply" />
            </div>
            
            <div className="relative z-10 flex flex-col items-center md:items-start py-2">
               <h4 className="text-sm font-black text-slate-900 tracking-tight mb-1">No active service requests</h4>
               <p className="text-[10px] text-slate-500 mb-5 leading-relaxed">You don't have any active service requests.</p>
               
               <Link href="/services" className="bg-black text-white px-5 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-colors active:scale-95 shadow-md shadow-black/10">
                  BOOK A SERVICE <ArrowRight size={12} />
               </Link>
            </div>
         </div>
      </section>

      {/* Back to Top */}
      <section className="flex flex-col items-center justify-center mb-8 mt-12">
        <button onClick={scrollToTop} className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md shadow-slate-200/50 text-slate-400 active:scale-90 transition-transform mb-2">
          <ChevronUp size={20} />
        </button>
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">BACK TO TOP</span>
      </section>
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
