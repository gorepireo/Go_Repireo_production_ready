import { NextResponse } from 'next/server';
import { verifyPhoneOtp, type OtpPurpose } from '@/lib/server/phone-otp';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const purpose: OtpPurpose = body.purpose === 'register' ? 'register' : 'login';
    const result = await verifyPhoneOtp(body.challengeId, body.phone, body.code, purpose);
    const response = NextResponse.json({ verified: result.verified, user: result.user });
    response.headers.set('Set-Cookie', result.sessionCookie);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to verify the code.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
