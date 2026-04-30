'use client';

import { useState, useEffect, Suspense } from 'react';
import { insforge } from '@/lib/insforge';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (searchParams.get('registered')) {
      setSuccessMsg('Registration Successful. Please sign in below.');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: loginError } = await insforge.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      if (data?.user) {
        const { data: profileData } = await insforge.auth.getProfile(data.user.id);
        const role = (profileData as any)?.role || 'user';
        const status = (profileData as any)?.status || 'active';

        if (status === 'pending_approval' && (role === 'worker' || role === 'shopkeeper')) {
          setError('Account Setup in Progress. Dashboard access will be available once your profile is verified.');
          setLoading(false);
          return;
        }
        
        await refresh();
        
        if (role === 'admin') {
          router.push('/admin');
        } else if (role === 'shopkeeper') {
          router.push('/dashboard/shop');
        } else if (role === 'worker') {
          router.push('/dashboard/worker');
        } else {
          router.push('/dashboard/user');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Sign in failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6 pb-24">
      <div className="max-w-md w-full space-y-10">
        
        {/* Branding & Header */}
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center p-2 shadow-2xl shadow-black/5 mx-auto group-hover:rotate-6 transition-transform border border-black/[0.03]">
              <img src="/logo.png" alt="Repireo" className="w-full h-full object-contain" />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-bold uppercase tracking-tighter skew-title leading-tight">
              IDENTITY <br />
              <span className="text-[#007AFF]">VERIFY.</span>
            </h1>
            <p className="tactile-label tracking-[0.4em] text-slate-400">NEAFER TACTICAL AUTH</p>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="king-card bg-white/70 backdrop-blur-xl border-white/50 !p-8 md:!p-10 shadow-2xl space-y-8"
        >
          {successMsg && (
            <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-3">
              <ShieldCheck className="text-green-500 w-5 h-5 flex-shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 leading-tight">{successMsg}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="tactile-label ml-2">Login Identifier</label>
              <input 
                required 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 bg-black/[0.02] px-5 rounded-2xl text-sm font-medium focus:bg-white focus:shadow-[0_0_20px_rgba(0,122,255,0.05)] transition-all outline-none" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="tactile-label ml-2">Secure Protocol Key</label>
              <div className="relative">
                <input 
                  required 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 bg-black/[0.02] px-5 rounded-2xl text-sm font-medium focus:bg-white focus:shadow-[0_0_20px_rgba(0,122,255,0.05)] transition-all outline-none" 
                  placeholder="••••••••" 
                />
                <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              </div>
            </div>

            {error && <p className="text-[#FF3B30] text-[10px] font-bold uppercase tracking-widest p-4 bg-red-50 rounded-2xl border border-red-100">{error}</p>}

            <button 
              disabled={loading}
              type="submit" 
              className="btn-primary w-full h-14 !text-[10px]"
            >
              {loading ? 'AUTHENTICATING...' : 'ESTABLISH LINK'} 
            </button>
          </form>

          <div className="pt-8 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] text-center space-y-4">
             <p className="tactile-label !text-slate-400">
                New Unit Deployment? {' '}
                <Link href="/register" className="text-[#007AFF] font-bold ml-1 hover:underline">
                  INITIALIZE ACCOUNT
                </Link>
             </p>
             <Link href="/" className="inline-block tactile-label !text-slate-300 hover:text-black transition-colors pt-2">
                Return to Strategic Home
             </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
