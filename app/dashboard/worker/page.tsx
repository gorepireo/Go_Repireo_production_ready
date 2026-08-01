'use client';

import { WorkerDashboardSkeleton } from '@/components/SkeletonLoader';

import { useState, useEffect, Suspense } from 'react';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Activity, Shield, ChevronRight, Navigation, Zap, Map, MessageCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { isServiceMatching } from '@/lib/serviceMatcher';

function WorkerDashboardContent() {
  const { user, profile: rawProfile, refresh } = useAuth();
  const profile = rawProfile as any;
  const router = useRouter();
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [acceptedJobs, setAcceptedJobs] = useState<any[]>([]);
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(profile?.is_available || false);
  const [workerTrade, setWorkerTrade] = useState<string>('');
  const [declinedJobIds, setDeclinedJobIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined' && user?.id) {
      try {
        const saved = localStorage.getItem(`declined_jobs_${user.id}`);
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    const fetchJobs = async () => {
      if (!user) return;
      
      const { data: worker } = await insforge.database
        .from('workers')
        .select('id, service')
        .eq('user_id', user.id)
        .maybeSingle();

      const trade = worker?.service || profile?.service || profile?.service_name || '';
      setWorkerTrade(trade);

      const { data: pending } = await insforge.database
        .from('orders')
        .select('*')
        .is('worker_id', null)
        .eq('status', 'pending');

      if (pending) {
        const suitable = pending.filter(job => 
          isServiceMatching(trade, job.service_name, job.details?.category)
        );
        setActiveJobs(suitable);
      }

      if (worker) {
        const { data: accepted } = await insforge.database
          .from('orders')
          .select('*')
          .eq('worker_id', worker.id)
          .in('status', ['shipping', 'in_progress']);
          
        if (accepted) setAcceptedJobs(accepted);

        const { data: completed } = await insforge.database
          .from('orders')
          .select('*')
          .eq('worker_id', worker.id)
          .eq('status', 'completed');

        if (completed) setCompletedJobs(completed);
      }

      setLoading(false);
    };

    fetchJobs();
  }, [user, profile]);

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

  // Live Location Tracker for Active Missions
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (acceptedJobs.length > 0 && user) {
      intervalId = setInterval(() => {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              for (const job of acceptedJobs) {
                await insforge.database.from('order_live_location').upsert({
                  order_id: job.id,
                  worker_id: user.id,
                  lat: latitude,
                  lng: longitude,
                  updated_at: new Date().toISOString()
                }, { onConflict: 'order_id' });
              }
            } catch (err) {
              console.error("Error upserting live location:", err);
            }
          }, (err) => {
            console.error("Location tracking error:", err);
          }, { enableHighAccuracy: true });
        }
      }, 5000); // Send every 5 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [acceptedJobs, user]);

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

  const handleCompleteJob = async (jobId: string) => {
    if (!user) return;
    try {
      const { error } = await insforge.database
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', jobId);

      if (error) throw error;

      await insforge.database.from('order_tracking').insert({
        order_id: jobId,
        status: 'completed',
        lat: profile?.lat || profile?.address?.lat || 28.6139,
        lng: profile?.lng || profile?.address?.lng || 77.2090,
        note: 'Service mission completed successfully by worker.'
      });

      // Cleanup live tracking location from database
      await insforge.database.from('order_live_location').delete().eq('order_id', jobId);

      const finishedJob = acceptedJobs.find(j => j.id === jobId);
      if (finishedJob) {
        setCompletedJobs(prev => [{ ...finishedJob, status: 'completed' }, ...prev]);
        setAcceptedJobs(prev => prev.filter(j => j.id !== jobId));
      }
      refresh?.();
    } catch (err: any) {
      console.error("Failed to complete job:", err);
      alert("Error marking job as completed");
    }
  };

  const handleDeclineJob = (jobId: string) => {
    if (!user) return;
    const updated = [...declinedJobIds, jobId];
    setDeclinedJobIds(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`declined_jobs_${user.id}`, JSON.stringify(updated));
    }
  };

  const handleAcceptJob = async (jobId: string) => {
    if (!user) return;
    
    try {
      // The orders.worker_id references the workers table primary key, not the user_id.
      const { data: worker, error: workerErr } = await insforge.database
        .from('workers')
        .select('id, from_name, service')
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

      const acceptedJob = activeJobs.find(j => j.id === jobId);

      // Notify customer that worker accepted the job
      if (acceptedJob && acceptedJob.user_email) {
        try {
          const { data: customerUser } = await insforge.database
            .from('users')
            .select('id')
            .eq('email', acceptedJob.user_email)
            .maybeSingle();

          if (customerUser) {
            const workerName = worker.from_name || profile?.full_name || 'A verified service provider';
            const serviceCat = (acceptedJob.service_name || acceptedJob.details?.category || 'service').toUpperCase();
            await insforge.database.from('notifications').insert([{
              user_id: customerUser.id,
              title: 'Worker Assigned',
              message: `${workerName} has accepted your ${serviceCat} request and is en route!`,
              type: 'order',
              link: `/track?id=${jobId}`
            }]);
          }
        } catch (notifErr) {
          console.warn("Could not notify customer:", notifErr);
        }
      }

      const { error: trackingErr } = await insforge.database.from('order_tracking').insert({
        order_id: jobId,
        status: 'shipping',
        lat: profile?.lat || profile?.address?.lat || 28.6139,
        lng: profile?.lng || profile?.address?.lng || 77.2090,
        note: `${worker.from_name || 'Worker'} accepted the job and is en route.`
      });
      
      if (trackingErr) {
        console.error("Failed to insert tracking:", trackingErr);
      }

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

  if (loading) return <WorkerDashboardSkeleton />;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] pb-24 font-sans">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 space-y-5">
        
        {/* Header with Graphic */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-50/50 to-transparent p-5 md:p-6 border border-white shadow-sm flex flex-col md:flex-row items-center justify-between">
          <div className="z-10 w-full md:w-1/2">
            <p className="text-[10px] font-bold text-[#007AFF] uppercase tracking-wider">Worker Workspace</p>
            <h1 className="text-lg md:text-xl font-extrabold text-[#0A1629] tracking-tight truncate mt-0.5">
              {profile?.display_name || 'Service Partner'}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Manage your active jobs and service requests</p>
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
              <p className="text-[8px] md:text-[10px] font-bold text-[#007AFF] uppercase tracking-widest">Worker Payout Earnings</p>
              <h3 className="text-2xl md:text-3xl font-extrabold mt-1 tracking-tight">₹{completedJobs.reduce((acc, job) => acc + (Math.max(0, (Number(job.total_price) || 0) - (Number(job.details?.estimation?.platformFee) || 49))), profile?.earnings || 0)}</h3>
            </div>
            <div className="z-10 flex items-center gap-1 md:gap-1.5 mt-2">
              <Shield size={10} className="text-[#007AFF]" />
              <p className="text-[8px] md:text-[10px] font-bold text-[#007AFF] uppercase tracking-widest">Verified Worker Share</p>
            </div>
            <div className="absolute right-[-10px] bottom-[-10px] md:bottom-[-20px] w-[90px] md:w-[130px] pointer-events-none">
              <img src="/wallet_coins_3d.png" alt="Earnings Graphic" className="w-full object-contain" />
            </div>
          </div>
        </div>

        {/* Active Missions (Accepted & Assigned) */}
        {acceptedJobs.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
               <h3 className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest flex items-center gap-1.5">
                 <Zap size={12} /> ACTIVE MISSIONS (ASSIGNED)
               </h3>
               <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest flex items-center gap-1">{acceptedJobs.length} ONGOING <ChevronRight size={12} /></span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <AnimatePresence>
                {acceptedJobs.map((job) => {
                  const isScheduled = job.details?.bookingType === 'scheduled';
                  const platformFee = Number(job.details?.estimation?.platformFee) || 49;
                  const workerPayout = Math.max(0, (Number(job.total_price) || 0) - platformFee);
                  const isCash = job.payment_method === 'cash' || job.payment_status === 'cash_on_delivery';

                  return (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#F0F6FF] rounded-lg flex items-center justify-center shadow-inner border border-blue-50">
                            <Activity size={18} className="text-[#007AFF]" />
                          </div>
                          <div>
                            <h4 className="text-base font-extrabold uppercase tracking-tight text-[#0F172A]">{job.service_name || job.details?.category || 'SERVICE'}</h4>
                            <p className="text-[9px] font-bold text-slate-400 font-mono tracking-widest mt-0.5">ID: #{job.id.slice(0, 6).toUpperCase()}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="px-2.5 py-1 bg-[#F0F6FF] text-[#007AFF] rounded-md text-[8px] font-extrabold uppercase tracking-widest">ASSIGNED TO YOU</span>
                          {isScheduled ? (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[8px] font-bold uppercase tracking-wider">
                              📅 {job.details?.preferredDate} @ {job.details?.preferredTime}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[8px] font-bold uppercase tracking-wider">
                              ⚡ IMMEDIATE (ASAP)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Payment & Worker Share Banner */}
                      <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 flex items-center justify-between">
                        <div>
                          <p className="text-[8px] font-extrabold text-emerald-800 uppercase tracking-widest">PAYMENT TYPE</p>
                          <p className="text-xs font-black text-emerald-900 mt-0.5">
                            {isCash ? '💵 Cash Payment from Client' : '💳 Prepaid Online'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-extrabold text-emerald-800 uppercase tracking-widest">YOUR PAYOUT SHARE</p>
                          <p className="text-lg font-black text-emerald-700">₹{workerPayout}</p>
                        </div>
                      </div>

                      {/* Full Problem Description - Shown ONLY after accept */}
                      {job.details?.description && (
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">PROBLEM DESCRIPTION</p>
                          <p className="text-xs font-semibold text-slate-700 leading-relaxed">{job.details.description}</p>
                        </div>
                      )}

                      {/* Full Address & Map Location - Shown ONLY after accept */}
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin size={14} className="text-red-500 flex-shrink-0" />
                        <p className="text-xs font-semibold">{job.details?.address || 'Client Address'}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-1">
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 bg-[#007AFF] hover:bg-blue-600 text-white rounded-xl text-[9px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1 transition-colors shadow-sm"
                        >
                          <Map size={12} /> NAVIGATE
                        </a>
                        <button 
                          onClick={() => router.push(`/chat?orderId=${job.id}`)}
                          className="py-2.5 bg-white border border-slate-200 hover:border-blue-300 text-slate-700 rounded-xl text-[9px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1 transition-colors shadow-sm"
                        >
                          <MessageCircle size={12} className="text-[#007AFF]" /> CHAT
                        </button>
                        <button 
                          onClick={() => handleCompleteJob(job.id)}
                          className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1 transition-colors shadow-sm"
                        >
                          COMPLETE
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Mission Feed (Available) */}
        {(() => {
          const visibleJobs = activeJobs.filter(job => !declinedJobIds.includes(job.id));
          return (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                 <h3 className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest flex items-center gap-1.5">
                   <Zap size={12} /> AVAILABLE SERVICES {workerTrade ? `(${workerTrade.toUpperCase()})` : ''}
                 </h3>
                 <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest flex items-center gap-1">{visibleJobs.length} MATCHING JOBS <ChevronRight size={12} /></span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <AnimatePresence>
                  {visibleJobs.map((job) => {
                    const categoryTitle = (job.service_name || job.details?.category || job.service_type || 'PROVISION').toUpperCase();
                    const isScheduled = job.details?.bookingType === 'scheduled';
                    const generalLocation = job.details?.address ? job.details.address.split(',')[0] : (profile?.address?.district || 'Nearby Location');
                    const platformFee = Number(job.details?.estimation?.platformFee) || 49;
                    const workerPayout = Math.max(0, (Number(job.total_price) || 0) - platformFee);
                    const isCash = job.payment_method === 'cash' || job.payment_status === 'cash_on_delivery';

                    return (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-[20px] p-3.5 shadow-sm border border-slate-100 flex flex-col gap-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#F0F6FF] rounded-lg flex items-center justify-center shadow-inner border border-blue-50">
                              <Activity size={18} className="text-[#007AFF]" />
                            </div>
                            <div>
                              <h4 className="text-base font-extrabold uppercase tracking-tight text-[#0F172A]">{categoryTitle}</h4>
                              <p className="text-[9px] font-bold text-slate-400 font-mono tracking-widest mt-0.5">ID: #{job.id.slice(0, 6).toUpperCase()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[8px] font-extrabold text-emerald-600 uppercase tracking-widest">WORKER PAYOUT</p>
                            <p className="text-lg font-extrabold text-emerald-700 tracking-tight">₹{workerPayout}</p>
                            <p className="text-[8px] font-medium text-slate-400">Excl. ₹{platformFee} Fee</p>
                          </div>
                        </div>

                        {/* Timing & Payment Method Badges */}
                        <div className="flex items-center justify-between text-xs font-semibold gap-2">
                          <div className="flex items-center gap-1.5 truncate text-slate-600">
                            <MapPin size={12} className="text-red-500 flex-shrink-0" />
                            <p className="truncate uppercase tracking-widest text-[10px]">{generalLocation}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${isCash ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                              {isCash ? '💵 CASH' : '💳 ONLINE'}
                            </span>
                            {isScheduled ? (
                              <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[8px] font-bold uppercase tracking-wider">
                                📅 {job.details?.preferredDate}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[8px] font-bold uppercase tracking-wider">
                                ⚡ ASAP
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Privacy notice - Description & Map Location concealed until accept */}
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
                          🔒 Exact address & problem description revealed upon accepting
                        </p>

                        <div className="grid grid-cols-2 gap-2 mt-0.5">
                          <button 
                            onClick={() => handleAcceptJob(job.id)}
                            className="py-3 bg-black hover:bg-slate-800 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-colors shadow-md flex items-center justify-center gap-1"
                          >
                            ACCEPT JOB
                          </button>
                          <button 
                            onClick={() => handleDeclineJob(job.id)}
                            className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                          >
                            <X size={12} /> DECLINE
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {visibleJobs.length === 0 && (
                  <div className="col-span-full py-10 text-center flex flex-col items-center gap-2 border-2 border-dashed border-slate-200 rounded-[20px] opacity-50">
                    <Activity size={20} className="text-slate-400" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Awaiting {workerTrade ? workerTrade.toUpperCase() : 'Service'} Requests...</p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Completed Missions (Isolated strictly to this assigned worker) */}
        {completedJobs.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
               <h3 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                 <Shield size={12} /> COMPLETED MISSIONS ({completedJobs.length})
               </h3>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PRIVATE HISTORY</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {completedJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-[20px] p-3.5 shadow-sm border border-emerald-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold uppercase text-[#0F172A]">{job.service_name || job.details?.category || 'SERVICE'}</h4>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] font-extrabold uppercase tracking-widest">
                      ✓ COMPLETED
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <p>Earned: ₹{job.total_price}</p>
                    <p className="font-mono text-[9px]">ID: #{job.id.slice(0, 6).toUpperCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
