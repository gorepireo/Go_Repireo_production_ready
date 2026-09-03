import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: 'Email, OTP, and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    // 1. Fetch user record from database
    const { data: userRow, error: fetchError } = await db.database
      .from('users')
      .select('id, reset_otp, reset_otp_expires_at')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (fetchError || !userRow) {
      return NextResponse.json({ error: 'Account not found. Please verify your email.' }, { status: 404 });
    }

    const savedOtp = (userRow as any).reset_otp;
    const expiresAt = (userRow as any).reset_otp_expires_at;

    let isDbOtpValid = false;
    if (savedOtp && savedOtp === cleanOtp) {
      if (!expiresAt || new Date(expiresAt).getTime() >= Date.now()) {
        isDbOtpValid = true;
      }
    }

    // 2. Try native InsForge auth reset password verification as well
    let isNativeAuthValid = false;
    try {
      const { data: resetData, error: resetErr } = await db.auth.resetPassword({
        newPassword,
        otp: cleanOtp,
      });

      if (!resetErr && resetData) {
        isNativeAuthValid = true;
      }
    } catch (e) {
      console.warn('Native auth password reset attempt:', e);
    }

    // If neither DB OTP nor Native Auth OTP passed, return invalid OTP error
    if (!isDbOtpValid && !isNativeAuthValid) {
      return NextResponse.json({ 
        error: 'Invalid or expired OTP verification code. Please check the code in your email or request a new code.' 
      }, { status: 400 });
    }

    // 3. Update password in database users table
    await db.database
      .from('users')
      .update({
        password: newPassword,
        reset_otp: null,
        reset_otp_expires_at: null,
      })
      .eq('email', cleanEmail);

    return NextResponse.json({ 
      success: true, 
      message: 'Password reset successfully! You can now sign in with your new password.' 
    });

  } catch (error: any) {
    console.error('Verify reset OTP error:', error);
    return NextResponse.json({ error: error.message || 'Failed to reset password' }, { status: 500 });
  }
}
