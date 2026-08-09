'use client';

import { useState, useEffect } from 'react';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Store, CheckCircle2, XCircle, Clock, Users,
  Plus, X, RefreshCw, LogOut, AlertTriangle, Eye
} from 'lucide-react';

type Application = {
  id: string;
  shop_name: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  password?: string;
  created_at?: string;
};

type WorkerApp = {
  id: string;
  app_id: string;
  from_name: string;
  email: string;
  mobile: string;
  service: string;
  experience: number;
  address: string;
  user_status: string;
  other_skills?: string;
  specializations?: string[];
  category_tokens?: string[];
  state?: string;
  district?: string;
  pincode?: string;
  created_at?: string;
};

type Tab = 'shops' | 'workers' | 'add';

export default function AdminPanel() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('shops');
  const [applications, setApplications] = useState<Application[]>([]);
  const [workers, setWorkers] = useState<WorkerApp[]>([]);
  const [selectedWorkerDetails, setSelectedWorkerDetails] = useState<WorkerApp | null>(null);
  const [loadingApps, setLoadingApps] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [addForm, setAddForm] = useState({
    shop_name: '', owner_name: '', email: '', phone: '', address: '', password: ''
  });
  const [addLoading, setAddLoading] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading) {
      if (!user) { router.push('/login'); return; }
      const isAdmin = 
        user?.email === 'admin@23456' || 
        user?.email === 'admin@23456.com' || 
        user?.email === 'gorepireo@gmail.com' || 
        (profile as any)?.role === 'admin' ||
        (typeof window !== 'undefined' && localStorage.getItem('repireo_admin_logged_in') === 'true');
      if (!isAdmin) { router.push('/'); return; }
    }
  }, [user, profile, authLoading, router]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async () => {
    setLoadingApps(true);
    try {
      const { data: shopData } = await insforge.database.from('shop_applications').select('*');
      if (shopData) setApplications(shopData as Application[]);

      const { data: workerData } = await insforge.database.from('worker_applications').select('*');
      const { data: userData } = await insforge.database.from('users').select('id, status').eq('role', 'worker');
      
      if (workerData && userData) {
        const merged = (workerData as any[]).map(w => {
          const user = userData.find(u => u.id === w.app_id);
          return { ...w, user_status: user ? user.status : 'pending_approval' };
        });
        setWorkers(merged);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (app: Application) => {
    setActionLoading(app.id);
    try {
      // 1. Mark application as approved
      const { error: appErr } = await insforge.database
        .from('shop_applications')
        .update({ status: 'approved' })
        .eq('id', app.id);
      if (appErr) throw appErr;

      // 2. Check if user exists
      let { data: existingUser } = await insforge.database
        .from('users')
        .select('id')
        .eq('email', app.email)
        .maybeSingle();

      let userId = (existingUser as any)?.id;

      // If user does not exist, create Auth user and Users table entry
      if (!userId && app.password) {
        const { data: signUpData, error: signUpError } = await insforge.auth.signUp({
          email: app.email,
          password: app.password,
          name: app.owner_name,
        });
        
        if (signUpError && !signUpError.message.includes('already registered')) throw signUpError;
        
        userId = signUpData?.user?.id;
        
        if (userId) {
          await insforge.database.from('users').upsert({
            id: userId,
            email: app.email,
            name: app.owner_name,
            role: 'shopkeeper',
            phone: app.phone,
            status: 'active',
            email_verified: true,
          });
        }
      } else if (userId) {
        // Update existing user status
        await insforge.database
          .from('users')
          .update({ status: 'active', role: 'shopkeeper' })
          .eq('id', userId);
      }

      if (!userId) throw new Error("Could not determine user ID for the shop owner.");

      // 3. Transfer data to shops table
      const { error: shopInsertErr } = await insforge.database.from('shops').insert({
        owner_id: userId,
        name: app.shop_name,
        owner_name: app.owner_name,
        email: app.email,
        phone: app.phone,
        address: app.address,
        status: 'active'
      });
      
      if (shopInsertErr && !shopInsertErr.message.includes('duplicate')) {
         throw shopInsertErr;
      }

      setApplications(prev =>
        prev.map(a => a.id === app.id ? { ...a, status: 'approved' } : a)
      );
      showToast(`${app.owner_name}'s application approved!`);
    } catch (err: any) {
      showToast(err.message || 'Approval failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (app: Application) => {
    setActionLoading(app.id + '_reject');
    try {
      const { error } = await insforge.database
        .from('shop_applications')
        .update({ status: 'rejected' })
        .eq('id', app.id);
      if (error) throw error;

      setApplications(prev =>
        prev.map(a => a.id === app.id ? { ...a, status: 'rejected' } : a)
      );
      showToast(`${app.owner_name}'s application rejected.`, 'error');
    } catch (err: any) {
      showToast(err.message || 'Rejection failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveWorker = async (worker: WorkerApp) => {
    setActionLoading(worker.id);
    try {
      // 1. Update user status to active
      const { error } = await insforge.database.from('users').update({ status: 'active' }).eq('id', worker.app_id);
      if (error) throw error;
      
      // 2. Transfer data to workers table
      const { error: workerInsertErr } = await insforge.database.from('workers').insert({
        app_id: worker.app_id,
        user_id: worker.app_id,
        from_name: worker.from_name,
        email: worker.email,
        mobile: worker.mobile,
        service: worker.service,
        experience: worker.experience,
        address: worker.address,
        status: 'offline',
        login_access: true,
        role: 'worker'
      });

      if (workerInsertErr && !workerInsertErr.message.includes('duplicate')) {
        throw workerInsertErr;
      }

      setWorkers(prev => prev.map(w => w.id === worker.id ? { ...w, user_status: 'active' } : w));
      showToast(`${worker.from_name}'s application approved!`);
    } catch (err: any) {
      showToast(err.message || 'Approval failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectWorker = async (worker: WorkerApp) => {
    setActionLoading(worker.id + '_reject');
    try {
      const { error } = await insforge.database.from('users').update({ status: 'rejected' }).eq('id', worker.app_id);
      if (error) throw error;
      setWorkers(prev => prev.map(w => w.id === worker.id ? { ...w, user_status: 'rejected' } : w));
      showToast(`${worker.from_name}'s application rejected.`, 'error');
    } catch (err: any) {
      showToast(err.message || 'Rejection failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddShopkeeper = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      // 1. Create auth user via insforge
      const { data: signUpData, error: signUpError } = await insforge.auth.signUp({
        email: addForm.email,
        password: addForm.password,
        name: addForm.owner_name,
      });

      let userId: string | null = null;

      if (signUpError) {
        // User may already exist - check users table
        const { data: existingUser } = await insforge.database
          .from('users')
          .select('id')
          .eq('email', addForm.email)
          .maybeSingle();
        if (!existingUser) throw signUpError;
        userId = (existingUser as any).id;
      } else {
        userId = signUpData?.user?.id ?? null;
      }

      if (!userId) throw new Error('Could not determine user ID.');

      // 2. Upsert into users table
      await insforge.database.from('users').upsert({
        id: userId,
        email: addForm.email,
        name: addForm.owner_name,
        role: 'shopkeeper',
        phone: addForm.phone,
        status: 'active',
        email_verified: true,
      });

      // 3. Insert into shop_applications
      await insforge.database.from('shop_applications').insert({
        shop_name: addForm.shop_name,
        owner_name: addForm.owner_name,
        email: addForm.email,
        phone: addForm.phone,
        address: addForm.address,
        password: addForm.password,
        status: 'approved',
      });

      // 4. Insert into shops
      await insforge.database.from('shops').insert({
        owner_id: userId,
        name: addForm.shop_name,
        owner_name: addForm.owner_name,
        email: addForm.email,
        phone: addForm.phone,
        address: addForm.address,
        status: 'active'
      });

      showToast(`Shopkeeper ${addForm.owner_name} created and approved!`);
      setAddForm({ shop_name: '', owner_name: '', email: '', phone: '', address: '', password: '' });
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to add shopkeeper', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  const currentPending = tab === 'shops' ? applications.filter(a => a.status === 'pending') : (tab === 'workers' ? workers.filter(w => w.user_status === 'pending_approval') : []);
  const currentApproved = tab === 'shops' ? applications.filter(a => a.status === 'approved') : (tab === 'workers' ? workers.filter(w => w.user_status === 'active') : []);
  const currentRejected = tab === 'shops' ? applications.filter(a => a.status === 'rejected') : (tab === 'workers' ? workers.filter(w => w.user_status === 'rejected') : []);

  if (authLoading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32 relative">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-2xl ${toast.type === 'success' ? 'bg-black' : 'bg-[#FF3B30]'}`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-12 md:py-20 space-y-8 sm:space-y-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sm:gap-8">
          <div className="space-y-2 sm:space-y-4 max-w-full">
            <div className="flex items-center gap-2 sm:gap-3 text-[#007AFF]">
              <div className="w-6 sm:w-8 h-[2px] bg-current" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.6em]">Go_Repireo Control Center</span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] sm:leading-[0.85] skew-title">
              ADMIN <br />
              <span className="text-[#007AFF]">PANEL.</span>
            </h1>
            <p className="tactile-label !text-slate-400 truncate max-w-[280px] sm:max-w-none">Signed in as {user?.email}</p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <button onClick={fetchData} className="w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200/60 hover:bg-black hover:text-white transition-all shrink-0">
              <RefreshCw size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button onClick={signOut} className="flex-1 sm:flex-initial flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-6 h-11 sm:h-12 bg-black text-white rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-[#FF3B30] transition-all">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {[
            { label: 'Pending', count: currentPending.length, color: '#FFB800', Icon: Clock },
            { label: 'Approved', count: currentApproved.length, color: '#34C759', Icon: CheckCircle2 },
            { label: 'Rejected', count: currentRejected.length, color: '#FF3B30', Icon: XCircle },
          ].map(({ label, count, color, Icon }) => (
            <div key={label} className="king-card bg-white !p-3.5 sm:!p-6 md:!p-10 flex flex-col gap-2 sm:gap-4 border border-slate-100">
              <Icon size={20} className="sm:w-6 sm:h-6" style={{ color }} />
              <div>
                <p className="text-xl sm:text-3xl md:text-5xl font-black tracking-tighter">{count}</p>
                <p className="tactile-label mt-0.5 sm:mt-1 text-[8px] sm:text-[10px] truncate">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden gap-2 sm:gap-3 pb-1">
          {([['shops', 'Shop Applications'], ['workers', 'Worker Applications'], ['add', 'Add Shopkeeper']] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap shrink-0 transition-all ${tab === t ? 'bg-black text-white' : 'bg-black/[0.04] text-slate-400 hover:bg-black/[0.08]'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Shops Tab */}
        {tab === 'shops' && (
          <div className="space-y-6 sm:space-y-8">
            {loadingApps ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : applications.length === 0 ? (
              <div className="king-card py-16 sm:py-24 text-center flex flex-col items-center border border-slate-100">
                <Store className="w-10 h-10 sm:w-12 sm:h-12 text-black/10 mb-4" />
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-black/20">No Applications</h3>
                <p className="tactile-label mt-2 text-[8px] sm:text-[10px]">No shopkeeper applications have been submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-3.5 sm:space-y-4">
                {applications.map((app) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="king-card bg-white !p-4 sm:!p-6 md:!p-8 border border-slate-100"
                  >
                    <div className="flex flex-col md:flex-row gap-5 md:items-center justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center justify-between sm:justify-start gap-3 flex-wrap">
                          <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900">{app.shop_name}</h3>
                          <span className={`px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${
                            app.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                            app.status === 'approved' ? 'bg-green-50 text-green-600' :
                            'bg-red-50 text-red-500'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                          <div>
                            <p className="tactile-label mb-0.5 text-[8px] sm:text-[10px]">Owner</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 break-words">{app.owner_name}</p>
                          </div>
                          <div>
                            <p className="tactile-label mb-0.5 text-[8px] sm:text-[10px]">Email</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 break-all">{app.email}</p>
                          </div>
                          <div>
                            <p className="tactile-label mb-0.5 text-[8px] sm:text-[10px]">Phone</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-800">{app.phone || '—'}</p>
                          </div>
                          <div>
                            <p className="tactile-label mb-0.5 text-[8px] sm:text-[10px]">Address</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 break-words">{app.address || '—'}</p>
                          </div>
                        </div>
                      </div>

                      {app.status === 'pending' && (
                        <div className="flex flex-row md:flex-row gap-2.5 sm:gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                          <button
                            onClick={() => handleApprove(app)}
                            disabled={actionLoading === app.id}
                            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 h-10 sm:h-12 bg-black text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#34C759] transition-all disabled:opacity-50"
                          >
                            {actionLoading === app.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : <CheckCircle2 size={14} />}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(app)}
                            disabled={actionLoading === app.id + '_reject'}
                            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 h-10 sm:h-12 bg-black/[0.04] text-black/60 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#FF3B30] hover:text-white transition-all disabled:opacity-50"
                          >
                            {actionLoading === app.id + '_reject' ? (
                              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : <XCircle size={14} />}
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Workers Tab */}
        {tab === 'workers' && (
          <div className="space-y-6 sm:space-y-8">
            {loadingApps ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : workers.length === 0 ? (
              <div className="king-card py-16 sm:py-24 text-center flex flex-col items-center border border-slate-100">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-black/10 mb-4" />
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-black/20">No Applications</h3>
                <p className="tactile-label mt-2 text-[8px] sm:text-[10px]">No worker applications have been submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-3.5 sm:space-y-4">
                {workers.map((worker) => (
                  <motion.div
                    key={worker.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="king-card bg-white !p-4 sm:!p-6 md:!p-8 border border-slate-100"
                  >
                    <div className="flex flex-col md:flex-row gap-5 md:items-center justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center justify-between sm:justify-start gap-3 flex-wrap">
                          <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900">{worker.from_name}</h3>
                          <span className={`px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${
                            worker.user_status === 'pending_approval' ? 'bg-yellow-50 text-yellow-600' :
                            worker.user_status === 'active' ? 'bg-green-50 text-green-600' :
                            'bg-red-50 text-red-500'
                          }`}>
                            {worker.user_status === 'pending_approval' ? 'pending' : worker.user_status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                          <div>
                            <p className="tactile-label mb-0.5 text-[8px] sm:text-[10px]">Service</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 break-words">{worker.service}</p>
                          </div>
                          <div>
                            <p className="tactile-label mb-0.5 text-[8px] sm:text-[10px]">Experience</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-800">{worker.experience} Years</p>
                          </div>
                          <div>
                            <p className="tactile-label mb-0.5 text-[8px] sm:text-[10px]">Mobile</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-800">{worker.mobile || '—'}</p>
                          </div>
                          <div>
                            <p className="tactile-label mb-0.5 text-[8px] sm:text-[10px]">Email</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 break-all">{worker.email || '—'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                        <button
                          onClick={() => setSelectedWorkerDetails(worker)}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 h-10 sm:h-12 bg-blue-50 text-[#007AFF] hover:bg-blue-100 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all"
                        >
                          <Eye size={14} />
                          <span>More Details</span>
                        </button>

                        {worker.user_status === 'pending_approval' && (
                          <>
                            <button
                              onClick={() => handleApproveWorker(worker)}
                              disabled={actionLoading === worker.id}
                              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 sm:px-6 h-10 sm:h-12 bg-black text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#34C759] transition-all disabled:opacity-50"
                            >
                              {actionLoading === worker.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : <CheckCircle2 size={14} />}
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectWorker(worker)}
                              disabled={actionLoading === worker.id + '_reject'}
                              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 sm:px-6 h-10 sm:h-12 bg-black/[0.04] text-black/60 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#FF3B30] hover:text-white transition-all disabled:opacity-50"
                            >
                              {actionLoading === worker.id + '_reject' ? (
                                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : <XCircle size={14} />}
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Shopkeeper Tab */}
        {tab === 'add' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="king-card bg-white !p-5 sm:!p-8 md:!p-12 border border-slate-100">
            <div className="space-y-2 sm:space-y-4 mb-6 sm:mb-10">
              <div className="flex items-center gap-2 sm:gap-3 text-[#007AFF]">
                <div className="w-5 sm:w-6 h-[2px] bg-current" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em]">Manual Entry</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9] skew-title">
                ADD <br />
                <span className="text-[#007AFF]">SHOPKEEPER.</span>
              </h2>
              <p className="tactile-label !text-slate-400 !tracking-normal !lowercase !font-medium text-xs">
                Creates and immediately activates the shopkeeper account.
              </p>
            </div>

            <form onSubmit={handleAddShopkeeper} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {[
                { label: 'Shop Name', name: 'shop_name', type: 'text', placeholder: 'My Repair Shop' },
                { label: 'Owner Name', name: 'owner_name', type: 'text', placeholder: 'Full name' },
                { label: 'Email Address', name: 'email', type: 'email', placeholder: 'shop@example.com' },
                { label: 'Password', name: 'password', type: 'password', placeholder: '••••••••' },
                { label: 'Phone Number', name: 'phone', type: 'text', placeholder: '+91 00000 00000' },
                { label: 'Address', name: 'address', type: 'text', placeholder: 'Area, City' },
              ].map((field) => (
                <div key={field.name} className="space-y-1.5 sm:space-y-2">
                  <label className="tactile-label ml-1 text-[8px] sm:text-[10px]">{field.label}</label>
                  <input
                    required
                    type={field.type}
                    placeholder={field.placeholder}
                    value={(addForm as any)[field.name]}
                    onChange={(e) => setAddForm({ ...addForm, [field.name]: e.target.value })}
                    className="w-full h-12 sm:h-14 bg-black/[0.02] px-4 sm:px-5 rounded-2xl text-xs sm:text-sm font-medium focus:bg-white transition-all outline-none border border-transparent focus:border-[#007AFF]/20"
                  />
                </div>
              ))}

              <div className="md:col-span-2 pt-2 sm:pt-4">
                <button
                  type="submit"
                  disabled={addLoading}
                  className="btn-primary w-full h-14 sm:h-16 text-[9px] sm:text-[10px]"
                >
                  {addLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus size={18} /> Create & Activate Shopkeeper
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>

      {/* Worker Full Details Modal */}
      <AnimatePresence>
        {selectedWorkerDetails && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-slate-100 shadow-2xl space-y-6"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#007AFF]">Worker Application Details</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      selectedWorkerDetails.user_status === 'pending_approval' ? 'bg-yellow-50 text-yellow-600' :
                      selectedWorkerDetails.user_status === 'active' ? 'bg-green-50 text-green-600' :
                      'bg-red-50 text-red-500'
                    }`}>
                      {selectedWorkerDetails.user_status === 'pending_approval' ? 'Pending Approval' : selectedWorkerDetails.user_status}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 mt-1">{selectedWorkerDetails.from_name}</h3>
                </div>
                <button
                  onClick={() => setSelectedWorkerDetails(null)}
                  className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-black hover:text-white transition-all shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Detailed Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                  <p className="tactile-label mb-1 text-[8px]">Full Name</p>
                  <p className="text-sm font-bold text-slate-900">{selectedWorkerDetails.from_name || '—'}</p>
                </div>
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                  <p className="tactile-label mb-1 text-[8px]">Email Address</p>
                  <p className="text-sm font-bold text-slate-900 break-all">{selectedWorkerDetails.email || '—'}</p>
                </div>
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                  <p className="tactile-label mb-1 text-[8px]">Phone Number</p>
                  <p className="text-sm font-bold text-slate-900">{selectedWorkerDetails.mobile || '—'}</p>
                </div>
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                  <p className="tactile-label mb-1 text-[8px]">Years of Experience</p>
                  <p className="text-sm font-bold text-slate-900">{selectedWorkerDetails.experience} Years</p>
                </div>
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 sm:col-span-2">
                  <p className="tactile-label mb-1 text-[8px]">Primary Service Category</p>
                  <p className="text-sm font-bold text-slate-900">{selectedWorkerDetails.service || '—'}</p>
                </div>
                {selectedWorkerDetails.specializations && selectedWorkerDetails.specializations.length > 0 && (
                  <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 sm:col-span-2">
                    <p className="tactile-label mb-2 text-[8px]">Selected Specializations</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedWorkerDetails.specializations.map((spec, i) => (
                        <span key={i} className="bg-blue-50 text-[#007AFF] text-[10px] font-bold px-3 py-1 rounded-full border border-blue-100">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                  <p className="tactile-label mb-1 text-[8px]">State & District</p>
                  <p className="text-sm font-bold text-slate-900">{selectedWorkerDetails.state || 'UP'}, {selectedWorkerDetails.district || 'Etawah'}</p>
                </div>
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                  <p className="tactile-label mb-1 text-[8px]">Pincode & Location</p>
                  <p className="text-sm font-bold text-slate-900">{selectedWorkerDetails.pincode || '206001'} ({selectedWorkerDetails.address || 'Etawah'})</p>
                </div>
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 sm:col-span-2">
                  <p className="tactile-label mb-1 text-[8px]">Repair Description / Special Skills</p>
                  <p className="text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedWorkerDetails.other_skills || 'No additional description provided.'}
                  </p>
                </div>
              </div>

              {/* Action Footer inside Modal */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setSelectedWorkerDetails(null)}
                  className="px-5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all"
                >
                  Close
                </button>
                {selectedWorkerDetails.user_status === 'pending_approval' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleApproveWorker(selectedWorkerDetails);
                        setSelectedWorkerDetails(null);
                      }}
                      disabled={actionLoading === selectedWorkerDetails.id}
                      className="flex items-center gap-2 px-5 h-11 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#34C759] transition-all disabled:opacity-50"
                    >
                      <CheckCircle2 size={14} /> Approve Worker
                    </button>
                    <button
                      onClick={() => {
                        handleRejectWorker(selectedWorkerDetails);
                        setSelectedWorkerDetails(null);
                      }}
                      disabled={actionLoading === selectedWorkerDetails.id + '_reject'}
                      className="flex items-center gap-2 px-5 h-11 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#FF3B30] hover:text-white transition-all disabled:opacity-50"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
