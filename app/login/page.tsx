'use client';

import { useState, useEffect, Suspense } from 'react';
import { insforge } from '@/lib/insforge';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Home, ArrowRight, ShieldCheck, Zap, Headphones, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

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
  const [rememberMe, setRememberMe] = useState(true);

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
          const { data: profileData } = await insforge.auth.getProfile(data.user.id);
          role = (profileData as any)?.role || 'user';
          status = (profileData as any)?.status || 'active';
        }

        if (email === 'gorepireo@gmail.com') {
          role = 'admin';
          status = 'active';
        }

        if (status === 'pending_approval' && (role === 'worker' || role === 'shopkeeper')) {
          setError('Account pending approval. You will be notified once your profile is verified.');
          setLoading(false);
          return;
        }

        // Handle token persistence
        const token = (data as any).session?.accessToken || (data as any).accessToken || (data as any).session?.access_token;
        if (token && typeof window !== 'undefined') {
          if (rememberMe) {
            localStorage.setItem('repireo_auth_token', token);
          } else {
            sessionStorage.setItem('repireo_auth_token', token);
          }
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
    <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-6">
      
      {/* Hero Section */}
      <section className="px-4 relative mb-6">
        <div className="relative z-10 max-w-[65%] pt-4">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-[0_5px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-100 mb-6">
            <img src="/logo.png" alt="Repireo Logo" className="w-10 h-10 object-contain" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black leading-[0.95] tracking-tight text-[#0A1629] uppercase">
            WELCOME<br />
            <span className="text-[#007AFF]">BACK.</span>
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed mt-4">
            Sign in to continue managing your services, orders and account.
          </p>
        </div>

        {/* Hero Image */}
        <div className="absolute top-0 -right-24 w-[140%] max-w-[400px] h-64 z-0 pointer-events-none">
          <img src="/login_mechanic_3d.png" alt="Mechanic" className="w-full h-full object-contain relative z-10" />
        </div>
      </section>

      {/* Login Form */}
      <section className="px-4 mb-8 relative z-20">
        <div className="bg-white rounded-[2rem] p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] border border-slate-100">
          
          {successMsg && (
            <div className="p-3 mb-6 bg-green-50 rounded-xl border border-green-100 flex items-center gap-2">
              <ShieldCheck className="text-green-500 w-4 h-4 flex-shrink-0" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-green-600 leading-tight">{successMsg}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative flex items-center">
                <div className="absolute left-1.5 w-10 h-10 bg-blue-50/80 rounded-xl flex items-center justify-center pointer-events-none">
                  <Mail className="w-5 h-5 text-[#007AFF]" />
                </div>
                <input 
                  required 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 bg-[#F8FAFC] pl-14 pr-4 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-1 focus:ring-[#007AFF]/30 transition-all outline-none placeholder:text-slate-400"
                  placeholder="Enter your email address" 
                />
              </div>
            </div>
            
            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative flex items-center">
                <div className="absolute left-1.5 w-10 h-10 bg-blue-50/80 rounded-xl flex items-center justify-center pointer-events-none">
                  <Lock className="w-5 h-5 text-[#007AFF]" />
                </div>
                <input 
                  required 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 bg-[#F8FAFC] pl-14 pr-12 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-1 focus:ring-[#007AFF]/30 transition-all outline-none placeholder:text-slate-400"
                  placeholder="Enter your password" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between pt-1">
               <label className="flex items-center gap-2 cursor-pointer">
                 <input 
                   type="checkbox" 
                   checked={rememberMe}
                   onChange={(e) => setRememberMe(e.target.checked)}
                   className="w-4 h-4 rounded border-slate-300 text-[#007AFF] focus:ring-[#007AFF]" 
                 />
                 <span className="text-[10px] font-bold text-slate-500">Remember me</span>
               </label>
               <Link href="/forgot-password" className="text-[10px] font-bold text-[#007AFF] hover:underline">
                 Forgot password?
               </Link>
            </div>

            {error && <p className="text-[#FF3B30] text-[10px] font-bold uppercase tracking-widest p-3 bg-red-50 rounded-xl border border-red-100">{error}</p>}

            {/* Submit Button */}
            <button 
              disabled={loading}
              type="submit" 
              className="w-full h-14 bg-[#0A1629] text-white rounded-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors active:scale-95 mt-4"
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN'} <ArrowRight size={14} />
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-slate-100 flex-1"></div>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">NEW TO REPIREO?</span>
            <div className="h-px bg-slate-100 flex-1"></div>
          </div>

          {/* Create Account */}
          <Link href="/register" className="w-full h-14 bg-white text-[#0A1629] border border-slate-100 shadow-[0_5px_15px_-5px_rgba(0,0,0,0.05)] rounded-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors active:scale-95">
             CREATE ACCOUNT
          </Link>
          
        </div>
      </section>

      {/* Return to Home */}
      <section className="flex justify-center mb-8">
        <Link href="/" className="flex items-center gap-2 text-[#007AFF] text-[11px] font-bold hover:underline">
           <Home size={14} /> Return to Home
        </Link>
      </section>

      {/* Features Bar */}
      <section className="px-4 mb-10 overflow-x-auto pb-4 hide-scrollbar">
        <div className="flex gap-4 min-w-max">
          <div className="flex items-center gap-3 px-2 pr-6 border-r border-slate-200">
             <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#007AFF]">
               <ShieldCheck size={16} className="fill-[#007AFF]/20" />
             </div>
             <div>
               <h4 className="text-[8px] font-black text-slate-900 uppercase tracking-tight">Secure & Trusted</h4>
               <p className="text-[7px] text-slate-500">Your data is always<br/>safe with us</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3 px-2 pr-6 border-r border-slate-200">
             <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-[#FF9500]">
               <Zap size={16} className="fill-[#FF9500]/20" />
             </div>
             <div>
               <h4 className="text-[8px] font-black text-slate-900 uppercase tracking-tight">Fast & Reliable</h4>
               <p className="text-[7px] text-slate-500">Quick access to<br/>your services</p>
             </div>
          </div>

          <div className="flex items-center gap-3 px-2 pr-6 border-r border-slate-200">
             <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
               <Headphones size={16} />
             </div>
             <div>
               <h4 className="text-[8px] font-black text-slate-900 uppercase tracking-tight">24/7 Support</h4>
               <p className="text-[7px] text-slate-500">We're here to help<br/>you anytime</p>
             </div>
          </div>

          <div className="flex items-center gap-3 px-2 pr-6">
             <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500">
               <CheckCircle2 size={16} className="fill-green-500/20" />
             </div>
             <div>
               <h4 className="text-[8px] font-black text-slate-900 uppercase tracking-tight">Verified Platform</h4>
               <p className="text-[7px] text-slate-500">Trusted by 10,000+<br/>customers</p>
             </div>
          </div>
        </div>
      </section>
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