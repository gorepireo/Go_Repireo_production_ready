import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, Construction, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Website Under Maintenance | Go_Repireo',
  description: 'Go_Repireo is currently undergoing scheduled maintenance. Certificate verification remains available.',
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07111f] px-5 py-12 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_20%,rgba(0,122,255,.35),transparent_34%),radial-gradient(circle_at_80%_80%,rgba(16,185,129,.18),transparent_30%)]" />
      <div className="absolute left-[-8%] top-8 w-[116%] -rotate-3 border-y-4 border-black bg-[repeating-linear-gradient(135deg,#facc15_0px,#facc15_28px,#111827_28px,#111827_56px)] py-4 shadow-2xl" aria-hidden="true" />
      <div className="absolute bottom-10 left-[-8%] w-[116%] rotate-2 border-y-4 border-black bg-[repeating-linear-gradient(135deg,#facc15_0px,#facc15_28px,#111827_28px,#111827_56px)] py-4 shadow-2xl" aria-hidden="true" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-6rem)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.07] p-7 text-center shadow-2xl backdrop-blur-xl sm:p-12">
          <Image src="/logo.png" alt="Go_Repireo" width={82} height={82} className="mx-auto mb-7 rounded-2xl bg-white p-2 shadow-xl" priority />
          <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
            <Construction size={16} /> Scheduled maintenance
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Website under maintenance</h1>
          <p className="mx-auto mt-5 max-w-xl text-sm font-medium leading-7 text-slate-300 sm:text-base">
            We are improving the Go_Repireo experience. The main website is temporarily unavailable, but official certificate verification remains online.
          </p>

          <Link href="/verify/certificate" className="mx-auto mt-9 inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-[#007AFF] px-7 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-400/40">
            <BadgeCheck size={21} /> Verify a certificate
          </Link>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
            <ShieldCheck size={15} className="text-emerald-400" /> Official Go_Repireo verification portal
          </div>
        </div>
      </section>
    </main>
  );
}
