import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, BadgeCheck, ShieldCheck } from 'lucide-react';
import CertificateVerifier from '@/components/CertificateVerifier';

export const metadata: Metadata = {
  title: 'Verify Certificate | Go_Repireo',
  description: 'Verify the authenticity and status of a Go_Repireo internship or employment certificate.',
};

export default function VerifyCertificatePage() {
  return (
    <main className="min-h-screen bg-[#f5f8fc] px-5 py-8 text-slate-900 sm:py-14">
      <div className="mx-auto max-w-xl">
        <Link href="/maintenance" className="mb-7 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-blue-600"><ArrowLeft size={16} /> Back</Link>
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          <div className="bg-[#071a33] px-7 py-8 text-center text-white sm:px-10">
            <Image src="/logo.png" alt="Go_Repireo" width={68} height={68} className="mx-auto mb-5 rounded-2xl bg-white p-2" priority />
            <div className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300"><ShieldCheck size={14} /> Official verification</div>
            <h1 className="text-3xl font-black tracking-tight">Verify a certificate</h1>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-300">Enter the printed certificate code or scan its QR code.</p>
          </div>
          <div className="p-7 sm:p-10"><CertificateVerifier /></div>
        </section>
        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs font-semibold text-slate-500"><BadgeCheck size={15} className="text-blue-500" /> Results are read directly from the official credential registry.</p>
      </div>
    </main>
  );
}
