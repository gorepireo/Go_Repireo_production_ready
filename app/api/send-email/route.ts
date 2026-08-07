import { NextResponse } from 'next/server';
import { sendBrevoEmail } from '@/lib/brevo';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { toEmail, toName, templateId, params, type } = body;

    if (!toEmail) {
      return NextResponse.json({ error: 'Recipient email (toEmail) is required' }, { status: 400 });
    }

    // Default template ID map if templateId not explicitly passed
    let selectedTemplateId = templateId;
    if (!selectedTemplateId) {
      const templateMap: Record<string, number> = {
        otp: Number(process.env.BREVO_TEMPLATE_OTP || 1),
        welcome: Number(process.env.BREVO_TEMPLATE_WELCOME || 2),
        order_confirmation: Number(process.env.BREVO_TEMPLATE_ORDER_CONFIRMED || 3),
        worker_assigned: Number(process.env.BREVO_TEMPLATE_WORKER_ASSIGNED || 4),
        order_completed: Number(process.env.BREVO_TEMPLATE_ORDER_COMPLETED || 5),
        job_alert: Number(process.env.BREVO_TEMPLATE_JOB_ALERT || 6),
      };

      selectedTemplateId = templateMap[type] || 1;
    }

    const result = await sendBrevoEmail({
      toEmail,
      toName,
      templateId: selectedTemplateId,
      params: params || {},
    });

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Send Email API Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
