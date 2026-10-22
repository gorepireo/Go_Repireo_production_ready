import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CertificateVerifier from '@/components/CertificateVerifier';

export const metadata: Metadata = {
  title: 'Verify Certificate | Go_Repireo',
  description: 'Verify the authenticity and status of a Go_Repireo internship or employment certificate.',
};

export default function VerifyCertificatePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8fa] text-slate-900">
      <div className="pointer-events-none absolute -left-40 top-32 h-96 w-96 rounded-full bg-blue-300/20 blur-[130px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-36 bottom-12 h-80 w-80 rounded-full bg-amber-300/25 blur-[120px]" aria-hidden="true" />
      <div className="h-3 border-y border-slate-950/20 bg-[repeating-linear-gradient(135deg,#facc15_0px,#facc15_18px,#111827_18px,#111827_36px)]" aria-hidden="true" />
      <header className="relative">
        <div className="mx-auto flex h-20 max-w-3xl items-center px-6">
          <Image src="/logo.png" alt="Go_Repireo" width={36} height={36} className="object-contain" priority />
          <span className="ml-3 text-base font-bold tracking-tight text-slate-950">Go_Repireo</span>
        </div>
      </header>

      <div className="relative mx-auto max-w-3xl px-6 pb-16 pt-6 sm:pt-10">
        <Link href="/maintenance" className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-950"><ArrowLeft size={16} /> Back</Link>
        <section className="max-w-xl rounded-[2rem] border border-white/80 bg-white/60 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.07)] backdrop-blur-2xl sm:p-10">
          <div className="mb-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Official registry</p>
            <h1 className="text-4xl font-semibold tracking-[-0.035em] text-slate-950">Verify a certificate</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">Enter the certificate code printed on the document, or scan its QR code.</p>
          </div>
          <CertificateVerifier />
        </section>
        <p className="mt-8 max-w-xl px-1 text-xs leading-5 text-slate-400">Verification results are retrieved from the official Go_Repireo credential registry.</p>
      </div>
    </main>
  );
}
