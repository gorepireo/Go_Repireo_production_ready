'use client';

import { useAuth } from '@/context/AuthContext';

const modules = [
  ['Bookings', 'Awaiting trusted booking operations'],
  ['Workers', 'Awaiting secure approval and rejection operations'],
  ['Services', 'Awaiting authorized catalogue management'],
  ['Finance', 'Awaiting verified payment and payout contracts'],
  ['Support', 'Awaiting admin ticket workflow'],
] as const;

export default function AdminPage() {
  const { profile, signOut } = useAuth();
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#F58220]">Protected administration</p>
            <h1 className="mt-1 text-3xl font-black text-[#14243A]">GO_REPIREO operations</h1>
            <p className="mt-2 text-sm text-slate-600">Signed in as {profile?.display_name || profile?.phone || 'administrator'}</p>
          </div>
          <button onClick={() => void signOut()} className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700">Sign out</button>
        </header>
        <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5" role="status">
          <h2 className="font-bold text-amber-950">Administrative mutations are disabled</h2>
          <p className="mt-1 text-sm leading-6 text-amber-900">The deployed Firebase project currently exposes no trusted Cloud Functions. Approval, booking, finance, and service-catalogue controls remain unavailable until authenticated admin endpoints and audit logging are implemented and tested.</p>
        </section>
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Admin modules">
          {modules.map(([name, status]) => (
            <article key={name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-extrabold text-[#14243A]">{name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{status}</p>
              <span className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Blocked by backend contract</span>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
