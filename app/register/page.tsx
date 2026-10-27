'use client';

import { FormEvent, ReactNode, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, ArrowLeft, BriefcaseBusiness, Check, ChevronDown, Hammer, LockKeyhole,
  Mail, MapPin, Phone, ShieldCheck, Sparkles, UserRound, Wrench, Zap, AlertCircle
} from 'lucide-react';

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
  if (message.includes('Too many')) return 'Too many attempts. Please wait and try again.';
  if (message.includes('verification code is incorrect')) return 'The verification code is incorrect.';
  return message || 'Registration could not be completed.';
}

interface ApiPayload {
  error?: string;
  challengeId?: string;
  verified?: boolean;
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

export default function RegisterPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>('partner');
  const [partnerStep, setPartnerStep] = useState<1 | 2 | 3>(1);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [challengeId, setChallengeId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [services, setServices] = useState<string[]>([]);
  const [form, setForm] = useState({
    displayName: '', email: '', phone: '', state: 'Uttar Pradesh', district: 'Etawah', pincode: '206001', area: '',
    experienceYears: '2', description: '', code: '',
  });

  function update(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: false }));
    }
  }

  function chooseAccountType(type: AccountType) {
    setAccountType(type);
    setPartnerStep(1);
    setIsOtpStep(false);
    setError('');
    setFieldErrors({});
  }

  // Step 1 Validation -> Proceed to Step 2
  function handleNextToLocation() {
    const errors: Record<string, boolean> = {};
    if (form.displayName.trim().length < 2) errors.displayName = true;
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = true;
    if (!/^\d{10}$/.test(form.phone.trim())) errors.phone = true;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setError('');
    setPartnerStep(2);
  }

  // Step 2 Validation -> Proceed to Step 3
  function handleNextToServices() {
    const errors: Record<string, boolean> = {};
    if (form.state.trim().length < 2) errors.state = true;
    if (form.district.trim().length < 2) errors.district = true;
    if (!/^\d{6}$/.test(form.pincode.trim())) errors.pincode = true;
    if (form.area.trim().length < 2) errors.area = true;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setError('');
    setPartnerStep(3);
  }

  // Step 3 (or Customer) -> Send OTP
  async function sendCode(event?: FormEvent) {
    if (event) event.preventDefault();
    setError('');
    const errors: Record<string, boolean> = {};

    if (accountType === 'partner') {
      if (services.length === 0) errors.services = true;
      if (!form.description.trim()) errors.description = true;
      if (!form.experienceYears.trim()) errors.experienceYears = true;
    } else {
      if (form.displayName.trim().length < 2) errors.displayName = true;
      if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = true;
      if (!/^\d{10}$/.test(form.phone.trim())) errors.phone = true;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.services) setError('Please select at least one service category you provide.');
      return;
    }

    setFieldErrors({});
    setBusy(true);
    try {
      const response = await fetch('/api/auth/phone-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${form.phone}`, purpose: 'register' }),
      });
      const result = await responseJson(response);
      if (!response.ok) throw new Error(result.error || 'Unable to send the verification code.');
      setChallengeId(result.challengeId || '');
      setIsOtpStep(true);
    } catch (cause) {
      setError(friendlyError(cause));
    } finally {
      setBusy(false);
    }
  }

  // OTP Verification & Final Account Creation
  async function finishRegistration(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!challengeId || !/^\d{6}$/.test(form.code)) {
      return setError('Please enter the 6-digit verification code.');
    }
    setBusy(true);
    try {
      const verifyResponse = await fetch('/api/auth/phone-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, phone: `+91${form.phone}`, code: form.code, purpose: 'register' }),
      });
      const verification = await responseJson(verifyResponse);
      if (!verifyResponse.ok || !verification.verified) {
        throw new Error(verification.error || 'The verification code is invalid or expired.');
      }

      const response = await fetch('/api/auth/register-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const result = await responseJson(response);
      if (!response.ok) throw new Error(result.error || 'Account registration failed.');
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
        {/* Header */}
        <header className="flex h-[64px] items-center justify-between gap-2 px-3 min-[375px]:h-[76px] min-[375px]:px-5 sm:px-9 lg:h-[60px] lg:px-12">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Go_Repireo" width={44} height={44} className="size-9 object-contain min-[375px]:size-10" priority />
            <span className="text-sm font-black uppercase min-[375px]:text-base"><span className="text-[#0874ef]">Go_</span><span className="text-[#ff8a00]">Repireo</span></span>
          </Link>
          <Link href="/login" className="flex items-center gap-2 text-xs font-bold text-[#0874ef]"><span className="hidden font-medium text-slate-500 sm:inline">Already registered?</span> Sign in <ArrowRight size={15} /></Link>
        </header>

        <div className="grid lg:h-[calc(100%-60px)] lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[410px_minmax(0,1fr)]">
          <HeroPanel accountType={accountType} partnerStep={partnerStep} isOtpStep={isOtpStep} />

          <section className="relative bg-white px-4 py-6 sm:px-10 lg:mb-4 lg:mr-4 lg:mt-2 lg:min-h-0 lg:rounded-[28px] lg:px-8 lg:shadow-[0_20px_50px_rgba(29,96,168,0.12)] xl:px-12 lg:overflow-y-auto">
            <div className="mx-auto max-w-3xl">
              
              {/* Account Type Selector (Only on Step 1 when not OTP) */}
              {!isOtpStep && (
                <div className="mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Create Your Account</h1>
                      <p className="text-xs text-slate-500 mt-0.5">Select how you want to join the Go_Repireo platform.</p>
                    </div>
                    <AccountChoices accountType={accountType} onChoose={chooseAccountType} />
                  </div>
                </div>
              )}

              {/* 3-Step Wizard Progress Indicator for Partner */}
              {accountType === 'partner' && !isOtpStep && (
                <div className="mb-8 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    {[
                      { num: 1, title: 'Your Info', desc: 'Basic Details' },
                      { num: 2, title: 'Service Location', desc: 'Address & Area' },
                      { num: 3, title: 'Services & Skills', desc: 'Category & Exp' },
                    ].map((s, idx) => (
                      <div key={s.num} className="flex flex-1 items-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (s.num === 1) setPartnerStep(1);
                            if (s.num === 2 && partnerStep >= 2) setPartnerStep(2);
                          }}
                          className={`flex items-center gap-2.5 text-left transition-all ${partnerStep < s.num ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
                        >
                          <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-black transition-all ${
                            partnerStep === s.num
                              ? 'bg-[#0874ef] text-white shadow-md shadow-blue-500/30 ring-4 ring-blue-100'
                              : partnerStep > s.num
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-white text-slate-400 border border-slate-200'
                          }`}>
                            {partnerStep > s.num ? <Check size={14} /> : s.num}
                          </div>
                          <div className="hidden sm:block">
                            <p className={`text-xs font-black leading-tight ${partnerStep === s.num ? 'text-[#0874ef]' : partnerStep > s.num ? 'text-slate-800' : 'text-slate-400'}`}>
                              {s.title}
                            </p>
                            <p className="text-[10px] text-slate-400">{s.desc}</p>
                          </div>
                        </button>
                        {idx < 2 && (
                          <div className={`mx-2 sm:mx-4 h-0.5 flex-1 transition-all rounded-full ${partnerStep > s.num ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Content */}
              <form onSubmit={isOtpStep ? finishRegistration : (e) => e.preventDefault()}>
                
                {/* ================= STEP 1: YOUR INFORMATION ================= */}
                {!isOtpStep && (accountType === 'customer' || partnerStep === 1) && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2.5 pb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0874ef] flex items-center justify-center font-black text-xs">
                        1
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900">Your Information</h2>
                        <p className="text-xs text-slate-500">Enter your name and mobile number to get started.</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field
                        label="Full Name"
                        value={form.displayName}
                        onChange={(val) => update('displayName', val)}
                        placeholder="Your full name"
                        icon={<UserRound size={18} />}
                        required
                        error={fieldErrors.displayName}
                        errorMsg="Please enter your full name."
                      />
                      <Field
                        label="Email Address (Optional)"
                        value={form.email}
                        onChange={(val) => update('email', val)}
                        placeholder="name@example.com (optional)"
                        icon={<Mail size={18} />}
                        type="email"
                        required={false}
                        error={fieldErrors.email}
                        errorMsg="Please enter a valid email address."
                      />
                    </div>

                    <PhoneField
                      value={form.phone}
                      onChange={(val) => update('phone', val)}
                      error={fieldErrors.phone}
                      errorMsg="Please enter a valid 10-digit mobile number."
                    />

                    {accountType === 'customer' ? (
                      <div className="pt-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => sendCode()}
                          className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#075bd8] to-[#0788ff] text-sm font-black text-white shadow-lg shadow-blue-500/25 transition hover:brightness-105 active:scale-98 disabled:opacity-60"
                        >
                          {busy ? 'Sending OTP…' : 'Create Customer Account'} <ArrowRight size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="pt-4">
                        <button
                          type="button"
                          onClick={handleNextToLocation}
                          className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-[#0874ef] text-sm font-black text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-600 active:scale-98"
                        >
                          Next: Service Location <ArrowRight size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ================= STEP 2: ADDRESS & LOCATION ================= */}
                {!isOtpStep && accountType === 'partner' && partnerStep === 2 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2.5 pb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0874ef] flex items-center justify-center font-black text-xs">
                        2
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900">Service Location & Address</h2>
                        <p className="text-xs text-slate-500">Tell us where you provide your professional services.</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field
                          label="State"
                          value={form.state}
                          onChange={(val) => update('state', val)}
                          placeholder="e.g. Uttar Pradesh"
                          icon={<MapPin size={17} />}
                          required
                          error={fieldErrors.state}
                          errorMsg="Please enter state."
                        />
                        <Field
                          label="District / City"
                          value={form.district}
                          onChange={(val) => update('district', val)}
                          placeholder="e.g. Etawah"
                          icon={<BriefcaseBusiness size={17} />}
                          required
                          error={fieldErrors.district}
                          errorMsg="Please enter district or city."
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field
                          label="Pincode"
                          value={form.pincode}
                          onChange={(val) => update('pincode', val.replace(/\D/g, '').slice(0, 6))}
                          placeholder="e.g. 206001"
                          icon={<BriefcaseBusiness size={17} />}
                          inputMode="numeric"
                          required
                          error={fieldErrors.pincode}
                          errorMsg="Please enter a valid 6-digit pincode."
                        />
                        <Field
                          label="Specific Service Area / Localities"
                          value={form.area}
                          onChange={(val) => update('area', val)}
                          placeholder="e.g. Civil Lines, Main City, etc."
                          icon={<MapPin size={17} />}
                          required
                          error={fieldErrors.area}
                          errorMsg="Please enter service localities."
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setPartnerStep(1)}
                        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-98 transition"
                      >
                        <ArrowLeft size={16} /> Back
                      </button>
                      <button
                        type="button"
                        onClick={handleNextToServices}
                        className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-2xl bg-[#0874ef] text-sm font-black text-white shadow-lg shadow-blue-500/25 hover:bg-blue-600 active:scale-98 transition"
                      >
                        Next: Services & Experience <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                )}

                {/* ================= STEP 3: SERVICES & EXPERIENCE ================= */}
                {!isOtpStep && accountType === 'partner' && partnerStep === 3 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2.5 pb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0874ef] flex items-center justify-center font-black text-xs">
                        3
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900">Services & Experience</h2>
                        <p className="text-xs text-slate-500">Select the categories you specialize in and years of experience.</p>
                      </div>
                    </div>

                    {/* Services Checklist */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      fieldErrors.services ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50'
                    }`}>
                      <div className="flex flex-wrap items-baseline justify-between gap-1 mb-2">
                        <span className="text-xs font-bold text-slate-900">
                          Services You Provide <b className="text-red-500">*</b>
                        </span>
                        <span className="text-[10px] text-slate-500">Tap to select all that apply</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
                        {serviceOptions.map(({ name, Icon }) => {
                          const isSelected = services.includes(name);
                          return (
                            <button
                              key={name}
                              type="button"
                              onClick={() => {
                                setServices((curr) =>
                                  curr.includes(name) ? curr.filter((item) => item !== name) : [...curr, name]
                                );
                                if (fieldErrors.services) {
                                  setFieldErrors((prev) => ({ ...prev, services: false }));
                                }
                              }}
                              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                                isSelected
                                  ? 'bg-[#0874ef] text-white shadow-sm ring-2 ring-blue-300'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/30'
                              }`}
                            >
                              <Icon size={14} className={isSelected ? 'text-white' : 'text-[#0874ef]'} />
                              <span className="truncate">{name}</span>
                            </button>
                          );
                        })}
                      </div>

                      {fieldErrors.services && (
                        <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-rose-600">
                          <AlertCircle size={13} />
                          Please select at least one service category.
                        </p>
                      )}
                    </div>

                    {/* Experience & Skills Description */}
                    <div className="grid sm:grid-cols-[160px_1fr] gap-4">
                      <Field
                        label="Experience (Years)"
                        value={form.experienceYears}
                        onChange={(val) => update('experienceYears', val.replace(/\D/g, '').slice(0, 2))}
                        placeholder="e.g. 3"
                        type="number"
                        required
                        error={fieldErrors.experienceYears}
                        errorMsg="Enter years"
                      />
                      <Field
                        label="Skills & Specialty Description"
                        value={form.description}
                        onChange={(val) => update('description', val)}
                        placeholder="E.g. Inverter wiring, pipe fitting, AC gas charging & maintenance"
                        icon={<Wrench size={17} />}
                        required
                        error={fieldErrors.description}
                        errorMsg="Please describe your experience and skills."
                      />
                    </div>

                    <div className="flex items-center gap-2 rounded-xl bg-blue-50/70 p-3 text-xs text-slate-600">
                      <ShieldCheck size={18} className="text-[#0874ef] shrink-0" />
                      <span>Partner accounts are reviewed and activated by our team upon mobile verification.</span>
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setPartnerStep(2)}
                        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-98 transition"
                      >
                        <ArrowLeft size={16} /> Back
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => sendCode()}
                        className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#075bd8] to-[#0788ff] text-sm font-black text-white shadow-lg shadow-blue-500/25 hover:brightness-105 active:scale-98 transition disabled:opacity-60"
                      >
                        {busy ? 'Sending OTP…' : 'Send Verification OTP'} <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                )}

                {/* ================= STEP 4: OTP VERIFICATION ================= */}
                {isOtpStep && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <OtpStep phone={form.phone} code={form.code} onChange={(val) => update('code', val)} />

                    <button
                      type="submit"
                      disabled={busy}
                      className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#075bd8] to-[#0788ff] text-sm font-black text-white shadow-lg shadow-blue-500/25 transition hover:brightness-105 active:scale-98 disabled:opacity-60"
                    >
                      {busy ? 'Verifying…' : 'Verify & Complete Registration'} <ArrowRight size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsOtpStep(false);
                        setChallengeId('');
                        update('code', '');
                      }}
                      className="w-full text-center text-xs font-bold text-[#0874ef] hover:underline"
                    >
                      ← Edit details / change mobile number
                    </button>
                  </div>
                )}

                {error && (
                  <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-600">
                    <AlertCircle size={15} className="shrink-0" />
                    {error}
                  </p>
                )}

                <div className="mt-6 flex flex-col items-center gap-1 text-center text-[11px] text-slate-400">
                  <p className="flex items-center gap-1.5"><LockKeyhole size={13} />Your information is securely encrypted in the Go_Repireo database.</p>
                  <p>By continuing, you agree to our <Link href="/terms" className="font-semibold text-[#0874ef] hover:underline">Terms</Link> &amp; <Link href="/privacy" className="font-semibold text-[#0874ef] hover:underline">Privacy Policy</Link>.</p>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function HeroPanel({ accountType, partnerStep, isOtpStep }: { accountType: AccountType; partnerStep: number; isOtpStep: boolean }) {
  const customer = accountType === 'customer';
  return (
    <aside className="relative min-h-[185px] overflow-hidden bg-[linear-gradient(145deg,#f7fbff_0%,#dbeeff_58%,#eef8ff_100%)] px-4 py-5 text-[#071631] min-[375px]:min-h-[205px] min-[375px]:px-5 min-[375px]:py-6 sm:px-9 lg:h-full lg:min-h-0 lg:px-10 lg:py-8">
      <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_88%_13%,white_0,white_8%,transparent_9%),radial-gradient(circle_at_12%_80%,#cbe7ff_0,transparent_36%)]" />
      <div className="absolute -bottom-24 -left-20 size-72 rounded-full bg-white/70" />
      <div className="relative z-10 max-w-[270px] lg:max-w-none">
        <span className="inline-flex rounded-full bg-[#e2f0ff] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.22em] text-[#086de0]">
          {customer ? 'Customer account' : isOtpStep ? 'Security Verification' : `Step ${partnerStep} of 3: Service Partner`}
        </span>
        <h2 className="mt-3 text-[28px] font-black leading-[0.98] tracking-tight min-[375px]:text-[32px] lg:mt-4 lg:text-[42px]">
          {customer ? (
            <>Book a<br />service <span className="text-[#0874ef]">faster.</span></>
          ) : (
            <>Grow your<br /><span className="text-[#0874ef]">work</span> with us.</>
          )}
        </h2>
        <p className="mt-3 max-w-[290px] text-xs font-medium leading-5 text-[#496686] lg:mt-5 lg:text-sm lg:leading-6">
          {customer
            ? 'Create a simple account with your name and verified mobile number.'
            : isOtpStep
            ? 'Verify your mobile number to finalize your partner account.'
            : partnerStep === 1
            ? 'Start by entering your basic personal and contact information.'
            : partnerStep === 2
            ? 'Specify the service location and areas where you are available to work.'
            : 'Select your trade categories and experience to receive matching customer orders.'}
        </p>
      </div>
      <Image
        src={customer ? '/login_mechanic_3d.png' : '/custom_service_mechanic_3d.png'}
        alt="Go_Repireo service professional"
        width={520}
        height={520}
        className={`absolute z-[1] object-contain mix-blend-multiply ${
          customer
            ? '-bottom-16 right-[-42px] w-[190px] min-[375px]:-bottom-20 min-[375px]:right-[-54px] min-[375px]:w-[230px] sm:right-5 lg:-bottom-12 lg:left-1/2 lg:w-[390px] lg:-translate-x-1/2'
            : '-bottom-12 right-[-36px] w-[180px] min-[375px]:-bottom-16 min-[375px]:right-[-45px] min-[375px]:w-[220px] sm:right-4 lg:bottom-3 lg:left-1/2 lg:w-[300px] lg:-translate-x-1/2'
        }`}
        priority
      />
    </aside>
  );
}

function AccountChoices({ accountType, onChoose }: { accountType: AccountType; onChoose: (type: AccountType) => void }) {
  return (
    <div className="flex gap-2">
      {([
        { type: 'customer' as const, title: 'Customer', Icon: UserRound },
        { type: 'partner' as const, title: 'Service partner', Icon: BriefcaseBusiness }
      ]).map(({ type, title, Icon }) => {
        const isSelected = accountType === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChoose(type)}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              isSelected
                ? 'bg-[#0874ef] text-white shadow-sm ring-2 ring-blue-200'
                : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon size={15} />
            <span>{title}</span>
            {isSelected && <Check size={13} className="ml-0.5" />}
          </button>
        );
      })}
    </div>
  );
}

function PhoneField({
  value,
  onChange,
  error = false,
  errorMsg = '',
}: {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  errorMsg?: string;
}) {
  return (
    <label className="block">
      <span className={`mb-1.5 block text-xs font-bold ${error ? 'text-rose-600' : 'text-[#243858]'}`}>
        Mobile Number <b className="text-red-500">*</b>
      </span>
      <span className={`flex items-center rounded-xl border bg-[#f8fbff] h-12 transition-all focus-within:ring-2 ${
        error
          ? 'border-rose-500 ring-2 ring-rose-400/30 bg-rose-50/20'
          : 'border-slate-200 focus-within:border-[#0874ef] focus-within:ring-blue-100'
      }`}>
        <span className={`flex h-full shrink-0 items-center gap-1 border-r px-3 text-xs font-bold min-[375px]:gap-2 min-[375px]:px-4 min-[375px]:text-sm ${
          error ? 'border-rose-300 text-rose-600' : 'border-slate-200 text-slate-700'
        }`}>
          <Phone size={18} className={error ? 'text-rose-500' : 'text-[#0874ef]'} />+91 <ChevronDown size={14} />
        </span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 10))}
          inputMode="numeric"
          className={`min-w-0 flex-1 bg-transparent px-3 text-xs outline-none min-[375px]:px-4 min-[375px]:text-sm ${
            error ? 'text-rose-900 placeholder:text-rose-300' : 'text-slate-900 placeholder:text-slate-400'
          }`}
          placeholder="10-digit mobile number"
          required
        />
      </span>
      {error && errorMsg && (
        <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-600">
          <AlertCircle size={13} className="shrink-0" />
          {errorMsg}
        </p>
      )}
    </label>
  );
}

function OtpStep({ phone, code, onChange }: { phone: string; code: string; onChange: (value: string) => void }) {
  return (
    <div className="rounded-2xl bg-blue-50/70 px-4 py-8 text-center min-[375px]:px-6 min-[375px]:py-10 border border-blue-100">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-[#0874ef] shadow-md shadow-blue-500/10">
        <ShieldCheck size={28} />
      </span>
      <h2 className="mt-4 text-xl font-black min-[375px]:text-2xl text-slate-900">Verify your mobile</h2>
      <p className="mt-2 text-xs text-slate-500 min-[375px]:text-sm">
        Enter the six-digit verification code sent to <b className="text-slate-800">+91 {phone}</b>
      </p>
      <input
        value={code}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        className="mx-auto mt-6 block h-14 w-full max-w-xs rounded-xl border border-slate-300 bg-white px-3 text-center text-xl font-black tracking-[0.3em] outline-none focus:border-[#0874ef] focus:ring-2 focus:ring-blue-100 min-[375px]:px-5 min-[375px]:tracking-[0.45em]"
        placeholder="000000"
        required
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  icon,
  type = 'text',
  required = false,
  inputMode,
  error = false,
  errorMsg = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon?: ReactNode;
  type?: string;
  required?: boolean;
  inputMode?: 'numeric';
  error?: boolean;
  errorMsg?: string;
}) {
  return (
    <label className="block">
      <span className={`mb-1.5 block text-xs font-bold ${error ? 'text-rose-600' : 'text-[#243858]'}`}>
        {label} {required && <b className="text-red-500">*</b>}
      </span>
      <span className={`flex items-center rounded-xl border bg-[#f8fbff] px-4 h-12 transition-all focus-within:ring-2 ${
        error
          ? 'border-rose-500 ring-2 ring-rose-400/30 bg-rose-50/20'
          : 'border-slate-200 focus-within:border-[#0874ef] focus-within:ring-blue-100'
      }`}>
        {icon && <span className={`mr-3 ${error ? 'text-rose-500' : 'text-[#527096]'}`}>{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          inputMode={inputMode}
          className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${
            error ? 'text-rose-900 placeholder:text-rose-300' : 'text-slate-900 placeholder:text-slate-400'
          }`}
        />
      </span>
      {error && errorMsg && (
        <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-600">
          <AlertCircle size={13} className="shrink-0" />
          {errorMsg}
        </p>
      )}
    </label>
  );
}
