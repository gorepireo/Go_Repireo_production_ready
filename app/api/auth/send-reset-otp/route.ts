import { NextResponse } from 'next/server';
import { insforge } from '@/lib/insforge';
import { sendBrevoEmail } from '@/lib/brevo';

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

    // 2. Generate 6-digit numeric OTP & Store in Database (Valid for 10 minutes)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await insforge.database
      .from('users')
      .update({
        reset_otp: otp,
        reset_otp_expires_at: expiresAt,
      })
      .eq('email', cleanEmail);

    // 3. Send Brevo Transactional OTP Email (Template 1)
    const userName = (userRow as any).name || cleanEmail.split('@')[0];
    
    await sendBrevoEmail({
      toEmail: cleanEmail,
      toName: userName,
      templateId: Number(process.env.BREVO_TEMPLATE_OTP || 1),
      params: {
        CUSTOMER_NAME: userName,
        OTP_CODE: otp,
        EXPIRY_MINS: '10'
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Reset OTP code sent! Please check your email inbox for the 6-digit verification code.' 
    });

  } catch (error: any) {
    console.error('Send reset OTP error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send reset email' }, { status: 500 });
  }
}
