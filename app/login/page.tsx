'use client';

import { FormEvent, Suspense, useEffect, useRef, useState } from 'react';
import { ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Home, Phone } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

function normalizeIndianPhone(value: string) {
  const digits = value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  if (!/^\d{10}$/.test(digits)) throw new Error('Enter a valid 10-digit Indian mobile number.');
  return `+91${digits}`;
}

function loginErrorMessage(cause: unknown) {
  const message = cause instanceof Error ? cause.message : '';
  if (message.includes('auth/invalid-api-key')) return 'Login configuration is unavailable. Please contact support.';
  if (message.includes('auth/unauthorized-domain')) return 'This website domain is not authorized for login yet.';
  if (message.includes('auth/operation-not-allowed')) return 'Phone login has not been enabled yet.';
  if (message.includes('auth/too-many-requests')) return 'Too many attempts. Please wait and try again.';
  if (message.includes('auth/invalid-phone-number')) return 'Enter a valid 10-digit Indian mobile number.';
  return message || 'Unable to send the verification code.';
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
      setError(loginErrorMessage(cause));
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
      const idToken = await credential.user.getIdToken(true);
      const sessionResponse = await fetch('/api/auth/session', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const session = await sessionResponse.json();
      if (!sessionResponse.ok || !['customer', 'worker', 'admin'].includes(String(session.user?.role))) {
        await auth.signOut();
        throw new Error(session.error || 'This account is not registered. Create an account first.');
      }
      const { role, accountStatus } = session.user;
      if (accountStatus === 'pending') {
        await auth.signOut();
        throw new Error('Your service partner application is awaiting administrator approval.');
      }
      await refresh();
      const requested = search.get('next');
      const safeNext = requested?.startsWith('/') && !requested.startsWith('//') ? requested : null;
      router.replace(safeNext || (role === 'admin' ? '/admin' : role === 'worker' ? '/dashboard/worker' : '/dashboard/user'));
    } catch (cause) {
      setError(loginErrorMessage(cause) || 'The verification code is invalid or expired.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f9fcff_0%,#e7f4ff_58%,#f5faff_100%)] p-0 text-[#081832] lg:h-screen lg:overflow-hidden lg:p-4">
      <div className="relative mx-auto min-h-screen max-w-[1440px] overflow-hidden bg-white/75 shadow-[0_28px_90px_rgba(27,99,172,0.12)] lg:h-full lg:min-h-0 lg:rounded-[28px]">
        <header className="relative z-30 flex h-[72px] items-center justify-between px-6 sm:px-10 lg:h-[70px] lg:px-16">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Go_Repireo logo" width={44} height={44} className="size-11 object-contain" priority />
            <span className="text-base font-black uppercase"><span className="text-[#0874ef]">Go_</span><span className="text-[#ff8a00]">Repireo</span></span>
          </Link>
          <Link href="/login" className="flex items-center gap-2 text-xs font-bold text-[#0874ef]"><span className="hidden font-medium text-slate-500 sm:inline">Already registered?</span> Sign in <ArrowRight size={15} /></Link>
        </header>

        <div className="relative grid lg:h-[calc(100%-70px)] lg:grid-cols-[42%_58%]">
          <section className="relative z-10 px-6 pb-8 pt-3 sm:px-10 lg:flex lg:flex-col lg:justify-center lg:px-16 lg:pb-32 lg:pt-0">
            <div className="relative z-10 max-w-[350px]">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#2486ef]">Welcome back</p>
              <h1 className="mt-3 text-[42px] font-black leading-[0.94] tracking-[-0.045em] sm:text-5xl lg:text-[58px]">Welcome<br /><span className="text-[#0874ef]">Back.</span></h1>
              <p className="mt-4 max-w-[330px] text-sm font-medium leading-6 text-[#5a7190]">Sign in securely with the mobile number connected to your Go_Repireo account.</p>

            </div>
          </section>

          <div className="pointer-events-none relative z-10 order-first h-[245px] overflow-hidden lg:absolute lg:left-[42%] lg:right-0 lg:top-0 lg:order-none lg:h-[340px] lg:overflow-visible">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#d8efff_0%,transparent_68%)]" />
            <Image src="/login_mechanic_3d.png" alt="Go_Repireo service professional" width={520} height={520} className="absolute left-1/2 top-[-5%] h-[118%] w-auto -translate-x-1/2 rounded-[42%] object-contain lg:top-[-24%]" priority />
          </div>

          <section className="relative z-20 px-4 pb-8 sm:px-10 lg:flex lg:translate-y-20 lg:flex-col lg:justify-center lg:px-12 lg:pb-20 lg:pt-24">
            <div className="mx-auto w-full max-w-[610px] rounded-[32px] border border-white bg-white/95 p-6 shadow-[0_22px_60px_rgba(28,91,158,0.13)] backdrop-blur-xl sm:p-8 lg:p-9">
              <form onSubmit={confirmation ? verifyCode : requestCode} className="space-y-4">
              {!confirmation ? (
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="ml-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Mobile number</label>
                  <div className="flex h-14 items-center rounded-2xl border border-[#a9d1ff] bg-[#f8fbff] shadow-[0_7px_18px_rgba(31,133,242,0.08)] transition focus-within:border-[#0874ef] focus-within:ring-2 focus-within:ring-blue-100">
                    <span className="flex h-full items-center gap-2 border-r border-slate-200 px-4 text-sm font-bold"><span aria-hidden="true">🇮🇳</span> +91</span>
                    <input id="phone" value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" autoComplete="tel" maxLength={10} className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400" placeholder="Enter mobile number" required />
                    <span className="mr-2 flex size-10 items-center justify-center rounded-full bg-blue-50 text-[#0874ef]"><Phone size={18} /></span>
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

              <button disabled={busy} className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#081832] text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-[0_12px_25px_rgba(8,24,50,0.14)] transition hover:bg-black active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60">
                {busy ? 'Please wait…' : confirmation ? 'Verify and continue' : 'Send verification code'} <ArrowRight size={14} />
              </button>

              {confirmation && (
                <button type="button" onClick={() => { setConfirmation(null); setCode(''); setError(''); }} className="w-full text-[10px] font-bold uppercase tracking-widest text-[#007AFF] hover:underline">
                  Use another number
                </button>
              )}
            </form>

            <div className="my-5 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">New to Repireo?</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            <Link href="/register" className="flex h-14 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-[10px] font-black uppercase tracking-[0.1em] text-[#081832] shadow-sm transition hover:bg-slate-50 active:scale-[0.99]">
              Create account
            </Link>
            </div>

            <Link href="/" className="mx-auto mt-6 flex w-fit items-center gap-2 text-xs font-bold text-[#0874ef] hover:underline"><Home size={15} /> Return to Home</Link>
          </section>

        </div>
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
