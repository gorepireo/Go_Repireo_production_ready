import { NextResponse } from 'next/server';
import { sendFast2SMS } from '@/lib/fast2sms';

export async function POST(request: Request) {
  try {
    const { phone, otpCode } = await request.json();

    if (!phone || !otpCode) {
      return NextResponse.json({ error: 'Phone number and OTP code are required' }, { status: 400 });
    }

    const result = await sendFast2SMS({
      numbers: phone,
      otpCode: otpCode,
    });

    if (result.success) {
      return NextResponse.json({ success: true, message: result.message, provider: 'fast2sms' }, { status: 200 });
    }

    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  } catch (error: any) {
    console.error('Send SMS API Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
