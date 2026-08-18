import { NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import { sendGmailEmail } from '@/lib/gmail';
import { sendResendEmail } from '@/lib/resend';
import { sendBrevoEmail } from '@/lib/brevo';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const sanitizedEmail = cleanEmail.replace(/[.#$/\[\]]/g, '_');

    // 1. Store Reset OTP in Firebase Realtime Database
    try {
      await set(ref(rtdb, `temp_otps/${sanitizedEmail}`), {
        reset_otp: otp,
        created_at: new Date().toISOString()
      });
    } catch (e) {}

    // 2. Dispatch Password Reset OTP Email
    const subject = `[Go_Repireo] Password Reset OTP Code is ${otp}`;
    const html = `
      <div style="font-family: sans-serif; padding: 24px; background: #f8fafc; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 32px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0A1629; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #475569; font-size: 14px;">Use the One-Time Password (OTP) code below to reset your Go_Repireo account password:</p>
          <div style="background: #fff7ed; border: 2px dashed #FF9500; border-radius: 16px; padding: 20px; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #0A1629; margin: 24px 0;">
            ${otp}
          </div>
          <p style="color: #94a3b8; font-size: 12px;">This code is valid for 10 minutes. If you did not request a password reset, please ignore this email.</p>
        </div>
      </div>
    `;

    // Try Gmail SMTP -> Resend -> Brevo
    let result = await sendGmailEmail({ toEmail: cleanEmail, subject, html });
    if (!result.success) {
      result = await sendResendEmail({ toEmail: cleanEmail, subject, html });
    }
    if (!result.success) {
      result = await sendBrevoEmail({ toEmail: cleanEmail, subject, html });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Password reset OTP has been sent to your email inbox.' 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Send Reset OTP Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
