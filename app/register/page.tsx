'use client';

import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import {
  ArrowRight, BriefcaseBusiness, Check, ChevronDown, Hammer, LockKeyhole,
  Mail, MapPin, Phone, ShieldCheck, Sparkles, UserRound, Wrench, Zap,
} from 'lucide-react';
import { auth } from '@/lib/firebase';

type AccountType = 'customer' | 'partner';

const serviceOptions = [
  { name: 'Plumbing', Icon: Phone },
  { name: 'Electrical', Icon: Zap },
  { name: 'Cleaning', Icon: Sparkles },
  { name: 'Carpentry', Icon: Hammer },
  { name: 'Appliance repair', Icon: BriefcaseBusiness },
  { name: 'AC service', Icon: Wrench },
  { name: 'Other repairs', Icon: ShieldCheck },
];

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

  function chooseAccountType(type: AccountType) {
    setAccountType(type);
    setError('');
  }

  async function sendCode(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (form.displayName.trim().length < 2) return setError('Enter your full name.');
    if (!/^\d{10}$/.test(form.phone)) return setError('Enter a valid 10-digit Indian mobile number.');
    if (accountType === 'partner' && !/^\d{6}$/.test(form.pincode)) return setError('Enter a valid six-digit pincode.');
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
          state: accountType === 'partner' ? form.state : '',
          district: accountType === 'partner' ? form.district : '',
          pincode: accountType === 'partner' ? form.pincode : '',
          area: accountType === 'partner' ? form.area : '',
          experienceYears: accountType === 'partner' ? Number(form.experienceYears) : 0,
          description: accountType === 'partner' ? form.description : '',
          serviceCategories: accountType === 'partner' ? services : [],
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f7fbff_0,#deefff_55%,#eef8ff_100%)] p-0 text-[#071631] lg:h-screen lg:min-h-0 lg:p-3">
      <div className="mx-auto min-h-screen max-w-[1480px] overflow-hidden bg-[linear-gradient(135deg,#f8fcff_0%,#e7f4ff_48%,#f8fcff_100%)] shadow-[0_30px_90px_rgba(26,96,170,0.13)] lg:h-full lg:min-h-0 lg:rounded-[28px]">
        <header className="flex h-[76px] items-center justify-between px-5 sm:px-9 lg:h-[60px] lg:px-12">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Go_Repireo" width={44} height={44} className="size-10 object-contain" priority />
            <span className="text-base font-black uppercase"><span className="text-[#0874ef]">Go_</span><span className="text-[#ff8a00]">Repireo</span></span>
          </Link>
          <Link href="/login" className="flex items-center gap-2 text-xs font-bold text-[#0874ef]"><span className="hidden font-medium text-slate-500 sm:inline">Already registered?</span> Sign in <ArrowRight size={15} /></Link>
        </header>

        <div className="grid lg:h-[calc(100%-60px)] lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[410px_minmax(0,1fr)]">
          <HeroPanel accountType={accountType} />

          <section className={`relative bg-white px-5 py-6 sm:px-10 lg:mb-4 lg:mr-4 lg:overflow-y-auto lg:rounded-[28px] lg:px-8 lg:py-5 lg:shadow-[0_20px_50px_rgba(29,96,168,0.12)] xl:px-12 ${accountType === 'partner' ? 'lg:mt-16' : 'lg:mt-2'}`}>
            {accountType === 'customer' && <Progress current={step} accountType={accountType} />}

            <form onSubmit={step === 1 ? sendCode : finishRegistration} className={`mx-auto max-w-4xl ${accountType === 'customer' ? 'mt-4' : ''}`}>
              {step === 1 ? <>
                <div className="hidden lg:block">
                  <h1 className="text-2xl font-black tracking-tight">Create Your Account</h1>
                  <p className="mt-0.5 text-sm text-slate-500">Get started by choosing how you want to use Go_Repireo.</p>
                </div>

                <AccountChoices accountType={accountType} onChoose={chooseAccountType} />

                <div className="mt-4">
                  <h2 className="text-lg font-black">Your Information</h2>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Full Name" value={form.displayName} onChange={(value) => update('displayName', value)} placeholder="Your full name" icon={<UserRound size={18} />} required />
                  <Field label="Email Address" value={form.email} onChange={(value) => update('email', value)} placeholder="name@example.com" icon={<Mail size={18} />} type="email" required />
                </div>

                <div className="mt-3">
                  <PhoneField value={form.phone} onChange={(value) => update('phone', value)} />
                </div>

                {accountType === 'customer' && <div className="mt-3 flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-medium text-[#0755ad]"><ShieldCheck size={18} className="shrink-0 text-[#0874ef]" />We will send a verification code to your mobile number.</div>}

                {accountType === 'partner' && <PartnerFields form={form} update={update} services={services} setServices={setServices} />}

                <div id="register-recaptcha" className="mt-4 overflow-hidden rounded-xl" />
              </> : <OtpStep phone={form.phone} code={form.code} onChange={(value) => update('code', value)} />}

              {error && <p role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-600">{error}</p>}

              <button disabled={busy} className="mt-4 flex h-12 w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#075bd8] to-[#0788ff] text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(0,116,255,0.23)] transition hover:brightness-105 disabled:opacity-60">
                {busy ? 'Please wait…' : step === 2 ? 'Verify and Create Account' : accountType === 'customer' ? 'Create Customer Account' : 'Submit Partner Application'} <ArrowRight size={18} />
              </button>

              {step === 2 && <button type="button" onClick={() => { setStep(1); setConfirmation(null); update('code', ''); verifier.current?.clear(); verifier.current = null; }} className="mt-4 w-full text-center text-xs font-bold text-[#0874ef]">Change account details</button>}

              <div className="mt-3 flex flex-col items-center gap-0.5 text-center text-[10px] text-slate-500">
                <p className="flex items-center gap-2"><LockKeyhole size={13} />Your information is secure and verified through Firebase.</p>
                <p>By continuing, you agree to our <Link href="/terms" className="font-semibold text-[#0874ef] underline">Terms</Link> &amp; <Link href="/privacy" className="font-semibold text-[#0874ef] underline">Privacy Policy</Link>.</p>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

function HeroPanel({ accountType }: { accountType: AccountType }) {
  const customer = accountType === 'customer';
  return <aside className="relative min-h-[205px] overflow-hidden bg-[linear-gradient(145deg,#f7fbff_0%,#dbeeff_58%,#eef8ff_100%)] px-5 py-6 text-[#071631] sm:px-9 lg:h-full lg:min-h-0 lg:px-10 lg:py-8">
    <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_88%_13%,white_0,white_8%,transparent_9%),radial-gradient(circle_at_12%_80%,#cbe7ff_0,transparent_36%)]" />
    <div className="absolute -bottom-24 -left-20 size-72 rounded-full bg-white/70" />
    <div className="relative z-10 max-w-[270px] lg:max-w-none">
      <span className="inline-flex rounded-full bg-[#e2f0ff] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.22em] text-[#086de0]">{customer ? 'Customer account' : 'Service partner application'}</span>
      <h2 className="mt-3 text-[32px] font-black leading-[0.98] tracking-tight lg:mt-4 lg:text-[42px]">{customer ? <>Book a<br />service <span className="text-[#0874ef]">faster.</span></> : <>Grow your<br /><span className="text-[#0874ef]">work</span> with us.</>}</h2>
      <p className="mt-3 max-w-[290px] text-xs font-medium leading-5 text-[#496686] lg:mt-5 lg:text-sm lg:leading-6">{customer ? 'Create a simple account with your name and verified mobile number.' : 'Tell us about your skills and service area. Partner applications are reviewed before activation.'}</p>
    </div>
    <Image src={customer ? '/login_mechanic_3d.png' : '/custom_service_mechanic_3d.png'} alt="Go_Repireo service professional" width={520} height={520} className={`absolute z-[1] object-contain mix-blend-multiply ${customer ? '-bottom-20 right-[-54px] w-[230px] sm:right-5 lg:-bottom-12 lg:left-1/2 lg:w-[390px] lg:-translate-x-1/2' : '-bottom-16 right-[-45px] w-[220px] sm:right-4 lg:top-0 lg:-right-16 lg:w-[280px]'}`} priority />
  </aside>;
}

function Progress({ current, accountType }: { current: 1 | 2; accountType: AccountType }) {
  const labels = accountType === 'partner' ? ['Basic Details', 'Service Details', 'Review & Submit'] : ['Basic Details', 'Additional Details', 'Review & Submit'];
  return <div className="flex items-center justify-between border-b border-slate-100 pb-5">
    {labels.map((label, index) => <div key={label} className="contents"><div className="flex items-center gap-2"><span className={`flex size-7 items-center justify-center rounded-full text-xs font-black ${index + 1 <= current ? 'bg-[#0874ef] text-white' : 'border border-slate-200 text-slate-500'}`}>{index + 1}</span><span className={`text-[9px] font-semibold sm:text-[11px] ${index + 1 <= current ? 'text-[#071631]' : 'text-slate-400'}`}><span className="sm:hidden">{index === 0 ? 'Basic' : index === 1 ? 'Details' : 'Review'}</span><span className="hidden sm:inline">{label}</span></span></div>{index < 2 && <span className="mx-2 h-px flex-1 bg-slate-200" />}</div>)}
  </div>;
}

function AccountChoices({ accountType, onChoose }: { accountType: AccountType; onChoose: (type: AccountType) => void }) {
  return <div className="mt-6 grid grid-cols-2 gap-2 sm:gap-3">
    {([{ type: 'customer' as const, title: 'Customer', text: 'Book and manage services', Icon: UserRound }, { type: 'partner' as const, title: 'Service partner', text: 'Apply to provide services', Icon: BriefcaseBusiness }]).map(({ type, title, text, Icon }) => <button key={type} type="button" onClick={() => onChoose(type)} className={`relative flex min-h-[86px] items-center gap-2 rounded-xl border p-3 text-left transition sm:gap-4 sm:p-4 ${accountType === type ? 'border-[#0874ef] bg-blue-50/60 ring-1 ring-[#0874ef]' : 'border-slate-200 hover:border-blue-200'}`}><Icon size={23} className={`shrink-0 ${accountType === type ? 'text-[#0874ef]' : 'text-slate-500'}`} /><span className="min-w-0"><strong className="block text-xs sm:text-sm">{title}</strong><span className="mt-1 block text-[9px] leading-4 text-slate-500 sm:text-[11px]">{text}</span></span>{accountType === type && <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-[#0874ef] text-white sm:right-3 sm:top-3 sm:size-6"><Check size={13} /></span>}</button>)}
  </div>;
}

function PartnerFields({ form, update, services, setServices }: { form: Record<string, string>; update: (name: 'state' | 'district' | 'pincode' | 'area' | 'experienceYears' | 'description', value: string) => void; services: string[]; setServices: React.Dispatch<React.SetStateAction<string[]>> }) {
  return <>
    <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50/70 p-4">
      <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-[#ffb338] text-white"><MapPin size={18} /></span><div><h3 className="text-sm font-black">Your Service Location</h3><p className="text-[10px] text-slate-500">Where do you provide your services?</p></div></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="State" value={form.state} onChange={(value) => update('state', value)} placeholder="Select your state" icon={<MapPin size={17} />} required /><Field label="District" value={form.district} onChange={(value) => update('district', value)} placeholder="Select your district" icon={<BriefcaseBusiness size={17} />} required /></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Pincode" value={form.pincode} onChange={(value) => update('pincode', value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" icon={<BriefcaseBusiness size={17} />} inputMode="numeric" required /><Field label="Service Area" value={form.area} onChange={(value) => update('area', value)} placeholder="Locality or areas you serve" icon={<MapPin size={17} />} required /></div>
    </div>
    <div className="mt-5"><h3 className="text-sm font-black">Services You Provide</h3><p className="text-[11px] text-slate-500">Select all that apply</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{serviceOptions.map(({ name, Icon }) => <button key={name} type="button" onClick={() => setServices((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name])} className={`flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-[10px] font-bold transition ${services.includes(name) ? 'border-[#0874ef] bg-[#0874ef] text-white' : 'border-slate-200 bg-white text-[#12315e] hover:border-blue-300'}`}><Icon size={14} />{name}</button>)}</div></div>
    <div className="mt-5"><h3 className="text-sm font-black">Experience &amp; Skills</h3><div className="mt-3 grid gap-4 sm:grid-cols-[190px_1fr]"><Field label="Experience (Years)" value={form.experienceYears} onChange={(value) => update('experienceYears', value.replace(/\D/g, '').slice(0, 2))} placeholder="0" type="number" required /><Field label="Skills Description" value={form.description} onChange={(value) => update('description', value)} placeholder="Describe your experience, skills and specialties" icon={<Wrench size={17} />} required /></div></div>
    <p className="mt-4 flex items-center justify-center gap-2 text-center text-[10px] text-slate-500"><ShieldCheck size={14} className="text-[#0874ef]" />Partner accounts remain pending until an administrator reviews and approves them.</p>
  </>;
}

function PhoneField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold text-[#243858]">Mobile Number <b className="text-red-500">*</b></span><span className="flex h-12 items-center rounded-xl border border-slate-200 bg-[#f8fbff] focus-within:border-[#0874ef] focus-within:ring-2 focus-within:ring-blue-100"><span className="flex h-full items-center gap-2 border-r border-slate-200 px-4 text-sm font-bold"><Phone size={18} className="text-[#0874ef]" />+91 <ChevronDown size={14} /></span><input value={value} onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none" placeholder="10-digit mobile number" required /></span></label>;
}

function OtpStep({ phone, code, onChange }: { phone: string; code: string; onChange: (value: string) => void }) {
  return <div className="rounded-2xl bg-blue-50/70 px-5 py-10 text-center"><span className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-[#0874ef] shadow-sm"><ShieldCheck size={28} /></span><h1 className="mt-4 text-2xl font-black">Verify your mobile</h1><p className="mt-2 text-sm text-slate-500">Enter the six-digit code sent to +91 {phone}</p><input value={code} onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className="mx-auto mt-6 block h-14 w-full max-w-xs rounded-xl border border-slate-200 bg-white px-5 text-center text-xl font-black tracking-[0.4em] outline-none focus:border-[#0874ef]" placeholder="000000" required /></div>;
}

function Field({ label, value, onChange, placeholder, icon, type = 'text', required = false, inputMode }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; icon?: ReactNode; type?: string; required?: boolean; inputMode?: 'numeric' }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold text-[#243858]">{label} {required && <b className="text-red-500">*</b>}</span><span className="flex h-12 items-center rounded-xl border border-slate-200 bg-[#f8fbff] px-4 focus-within:border-[#0874ef] focus-within:ring-2 focus-within:ring-blue-100">{icon && <span className="mr-3 text-[#527096]">{icon}</span>}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} inputMode={inputMode} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" /></span></label>;
}
