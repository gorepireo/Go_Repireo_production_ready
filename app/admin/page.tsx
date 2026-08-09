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
};

type Tab = 'shops' | 'workers' | 'add';

export default function AdminPanel() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('shops');
  const [applications, setApplications] = useState<Application[]>([]);
  const [workers, setWorkers] = useState<WorkerApp[]>([]);
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

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20 space-y-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[#007AFF]">
              <div className="w-8 h-[2px] bg-current" />
              <span className="text-[10px] font-black uppercase tracking-[0.6em]">Go_Repireo Control Center</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] skew-title">
              ADMIN <br />
              <span className="text-[#007AFF]">PANEL.</span>
            </h1>
            <p className="tactile-label !text-slate-400">Signed in as {user?.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchData} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md hover:bg-black hover:text-white transition-all">
              <RefreshCw size={18} />
            </button>
            <button onClick={signOut} className="flex items-center gap-3 px-6 h-12 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#FF3B30] transition-all">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Pending', count: currentPending.length, color: '#FFB800', Icon: Clock },
            { label: 'Approved', count: currentApproved.length, color: '#34C759', Icon: CheckCircle2 },
            { label: 'Rejected', count: currentRejected.length, color: '#FF3B30', Icon: XCircle },
          ].map(({ label, count, color, Icon }) => (
            <div key={label} className="king-card bg-white !p-6 md:!p-10 flex flex-col gap-4">
              <Icon size={24} style={{ color }} />
              <div>
                <p className="text-3xl md:text-5xl font-black tracking-tighter">{count}</p>
                <p className="tactile-label mt-1">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-3">
          {([['shops', 'Shop Applications'], ['workers', 'Worker Applications'], ['add', 'Add Shopkeeper']] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-black text-white' : 'bg-black/[0.04] text-slate-400 hover:bg-black/[0.08]'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Shops Tab */}
        {tab === 'shops' && (
          <div className="space-y-8">
            {loadingApps ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : applications.length === 0 ? (
              <div className="king-card py-24 text-center flex flex-col items-center">
                <Store className="w-12 h-12 text-black/10 mb-4" />
                <h3 className="text-2xl font-black uppercase tracking-tighter text-black/20">No Applications</h3>
                <p className="tactile-label mt-2">No shopkeeper applications have been submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="king-card bg-white !p-6 md:!p-8"
                  >
                    <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-xl font-black uppercase tracking-tight">{app.shop_name}</h3>
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            app.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                            app.status === 'approved' ? 'bg-green-50 text-green-600' :
                            'bg-red-50 text-red-500'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="tactile-label mb-1">Owner</p>
                            <p className="text-sm font-bold">{app.owner_name}</p>
                          </div>
                          <div>
                            <p className="tactile-label mb-1">Email</p>
                            <p className="text-sm font-bold truncate">{app.email}</p>
                          </div>
                          <div>
                            <p className="tactile-label mb-1">Phone</p>
                            <p className="text-sm font-bold">{app.phone || '—'}</p>
                          </div>
                          <div>
                            <p className="tactile-label mb-1">Address</p>
                            <p className="text-sm font-bold truncate">{app.address || '—'}</p>
                          </div>
                        </div>
                      </div>

                      {app.status === 'pending' && (
                        <div className="flex gap-3 shrink-0">
                          <button
                            onClick={() => handleApprove(app)}
                            disabled={actionLoading === app.id}
                            className="flex items-center gap-2 px-6 h-12 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#34C759] transition-all disabled:opacity-50"
                          >
                            {actionLoading === app.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : <CheckCircle2 size={14} />}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(app)}
                            disabled={actionLoading === app.id + '_reject'}
                            className="flex items-center gap-2 px-6 h-12 bg-black/[0.04] text-black/60 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#FF3B30] hover:text-white transition-all disabled:opacity-50"
                          >
                            {actionLoading === app.id + '_reject' ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
          <div className="space-y-8">
            {loadingApps ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : workers.length === 0 ? (
              <div className="king-card py-24 text-center flex flex-col items-center">
                <Users className="w-12 h-12 text-black/10 mb-4" />
                <h3 className="text-2xl font-black uppercase tracking-tighter text-black/20">No Applications</h3>
                <p className="tactile-label mt-2">No worker applications have been submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workers.map((worker) => (
                  <motion.div
                    key={worker.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="king-card bg-white !p-6 md:!p-8"
                  >
                    <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-xl font-black uppercase tracking-tight">{worker.from_name}</h3>
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            worker.user_status === 'pending_approval' ? 'bg-yellow-50 text-yellow-600' :
                            worker.user_status === 'active' ? 'bg-green-50 text-green-600' :
                            'bg-red-50 text-red-500'
                          }`}>
                            {worker.user_status === 'pending_approval' ? 'pending' : worker.user_status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="tactile-label mb-1">Service</p>
                            <p className="text-sm font-bold">{worker.service}</p>
                          </div>
                          <div>
                            <p className="tactile-label mb-1">Experience</p>
                            <p className="text-sm font-bold">{worker.experience} Years</p>
                          </div>
                          <div>
                            <p className="tactile-label mb-1">Mobile</p>
                            <p className="text-sm font-bold">{worker.mobile || '—'}</p>
                          </div>
                          <div>
                            <p className="tactile-label mb-1">Email</p>
                            <p className="text-sm font-bold truncate">{worker.email || '—'}</p>
                          </div>
                        </div>
                      </div>

                      {worker.user_status === 'pending_approval' && (
                        <div className="flex gap-3 shrink-0">
                          <button
                            onClick={() => handleApproveWorker(worker)}
                            disabled={actionLoading === worker.id}
                            className="flex items-center gap-2 px-6 h-12 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#34C759] transition-all disabled:opacity-50"
                          >
                            {actionLoading === worker.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : <CheckCircle2 size={14} />}
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectWorker(worker)}
                            disabled={actionLoading === worker.id + '_reject'}
                            className="flex items-center gap-2 px-6 h-12 bg-black/[0.04] text-black/60 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#FF3B30] hover:text-white transition-all disabled:opacity-50"
                          >
                            {actionLoading === worker.id + '_reject' ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
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

        {/* Add Shopkeeper Tab */}
        {tab === 'add' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="king-card bg-white !p-8 md:!p-12">
            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-3 text-[#007AFF]">
                <div className="w-6 h-[2px] bg-current" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em]">Manual Entry</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9] skew-title">
                ADD <br />
                <span className="text-[#007AFF]">SHOPKEEPER.</span>
              </h2>
              <p className="tactile-label !text-slate-400 !tracking-normal !lowercase !font-medium">
                Creates and immediately activates the shopkeeper account.
              </p>
            </div>

            <form onSubmit={handleAddShopkeeper} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Shop Name', name: 'shop_name', type: 'text', placeholder: 'My Repair Shop' },
                { label: 'Owner Name', name: 'owner_name', type: 'text', placeholder: 'Full name' },
                { label: 'Email Address', name: 'email', type: 'email', placeholder: 'shop@example.com' },
                { label: 'Password', name: 'password', type: 'password', placeholder: '••••••••' },
                { label: 'Phone Number', name: 'phone', type: 'text', placeholder: '+91 00000 00000' },
                { label: 'Address', name: 'address', type: 'text', placeholder: 'Area, City' },
              ].map((field) => (
                <div key={field.name} className="space-y-2">
                  <label className="tactile-label ml-1">{field.label}</label>
                  <input
                    required
                    type={field.type}
                    placeholder={field.placeholder}
                    value={(addForm as any)[field.name]}
                    onChange={(e) => setAddForm({ ...addForm, [field.name]: e.target.value })}
                    className="w-full h-14 bg-black/[0.02] px-5 rounded-2xl text-sm font-medium focus:bg-white transition-all outline-none border border-transparent focus:border-[#007AFF]/20"
                  />
                </div>
              ))}

              <div className="md:col-span-2 pt-4">
                <button
                  type="submit"
                  disabled={addLoading}
                  className="btn-primary w-full h-16 text-[10px]"
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
    </div>
  );
}
