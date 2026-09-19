import { Resend } from 'resend';

export interface ResendEmailOptions {
  toEmail: string;
  toName?: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send Transactional Email via Resend API
 * Instantiates Resend SDK lazily inside function to prevent top-level build errors during Vercel deployment
 */
export async function sendResendEmail(options: ResendEmailOptions) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('RESEND_API_KEY is not defined in environment variables.');
      return { success: false, error: 'RESEND_API_KEY missing' };
    }

    const resendClient = new Resend(apiKey);
    const fromAddress = options.from || 'Go_Repireo <onboarding@resend.dev>';

    const response = await resendClient.emails.send({
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
