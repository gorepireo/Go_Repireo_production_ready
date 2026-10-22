import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, BadgeCheck, CircleAlert, ShieldX } from 'lucide-react';
import { lookupCertificate, normalizeCertificateCode } from '@/lib/certificate-verification';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Certificate Verification | Go_Repireo',
  description: 'Official Go_Repireo certificate verification result.',
  robots: { index: false, follow: false },
};

function displayDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(date);
}

export default async function CertificateResultPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await params;
  const code = normalizeCertificateCode(rawCode);
  const result = await lookupCertificate(code);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8fa] text-slate-900">
      <div className="pointer-events-none absolute -left-40 top-32 h-96 w-96 rounded-full bg-blue-300/20 blur-[130px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-36 bottom-12 h-80 w-80 rounded-full bg-amber-300/25 blur-[120px]" aria-hidden="true" />
      <div className="h-3 border-y border-slate-950/20 bg-[repeating-linear-gradient(135deg,#facc15_0px,#facc15_18px,#111827_18px,#111827_36px)]" aria-hidden="true" />
      <header className="border-b border-slate-200 bg-[#071a33] text-white">
        <div className="mx-auto flex h-20 max-w-6xl items-center px-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-white"><Image src="/logo.png" alt="Go_Repireo" width={38} height={38} className="object-contain" priority /></span>
          <span className="ml-3 text-lg font-bold tracking-tight">Go_Repireo</span>
        </div>
      </header>

      <div className="relative mx-auto max-w-2xl px-6 py-10 sm:py-14">
        <Link href="/verify/certificate" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700"><ArrowLeft size={16} /> Verify another certificate</Link>
        <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/60 shadow-[0_24px_80px_rgba(15,23,42,0.07)] backdrop-blur-2xl">
          <div className="border-b border-slate-200 px-6 py-5 sm:px-10">
            <p className="text-sm font-semibold text-slate-700">Go_Repireo official credential registry</p>
          </div>

          {result.state === 'found' && result.certificate.verified ? (
            <div className="p-6 sm:p-10">
              <div className="mb-8 flex items-start gap-4 border-l-4 border-emerald-600 bg-emerald-50 p-4">
                <BadgeCheck size={25} className="mt-0.5 shrink-0 text-emerald-700" />
                <div>
                  <h1 className="text-xl font-bold text-emerald-950">Certificate verified</h1>
                  <p className="mt-1 font-mono text-sm font-semibold text-emerald-800">{result.certificate.code}</p>
                </div>
              </div>
              <dl className="divide-y divide-slate-200 border-y border-slate-200">
                <div className="grid gap-1 py-4 sm:grid-cols-[11rem_1fr]"><dt className="text-sm font-medium text-slate-500">Name</dt><dd className="text-sm font-semibold text-slate-900">{result.certificate.name}</dd></div>
                <div className="grid gap-1 py-4 sm:grid-cols-[11rem_1fr]"><dt className="text-sm font-medium text-slate-500">Internship / job title</dt><dd className="text-sm font-semibold text-slate-900">{result.certificate.title}</dd></div>
                {result.certificate.department && <div className="grid gap-1 py-4 sm:grid-cols-[11rem_1fr]"><dt className="text-sm font-medium text-slate-500">Department</dt><dd className="text-sm font-semibold text-slate-900">{result.certificate.department}</dd></div>}
                <div className="grid gap-1 py-4 sm:grid-cols-[11rem_1fr]"><dt className="text-sm font-medium text-slate-500">Tenure</dt><dd className="text-sm font-semibold text-slate-900">{displayDate(result.certificate.startDate)} – {displayDate(result.certificate.endDate)}</dd></div>
              </dl>
              <p className="mt-6 text-sm leading-6 text-slate-500">This record is active and was verified against the official Go_Repireo registry.</p>
            </div>
          ) : result.state === 'unavailable' ? (
            <div className="p-8 sm:p-10"><CircleAlert size={32} className="text-amber-600" /><h1 className="mt-4 text-2xl font-bold">Verification temporarily unavailable</h1><p className="mt-3 text-sm leading-6 text-slate-600">The official credential registry could not be reached. Please try again shortly. This does not mean the certificate is invalid.</p></div>
          ) : (
            <div className="p-8 sm:p-10"><ShieldX size={32} className="text-red-600" /><h1 className="mt-4 text-2xl font-bold">Certificate not verified</h1><p className="mt-3 text-sm leading-6 text-slate-600">No valid certificate record was found for <span className="font-mono font-semibold text-slate-800">{code}</span>. Check the code and try again.</p></div>
          )}
        </section>
      </div>
    </main>
  );
}
