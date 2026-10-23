'use client';

import { FormEvent, Suspense, useEffect, useRef, useState } from 'react';
import { ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Headphones, Home, Phone, ShieldCheck, Zap } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

function normalizeIndianPhone(value: string) {
  const digits = value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  if (!/^\d{10}$/.test(digits)) throw new Error('Enter a valid 10-digit Indian mobile number.');
  return `+91${digits}`;
}

function LoginContent() {
  const router = useRouter();
  const search = useSearchParams();
  const { refresh } = useAuth();
  const verifier = useRef<RecaptchaVerifier | null>(null);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => () => verifier.current?.clear(), []);

  async function requestCode(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (!verifier.current) verifier.current = new RecaptchaVerifier(auth, 'phone-recaptcha', { size: 'normal' });
      setConfirmation(await signInWithPhoneNumber(auth, normalizeIndianPhone(phone), verifier.current));
    } catch (cause) {
      verifier.current?.clear();
      verifier.current = null;
      setError(cause instanceof Error ? cause.message : 'Unable to send the verification code.');
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    if (!confirmation || !/^\d{6}$/.test(code)) {
      setError('Enter the six-digit verification code.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const credential = await confirmation.confirm(code);
      const token = await credential.user.getIdTokenResult(true);
      const role = token.claims.admin === true ? 'admin' : token.claims.role;
      if (!['customer', 'worker', 'admin'].includes(String(role))) {
        await auth.signOut();
        throw new Error('This account has no trusted GO_REPIREO role. Contact support.');
      }
      await refresh();
      const requested = search.get('next');
      const safeNext = requested?.startsWith('/') && !requested.startsWith('//') ? requested : null;
      router.replace(safeNext || (role === 'admin' ? '/admin' : role === 'worker' ? '/dashboard/worker' : '/dashboard/user'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The verification code is invalid or expired.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] pb-24 pt-6 md:pt-12">
      <div className="mx-auto w-full max-w-md md:max-w-lg lg:max-w-xl">
        <section className="mb-6 px-4">
          <div className="relative flex min-h-[180px] items-center justify-between overflow-hidden rounded-3xl border border-slate-100/80 bg-white p-4 md:border-none md:bg-transparent md:p-0">
            <div className="relative z-10 max-w-[58%] pt-2 sm:max-w-[65%]">
              <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-[0_5px_15px_-5px_rgba(0,0,0,0.05)]">
                <img src="/logo.png" alt="Go_Repireo logo" className="size-8 object-contain" />
              </div>
              <h1 className="text-3xl font-black uppercase leading-[0.95] tracking-tight text-[#0A1629] sm:text-4xl md:text-5xl">
                Welcome<br /><span className="text-[#007AFF]">back.</span>
              </h1>
              <p className="mt-3 max-w-[210px] text-[11px] leading-relaxed text-slate-500">
                Sign in securely with the mobile number connected to your Go_Repireo account.
              </p>
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 z-0 flex h-full w-[42%] max-w-[220px] items-center justify-end">
              <img src="/login_mechanic_3d.png" alt="Go_Repireo mechanic" className="size-full object-contain object-right" />
            </div>
          </div>
        </section>

        <section className="relative z-20 mb-8 px-4">
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.04)] md:p-8">
            <form onSubmit={confirmation ? verifyCode : requestCode} className="space-y-5">
              {!confirmation ? (
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="ml-1 text-[8px] font-bold uppercase tracking-widest text-slate-400">Mobile number</label>
                  <div className="relative flex h-14 items-center rounded-2xl bg-[#F8FAFC] transition-all focus-within:bg-white focus-within:ring-1 focus-within:ring-[#007AFF]/30">
                    <div className="pointer-events-none absolute left-1.5 flex size-10 items-center justify-center rounded-xl bg-blue-50/80">
                      <Phone className="size-5 text-[#007AFF]" />
                    </div>
                    <span className="absolute left-14 text-sm font-semibold text-slate-500">+91</span>
                    <input id="phone" value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" autoComplete="tel" maxLength={10} className="h-full min-w-0 flex-1 bg-transparent pl-[5.4rem] pr-4 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400" placeholder="Enter mobile number" required />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label htmlFor="code" className="ml-1 text-[8px] font-bold uppercase tracking-widest text-slate-400">Verification code</label>
                  <input id="code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className="h-14 w-full rounded-2xl bg-[#F8FAFC] px-5 text-center text-lg font-bold tracking-[0.45em] text-slate-900 outline-none transition-all focus:bg-white focus:ring-1 focus:ring-[#007AFF]/30" placeholder="000000" required />
                  <p className="ml-1 pt-1 text-[10px] text-slate-500">Code sent to +91 {phone}</p>
                </div>
              )}

              <div id="phone-recaptcha" className="overflow-hidden rounded-xl" />
              {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-[10px] font-bold uppercase tracking-wider text-[#FF3B30]">{error}</p>}

              <button disabled={busy} className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#0A1629] text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-black active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
                {busy ? 'Please wait…' : confirmation ? 'Verify and continue' : 'Send verification code'} <ArrowRight size={14} />
              </button>

              {confirmation && (
                <button type="button" onClick={() => { setConfirmation(null); setCode(''); setError(''); }} className="w-full text-[10px] font-bold uppercase tracking-widest text-[#007AFF] hover:underline">
                  Use another number
                </button>
              )}
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">New to Repireo?</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            <Link href="/register" className="flex h-14 w-full items-center justify-center gap-2 rounded-full border border-slate-100 bg-white text-[10px] font-bold uppercase tracking-widest text-[#0A1629] shadow-[0_5px_15px_-5px_rgba(0,0,0,0.05)] transition-colors hover:bg-slate-50 active:scale-95">
              Create account
            </Link>
          </div>
        </section>

        <section className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center gap-2 text-[11px] font-bold text-[#007AFF] hover:underline"><Home size={14} /> Return to Home</Link>
        </section>

        <section className="hide-scrollbar mb-10 overflow-x-auto px-4 pb-4">
          <div className="flex min-w-max justify-between gap-4 md:justify-center">
            {[
              { Icon: ShieldCheck, title: 'Secure & Trusted', text: 'Firebase protected', color: 'bg-blue-50 text-[#007AFF]' },
              { Icon: Zap, title: 'Fast & Reliable', text: 'Quick account access', color: 'bg-orange-50 text-[#FF9500]' },
              { Icon: Headphones, title: 'Support', text: 'Help when needed', color: 'bg-purple-50 text-purple-500' },
              { Icon: CheckCircle2, title: 'Verified Platform', text: 'Trusted service', color: 'bg-green-50 text-green-500' },
            ].map(({ Icon, title, text, color }, index) => (
              <div key={title} className={`flex items-center gap-3 px-2 pr-6 ${index < 3 ? 'border-r border-slate-200' : ''}`}>
                <div className={`flex size-8 items-center justify-center rounded-full ${color}`}><Icon size={16} /></div>
                <div><h2 className="text-[8px] font-black uppercase tracking-tight text-slate-900">{title}</h2><p className="text-[7px] text-slate-500">{text}</p></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#F8FAFC]"><video src="/logeing.mp4" autoPlay loop muted playsInline className="size-24 rounded-3xl border border-blue-100/80 object-cover shadow-xl shadow-blue-500/20" /></main>}>
      <LoginContent />
    </Suspense>
  );
}
