'use client';

import { useState, useEffect, Suspense } from 'react';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Navigation, ShieldCheck, Activity } from 'lucide-react';
import Link from 'next/link';

function UserDashboardContent() {
  const { user } = useAuth();
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

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] pb-32">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-12 space-y-10">
        
        {/* Operational Portal Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-7xl font-bold uppercase tracking-tighter leading-none skew-title">
                CLIENT <br />
                <span className="text-[#007AFF]">PORTAL.</span>
              </h1>
              <p className="tactile-label tracking-[0.3em] mt-2">Active Service Interface</p>
            </div>
            <div className="w-12 h-12 bg-[#007AFF]/5 rounded-xl border border-[#007AFF]/10 flex items-center justify-center">
              <Activity className="w-6 h-6 text-[#007AFF] animate-pulse" />
            </div>
          </div>
        </div>

        {/* Hero Section - Tactical Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="king-card !bg-[#007AFF] !border-none text-white overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <ShieldCheck size={120} />
            </div>
            <div className="relative z-10">
              <p className="tactile-label !text-white/60 mb-1">Total Account Spend</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">₹{totalSpent.toFixed(2)}</h2>
              <div className="flex items-center gap-2 mt-6">
                <span className="px-3 py-1 bg-white/20 rounded-full tactile-label !text-white font-bold">Premium Tier</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="king-card flex flex-col justify-between">
              <p className="tactile-label">Active Units</p>
              <h3 className="tactile-metric">{orders.length}</h3>
            </div>
            <div className="king-card flex flex-col justify-between">
              <p className="tactile-label">Signal State</p>
              <h3 className="tactile-metric text-green-500">98%</h3>
            </div>
            <div className="king-card flex flex-col justify-between">
              <p className="tactile-label">Latency</p>
              <h3 className="tactile-metric">12ms</h3>
            </div>
            <div className="king-card flex flex-col justify-between">
              <p className="tactile-label">Sector</p>
              <h3 className="tactile-metric">7A-X</h3>
            </div>
          </div>
        </div>

        {/* Transmission Feed (Orders) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
             <h3 className="tactile-label !text-slate-400">Service Activity</h3>
             <div className="h-px flex-1 bg-black/[0.03] mx-4" />
          </div>

          <div className="grid gap-3">
            <AnimatePresence>
              {orders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="king-card !p-4 group flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-black/[0.03] rounded-lg flex items-center justify-center shrink-0 shadow-xs">
                      <Package className="w-5 h-5 text-[#007AFF]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] font-bold bg-[#007AFF]/10 text-[#007AFF] px-2 py-0.5 rounded-full uppercase tracking-widest">
                          {order.status}
                        </span>
                        <span className="tactile-label font-mono !text-slate-300">#{order.id.slice(0, 6)}</span>
                      </div>
                      <h4 className="text-sm font-bold uppercase tracking-tight truncate">Service Request</h4>
                    </div>
                  </div>
                  
                  <Link href={`/track?id=${order.id}`} className="btn-primary !py-2.5 !px-4 !text-[8px] md:!text-[10px] shrink-0">
                    STATUS
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>

            {orders.length === 0 && (
              <div className="king-card py-20 text-center flex flex-col items-center gap-4 border-dashed border-slate-200">
                <p className="tactile-label">No active services identified.</p>
                <Link href="/services" className="btn-primary !bg-black !from-black !to-slate-800 !py-3 !px-6 !text-[10px]">
                  NEW REQUEST
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
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
