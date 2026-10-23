'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, MapPin, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { auth } from '@/lib/firebase';

type AccountType = 'customer' | 'partner';

const serviceOptions = ['Plumbing', 'Electrical', 'Cleaning', 'Carpentry', 'Appliance repair', 'AC service', 'Other repairs'];

function friendlyError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : '';
  if (message.includes('auth/unauthorized-domain')) return 'This website domain is not authorized for Firebase login.';
  if (message.includes('auth/operation-not-allowed')) return 'Phone authentication is not enabled in Firebase.';
  if (message.includes('auth/too-many-requests')) return 'Too many attempts. Please wait and try again.';
  if (message.includes('auth/invalid-verification-code')) return 'The verification code is incorrect.';
  return message || 'Registration could not be completed.';
}

export default function RegisterPage() {
  const router = useRouter();
  const verifier = useRef<RecaptchaVerifier | null>(null);
  const [accountType, setAccountType] = useState<AccountType>('customer');
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [form, setForm] = useState({
    displayName: '', email: '', phone: '', state: '', district: '', pincode: '', area: '',
    experienceYears: '0', description: '', code: '',
  });

  useEffect(() => () => verifier.current?.clear(), []);

  function update(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function sendCode(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (form.displayName.trim().length < 2) return setError('Enter your full name.');
    if (!/^\d{10}$/.test(form.phone)) return setError('Enter a valid 10-digit Indian mobile number.');
    if (form.pincode && !/^\d{6}$/.test(form.pincode)) return setError('Enter a valid six-digit pincode.');
    if (accountType === 'partner' && services.length === 0) return setError('Select at least one service category.');

    setBusy(true);
    try {
      if (!verifier.current) verifier.current = new RecaptchaVerifier(auth, 'register-recaptcha', { size: 'normal' });
      setConfirmation(await signInWithPhoneNumber(auth, `+91${form.phone}`, verifier.current));
      setStep(2);
    } catch (cause) {
      verifier.current?.clear();
      verifier.current = null;
      setError(friendlyError(cause));
    } finally {
      setBusy(false);
    }
  }

  async function finishRegistration(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!confirmation || !/^\d{6}$/.test(form.code)) return setError('Enter the six-digit verification code.');
    setBusy(true);
    try {
      const credential = await confirmation.confirm(form.code);
      const idToken = await credential.user.getIdToken(true);
      const response = await fetch('/api/auth/register-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          displayName: form.displayName,
          accountType,
          email: form.email,
          state: form.state,
          district: form.district,
          pincode: form.pincode,
          area: form.area,
          experienceYears: Number(form.experienceYears),
          description: form.description,
          serviceCategories: services,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Account registration failed.');
      await auth.signOut();
      router.replace(`/login?registered=${accountType}`);
    } catch (cause) {
      setError(friendlyError(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F0F5FA] px-4 py-8 text-[#0F172A]">
      <div className="mx-auto max-w-3xl">
        <header className="mb-7 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm"><Image src="/logo.png" alt="Go_Repireo" width={36} height={36} /></span>
            <span className="text-sm font-black uppercase"><span className="text-[#007AFF]">Go_</span><span className="text-[#FF9500]">Repireo</span></span>
          </Link>
          <Link href="/login" className="text-xs font-bold text-[#007AFF]">Already registered? Sign in</Link>
        </header>

        <section className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_20px_60px_-24px_rgba(15,23,42,0.18)]">
          <div className="bg-[#0A1629] px-6 py-8 text-white sm:px-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#62A7FF]">Create your account</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Join Go_Repireo.</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Choose how you will use the platform. Your mobile number is verified securely through Firebase.</p>
          </div>

          <div className="p-6 sm:p-10">
            <div className="mb-8 grid grid-cols-2 gap-3">
              {([
                { type: 'customer' as const, title: 'Customer', description: 'Book and manage services', Icon: UserRound },
                { type: 'partner' as const, title: 'Service partner', description: 'Apply to provide services', Icon: BriefcaseBusiness },
              ]).map(({ type, title, description, Icon }) => (
                <button key={type} type="button" onClick={() => setAccountType(type)} disabled={step === 2} className={`rounded-2xl border p-4 text-left transition ${accountType === type ? 'border-[#007AFF] bg-blue-50 ring-1 ring-[#007AFF]' : 'border-slate-200 bg-white hover:border-slate-300'} disabled:cursor-not-allowed`}>
                  <span className="flex items-center justify-between"><Icon className={accountType === type ? 'text-[#007AFF]' : 'text-slate-500'} size={22} />{accountType === type && <Check className="text-[#007AFF]" size={18} />}</span>
                  <span className="mt-3 block text-sm font-black">{title}</span><span className="mt-1 block text-[10px] text-slate-500">{description}</span>
                </button>
              ))}
            </div>

            <form onSubmit={step === 1 ? sendCode : finishRegistration} className="space-y-5">
              {step === 1 ? <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" value={form.displayName} onChange={(value) => update('displayName', value)} placeholder="Your full name" required />
                  <Field label="Email address" value={form.email} onChange={(value) => update('email', value)} placeholder="name@example.com" type="email" />
                </div>
                <div>
                  <label className="ml-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">Mobile number</label>
                  <div className="mt-2 flex h-14 items-center rounded-2xl bg-[#F8FAFC] px-4 focus-within:ring-1 focus-within:ring-[#007AFF]"><Phone size={18} className="mr-3 text-[#007AFF]" /><span className="mr-2 text-sm font-semibold text-slate-500">+91</span><input value={form.phone} onChange={(event) => update('phone', event.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" placeholder="10-digit mobile number" required /></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2"><Field label="State" value={form.state} onChange={(value) => update('state', value)} placeholder="State" /><Field label="District" value={form.district} onChange={(value) => update('district', value)} placeholder="District" /></div>
                <div className="grid gap-4 sm:grid-cols-[160px_1fr]"><Field label="Pincode" value={form.pincode} onChange={(value) => update('pincode', value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" /><Field label="Area / address" value={form.area} onChange={(value) => update('area', value)} placeholder="Locality or service area" /></div>

                {accountType === 'partner' && <div className="space-y-5 rounded-2xl border border-orange-100 bg-orange-50/50 p-5">
                  <div><p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Services you provide</p><div className="mt-3 flex flex-wrap gap-2">{serviceOptions.map((service) => <button key={service} type="button" onClick={() => setServices((current) => current.includes(service) ? current.filter((item) => item !== service) : [...current, service])} className={`rounded-full border px-3 py-2 text-[10px] font-bold ${services.includes(service) ? 'border-[#007AFF] bg-[#007AFF] text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{service}</button>)}</div></div>
                  <div className="grid gap-4 sm:grid-cols-[160px_1fr]"><Field label="Experience (years)" value={form.experienceYears} onChange={(value) => update('experienceYears', value.replace(/\D/g, '').slice(0, 2))} type="number" placeholder="0" /><Field label="Skills description" value={form.description} onChange={(value) => update('description', value)} placeholder="Describe your experience" /></div>
                  <p className="flex gap-2 text-[10px] leading-5 text-orange-800"><ShieldCheck size={16} className="shrink-0" />Partner accounts remain pending until an administrator reviews and approves them.</p>
                </div>}
                <div id="register-recaptcha" className="overflow-hidden rounded-xl" />
              </> : <div className="rounded-2xl bg-[#F8FAFC] p-6 text-center">
                <ShieldCheck className="mx-auto text-[#007AFF]" size={34} /><h2 className="mt-3 text-xl font-black">Verify your mobile</h2><p className="mt-2 text-xs text-slate-500">Enter the six-digit code sent to +91 {form.phone}</p>
                <input value={form.code} onChange={(event) => update('code', event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className="mx-auto mt-5 block h-14 w-full max-w-xs rounded-2xl border border-slate-200 bg-white px-5 text-center text-xl font-black tracking-[0.4em] outline-none focus:border-[#007AFF]" placeholder="000000" required />
              </div>}

              {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-600">{error}</p>}
              <button disabled={busy} className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#0A1629] text-[10px] font-bold uppercase tracking-widest text-white hover:bg-black disabled:opacity-60">{busy ? 'Please wait…' : step === 1 ? 'Send verification code' : 'Verify and create account'} <ArrowRight size={15} /></button>
              {step === 2 && <button type="button" onClick={() => { setStep(1); setConfirmation(null); update('code', ''); verifier.current?.clear(); verifier.current = null; }} className="flex w-full items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#007AFF]"><ArrowLeft size={14} />Change details</button>}
            </form>
          </div>
        </section>
        <p className="mt-5 flex items-center justify-center gap-2 text-[10px] text-slate-500"><MapPin size={13} />Your location helps us connect nearby customers and partners.</p>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; required?: boolean }) {
  return <label className="block"><span className="ml-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} className="mt-2 h-14 w-full rounded-2xl bg-[#F8FAFC] px-4 text-sm font-semibold outline-none focus:ring-1 focus:ring-[#007AFF]" /></label>;
}
