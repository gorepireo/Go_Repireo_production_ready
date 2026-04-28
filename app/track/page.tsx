'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  MapPin, 
  CheckCircle2, 
  Search,
  Activity,
  Zap,
  Navigation,
  Clock,
  LayoutGrid,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function TrackPage() {
  const { user } = useAuth();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const urlId = searchParams?.get('id');

  const [trackingId, setTrackingId] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
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
      
      if (data && data.length > 0) {
        setOrders(data);
        
        // Prioritize ID from URL if available
        const orderToSelect = urlId ? data.find(o => o.id === urlId) : data[0];
        setSelectedOrder(orderToSelect || data[0]);
        setTrackingId((orderToSelect || data[0]).id.slice(0, 8).toUpperCase());
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSteps = (order: any) => {
    const timeStr = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });

    return [
      { id: 1, status: 'ORDER PLACED', date: `${dateStr}, ${timeStr}`, location: 'System Registry confirmed', completed: true },
      { id: 2, status: 'PROVISIONING', date: 'Processing', location: 'Logistic Hub Alpha', completed: order.status !== 'pending' },
      { id: 3, status: 'IN TRANSIT', date: '--:--', location: 'Signal Relay Hub', completed: order.status === 'shipping' || order.status === 'delivered' },
      { id: 4, status: 'DELIVERED', date: 'Awaiting', location: 'Client Destination', completed: order.status === 'delivered' },
    ];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <Activity className="w-12 h-12 text-[#007AFF] animate-spin mb-4 opacity-20" />
        <p className="tactile-label animate-pulse uppercase tracking-[0.4em]">Synchronizing Orbital Signal...</p>
      </div>
    );
  }

  const currentSteps = selectedOrder ? getSteps(selectedOrder) : [];

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-12 space-y-12">
        
        {/* Header Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl md:text-8xl font-bold uppercase tracking-tighter leading-[0.85] skew-title">
              SIGNAL <br />
              <span className="text-[#007AFF]">TRACE.</span>
            </h1>
            <div className="w-16 h-16 bg-[#007AFF]/5 rounded-2xl flex items-center justify-center shadow-inner">
              <Navigation className="w-8 h-8 text-[#007AFF]" />
            </div>
          </div>
          <p className="tactile-label !text-slate-400 max-w-sm tracking-[0.2em]">
            Real-time orbital tracking and logistical verification for deployed assets.
          </p>
        </div>

        {/* Search Terminal with Dropdown */}
        <div className="relative group z-50">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#007AFF] transition-colors" size={20} />
            <input 
              type="text" 
              readOnly
              value={selectedOrder ? `ID-${selectedOrder.id.slice(0, 8).toUpperCase()}` : 'NO ACTIVE SIGNALS'}
              onClick={() => setShowDropdown(!showDropdown)}
              placeholder="SELECT SIGNAL..." 
              className="w-full h-20 bg-white shadow-xl shadow-black/[0.02] border-none px-16 rounded-[2rem] text-xl font-bold tracking-tight outline-none focus:shadow-2xl transition-all cursor-pointer"
            />
            <ChevronDown className={`absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />

            <AnimatePresence>
              {showDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-[110%] left-0 right-0 bg-white shadow-2xl rounded-[2rem] overflow-hidden border border-slate-100 p-4"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 px-6 py-4">Active Log Entries</p>
                  <div className="max-h-[300px] overflow-y-auto space-y-2 px-2 pb-4 style-scrollbar">
                    {orders.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => {
                          setSelectedOrder(o);
                          setShowDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between p-6 rounded-2xl transition-all ${selectedOrder?.id === o.id ? 'bg-[#007AFF] text-white shadow-lg shadow-[#007AFF]/20' : 'hover:bg-slate-50 text-slate-600'}`}
                      >
                        <div className="flex items-center gap-4">
                          <Package size={18} className={selectedOrder?.id === o.id ? 'text-white' : 'text-[#007AFF]'} />
                          <div className="text-left">
                            <span className="block font-bold text-sm uppercase tracking-tight">GP-{o.id.slice(0, 8).toUpperCase()}</span>
                            <span className={`text-[10px] font-medium uppercase tracking-widest ${selectedOrder?.id === o.id ? 'text-white/60' : 'text-slate-400'}`}>{o.service_name}</span>
                          </div>
                        </div>
                        <div className="text-right">
                           <span className="block text-[10px] font-bold uppercase tracking-widest">{new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           <span className={`text-[8px] font-bold uppercase tracking-[0.2em] ${selectedOrder?.id === o.id ? 'text-white/40' : 'text-slate-300'}`}>{new Date(o.created_at).toLocaleDateString()}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
        </div>

        {selectedOrder ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Timeline Card */}
            <div className="md:col-span-2">
              <div className="king-card h-full !p-8 md:!p-12">
                 <div className="flex items-center justify-between mb-12">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-black/20">Movement Log</h3>
                    <div className="flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full animate-pulse ${selectedOrder.status === 'delivered' ? 'bg-blue-500' : 'bg-green-500'}`} />
                       <span className={`text-[8px] font-bold uppercase tracking-widest ${selectedOrder.status === 'delivered' ? 'text-blue-600' : 'text-green-600'}`}>
                          {selectedOrder.status === 'delivered' ? 'Signal Sealed' : 'Active Ping'}
                       </span>
                    </div>
                 </div>

                 <div className="space-y-0 relative">
                    <div className="absolute left-6 top-2 bottom-2 w-[2px] bg-gradient-to-b from-[#007AFF] via-[#007AFF]/20 to-slate-200" />
                    
                    {currentSteps.map((step) => (
                      <div key={step.id} className="relative flex gap-8 pb-12 last:pb-0 group">
                        <div className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${step.completed ? 'bg-black text-white shadow-black/10' : 'bg-white text-slate-300'}`}>
                          {step.completed ? <CheckCircle2 size={18} /> : <Activity size={18} />}
                        </div>
                        
                        <div className="flex-1 pt-1">
                          <div className="flex justify-between items-start mb-1">
                             <h4 className={`text-sm font-bold uppercase tracking-tight ${step.completed ? 'text-black' : 'text-slate-300'}`}>{step.status}</h4>
                             <span className="text-[9px] font-bold text-slate-300">{step.date}</span>
                          </div>
                          <p className="tactile-label !text-slate-400 !lowercase tracking-normal">{step.location}</p>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>

            {/* Asset Info Card */}
            <div className="space-y-6">
              <div className="king-card !bg-black text-white !p-8">
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-6">Asset Spec</p>
                 <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                       <Package className="w-8 h-8 text-white" />
                    </div>
                    {selectedOrder.status === 'pending' && (
                      <button 
                        onClick={async () => {
                          await insforge.database
                            .from('orders')
                            .update({ status: 'shipping' })
                            .eq('id', selectedOrder.id);
                          fetchOrders();
                        }}
                        className="glass px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest text-[#007AFF] hover:bg-[#007AFF] hover:text-white transition-all animate-pulse"
                      >
                         Simulate Signal
                      </button>
                    )}
                 </div>
                 <h4 className="text-xl font-bold uppercase tracking-tight mb-2 truncate">{selectedOrder.service_name}</h4>
                 <p className="text-[9px] font-bold text-[#007AFF] uppercase tracking-widest">Pricing: ₹{selectedOrder.total_price}</p>
                 
                 <div className="mt-10 pt-8 border-t border-white/10">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 mb-4">DEPLOYED TO</p>
                    <p className="text-sm font-bold uppercase tracking-tight leading-tight">
                      {selectedOrder.details?.address || 'Node Destination Alpha'}
                    </p>
                 </div>
              </div>

              <Link 
                href={`/track/map?id=${selectedOrder.id}`}
                className="king-card !p-8 bg-[#007AFF] text-white group block transition-all hover:bg-[#005bbd] hover:scale-[1.02] shadow-[0_20px_50px_rgba(0,122,255,0.2)]"
              >
                 <div className="flex justify-between items-start mb-6">
                    <Navigation size={24} className="group-hover:rotate-45 transition-transform" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/40">logistics view</span>
                 </div>
                 <p className="text-sm font-bold leading-tight">VIEW ORBITAL MAP</p>
                 <p className="text-[9px] mt-2 opacity-50 uppercase font-bold tracking-widest">Real-time Location Stream</p>
              </Link>
            </div>
          </div>
        ) : (
          <div className="king-card py-32 text-center space-y-6 border-dashed border-2 border-slate-200">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Activity className="text-slate-200 w-10 h-10" />
             </div>
             <div className="space-y-2">
                <h3 className="text-xl font-black uppercase italic italic transform -skew-x-12">No Activity Detected</h3>
                <p className="text-xs text-slate-400 tracking-widest max-w-[200px] mx-auto uppercase leading-relaxed font-bold">Initiate service query to begin orbital logging.</p>
             </div>
             <Link href="/services" className="btn-primary mt-6 !rounded-[1.5rem]">Initiate Module <Zap size={14} /></Link>
          </div>
        )}

      </div>
    </div>
  );
}
