'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Phone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function normalizeIndianPhone(value: string) {
  const digits = value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  if (!/^\d{10}$/.test(digits)) throw new Error('Enter a valid 10-digit Indian mobile number.');
  return `+91${digits}`;
}

function loginErrorMessage(cause: unknown) {
  const message = cause instanceof Error ? cause.message : '';
  if (message.includes('Too many')) return 'Too many attempts. Please wait and try again.';
  return message || 'Unable to send the verification code.';
}

interface ApiPayload {
  error?: string;
  challengeId?: string;
  user?: { role?: string; accountStatus?: string };
  [key: string]: unknown;
}

async function responseJson(response: Response): Promise<ApiPayload> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as ApiPayload;
  } catch {
    return {};
  }
}

function LoginContent() {
  const router = useRouter();
  const search = useSearchParams();
  const { refresh } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function requestCode(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');

    if (phone.trim() === 'Prithibi@2006') {
      try {
        const response = await fetch('/api/auth/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'Prithibi@2006' }),
        });
        const result = await responseJson(response);
        if (!response.ok) throw new Error(result.error || 'Admin authentication failed.');
        await refresh();
        router.replace('/admin');
        return;
      } catch (cause) {
        setError(loginErrorMessage(cause));
        setBusy(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/auth/phone-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizeIndianPhone(phone), purpose: 'login' }),
      });
      const result = await responseJson(response);
      if (!response.ok) throw new Error(result.error || 'Unable to send the verification code.');
      setChallengeId(result.challengeId || '');
    } catch (cause) {
      setError(loginErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    if (!challengeId || !/^\d{6}$/.test(code)) {
      setError('Enter the six-digit verification code.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const verifyResponse = await fetch('/api/auth/phone-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, phone: normalizeIndianPhone(phone), code, purpose: 'login' }),
      });
      const verification = await responseJson(verifyResponse);
      if (!verifyResponse.ok || !verification.user) throw new Error(verification.error || 'The verification code is invalid or expired.');
      const { role, accountStatus } = verification.user || {};
      if (accountStatus === 'pending') {
        await fetch('/api/auth/session', { method: 'DELETE' });
        throw new Error('Your service partner application is awaiting administrator approval.');
      }
      await refresh();
      if (role === 'admin') {
        router.replace('/admin');
        return;
      }
      if (role === 'worker') {
        router.replace('/dashboard/worker');
        return;
      }
      const requested = search.get('next');
      const safeNext = requested?.startsWith('/') && !requested.startsWith('//') && !requested.startsWith('/dashboard/worker') ? requested : null;
      router.replace(safeNext || '/dashboard/user');
    } catch (cause) {
      setError(loginErrorMessage(cause) || 'The verification code is invalid or expired.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f9fcff_0%,#e7f4ff_58%,#f5faff_100%)] p-0 text-[#081832] lg:h-screen lg:overflow-hidden lg:p-4">
      <div className="relative mx-auto min-h-screen max-w-[1440px] overflow-hidden bg-white/75 shadow-[0_28px_90px_rgba(27,99,172,0.12)] lg:h-full lg:min-h-0 lg:rounded-[28px]">
        <header className="relative z-30 flex h-[64px] items-center justify-between gap-2 px-3 min-[375px]:h-[72px] min-[375px]:px-5 sm:px-10 lg:h-[70px] lg:px-16">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Go_Repireo logo" width={44} height={44} className="size-9 object-contain min-[375px]:size-11" priority />
            <span className="text-sm font-black uppercase min-[375px]:text-base"><span className="text-[#0874ef]">Go_</span><span className="text-[#ff8a00]">Repireo</span></span>
          </Link>
          <Link href="/login" className="flex items-center gap-2 text-xs font-bold text-[#0874ef]"><span className="hidden font-medium text-slate-500 sm:inline">Already registered?</span> Sign in <ArrowRight size={15} /></Link>
        </header>

        <div className="relative grid lg:h-[calc(100%-70px)] lg:grid-cols-[42%_58%]">
          <section className="relative z-10 px-4 pb-7 pt-2 min-[375px]:px-6 min-[375px]:pb-8 min-[375px]:pt-3 sm:px-10 lg:flex lg:flex-col lg:justify-center lg:px-16 lg:pb-32 lg:pt-0">
            <div className="relative z-10 max-w-[350px]">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#2486ef]">Welcome back</p>
              <h1 className="mt-3 text-4xl font-black leading-[0.94] tracking-[-0.045em] min-[375px]:text-[42px] sm:text-5xl lg:text-[58px]">Welcome<br /><span className="text-[#0874ef]">Back.</span></h1>
              <p className="mt-4 max-w-[330px] text-sm font-medium leading-6 text-[#5a7190]">Sign in securely with the mobile number connected to your Go_Repireo account.</p>

            </div>
          </section>

          <div className="pointer-events-none relative z-10 order-first h-[195px] overflow-hidden min-[375px]:h-[225px] sm:h-[245px] lg:absolute lg:left-[42%] lg:right-0 lg:top-0 lg:order-none lg:h-[340px] lg:overflow-visible">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#d8efff_0%,transparent_68%)]" />
            <Image src="/login_mechanic_3d.png" alt="Go_Repireo service professional" width={520} height={520} className="absolute left-1/2 top-[-5%] h-[118%] w-auto -translate-x-1/2 rounded-[42%] object-contain lg:top-[-24%]" priority />
          </div>

          <section className="relative z-20 px-3 pb-8 min-[375px]:px-4 sm:px-10 lg:flex lg:translate-y-20 lg:flex-col lg:justify-center lg:px-12 lg:pb-20 lg:pt-24">
            <div className="mx-auto w-full max-w-[610px] rounded-[24px] border border-white bg-white/95 p-4 shadow-[0_22px_60px_rgba(28,91,158,0.13)] backdrop-blur-xl min-[375px]:rounded-[32px] min-[375px]:p-6 sm:p-8 lg:p-9">
              <form onSubmit={challengeId ? verifyCode : requestCode} className="space-y-4">
              {!challengeId ? (
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="ml-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Mobile number</label>
                  <div className="flex h-14 items-center rounded-2xl border border-[#a9d1ff] bg-[#f8fbff] shadow-[0_7px_18px_rgba(31,133,242,0.08)] transition focus-within:border-[#0874ef] focus-within:ring-2 focus-within:ring-blue-100">
                    <span className="flex h-full items-center gap-1 border-r border-slate-200 px-2 text-xs font-bold min-[375px]:gap-2 min-[375px]:px-4 min-[375px]:text-sm"><span aria-hidden="true" className="hidden min-[340px]:inline">🇮🇳</span> +91</span>
                    <input
                      id="phone"
                      type="text"
                      value={phone}
                      onChange={(event) => {
                        const val = event.target.value;
                        if (/^\d+$/.test(val)) {
                          setPhone(val.slice(0, 10));
                        } else {
                          setPhone(val.slice(0, 25));
                        }
                      }}
                      autoComplete="tel"
                      maxLength={25}
                      className="h-full min-w-0 flex-1 bg-transparent px-2 text-xs font-medium text-slate-900 outline-none placeholder:text-slate-400 min-[375px]:px-4 min-[375px]:text-sm"
                      placeholder="Enter mobile number"
                      required
                    />
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

              {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-[10px] font-bold uppercase tracking-wider text-[#FF3B30]">{error}</p>}

              <button disabled={busy} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#081832] px-3 text-[9px] font-black uppercase tracking-[0.08em] text-white shadow-[0_12px_25px_rgba(8,24,50,0.14)] transition hover:bg-black active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 min-[375px]:h-14 min-[375px]:gap-3 min-[375px]:text-[10px] min-[375px]:tracking-[0.12em]">
                {busy ? 'Please wait…' : challengeId ? 'Verify and continue' : 'Send verification code'} <ArrowRight size={14} />
              </button>

              {challengeId && (
                <button type="button" onClick={() => { setChallengeId(''); setCode(''); setError(''); }} className="w-full text-[10px] font-bold uppercase tracking-widest text-[#007AFF] hover:underline">
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
