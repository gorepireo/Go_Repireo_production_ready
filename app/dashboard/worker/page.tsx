'use client';

import { useState, useEffect, Suspense } from 'react';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Activity, Shield, ChevronRight, Navigation, Zap, Map, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

function WorkerDashboardContent() {
  const { user, profile: rawProfile, refresh } = useAuth();
  const profile = rawProfile as any;
  const router = useRouter();
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [acceptedJobs, setAcceptedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(profile?.is_available || false);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!user) return;
      
      const { data: worker } = await insforge.database
        .from('workers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: pending } = await insforge.database
        .from('orders')
        .select('*')
        .is('worker_id', null)
        .eq('status', 'pending');

      if (pending) setActiveJobs(pending);

      if (worker) {
        const { data: accepted } = await insforge.database
          .from('orders')
          .select('*')
          .eq('worker_id', worker.id)
          .in('status', ['shipping', 'in_progress']);
          
        if (accepted) setAcceptedJobs(accepted);
      }

      setLoading(false);
    };

    fetchJobs();
  }, [user]);

  useEffect(() => {
    const fetchWorkerData = async () => {
      if (!user) return;
      const { data } = await insforge.database.from('workers').select('status').eq('user_id', user.id).maybeSingle();
      if (data) {
        setIsAvailable(data.status === 'active');
      }
    };
    fetchWorkerData();
  }, [user]);

  const toggleAvailability = async () => {
    const newVal = !isAvailable;
    setIsAvailable(newVal); // Optimistic UI update
    
    const { error } = await insforge.database
      .from('workers')
      .update({ status: newVal ? 'active' : 'offline' })
      .eq('user_id', user.id);
      
    if (error) {
        console.error("Toggle error:", error);
        setIsAvailable(!newVal); // Revert
        alert("Failed to update status");
    } else {
        refresh?.();
    }
  };

  const handleAcceptJob = async (jobId: string) => {
    if (!user) return;
    
    try {
      // The orders.worker_id references the workers table primary key, not the user_id.
      const { data: worker, error: workerErr } = await insforge.database
        .from('workers')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (workerErr || !worker) {
        throw new Error("Worker profile not found. Please contact support.");
      }

      const { error } = await insforge.database
        .from('orders')
        .update({ status: 'shipping', worker_id: worker.id })
        .eq('id', jobId);

      if (error) {
        console.error("Failed to update order:", error);
        alert(`Could not accept job: ${error.message}`);
        return;
      }

      const { error: trackingErr } = await insforge.database.from('order_tracking').insert({
        order_id: jobId,
        status: 'shipping',
        lat: profile?.lat || profile?.address?.lat || 28.6139,
        lng: profile?.lng || profile?.address?.lng || 77.2090,
        note: 'Worker accepted the job and is en route.'
      });
      
      if (trackingErr) {
        console.error("Failed to insert tracking:", trackingErr);
        // We don't fail the whole process if tracking insert fails, but good to know
      }

      const acceptedJob = activeJobs.find(j => j.id === jobId);
      if (acceptedJob) {
        setAcceptedJobs(prev => [...prev, { ...acceptedJob, status: 'shipping', worker_id: worker.id }]);
      }
      setActiveJobs(jobs => jobs.filter(j => j.id !== jobId));
      refresh?.();
    } catch (err: any) {
      console.error("Exception in handleAcceptJob:", err);
      alert("Error accepting job");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] pb-24 font-sans px-4 md:px-6 pt-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="h-32 bg-white rounded-3xl animate-pulse shadow-sm border border-slate-100"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-white rounded-3xl animate-pulse shadow-sm border border-slate-100"></div>
          <div className="h-24 bg-white rounded-3xl animate-pulse shadow-sm border border-slate-100"></div>
        </div>
        <div className="h-10 w-48 bg-slate-200 rounded-full animate-pulse mt-8 mb-4"></div>
        <div className="space-y-4">
          <div className="h-32 bg-white rounded-3xl animate-pulse shadow-sm border border-slate-100"></div>
          <div className="h-32 bg-white rounded-3xl animate-pulse shadow-sm border border-slate-100"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] pb-24 font-sans">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 space-y-5">
        
        {/* Header with Graphic */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-50/50 to-transparent p-5 md:p-6 border border-white shadow-sm flex flex-col md:flex-row items-center justify-between">
          <div className="z-10 w-full md:w-1/2">
            <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight leading-[1.1]">
              SERVICE <br />
              <span className="text-[#007AFF]">WORKSPACE.</span>
            </h1>
            <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mt-2">Service Provider Interface</p>
          </div>
          <div className="absolute right-[-40px] md:right-0 bottom-[-20px] md:bottom-[-30px] w-[240px] md:w-[280px] opacity-90 md:opacity-100 z-0 pointer-events-none">
             <img src="/house_toolbox_3d.png" alt="Workspace Graphic" className="w-full object-contain" />
          </div>
        </div>

        {/* Tactical Grid: Status & Earnings */}
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          
          {/* Availability Card */}
          <div className="bg-white rounded-2xl md:rounded-3xl p-3 md:p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[8px] md:text-[10px] font-bold text-[#007AFF] uppercase tracking-widest">Availability</p>
                <h2 className={`text-base md:text-xl font-extrabold uppercase tracking-tight mt-1 ${isAvailable ? 'text-[#0F172A]' : 'text-slate-800'}`}>
                  {isAvailable ? 'ONLINE' : 'OFFLINE'}
                </h2>
              </div>
              <div className="w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center border-slate-200 mt-1">
                <div className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${isAvailable ? 'bg-[#007AFF]' : 'bg-transparent'}`} />
              </div>
            </div>
            
            <button 
              onClick={toggleAvailability}
              className="w-full mt-3 md:mt-4 p-1.5 md:p-2.5 rounded-xl md:rounded-2xl flex items-center justify-between transition-all bg-slate-50 hover:bg-slate-100 border border-slate-100 group"
            >
              <span className="text-[8px] md:text-[10px] font-semibold text-slate-500 uppercase tracking-widest pl-1 md:pl-2">
                <span className="hidden md:inline">YOU ARE </span>{isAvailable ? 'ONLINE' : 'OFFLINE'}
              </span>
              <div className={`w-10 h-5 md:w-12 md:h-6 rounded-full p-0.5 transition-colors relative flex items-center shadow-inner ${isAvailable ? 'bg-[#007AFF]' : 'bg-slate-300'}`}>
                <motion.div 
                  initial={false}
                  animate={{ x: isAvailable ? 20 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="w-4 h-4 md:w-5 md:h-5 bg-white rounded-full shadow-md absolute left-0.5"
                />
              </div>
            </button>
          </div>

          {/* Earnings Card */}
          <div className="bg-white rounded-2xl md:rounded-3xl p-3 md:p-4 shadow-sm border border-slate-100 relative overflow-hidden flex flex-col justify-between min-h-[100px] md:min-h-[110px]">
            <div className="z-10">
              <p className="text-[8px] md:text-[10px] font-bold text-[#007AFF] uppercase tracking-widest">Earnings</p>
              <h3 className="text-2xl md:text-3xl font-extrabold mt-1 tracking-tight">₹{profile?.earnings || 0}</h3>
            </div>
            <div className="z-10 flex items-center gap-1 md:gap-1.5 mt-2">
              <Shield size={10} className="text-[#007AFF]" />
              <p className="text-[8px] md:text-[10px] font-bold text-[#007AFF] uppercase tracking-widest">Level 4</p>
            </div>
            <div className="absolute right-[-10px] bottom-[-10px] md:bottom-[-20px] w-[90px] md:w-[130px] pointer-events-none">
              <img src="/wallet_coins_3d.png" alt="Earnings Graphic" className="w-full object-contain" />
            </div>
          </div>
        </div>

        {/* Active Missions (Accepted) */}
        {acceptedJobs.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
               <h3 className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest flex items-center gap-1.5">
                 <Zap size={12} /> ACTIVE MISSIONS
               </h3>
               <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest flex items-center gap-1">{acceptedJobs.length} ONGOING <ChevronRight size={12} /></span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <AnimatePresence>
                {acceptedJobs.map((job) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[20px] p-3.5 shadow-sm border border-slate-100 flex flex-col gap-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#F0F6FF] rounded-lg flex items-center justify-center shadow-inner border border-blue-50">
                          <Activity size={18} className="text-[#007AFF]" />
                        </div>
                        <div>
                          <h4 className="text-base font-extrabold uppercase tracking-tight text-[#0F172A]">{job.service_type || 'PROVISION'}</h4>
                          <p className="text-[9px] font-bold text-slate-400 font-mono tracking-widest mt-0.5">ID: #{job.id.slice(0, 6).toUpperCase()}</p>
                        </div>
                      </div>
                      <div>
                        <span className="px-2.5 py-1 bg-[#F0F6FF] text-[#007AFF] rounded-md text-[8px] font-extrabold uppercase tracking-widest">EN ROUTE</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin size={12} className="text-red-500 flex-shrink-0" />
                      <p className="text-xs font-semibold truncate">{job.details?.address || 'Client Location'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-0.5">
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 bg-[#007AFF] hover:bg-blue-600 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors shadow-[0_4px_14px_-4px_rgba(0,122,255,0.4)]"
                      >
                        <Map size={12} /> NAVIGATE
                      </a>
                      <button 
                        onClick={() => router.push(`/chat?orderId=${job.id}`)}
                        className="w-full py-2.5 bg-white border border-slate-200 hover:border-blue-300 text-slate-700 rounded-xl text-[10px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <MessageCircle size={12} className="text-[#007AFF]" /> CHAT
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Mission Feed (Available) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
             <h3 className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest flex items-center gap-1.5">
               <Zap size={12} /> AVAILABLE SERVICES
             </h3>
             <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest flex items-center gap-1">{activeJobs.length} JOBS <ChevronRight size={12} /></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence>
              {activeJobs.map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[20px] p-3.5 shadow-sm border border-slate-100 flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#F0F6FF] rounded-lg flex items-center justify-center shadow-inner border border-blue-50">
                        <Activity size={18} className="text-[#007AFF]" />
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold uppercase tracking-tight text-[#0F172A]">{job.service_type || 'PROVISION'}</h4>
                        <p className="text-[9px] font-bold text-slate-400 font-mono tracking-widest mt-0.5">ID: #{job.id.slice(0, 6).toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">EARNINGS</p>
                      <p className="text-lg font-extrabold tracking-tight">₹{job.total_price}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin size={12} className="text-red-500 flex-shrink-0" />
                    <p className="text-xs font-semibold uppercase tracking-widest">{profile?.address?.district || 'Sector Prime'}</p>
                  </div>

                  <button 
                    onClick={() => handleAcceptJob(job.id)}
                    className="w-full py-3 bg-black hover:bg-slate-800 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-colors shadow-md mt-0.5"
                  >
                    ACCEPT JOB
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {activeJobs.length === 0 && (
              <div className="col-span-full py-10 text-center flex flex-col items-center gap-2 border-2 border-dashed border-slate-200 rounded-[20px] opacity-50">
                <Activity size={20} className="text-slate-400" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Awaiting Service Requests...</p>
              </div>
            )}
          </div>
        </div>

        {/* Promo Banner */}
        <div className="mt-6 relative overflow-hidden rounded-[20px] bg-[#091533] p-5 flex items-center shadow-lg border border-slate-800">
          {/* subtle dot background pattern */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
          
          <div className="relative z-10 w-2/3 md:w-1/2 text-white">
             <h3 className="text-lg md:text-xl font-extrabold tracking-tight leading-tight">
               GET MORE <span className="text-[#4D8FFF]">JOBS.</span><br/>
               <span className="text-[#4D8FFF]">EARN MORE.</span>
             </h3>
             <p className="text-[10px] md:text-xs text-slate-300 mt-1.5 max-w-[180px] md:max-w-none leading-relaxed">Stay active to receive more missions and grow your earnings.</p>
          </div>

          <div className="absolute right-[-20px] bottom-[-20px] md:right-0 md:bottom-[-5px] w-[150px] md:w-[180px] z-0 pointer-events-none">
             <img src="/toolbox_3d.png" alt="Promo Graphic" className="w-full object-contain drop-shadow-2xl" />
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
