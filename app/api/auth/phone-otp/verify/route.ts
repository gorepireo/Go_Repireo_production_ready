import { NextResponse } from 'next/server';
import { verifyPhoneOtp, type OtpPurpose } from '@/lib/server/phone-otp';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const purpose: OtpPurpose = body.purpose === 'register' ? 'register' : 'login';
    return NextResponse.json(await verifyPhoneOtp(body.challengeId, body.phone, body.code, purpose));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to verify the code.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
