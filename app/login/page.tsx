'use client';

import { useState, useEffect, Suspense } from 'react';
import { insforge } from '@/lib/insforge';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered')) {
      setSuccessMsg('Registration successful. Please sign in to continue.');
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
        // First try to get role from the users table (primary source of truth)
        let role = 'user';
        let status = 'active';

        const { data: usersRow } = await insforge.database
          .from('users')
          .select('role, status')
          .eq('email', email)
          .maybeSingle();

        if (usersRow) {
          role = (usersRow as any).role || 'user';
          status = (usersRow as any).status || 'active';
        } else {
          // Fallback to auth profile
          const { data: profileData } = await insforge.auth.getProfile(data.user.id);
          role = (profileData as any)?.role || 'user';
          status = (profileData as any)?.status || 'active';
        }

        // Special override: company email is always admin
        if (email === 'gorepireo@gmail.com') {
          role = 'admin';
          status = 'active';
        }

        if (status === 'pending_approval' && (role === 'worker' || role === 'shopkeeper')) {
          setError('Account pending approval. You will be notified once your profile is verified.');
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
        
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center p-2 shadow-2xl shadow-black/5 mx-auto transition-transform border border-black/[0.03]">
              <img src="/logo.png" alt="Repireo" className="w-full h-full object-contain" />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-bold uppercase tracking-tighter skew-title leading-tight">
              Welcome <br />
              <span className="text-[#007AFF]">Back.</span>
            </h1>
            <p className="tactile-label tracking-[0.4em] text-slate-400">Sign In to Repireo</p>
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
              <label className="tactile-label ml-2">Email Address</label>
              <input 
                required 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 bg-black/[0.02] px-5 rounded-2xl text-sm font-medium focus:bg-white focus:shadow-[0_0_20px_rgba(0,122,255,0.05)] transition-all outline-none" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="tactile-label ml-2">Password</label>
              <div className="relative">
                <input 
                  required 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 bg-black/[0.02] pl-5 pr-12 rounded-2xl text-sm font-medium focus:bg-white focus:shadow-[0_0_20px_rgba(0,122,255,0.05)] transition-all outline-none" 
                  placeholder="••••••••" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && <p className="text-[#FF3B30] text-[10px] font-bold uppercase tracking-widest p-4 bg-red-50 rounded-2xl border border-red-100">{error}</p>}

            <button 
              disabled={loading}
              type="submit" 
              className="btn-primary w-full h-14 !text-[10px]"
            >
              {loading ? 'Signing In...' : 'Sign In'} 
            </button>
          </form>

          <div className="pt-8 text-center space-y-4">
             <p className="tactile-label !text-slate-400">
                Don't have an account?{' '}
                <Link href="/register" className="text-[#007AFF] font-bold ml-1 hover:underline">
                  Create Account
                </Link>
             </p>
             <Link href="/" className="inline-block tactile-label !text-slate-300 hover:text-black transition-colors pt-2">
                Return to Home
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