import { NextResponse } from 'next/server';
import { lookupCertificate, normalizeCertificateCode } from '@/lib/certificate-verification';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await context.params;
  const code = normalizeCertificateCode(rawCode);
  const result = await lookupCertificate(code);

  if (result.state === 'found') {
    return NextResponse.json(result.certificate, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
    });
  }
  if (result.state === 'not-found') {
    return NextResponse.json({ code, verified: false, error: 'Certificate not found.' }, { status: 404 });
  }
  return NextResponse.json(
    { code, verified: false, error: 'Verification service is temporarily unavailable.' },
    { status: 503, headers: { 'Retry-After': '300' } },
  );
}
