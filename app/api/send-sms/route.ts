import { NextResponse } from 'next/server';
import { sendTextBeeSms } from '@/lib/textbee';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, message, otp, type, params, name } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Recipient phone number is required' }, { status: 400 });
    }

    const smsText = message || getSmsTextByType(type, name, params || { otp });

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

function getSmsTextByType(type?: string, name?: string, params?: any): string {
  const userName = name || params?.NAME || params?.WORKER_NAME || 'Customer';
  const otpCode = params?.OTP || params?.otp || '1234';
  const serviceName = params?.SERVICE_NAME || params?.SERVICE_CATEGORY || 'Service & Repair';
  const orderId = params?.ORDER_ID || 'ORD-1001';
  const price = params?.TOTAL_PRICE || '248';
  const workerName = params?.WORKER_NAME || 'Technician';
  const workerPhone = params?.WORKER_PHONE || '';
  const startOtp = params?.START_OTP || '1234';

  switch (type) {
    case 'otp':
      return `Hi ${userName}, your Go_Repireo account verification OTP code is ${otpCode}. Valid for 10 minutes.`;

    case 'password_reset_otp':
      return `Hi ${userName}, your Go_Repireo password reset OTP code is ${otpCode}. Valid for 10 minutes.`;

    case 'welcome':
      return `Welcome to Go_Repireo, ${userName}! Book verified home service technicians and hardware supplies online at https://gorepireo.in`;

    case 'worker_approved':
      return `Congratulations ${userName}! Your Go_Repireo technician application for ${serviceName} has been approved. Access your dashboard at https://gorepireo.in/dashboard/worker`;

    case 'shop_approved':
      return `Congratulations ${userName}! Your Go_Repireo hardware store application has been approved. Access your dashboard at https://gorepireo.in/dashboard/shop`;

    case 'order_confirmation':
      return `Your Go_Repireo booking #${orderId} (${serviceName}) is confirmed! Total: ₹${price}. Start OTP: ${startOtp}. Track at https://gorepireo.in/track?id=${orderId}`;

    case 'worker_assigned':
      return `Technician ${workerName} (${workerPhone}) has been assigned to your Go_Repireo order #${orderId}. Share Start OTP ${startOtp} on arrival.`;

    case 'order_completed':
      return `Your Go_Repireo service order #${orderId} is complete! Thank you for using Go_Repireo. Leave review at https://gorepireo.in/track?id=${orderId}`;

    case 'job_alert':
      return `New Go_Repireo service job available: ${serviceName}. Estimated Payout: ₹${price}. Accept now at https://gorepireo.in/dashboard/worker`;

    default:
      return `Hi ${userName}, your Go_Repireo verification code is ${otpCode}. Valid for 10 minutes.`;
  }
}
