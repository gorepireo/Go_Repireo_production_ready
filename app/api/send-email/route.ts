import { NextResponse } from 'next/server';
import { sendGmailEmail } from '@/lib/gmail';
import { sendResendEmail } from '@/lib/resend';
import { sendBrevoEmail } from '@/lib/brevo';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { toEmail, toName, templateId, params, type, subject, html } = body;

    if (!toEmail) {
      return NextResponse.json({ error: 'Recipient email (toEmail) is required' }, { status: 400 });
    }

    const emailSubject = subject || getSubjectByType(type, params);
    const emailHtml = html || getHtmlTemplateByType(type, toName, params);

    // 1. Primary: Gmail SMTP (500 FREE Emails / Day directly to recipient inbox)
    const gmailResult = await sendGmailEmail({
      toEmail,
      toName,
      subject: emailSubject,
      html: emailHtml,
    });

    if (gmailResult.success) {
      return NextResponse.json({ success: true, messageId: gmailResult.messageId, provider: 'gmail_smtp' }, { status: 200 });
    }

    console.warn('Gmail SMTP note, falling back to Resend API:', gmailResult.error);

    // 2. Secondary Fallback: Resend API
    const resendResult = await sendResendEmail({
      toEmail,
      toName,
      subject: emailSubject,
      html: emailHtml,
    });

    if (resendResult.success) {
      return NextResponse.json({ success: true, messageId: resendResult.messageId, provider: 'resend' }, { status: 200 });
    }

    // 3. Tertiary Fallback: Brevo REST API
    const brevoResult = await sendBrevoEmail({
      toEmail,
      toName,
      subject: emailSubject,
      html: emailHtml,
      templateId: templateId,
      params: params || {},
    });

    if (brevoResult.success) {
      return NextResponse.json({ success: true, messageId: brevoResult.messageId, provider: 'brevo' }, { status: 200 });
    }

    return NextResponse.json({ success: false, error: gmailResult.error || resendResult.error || brevoResult.error }, { status: 500 });
  } catch (error: any) {
    console.error('Send Email API Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

function getSubjectByType(type?: string, params?: any): string {
  switch (type) {
    case 'otp':
      return `[Go_Repireo] Your Verification OTP Code is ${params?.OTP || params?.otp || '1234'}`;
    case 'welcome':
      return 'Welcome to Go_Repireo! Instant Doorstep Home Services';
    case 'order_confirmation':
      return `[Go_Repireo] Order Confirmed: ${params?.SERVICE_NAME || 'Service Booking'}`;
    case 'worker_assigned':
      return `[Go_Repireo] Technician Assigned for Your Order #${params?.ORDER_ID || ''}`;
    case 'order_completed':
      return '[Go_Repireo] Service Order Completed Successfully!';
    case 'job_alert':
      return '[Go_Repireo] New Service Job Available Near You';
    default:
      return '[Go_Repireo] Important Notification';
  }
}

function getHtmlTemplateByType(type?: string, name?: string, params?: any): string {
  const userName = name || params?.NAME || 'Customer';
  const otpCode = params?.OTP || params?.otp || '1234';
  const serviceName = params?.SERVICE_NAME || 'Service & Repair';
  const orderId = params?.ORDER_ID || 'ORD-1001';
  const price = params?.TOTAL_PRICE || '248';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
          .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
          .header { text-align: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }
          .logo { font-size: 22px; font-weight: 900; color: #0A1629; text-transform: uppercase; letter-spacing: -0.5px; }
          .accent { color: #007AFF; }
          .title { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; }
          .body-text { font-size: 14px; color: #475569; line-height: 1.6; }
          .otp-box { background: #f0f6ff; border: 2px dashed #007AFF; border-radius: 16px; padding: 16px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 32px; font-weight: 900; color: #007AFF; letter-spacing: 6px; }
          .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo">GO_<span class="accent">REPIREO</span></div>
          </div>
          <h2 class="title">Hello ${userName},</h2>
          ${type === 'otp' ? `
            <p class="body-text">Thank you for registering with Go_Repireo. Please use the One-Time Password (OTP) below to verify your account:</p>
            <div class="otp-box">
              <div class="otp-code">${otpCode}</div>
            </div>
            <p class="body-text">This OTP code is valid for 10 minutes. Please do not share this OTP with anyone.</p>
          ` : `
            <p class="body-text">Your request for <strong>${serviceName}</strong> (Order #${orderId}) has been updated.</p>
            <p class="body-text">Total Price: <strong>₹${price}</strong></p>
          `}
          <div class="footer">
            © ${new Date().getFullYear()} Go_Repireo. All rights reserved.<br>Doorstep Maintenance & Repair Platform
          </div>
        </div>
      </body>
    </html>
  `;
}
