import { NextResponse } from 'next/server';
import { sendSmsGate } from '@/lib/smsGate';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, message, otp } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Mobile phone number (phoneNumber) is required' }, { status: 400 });
    }

    const smsText = message || `Your Go_Repireo verification code is ${otp || '1234'}. It will expire in 10 minutes.`;

    const result = await sendSmsGate({
      phoneNumber,
      message: smsText
    });

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data, provider: 'sms_gate' }, { status: 200 });
    }

    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  } catch (error: any) {
    console.error('Send SMS API Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
