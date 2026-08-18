import { NextResponse } from 'next/server';
import { sendGmailEmail } from '@/lib/gmail';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { toEmail, toName, params, type, subject, html } = body;

    if (!toEmail) {
      return NextResponse.json({ error: 'Recipient email (toEmail) is required' }, { status: 400 });
    }

    const emailSubject = subject || getSubjectByType(type, params);
    const emailHtml = html || getHtmlTemplateByType(type, toName, params);

    // Exclusive Gmail SMTP Direct Email Dispatch
    const gmailResult = await sendGmailEmail({
      toEmail,
      toName,
      subject: emailSubject,
      html: emailHtml,
    });

    if (gmailResult.success) {
      return NextResponse.json({ success: true, messageId: gmailResult.messageId, provider: 'gmail_smtp' }, { status: 200 });
    }

    return NextResponse.json({ success: false, error: gmailResult.error }, { status: 500 });
  } catch (error: any) {
    console.error('Gmail SMTP Email API Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

function getSubjectByType(type?: string, params?: any): string {
  switch (type) {
    case 'otp':
      return `Your Go_Repireo verification code is ${params?.OTP || params?.otp || '1234'}`;
    case 'password_reset_otp':
      return `Your Go_Repireo password reset code is ${params?.OTP || params?.otp || '1234'}`;
    case 'welcome':
      return 'Welcome to Go_Repireo Doorstep Home Services';
    case 'worker_approved':
      return 'Your Go_Repireo technician profile is approved';
    case 'shop_approved':
      return 'Your Go_Repireo merchant store profile is approved';
    case 'order_confirmation':
      return `Your Go_Repireo booking is confirmed (#${params?.ORDER_ID || ''})`;
    case 'worker_assigned':
      return `Technician ${params?.WORKER_NAME || ''} assigned to your order #${params?.ORDER_ID || ''}`;
    case 'order_completed':
      return `Your Go_Repireo service order #${params?.ORDER_ID || ''} is complete`;
    case 'job_alert':
      return `New service job available: ${params?.SERVICE_NAME || 'Service Request'}`;
    default:
      return 'Important Go_Repireo Notification';
  }
}

function getHtmlTemplateByType(type?: string, name?: string, params?: any): string {
  const userName = name || params?.NAME || params?.WORKER_NAME || params?.OWNER_NAME || 'Customer';
  const otpCode = params?.OTP || params?.otp || '1234';
  const serviceName = params?.SERVICE_NAME || params?.SERVICE_CATEGORY || 'Service & Repair';
  const orderId = params?.ORDER_ID || 'ORD-1001';
  const price = params?.TOTAL_PRICE || '248';
  const workerName = params?.WORKER_NAME || 'Rahul Sharma';
  const workerPhone = params?.WORKER_PHONE || '+91 9812345678';
  const address = params?.ADDRESS || params?.SERVICE_AREA || 'Etawah, Uttar Pradesh';
  const payMethod = params?.PAYMENT_METHOD || 'Cash on Service';
  const startOtp = params?.START_OTP || '1234';
  const shopName = params?.SHOP_NAME || 'Gupta Hardware Store';

  switch (type) {
    case 'otp':
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; color: #0f172a; line-height: 1.6; max-width: 500px; margin: 0 auto; padding: 20px;">
          <p>Hi ${userName},</p>
          <p>Your verification code for Go_Repireo is <strong style="font-size: 26px; color: #007AFF; font-family: monospace; letter-spacing: 4px;">${otpCode}</strong>.</p>
          <p>It will expire in 10 minutes.</p>
          <br>
          <p style="color: #64748b; font-size: 13px;">Thanks,<br><strong>Go_Repireo Team</strong></p>
        </div>
      `;

    case 'password_reset_otp':
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; color: #0f172a; line-height: 1.6; max-width: 500px; margin: 0 auto; padding: 20px;">
          <p>Hi ${userName},</p>
          <p>Your password reset code for Go_Repireo is <strong style="font-size: 26px; color: #007AFF; font-family: monospace; letter-spacing: 4px;">${otpCode}</strong>.</p>
          <p>If you did not request a password reset, you can safely ignore this email.</p>
          <br>
          <p style="color: #64748b; font-size: 13px;">Thanks,<br><strong>Go_Repireo Team</strong></p>
        </div>
      `;

    case 'welcome':
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; color: #0f172a; line-height: 1.6; max-width: 500px; margin: 0 auto; padding: 20px;">
          <p>Hi ${userName},</p>
          <p>Welcome to Go_Repireo! Your account is ready. You can now book verified doorstep service professionals and order hardware supplies directly online.</p>
          <p><a href="https://gorepireo.in/services/service" style="display: inline-block; background: #007AFF; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 40px; font-weight: 700;">Book First Service</a></p>
          <br>
          <p style="color: #64748b; font-size: 13px;">Thanks,<br><strong>Go_Repireo Team</strong></p>
        </div>
      `;

    case 'worker_approved':
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; color: #0f172a; line-height: 1.6; max-width: 500px; margin: 0 auto; padding: 20px;">
          <p>Hi ${userName},</p>
          <p>Congratulations! Your technician registration application for <strong>${serviceName}</strong> (${address}) has been verified and approved by the Go_Repireo Admin team.</p>
          <p><a href="https://gorepireo.in/dashboard/worker" style="display: inline-block; background: #22c55e; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 40px; font-weight: 700;">Open Worker Dashboard</a></p>
          <br>
          <p style="color: #64748b; font-size: 13px;">Thanks,<br><strong>Go_Repireo Admin Team</strong></p>
        </div>
      `;

    case 'shop_approved':
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; color: #0f172a; line-height: 1.6; max-width: 500px; margin: 0 auto; padding: 20px;">
          <p>Hi ${userName},</p>
          <p>Your hardware store <strong>${shopName}</strong> (${address}) has been verified and approved on Go_Repireo.</p>
          <p><a href="https://gorepireo.in/dashboard/shop" style="display: inline-block; background: #FF9500; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 40px; font-weight: 700;">Open Shop Dashboard</a></p>
          <br>
          <p style="color: #64748b; font-size: 13px;">Thanks,<br><strong>Go_Repireo Admin Team</strong></p>
        </div>
      `;

    case 'order_confirmation':
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; color: #0f172a; line-height: 1.6; max-width: 500px; margin: 0 auto; padding: 20px;">
          <p>Hi ${userName},</p>
          <p>Your service request <strong>${serviceName}</strong> (#${orderId}) is confirmed.</p>
          <p>Total Price: ₹${price} (${payMethod})<br>Start OTP Code: <strong>${startOtp}</strong></p>
          <p><a href="https://gorepireo.in/track?order_id=${orderId}" style="display: inline-block; background: #007AFF; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 40px; font-weight: 700;">Track Order</a></p>
          <br>
          <p style="color: #64748b; font-size: 13px;">Thanks,<br><strong>Go_Repireo Team</strong></p>
        </div>
      `;

    case 'worker_assigned':
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; color: #0f172a; line-height: 1.6; max-width: 500px; margin: 0 auto; padding: 20px;">
          <p>Hi ${userName},</p>
          <p>Technician <strong>${workerName}</strong> (${workerPhone}) has been assigned to your order #${orderId}.</p>
          <p>Please share your Start OTP <strong>${startOtp}</strong> upon their arrival.</p>
          <p><a href="https://gorepireo.in/track?order_id=${orderId}" style="display: inline-block; background: #007AFF; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 40px; font-weight: 700;">Track Live GPS Map</a></p>
          <br>
          <p style="color: #64748b; font-size: 13px;">Thanks,<br><strong>Go_Repireo Team</strong></p>
        </div>
      `;

    case 'order_completed':
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; color: #0f172a; line-height: 1.6; max-width: 500px; margin: 0 auto; padding: 20px;">
          <p>Hi ${userName},</p>
          <p>Your service request <strong>${serviceName}</strong> (#${orderId}) is completed.</p>
          <p><a href="https://gorepireo.in/track?order_id=${orderId}&review=true" style="display: inline-block; background: #007AFF; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 40px; font-weight: 700;">Leave Review ⭐</a></p>
          <br>
          <p style="color: #64748b; font-size: 13px;">Thanks,<br><strong>Go_Repireo Team</strong></p>
        </div>
      `;

    case 'job_alert':
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; color: #0f172a; line-height: 1.6; max-width: 500px; margin: 0 auto; padding: 20px;">
          <p>Hi ${userName},</p>
          <p>A new service request for <strong>${serviceName}</strong> (${address}) is available near you.</p>
          <p>Estimated Payout: <strong>₹${price}</strong></p>
          <p><a href="https://gorepireo.in/dashboard/worker" style="display: inline-block; background: #007AFF; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 40px; font-weight: 700;">Accept Job Now</a></p>
          <br>
          <p style="color: #64748b; font-size: 13px;">Thanks,<br><strong>Go_Repireo Dispatch Team</strong></p>
        </div>
      `;

    default:
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; color: #0f172a; line-height: 1.6; max-width: 500px; margin: 0 auto; padding: 20px;">
          <p>Hi ${userName},</p>
          <p>You have a new update regarding your Go_Repireo account or service booking.</p>
          <br>
          <p style="color: #64748b; font-size: 13px;">Thanks,<br><strong>Go_Repireo Team</strong></p>
        </div>
      `;
  }
}
