import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Website Under Maintenance | Go_Repireo',
  description: 'Go_Repireo is currently undergoing scheduled maintenance. Certificate verification remains available.',
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8fa] text-slate-950">
      <div className="pointer-events-none absolute -left-32 top-32 h-80 w-80 rounded-full bg-amber-300/25 blur-[110px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-28 bottom-24 h-96 w-96 rounded-full bg-blue-300/25 blur-[130px]" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-3 border-y border-slate-950/20 bg-[repeating-linear-gradient(135deg,#facc15_0px,#facc15_18px,#111827_18px,#111827_36px)]" aria-hidden="true" />

      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Go_Repireo" width={36} height={36} className="object-contain" priority />
          <span className="text-base font-bold tracking-tight text-slate-950">Go_Repireo</span>
        </div>
        <span className="text-xs font-medium text-slate-400">System status</span>
      </header>

      <section className="relative mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl items-center px-6 pb-24 pt-8">
        <div className="w-full rounded-[2rem] border border-white/80 bg-white/55 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-12">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Maintenance in progress
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-slate-950 sm:text-6xl">
            We’re making<br className="hidden sm:block" /> Go_Repireo better.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-500">
            Go_Repireo is temporarily offline while we improve the experience. Certificate verification remains available throughout maintenance.
          </p>

          <div className="mt-10 flex flex-col items-start gap-4 border-t border-slate-200 pt-7 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-semibold text-slate-900">Certificate verification</p><p className="mt-1 text-sm text-slate-500">The official registry is still online.</p></div>
            <Link href="/verify/certificate" className="inline-flex min-h-11 items-center gap-4 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2">
              Verify certificate <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="mt-10 h-2 w-28 rounded-full bg-[repeating-linear-gradient(135deg,#facc15_0px,#facc15_12px,#111827_12px,#111827_24px)]" aria-hidden="true" />
        </div>
      </section>

      <div className="absolute bottom-0 left-0 right-0 flex h-12 items-center border-t border-slate-200 px-6 text-xs text-slate-400">
        © {new Date().getFullYear()} Go_Repireo
      </div>
    </main>
  );
}
