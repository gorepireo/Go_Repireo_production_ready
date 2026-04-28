'use client';

import { useState, useEffect } from 'react';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Users, 
  Store, 
  CheckCircle, 
  Search, 
  Activity, 
  LogOut,
  UserCheck,
  ShieldAlert,
  Zap,
  LayoutDashboard,
  Bell
} from 'lucide-react';

export default function AdminPanel() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'workers' | 'shops'>('workers');
  const [workerApps, setWorkerApps] = useState<any[]>([]);
  const [shopApps, setShopApps] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, profile, loading, router]);

  const fetchData = async () => {
    setFetching(true);
    try {
      const { data: wApps } = await insforge.database.from('worker_applications').select('*').order('created_at', { ascending: false });
      const { data: sApps } = await insforge.database.from('shop_applications').select('*').order('created_at', { ascending: false });
      setWorkerApps(wApps || []);
      setShopApps(sApps || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchData();
    }
  }, [profile]);

  const approveWorker = async (app: any) => {
    setActionLoading(app.id);
    try {
      const { error: wError } = await insforge.database.from('workers').insert({
        user_id: app.app_id,
        app_id: app.app_id,
        from_name: app.from_name,
        email: app.email,
        mobile: app.mobile,
        service: app.service,
        experience: app.experience,
        expertise: app.service,
        tools: app.tools,
        availability: app.availability,
        training_slot: app.training_slot,
        other_skills: app.other_skills,
        status: 'online',
        login_access: true
      });

      if (wError) throw wError;

      const { error: uError } = await insforge.database.from('users').update({
        status: 'active'
      }).eq('id', app.app_id);

      if (uError) throw uError;

      await insforge.database.from('worker_applications').delete().eq('id', app.id);
      alert(`Provider ${app.from_name} has been approved.`);
      fetchData();
    } catch (err: any) {
      alert('Approval Failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const approveShop = async (app: any) => {
    setActionLoading(app.id);
    try {
      const { data: usersData } = await insforge.database.from('users').select('id').eq('email', app.email).single();
      
      if (!usersData) throw new Error("Parent identity not found in database.");

      const { error: sError } = await insforge.database.from('shops').insert({
        owner_id: usersData.id,
        name: app.shop_name,
        owner_name: app.owner_name,
        email: app.email,
        phone: app.phone,
        address: app.address
      });

      if (sError) throw sError;

      await insforge.database.from('users').update({
        status: 'active'
      }).eq('id', usersData.id);

      await insforge.database.from('shop_applications').delete().eq('id', app.id);

      alert(`Vendor ${app.shop_name} has been approved.`);
      fetchData();
    } catch (err: any) {
      alert('Approval Failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !profile || profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/20 animate-pulse">Establishing Secure Uplink...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] pb-32">
      {/* Strategic Alabaster Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-2xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-5">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1 shadow-lg shadow-black/5 border border-black/[0.03]">
              <img src="/logo.png" alt="Repireo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm md:text-xl font-bold uppercase tracking-tighter text-black">STRATEGIC <span className="text-[#007AFF]">OVERSIGHT</span></h1>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                <p className="tactile-label">Alabaster Active</p>
              </div>
            </div>
          </div>
          
          <button onClick={signOut} className="flex items-center gap-2 text-red-500/60 hover:text-red-500 transition-colors">
            <LogOut size={16} />
            <span className="tactile-label text-red-500/60 font-bold">Exit</span>
          </button>
        </div>
      </nav>

      {/* Main Command Console */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-24 md:pt-36">
        {/* Global KPIs - Horizontal Scaling */}
        <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
          <div className="king-card min-w-[200px] flex-1">
            <p className="tactile-label">Total Revenue</p>
            <h3 className="tactile-metric">$1.2M</h3>
          </div>
          <div className="king-card min-w-[200px] flex-1">
            <p className="tactile-label">Active Deployments</p>
            <h3 className="tactile-metric">{workerApps.length + shopApps.length}</h3>
          </div>
          <div className="king-card min-w-[200px] flex-1">
            <p className="tactile-label">System Health</p>
            <h3 className="tactile-metric text-green-500">99.9%</h3>
          </div>
        </div>

        <section className="mt-8 mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-12 mb-10">
            <div className="space-y-2">
              <h2 className="text-4xl md:text-7xl font-bold uppercase tracking-tighter leading-none skew-title">
                UNIT <span className="text-[#007AFF]">PIPELINE.</span>
              </h2>
              <p className="tactile-label tracking-[0.3em]">Strategic Recruitment Console</p>
            </div>
            
            <div className="flex bg-white/50 p-1.5 rounded-2xl shadow-inner">
               <button 
                onClick={() => setActiveTab('workers')}
                className={`px-6 py-2.5 rounded-xl tactile-label font-bold transition-all ${activeTab === 'workers' ? 'bg-[#007AFF] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Units ({workerApps.length})
               </button>
               <button 
                onClick={() => setActiveTab('shops')}
                className={`px-6 py-2.5 rounded-xl tactile-label font-bold transition-all ${activeTab === 'shops' ? 'bg-black text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Merchants ({shopApps.length})
               </button>
            </div>
          </div>

          {fetching ? (
            <div className="py-20 flex flex-col items-center gap-4 opacity-20">
              <Activity className="w-12 h-12 text-[#007AFF] animate-pulse" />
              <p className="tactile-label">Synchronizing Sector...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6">
              <AnimatePresence mode="wait">
                {activeTab === 'workers' ? (
                  workerApps.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center opacity-20">
                      <ShieldAlert size={48} />
                      <p className="tactile-label mt-4">No Pending Units</p>
                    </div>
                  ) : (
                    workerApps.map((app) => (
                      <motion.div 
                        key={app.id} 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="king-card !p-3 md:!p-6 group flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="w-8 h-8 md:w-12 md:h-12 bg-black/[0.03] rounded-lg md:rounded-xl flex items-center justify-center">
                              <Users size={16} className="text-[#007AFF]" />
                            </div>
                            <span className="status-pill-yellow">PENDING</span>
                          </div>
                          <div>
                            <h3 className="text-xs md:text-xl font-bold uppercase tracking-tight truncate">{app.from_name}</h3>
                            <p className="tactile-label truncate text-[8px] md:text-[10px]">{app.service}</p>
                          </div>
                          <div className="flex items-center gap-2">
                             <Shield size={10} className="text-slate-300" />
                             <p className="tactile-label !text-slate-400">{app.experience} XP</p>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => approveWorker(app)}
                          disabled={actionLoading === app.id}
                          className="btn-primary !py-2.5 !px-4 !text-[8px] md:!text-[10px] w-full mt-6"
                        >
                          {actionLoading === app.id ? 'VERIFYING...' : 'PROVISION'}
                        </button>
                      </motion.div>
                    ))
                  )
                ) : (
                  shopApps.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center opacity-20">
                      <ShieldAlert size={48} />
                      <p className="tactile-label mt-4">No Pending Merchants</p>
                    </div>
                  ) : (
                    shopApps.map((app) => (
                      <motion.div 
                        key={app.id} 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="king-card !p-3 md:!p-6 group flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="w-8 h-8 md:w-12 md:h-12 bg-black/[0.03] rounded-lg md:rounded-xl flex items-center justify-center">
                              <Store size={16} className="text-black" />
                            </div>
                            <span className="status-pill-yellow">AUDIT</span>
                          </div>
                          <div>
                            <h3 className="text-xs md:text-xl font-bold uppercase tracking-tight truncate">{app.shop_name}</h3>
                            <p className="tactile-label truncate text-[8px] md:text-[10px]">{app.owner_name}</p>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => approveShop(app)}
                          disabled={actionLoading === app.id}
                          className="btn-primary !bg-black !from-black !to-slate-800 !py-2.5 !px-4 !text-[8px] md:!text-[10px] w-full mt-6"
                        >
                          {actionLoading === app.id ? 'AUDITING...' : 'AUTHORIZE'}
                        </button>
                      </motion.div>
                    ))
                  )
                )}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>

      {/* Admin Status Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-8 pointer-events-none opacity-20">
         <div className="max-w-7xl mx-auto flex justify-between items-end">
            <div className="space-y-2">
              <p className="tactile-label">ADMIN_TERMINAL_V1.0</p>
              <p className="tactile-label">SECURE_CONNECTION_ESTABLISHED</p>
            </div>
            <Activity size={32} className="text-[#007AFF] animate-pulse" />
         </div>
      </footer>
    </div>
  );
}

function ArrowUpRight({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M7 7h10v10"/><path d="M7 17 17 7"/>
    </svg>
  );
}
