'use client';

import { FormEvent, Suspense, useEffect, useRef, useState } from 'react';
import { ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-12">
      <section className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <Link href="/" className="text-sm font-semibold text-[#165DCC]">← Back to GO_REPIREO</Link>
        <h1 className="mt-6 text-3xl font-black tracking-tight text-[#14243A]">Secure sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Use the same mobile number as your GO_REPIREO Android account.</p>

        <form onSubmit={confirmation ? verifyCode : requestCode} className="mt-8 space-y-5">
          {!confirmation ? (
            <label className="block text-sm font-semibold text-slate-800">
              Mobile number
              <div className="mt-2 flex rounded-xl border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-[#165DCC]">
                <span className="px-3 py-3 text-slate-500">+91</span>
                <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="numeric" autoComplete="tel" maxLength={10} className="min-w-0 flex-1 rounded-r-xl px-3 py-3 outline-none" required />
              </div>
            </label>
          ) : (
            <label className="block text-sm font-semibold text-slate-800">
              Six-digit verification code
              <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#165DCC]" required />
            </label>
          )}
          <div id="phone-recaptcha" />
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="min-h-12 w-full rounded-xl bg-[#165DCC] px-5 py-3 font-bold text-white disabled:opacity-60">
            {busy ? 'Please wait…' : confirmation ? 'Verify and continue' : 'Send verification code'}
          </button>
          {confirmation && <button type="button" onClick={() => { setConfirmation(null); setCode(''); setError(''); }} className="w-full text-sm font-semibold text-[#165DCC]">Use another number</button>}
        </form>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#F8FAFC]" />}>
      <LoginContent />
    </Suspense>
  );
}
