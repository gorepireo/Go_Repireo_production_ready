'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, KeyRound, ArrowRight, ShieldCheck, Home, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const tokenParam = searchParams.get('token') || searchParams.get('otp') || searchParams.get('code');
    const emailParam = searchParams.get('email');

    if (emailParam) setEmail(emailParam);
    if (tokenParam) {
      setOtp(tokenParam);
      setStep('reset');
    }
  }, [searchParams]);

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/send-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP email.');
      }

      setSuccessMsg('OTP code sent to your Gmail inbox! Valid for 5 minutes.');
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please verify your email address.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      setError('Please enter the 6-digit OTP code and your new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      setSuccessMsg('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login?registered=1');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The OTP code may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-6">
      
      {/* Top Bar */}
      <div className="px-4 mb-4 flex items-center justify-between">
        <Link href="/login" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#007AFF] transition-colors">
          <ArrowLeft size={16} /> Back to Sign In
        </Link>
      </div>

      {/* Hero Section */}
      <section className="px-4 relative mb-6">
        <div className="relative z-10 max-w-[75%] pt-2">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-[0_5px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-100 mb-4">
            <img src="/logo.png" alt="Go_Repireo Logo" className="w-10 h-10 object-contain" />
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black leading-[0.95] tracking-tight text-[#0A1629] uppercase">
            RESET YOUR<br />
            <span className="text-[#007AFF]">PASSWORD.</span>
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed mt-3">
            {step === 'request' 
              ? "Enter your email address to receive a 6-digit OTP code in your Gmail inbox." 
              : `Enter the 6-digit OTP sent to ${email} (valid for 5 minutes) and choose your new password.`}
          </p>
        </div>

        {/* Decorative Badge */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-blue-50/50 rounded-full flex items-center justify-center border border-blue-100 pointer-events-none">
          <KeyRound className="w-10 h-10 text-[#007AFF]/60" />
        </div>
      </section>

      {/* Form Container */}
      <section className="px-4 mb-8 relative z-20">
        <div className="bg-white rounded-[2rem] p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] border border-slate-100">
          
          {/* Status Messages */}
          {successMsg && (
            <div className="p-4 mb-6 bg-green-50 rounded-xl border border-green-100 flex items-start gap-2.5">
              <CheckCircle2 className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-green-700 leading-relaxed">{successMsg}</p>
            </div>
          )}

          {error && (
            <div className="p-4 mb-6 bg-red-50 rounded-xl border border-red-100 flex items-start gap-2.5">
              <ShieldCheck className="text-red-500 w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-red-600 leading-relaxed">{error}</p>
            </div>
          )}

          {step === 'request' ? (
            /* Step 1: Send Reset Request Form */
            <form onSubmit={handleSendResetEmail} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Gmail Email Address</label>
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
                    placeholder="Enter your registered email" 
                  />
                </div>
              </div>

              <button 
                disabled={loading}
                type="submit" 
                className="w-full h-14 bg-[#0A1629] text-white rounded-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors active:scale-95 mt-4 shadow-lg shadow-black/5"
              >
                {loading ? 'SENDING OTP TO GMAIL...' : 'SEND OTP TO GMAIL'} <ArrowRight size={14} />
              </button>
            </form>
          ) : (
            /* Step 2: Reset Password Form (Enter OTP + New Password + Confirm Password) */
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">6-Digit Gmail OTP Code</label>
                  <span className="text-[9px] font-bold text-[#007AFF]">Valid for 5 mins</span>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-1.5 w-10 h-10 bg-blue-50/80 rounded-xl flex items-center justify-center pointer-events-none">
                    <KeyRound className="w-5 h-5 text-[#007AFF]" />
                  </div>
                  <input 
                    required 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full h-14 bg-[#F8FAFC] pl-14 pr-4 rounded-2xl text-base font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-[#007AFF]/30 transition-all outline-none placeholder:text-slate-400 tracking-wider"
                    placeholder="Enter 6-digit OTP code" 
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                <div className="relative flex items-center">
                  <div className="absolute left-1.5 w-10 h-10 bg-blue-50/80 rounded-xl flex items-center justify-center pointer-events-none">
                    <Lock className="w-5 h-5 text-[#007AFF]" />
                  </div>
                  <input 
                    required 
                    type={showPassword ? "text" : "password"} 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-14 bg-[#F8FAFC] pl-14 pr-12 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-1 focus:ring-[#007AFF]/30 transition-all outline-none placeholder:text-slate-400"
                    placeholder="Enter new password" 
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

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                <div className="relative flex items-center">
                  <div className="absolute left-1.5 w-10 h-10 bg-blue-50/80 rounded-xl flex items-center justify-center pointer-events-none">
                    <Lock className="w-5 h-5 text-[#007AFF]" />
                  </div>
                  <input 
                    required 
                    type={showPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-14 bg-[#F8FAFC] pl-14 pr-12 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-1 focus:ring-[#007AFF]/30 transition-all outline-none placeholder:text-slate-400"
                    placeholder="Confirm new password" 
                  />
                </div>
              </div>

              <button 
                disabled={loading}
                type="submit" 
                className="w-full h-14 bg-[#007AFF] text-white rounded-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-colors active:scale-95 mt-4 shadow-lg shadow-blue-500/20"
              >
                {loading ? 'RESETTING PASSWORD...' : 'CONFIRM & RESET PASSWORD'} <ArrowRight size={14} />
              </button>

              <div className="text-center pt-2 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={loading}
                  className="font-bold text-slate-500 hover:text-slate-700"
                >
                  Resend OTP Code
                </button>
                <Link href="/login" className="font-bold text-[#007AFF] hover:underline">
                  Sign in instead
                </Link>
              </div>
            </form>
          )}

        </div>
      </section>

      {/* Return to Home */}
      <section className="flex justify-center mb-8">
        <Link href="/" className="flex items-center gap-2 text-[#007AFF] text-[11px] font-bold hover:underline">
          <Home size={14} /> Return to Home
        </Link>
      </section>

    </div>
  );
}

export default function ForgotPassword() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  );
}
