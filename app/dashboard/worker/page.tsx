'use client';

import { useState, useEffect, Suspense } from 'react';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Activity, Shield, ChevronRight, Navigation, Zap } from 'lucide-react';

function WorkerDashboardContent() {
  const { user, profile: rawProfile, refresh } = useAuth();
  const profile = rawProfile as any;
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(profile?.is_available || false);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!user) return;
      
      const { data } = await insforge.database
        .from('orders')
        .select('*')
        .is('worker_id', null)
        .eq('status', 'pending');

      if (data) setActiveJobs(data);
      setLoading(false);
    };

    fetchJobs();
  }, [user]);

  const toggleAvailability = async () => {
    const newVal = !isAvailable;
    const { error } = await insforge.database
      .from('workers')
      .update({ is_available: newVal })
      .eq('user_id', user.id);
    
    if (!error) {
        setIsAvailable(newVal);
        refresh?.();
    }
  };

  const handleAcceptJob = async (jobId: string) => {
    if (!user) return;
    
    const { error } = await insforge.database
      .from('orders')
      .update({ status: 'shipping', worker_id: user.id })
      .eq('id', jobId);

    if (!error) {
      await insforge.database.from('order_tracking').insert({
        order_id: jobId,
        status: 'shipping',
        lat: profile?.lat || 28.6139,
        lng: profile?.lng || 77.2090
      });
      setActiveJobs(jobs => jobs.filter(j => j.id !== jobId));
      refresh?.();
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] pb-32">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-12 space-y-10">
        
        {/* Command Console Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-7xl font-bold uppercase tracking-tighter leading-none skew-title">
                SERVICE <br />
                <span className="text-[#007AFF]">WORKSPACE.</span>
              </h1>
              <p className="tactile-label tracking-[0.3em] mt-2">Service Provider Interface</p>
            </div>
            <div className="w-12 h-12 bg-black/[0.03] rounded-xl flex items-center justify-center shadow-inner">
              <Zap className={`w-6 h-6 transition-colors ${isAvailable ? 'text-yellow-500' : 'text-slate-300'}`} />
            </div>
          </div>
        </div>

        {/* Tactical Grid: Status & Earnings */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          <div className="king-card flex flex-col justify-between group">
            <div>
              <p className="tactile-label">Availability Status</p>
              <h2 className={`text-xl font-bold uppercase tracking-tight mt-1 ${isAvailable ? 'text-[#007AFF]' : 'text-slate-400'}`}>
                {isAvailable ? 'ACTIVE' : 'OFFLINE'}
              </h2>
            </div>
            <button 
              onClick={toggleAvailability}
              className={`w-full py-3 rounded-xl tactile-label font-bold transition-all mt-4 ${isAvailable ? 'bg-[#007AFF] text-white shadow-[0_10px_20px_-5px_rgba(0,122,255,0.4)]' : 'bg-black/[0.02] text-slate-400 shadow-inner'}`}
            >
              TOGGLE
            </button>
          </div>

          <div className="king-card flex flex-col justify-between">
            <div>
              <p className="tactile-label">Total Earnings</p>
              <h3 className="tactile-metric mt-1">₹{profile?.earnings || 0}</h3>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Shield size={12} className="text-[#007AFF]" />
              <p className="tactile-label !text-[#007AFF]">Level 4 Unit</p>
            </div>
          </div>
        </div>

        {/* Mission Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
             <h3 className="tactile-label !text-slate-400">Available Services</h3>
             <span className="tactile-label font-bold text-[#007AFF]">{activeJobs.length} JOBS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence>
              {activeJobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="king-card !p-4 group flex flex-col gap-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black/[0.03] rounded-lg flex items-center justify-center shadow-xs">
                        <Activity size={18} className="text-[#007AFF]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold uppercase tracking-tight">{job.service_type || 'Provision'}</h4>
                        <p className="tactile-label !text-slate-300 font-mono">#{job.id.slice(0, 6)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="tactile-label !text-slate-300">EARNINGS</p>
                      <p className="text-lg font-bold">₹{job.total_price}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-2">
                    <MapPin size={10} className="text-red-500" />
                    <p className="tactile-label truncate">{profile?.address?.district || 'Sector Prime'}</p>
                  </div>

                  <button 
                    onClick={() => handleAcceptJob(job.id)}
                    className="btn-primary !py-3 !text-[10px] w-full"
                  >
                    ACCEPT JOB
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {activeJobs.length === 0 && (
              <div className="col-span-full king-card py-20 text-center flex flex-col items-center gap-4 opacity-30 border-dashed border-slate-200">
                <Activity size={32} className="animate-pulse" />
                <p className="tactile-label">Awaiting Service Requests...</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function WorkerDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <WorkerDashboardContent />
    </Suspense>
  );
}
