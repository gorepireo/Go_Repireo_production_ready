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
    case 'password_reset_otp':
      return `[Go_Repireo] Password Reset OTP Code is ${params?.OTP || params?.otp || '1234'}`;
    case 'welcome':
      return 'Welcome to Go_Repireo! Instant Doorstep Home Services';
    case 'worker_approved':
      return '🎉 Congratulations! Your Technician Profile is Approved - Go_Repireo';
    case 'shop_approved':
      return '🏬 Your Merchant Store Profile is Approved - Go_Repireo';
    case 'order_confirmation':
      return `[Go_Repireo] Booking Confirmed: ${params?.SERVICE_NAME || 'Service Request'} (#${params?.ORDER_ID || ''})`;
    case 'worker_assigned':
      return `👨‍🔧 Technician ${params?.WORKER_NAME || ''} Assigned to Order #${params?.ORDER_ID || ''}`;
    case 'order_completed':
      return `✨ Service Order #${params?.ORDER_ID || ''} Completed Successfully!`;
    case 'job_alert':
      return `⚡ New Service Job Available: ${params?.SERVICE_NAME || 'Service Request'}`;
    default:
      return '[Go_Repireo] Important Notification';
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

  const logoHeader = `
    <div style="text-align: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 28px;">
      <div style="font-size: 26px; font-weight: 900; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0A1629; letter-spacing: -0.5px; text-transform: uppercase;">
        GO_<span style="color: #007AFF;">REPIREO</span>
      </div>
      <div style="font-size: 10px; font-weight: 800; color: #FF9500; text-transform: uppercase; letter-spacing: 2.5px; margin-top: 3px;">
        Instant Doorstep Maintenance & Repair
      </div>
    </div>
  `;

  const footer = `
    <div style="text-align: center; margin-top: 36px; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; font-family: sans-serif;">
      © ${new Date().getFullYear()} Go_Repireo Platform. All rights reserved.<br>
      Doorstep Plumbing, Electrical, Cleaning & Hardware Delivery Platform.<br>
      <a href="https://gorepireo.in" style="color: #007AFF; text-decoration: none; font-weight: 700;">https://gorepireo.in</a>
    </div>
  `;

  let contentHtml = '';

  switch (type) {
    case 'otp':
      contentHtml = `
        <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; text-align: center; margin: 0 0 12px 0;">Verify Your Email Address</h1>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">Hi ${userName},</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">Welcome to Go_Repireo! Please use the One-Time Password (OTP) below to verify your email address:</p>

        <div style="background: #f0f6ff; border: 2px dashed #007AFF; border-radius: 20px; padding: 24px; text-align: center; margin: 28px 0;">
          <div style="font-size: 11px; font-weight: 800; color: #007AFF; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Verification OTP Code</div>
          <div style="font-size: 38px; font-weight: 900; color: #0A1629; letter-spacing: 8px; font-family: monospace;">${otpCode}</div>
        </div>

        <div style="font-size: 12px; color: #64748b; text-align: center; background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0;">
          🔒 This code expires in <strong>10 minutes</strong>. Do not share this OTP with anyone.
        </div>
      `;
      break;

    case 'password_reset_otp':
      contentHtml = `
        <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; text-align: center; margin: 0 0 12px 0;">Reset Your Password</h1>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">Hi ${userName},</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">We received a request to reset your password for your Go_Repireo account. Use the OTP code below to proceed:</p>

        <div style="background: #fff7ed; border: 2px dashed #FF9500; border-radius: 20px; padding: 24px; text-align: center; margin: 28px 0;">
          <div style="font-size: 11px; font-weight: 800; color: #d97706; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Password Reset OTP</div>
          <div style="font-size: 38px; font-weight: 900; color: #0A1629; letter-spacing: 8px; font-family: monospace;">${otpCode}</div>
        </div>

        <div style="font-size: 12px; color: #991b1b; text-align: center; background: #fef2f2; padding: 12px; border-radius: 12px; border: 1px solid #fee2e2;">
          ⚠️ If you did not request a password reset, please ignore this email or secure your account.
        </div>
      `;
      break;

    case 'welcome':
      contentHtml = `
        <h1 style="font-size: 24px; font-weight: 900; color: #0f172a; text-align: center; margin: 0 0 12px 0;">Welcome to Go_Repireo! 🎉</h1>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">Hi ${userName},</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">Your Go_Repireo account is ready! You can now book verified doorstep service professionals and order hardware supplies directly online.</p>

        <div style="background: #f8fafc; border-radius: 18px; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0;">
          <div style="font-size: 13px; color: #334155; margin-bottom: 10px;">⚡ <strong>Upfront Pricing:</strong> Real-time cost estimates before booking</div>
          <div style="font-size: 13px; color: #334155; margin-bottom: 10px;">🛠️ <strong>Verified Experts:</strong> Background-checked plumbers & electricians</div>
          <div style="font-size: 13px; color: #334155;">📍 <strong>Live GPS Tracking:</strong> Track technician arrival in real-time</div>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="https://gorepireo.in/services/service" style="display: inline-block; background: #007AFF; color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 50px; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Book First Service</a>
        </div>
      `;
      break;

    case 'worker_approved':
      contentHtml = `
        <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; text-align: center; margin: 0 0 12px 0;">Application Approved! 🟢</h1>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">Hi ${userName},</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">Congratulations! Your technician registration application has been verified and approved by the Go_Repireo Admin team.</p>

        <div style="background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 20px; padding: 24px; text-align: center; margin: 24px 0;">
          <div style="font-size: 18px; font-weight: 900; color: #15803d; margin-bottom: 6px;">Verified Service Partner</div>
          <div style="font-size: 13px; color: #166534;">You are now active on the Go_Repireo Technician Network</div>
        </div>

        <div style="background: #f8fafc; border-radius: 16px; padding: 18px; margin: 20px 0; border: 1px solid #e2e8f0;">
          <div style="font-size: 13px; color: #334155; margin-bottom: 8px;">💼 <strong>Approved Category:</strong> ${serviceName}</div>
          <div style="font-size: 13px; color: #334155; margin-bottom: 8px;">📍 <strong>Service Area:</strong> ${address}</div>
          <div style="font-size: 13px; color: #334155;">⭐ <strong>Status:</strong> Active & Ready for Job Dispatch</div>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="https://gorepireo.in/dashboard/worker" style="display: inline-block; background: #22c55e; color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 50px; font-size: 14px; font-weight: 800; text-transform: uppercase;">Open Worker Dashboard</a>
        </div>
      `;
      break;

    case 'shop_approved':
      contentHtml = `
        <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; text-align: center; margin: 0 0 12px 0;">Store Application Approved! 🏬</h1>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">Hi ${userName},</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">Your hardware store <strong>${shopName}</strong> has been approved by the Go_Repireo Admin team.</p>

        <div style="background: #fff7ed; border: 2px dashed #FF9500; border-radius: 20px; padding: 24px; text-align: center; margin: 24px 0;">
          <div style="font-size: 18px; font-weight: 900; color: #c2410c; margin-bottom: 6px;">${shopName}</div>
          <div style="font-size: 13px; color: #9a3412;">Verified Merchant Store - ${address}</div>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="https://gorepireo.in/dashboard/shop" style="display: inline-block; background: #FF9500; color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 50px; font-size: 14px; font-weight: 800; text-transform: uppercase;">Open Shop Dashboard</a>
        </div>
      `;
      break;

    case 'order_confirmation':
      contentHtml = `
        <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; text-align: center; margin: 0 0 12px 0;">Booking Confirmed! ✅</h1>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">Hi ${userName},</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">Your service request has been successfully placed. A technician will be assigned shortly.</p>

        <div style="background: #f8fafc; border-radius: 18px; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px;">
            <span style="color: #64748b;">Order ID:</span><span style="font-weight: 700; color: #0f172a;">#${orderId}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px;">
            <span style="color: #64748b;">Service:</span><span style="font-weight: 700; color: #0f172a;">${serviceName}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px;">
            <span style="color: #64748b;">Payment Method:</span><span style="font-weight: 700; color: #0f172a;">${payMethod}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 12px 0 0 0; font-size: 16px; font-weight: 900; color: #007AFF; border-top: 2px solid #e2e8f0; margin-top: 8px;">
            <span>Total Price:</span><span>₹${price}</span>
          </div>
          <div style="background: #f0f6ff; border-radius: 12px; padding: 12px; text-align: center; margin-top: 14px; font-size: 13px; font-weight: 800; color: #007AFF;">
            🔑 Start OTP Code: ${startOtp}
          </div>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="https://gorepireo.in/track?order_id=${orderId}" style="display: inline-block; background: #007AFF; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-size: 13px; font-weight: 800; text-transform: uppercase;">Track Order Status</a>
        </div>
      `;
      break;

    case 'worker_assigned':
      contentHtml = `
        <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; text-align: center; margin: 0 0 12px 0;">Technician Assigned 👨‍🔧</h1>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">Hi ${userName},</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">A verified service technician has been assigned to your order #${orderId}.</p>

        <div style="background: #f0f6ff; border-radius: 20px; padding: 20px; text-align: center; margin: 24px 0; border: 1px solid #dbeafe;">
          <div style="font-size: 18px; font-weight: 900; color: #0A1629; margin-bottom: 4px;">${workerName}</div>
          <div style="font-size: 14px; font-weight: 700; color: #007AFF;">📞 Phone: ${workerPhone}</div>
        </div>

        <p style="font-size: 14px; color: #475569; line-height: 1.6;">Share your Start OTP (<strong>${startOtp}</strong>) with the technician upon their arrival to begin service.</p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="https://gorepireo.in/track?order_id=${orderId}" style="display: inline-block; background: #007AFF; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-size: 13px; font-weight: 800; text-transform: uppercase;">Track Live GPS Map</a>
        </div>
      `;
      break;

    case 'order_completed':
      contentHtml = `
        <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; text-align: center; margin: 0 0 12px 0;">Service Completed! ✨</h1>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">Hi ${userName},</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">Your service request <strong>#${orderId}</strong> has been completed successfully.</p>

        <div style="background: #f8fafc; border-radius: 18px; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px;">
            <span style="color: #64748b;">Order ID:</span><span style="font-weight: 700; color: #0f172a;">#${orderId}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px;">
            <span style="color: #64748b;">Service:</span><span style="font-weight: 700; color: #0f172a;">${serviceName}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 12px 0 0 0; font-size: 16px; font-weight: 900; color: #007AFF; border-top: 2px solid #e2e8f0; margin-top: 8px;">
            <span>Total Amount Paid:</span><span>₹${price}</span>
          </div>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="https://gorepireo.in/track?order_id=${orderId}&review=true" style="display: inline-block; background: #007AFF; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-size: 13px; font-weight: 800; text-transform: uppercase;">Leave Star Rating & Review ⭐</a>
        </div>
      `;
      break;

    case 'job_alert':
      contentHtml = `
        <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; text-align: center; margin: 0 0 12px 0;">New Service Job Alert! ⚡</h1>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">Hi ${userName},</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">A new service request matching your specialization is available in your area:</p>

        <div style="background: #f0f6ff; border: 2px solid #007AFF; border-radius: 20px; padding: 20px; margin: 24px 0;">
          <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">Category: ${serviceName}</div>
          <div style="font-size: 13px; color: #475569; margin-bottom: 8px;">Location: ${address}</div>
          <div style="font-size: 18px; font-weight: 900; color: #007AFF; text-align: center; margin-top: 10px;">Estimated Payout: ₹${price}</div>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="https://gorepireo.in/dashboard/worker" style="display: inline-block; background: #007AFF; color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 50px; font-size: 14px; font-weight: 800; text-transform: uppercase;">Accept Job Now</a>
        </div>
      `;
      break;

    default:
      contentHtml = `
        <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; text-align: center; margin: 0 0 12px 0;">Notification</h1>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">Hi ${userName},</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">You have a new update regarding your Go_Repireo account or service booking.</p>
      `;
      break;
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Go_Repireo Notification</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px;">
        <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 36px 28px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.03);">
          ${logoHeader}
          ${contentHtml}
          ${footer}
        </div>
      </body>
    </html>
  `;
}
