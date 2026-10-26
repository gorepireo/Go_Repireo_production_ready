import { NextResponse } from 'next/server';
import { issuePhoneOtp, type OtpPurpose } from '@/lib/server/phone-otp';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const purpose: OtpPurpose = body.purpose === 'register' ? 'register' : 'login';
    const challenge = await issuePhoneOtp(body.phone, purpose);
    return NextResponse.json(challenge);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to send the verification code.';
    const status = message.includes('Too many') ? 429 : message.includes('valid 10-digit') ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
