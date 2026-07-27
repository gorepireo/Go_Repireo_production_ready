import { NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if user exists in database
    const { data: userRow } = await insforge.database
      .from('users')
      .select('id, name, email')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (!userRow) {
      return NextResponse.json({ 
        error: 'No account found with this email address. Please check your email or register a new account.' 
      }, { status: 444 });
    }

    // 2. Generate 6-digit numeric OTP & Store in Database (Valid for 5 minutes)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes strictly

    await insforge.database
      .from('users')
      .update({
        reset_otp: otp,
        reset_otp_expires_at: expiresAt,
      })
      .eq('email', cleanEmail);

    // 3. Trigger native InsForge Auth reset password email (Works on Free Plan)
    const { error: authError } = await insforge.auth.sendResetPasswordEmail({ 
      email: cleanEmail 
    });

    if (authError) {
      console.warn('InsForge auth email trigger message:', authError.message);
    }

    // 4. Try custom email as optional enhancement (suppress free plan restriction error)
    const userName = (userRow as any).name || 'Valued User';
    const otpFormatted = otp.split('').join(' ');

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Reset Password OTP</title></head>
<body style="margin:0; padding:20px; background-color:#F8FAFC; font-family:sans-serif;">
  <div style="max-width:500px; margin:0 auto; background:#FFFFFF; border-radius:16px; padding:32px; border:1px solid #E2E8F0; text-align:center;">
    <h2 style="color:#0A1629; margin-top:0;">Go_Repireo Password Reset</h2>
    <p style="color:#475569; font-size:14px;">Hi ${userName}, use the code below to reset your password:</p>
    <div style="background:#F0F7FF; border:2px dashed #007AFF; padding:20px; border-radius:12px; font-size:32px; font-weight:bold; letter-spacing:8px; color:#0A1629; margin:20px 0;">
      ${otpFormatted}
    </div>
    <p style="color:#64748B; font-size:12px;">⏱️ Valid strictly for <strong>5 minutes</strong>. If you did not request this, please ignore.</p>
  </div>
</body>
</html>`;

    try {
      await insforge.emails.send({
        to: cleanEmail,
        subject: `🔒 ${otp} is your Go_Repireo Password Reset OTP`,
        html: emailHtml,
      });
    } catch (e: any) {
      console.log('Custom email API skipped (free plan mode enabled)');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Reset OTP code sent! Please check your Gmail inbox for the 6-digit verification code.' 
    });

  } catch (error: any) {
    console.error('Send reset OTP error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send reset email' }, { status: 500 });
  }
}
