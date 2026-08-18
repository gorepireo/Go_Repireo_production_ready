import { NextResponse } from 'next/server';
import { sendTextBeeSms } from '@/lib/textbee';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, message, otp } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Recipient phone number is required' }, { status: 400 });
    }

    const smsText = message || `Your Go_Repireo account verification OTP code is: ${otp || '1234'}. Valid for 10 minutes.`;

    const smsResult = await sendTextBeeSms({
      phoneNumber,
      message: smsText
    });

    if (smsResult.success) {
      return NextResponse.json({ success: true, data: smsResult.data }, { status: 200 });
    }

    return NextResponse.json({ success: false, error: smsResult.error }, { status: 200 });
  } catch (error: any) {
    console.error('Send SMS API Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
