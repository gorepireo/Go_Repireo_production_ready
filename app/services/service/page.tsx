'use client';

import { useEffect, useState } from 'react';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Clock, Image as ImageIcon, ArrowRight, Zap, LayoutGrid, Sparkles } from 'lucide-react';

export default function ServiceBooking() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: 'plumbing',
    description: '',
    preferredDate: '',
    preferredTime: '',
    address: ''
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/services/service');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login?redirect=/services/service');
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await insforge.database
        .from('orders')
        .insert([{
          user_email: user.email,
          service_name: formData.category,
          status: 'pending',
          total_price: 500,
          details: { ...formData, items: [{ type: 'service', name: formData.category }] },
          lat: 12.9716 + (Math.random() - 0.5) * 0.1,
          lng: 77.5946 + (Math.random() - 0.5) * 0.1,
          order_type: 'direct_service'
        }])
        .select();

      if (data) {
        await insforge.database
          .from('order_tracking')
          .insert([{
            order_id: data[0].id,
            status: 'pending',
            lat: data[0].lat - (Math.random() * 0.1),
            lng: data[0].lng - (Math.random() * 0.1),
            note: 'Logistic unit assigned. Initialising signal...'
          }]);

        router.push(`/track?id=${data[0].id}`);
      }
    } catch (err) {
      console.error('Booking error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl relative overflow-hidden">
           <motion.div 
             animate={{ rotate: 360 }} 
             transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
             className="absolute inset-0 bg-gradient-to-br from-[#007AFF]/10 to-transparent" 
           />
           <LayoutGrid className="w-10 h-10 text-[#007AFF] animate-pulse" />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-black/10">Establishing Protocol</p>
          <p className="text-sm font-bold uppercase tracking-widest text-[#007AFF] animate-pulse">Initialising Secure Gateway</p>
        </div>
      </div>
    );
  }

  const categories = [
    { id: 'plumbing', label: 'Plumbing', icon: '💧' },
    { id: 'electrical', label: 'Electrical', icon: '⚡' },
    { id: 'cleaning', label: 'Cleaning', icon: '✨' },
    { id: 'repair', label: 'Repair', icon: '🛠️' }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-12 space-y-12">
        
        {/* Header Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-4xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] italic transform -skew-x-12">
                BOOK A <br />
                <span className="text-[#007AFF]">PROFESSIONAL.</span>
              </h1>
            </motion.div>
            <div className="w-16 h-16 bg-[#007AFF]/5 rounded-2xl md:flex hidden items-center justify-center shadow-inner">
              <Sparkles className="w-8 h-8 text-[#007AFF]" />
            </div>
          </div>
          <p className="tactile-label !text-slate-400 max-w-sm tracking-[0.2em] uppercase font-bold text-[10px]">
             Secure assignment of elite service assets for residential maintenance.
          </p>
        </div>

        <motion.form 
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* Category Selector */}
          <div className="space-y-6">
            <label className="text-[10px] font-black text-black/20 uppercase tracking-[0.4em]">Section 01 / Select Discipline</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.id })}
                  className={`group relative h-32 md:h-40 rounded-[2rem] transition-all flex flex-col items-center justify-center gap-4 ${
                    formData.category === cat.id 
                    ? 'bg-black text-white shadow-2xl shadow-black/20 scale-[1.02]' 
                    : 'bg-white hover:bg-slate-50 text-slate-400'
                  }`}
                >
                  <span className="text-2xl md:text-3xl group-hover:scale-125 transition-transform duration-500">{cat.icon}</span>
                  <span className="text-xs font-black uppercase tracking-widest">{cat.label}</span>
                  {formData.category === cat.id && (
                    <motion.div 
                      layoutId="active-pill"
                      className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#007AFF] shadow-[0_0_10px_#007AFF]"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Core Problem Description */}
          <div className="space-y-6">
            <label className="text-[10px] font-black text-black/20 uppercase tracking-[0.4em]">Section 02 / Brief Entry</label>
            <div className="relative group">
               <textarea 
                required
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full h-40 bg-white rounded-[2rem] px-8 py-8 text-lg font-bold tracking-tight outline-none shadow-xl shadow-black/[0.02] focus:shadow-2xl focus:bg-[#007AFF]/[0.01] transition-all placeholder:text-slate-200 resize-none border-none" 
                placeholder="E.g. System breach in plumbing cluster A-4..." 
               />
               <div className="absolute right-8 bottom-8 opacity-20 group-focus-within:opacity-100 transition-opacity">
                  <Zap size={20} className="text-[#007AFF]" />
               </div>
            </div>
          </div>

          {/* Logistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* Temporal Field */}
            <div className="space-y-6">
               <label className="text-[10px] font-black text-black/20 uppercase tracking-[0.4em]">Section 03 / Temporal Sync</label>
               <div className="flex gap-4">
                  <div className="flex-1 relative group">
                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#007AFF] transition-colors" size={18} />
                    <input 
                      required 
                      type="date" 
                      onChange={e => setFormData({ ...formData, preferredDate: e.target.value })}
                      className="w-full h-16 bg-white rounded-2xl pl-16 pr-6 text-xs font-black uppercase tracking-widest outline-none shadow-xl shadow-black/[0.02] border-none" 
                    />
                  </div>
                  <div className="flex-1 relative group">
                    <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#007AFF] transition-colors" size={18} />
                    <input 
                      required 
                      type="time" 
                      onChange={e => setFormData({ ...formData, preferredTime: e.target.value })}
                      className="w-full h-16 bg-white rounded-2xl pl-16 pr-6 text-xs font-black uppercase tracking-widest outline-none shadow-xl shadow-black/[0.02] border-none" 
                    />
                  </div>
               </div>
            </div>

            {/* Geographical Field */}
            <div className="space-y-6">
               <label className="text-[10px] font-black text-black/20 uppercase tracking-[0.4em]">Section 04 / Geo Lock</label>
               <div className="relative group">
                 <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#007AFF] transition-colors" size={18} />
                 <input 
                   required 
                   value={formData.address}
                   onChange={e => setFormData({ ...formData, address: e.target.value })}
                   className="w-full h-16 bg-white rounded-2xl pl-16 pr-8 text-xs font-black uppercase tracking-widest outline-none shadow-xl shadow-black/[0.02] border-none" 
                   placeholder="DESTINATION COORDINATES..." 
                 />
               </div>
            </div>

          </div>

          {/* Visual Linkage */}
          <div className="space-y-6">
            <label className="text-[10px] font-black text-black/20 uppercase tracking-[0.4em]">Optional / Visual Log</label>
            <div className="group h-32 bg-white/40 backdrop-blur-xl border-dashed border-2 border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-2 hover:bg-white hover:border-[#007AFF]/20 transition-all cursor-pointer">
              <ImageIcon className="w-6 h-6 text-slate-300 group-hover:text-[#007AFF] transition-colors" />
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-slate-600">Attached Media Profile</p>
            </div>
          </div>

          {/* High-Impact Action */}
          <div className="pt-8">
            <button 
              disabled={loading}
              type="submit" 
              className="relative w-full h-24 bg-[#007AFF] text-white rounded-[2.5rem] text-xl font-black uppercase italic transform -skew-x-12 overflow-hidden shadow-[0_20px_50px_rgba(0,122,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="flex items-center justify-center gap-4">
                <span>{loading ? 'INITIALISING...' : 'CONFIRM ASSIGNMENT'}</span>
                <AnimatePresence mode="wait">
                  {!loading && (
                    <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 10, opacity: 0 }}>
                      <ArrowRight className="w-8 h-8" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </button>
          </div>

        </motion.form>
      </div>
    </div>
  );
}
