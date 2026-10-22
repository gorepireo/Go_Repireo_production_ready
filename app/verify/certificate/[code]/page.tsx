import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, BadgeCheck, CalendarDays, CircleAlert, ShieldX, UserRound, BriefcaseBusiness } from 'lucide-react';
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
    <main className="min-h-screen bg-[#f5f8fc] px-5 py-8 text-slate-900 sm:py-14">
      <div className="mx-auto max-w-xl">
        <Link href="/verify/certificate" className="mb-7 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-blue-600"><ArrowLeft size={16} /> Verify another</Link>
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          <div className="border-b border-slate-100 px-7 py-7 text-center">
            <Image src="/logo.png" alt="Go_Repireo" width={62} height={62} className="mx-auto mb-4 rounded-2xl bg-white p-1 shadow-md" priority />
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Go_Repireo official credential registry</p>
          </div>

          {result.state === 'found' && result.certificate.verified ? (
            <div className="p-7 sm:p-10">
              <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                <BadgeCheck size={48} className="mx-auto text-emerald-600" />
                <h1 className="mt-3 text-2xl font-black text-emerald-900">Certificate verified</h1>
                <p className="mt-1 font-mono text-xs font-bold tracking-wider text-emerald-700">{result.certificate.code}</p>
              </div>
              <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-100">
                <div className="flex gap-4 p-4"><UserRound className="mt-0.5 shrink-0 text-blue-500" size={19} /><div><dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">Name</dt><dd className="mt-1 text-sm font-black text-slate-900">{result.certificate.name}</dd></div></div>
                <div className="flex gap-4 p-4"><BriefcaseBusiness className="mt-0.5 shrink-0 text-blue-500" size={19} /><div><dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">Internship / job title</dt><dd className="mt-1 text-sm font-black text-slate-900">{result.certificate.title}</dd></div></div>
                <div className="flex gap-4 p-4"><CalendarDays className="mt-0.5 shrink-0 text-blue-500" size={19} /><div><dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tenure</dt><dd className="mt-1 text-sm font-black text-slate-900">{displayDate(result.certificate.startDate)} – {displayDate(result.certificate.endDate)}</dd></div></div>
              </dl>
              <p className="mt-6 text-center text-xs font-semibold leading-5 text-slate-500">This record is active and was verified against the official Go_Repireo registry.</p>
            </div>
          ) : result.state === 'unavailable' ? (
            <div className="p-8 text-center sm:p-12"><CircleAlert size={48} className="mx-auto text-amber-500" /><h1 className="mt-4 text-2xl font-black">Verification temporarily unavailable</h1><p className="mt-3 text-sm leading-6 text-slate-500">The official credential registry could not be reached. Please try again shortly. This does not mean the certificate is invalid.</p></div>
          ) : (
            <div className="p-8 text-center sm:p-12"><ShieldX size={48} className="mx-auto text-rose-500" /><h1 className="mt-4 text-2xl font-black">Certificate not verified</h1><p className="mt-3 text-sm leading-6 text-slate-500">No valid certificate record was found for <span className="font-mono font-bold text-slate-700">{code}</span>. Check the code and try again.</p></div>
          )}
        </section>
      </div>
    </main>
  );
}
