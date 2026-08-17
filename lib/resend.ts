import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = new Resend(resendApiKey);

export interface ResendEmailOptions {
  toEmail: string;
  toName?: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send Transactional Email via Resend API
 */
export async function sendResendEmail(options: ResendEmailOptions) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY missing in environment variables');
      return { success: false, error: 'RESEND_API_KEY missing' };
    }

    const fromAddress = options.from || 'Go_Repireo <onboarding@resend.dev>';

    const response = await resend.emails.send({
      from: fromAddress,
      to: [options.toEmail],
      subject: options.subject,
      html: options.html,
    });

    if (response.error) {
      console.error('Resend API Error:', response.error);
      return { success: false, error: response.error.message };
    }

    return { success: true, messageId: response.data?.id };
  } catch (err: any) {
    console.error('Resend Exception:', err);
    return { success: false, error: err.message };
  }
}
