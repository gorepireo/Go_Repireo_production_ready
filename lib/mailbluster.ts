import { sendGmailEmail } from './gmail';

export interface MailblusterEmailOptions {
  toEmail: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send Transactional Email via Mailbluster API with automatic Gmail Direct SMTP fallback
 */
export async function sendMailblusterEmail(options: MailblusterEmailOptions) {
  try {
    const apiKey = process.env.MAILBLUSTER_API_KEY || '';
    const senderEmail = process.env.MAILBLUSTER_SENDER_EMAIL || 'gorepireo@gmail.com';

    const plainText = options.text || options.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    if (apiKey) {
      const response = await fetch('https://api.mailbluster.com/v1/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `Go_Repireo <${senderEmail}>`,
          to: options.toEmail,
          subject: options.subject,
          html: options.html,
          text: plainText
        })
      });

      const data = await response.json();
      if (response.ok && data.status !== 'error') {
        console.log(`[Mailbluster API Success] Sent email to ${options.toEmail}`);
        return { success: true, provider: 'mailbluster_api', data };
      } else {
        console.warn('[Mailbluster API Note]: Falling back to Gmail Direct SMTP...', data);
      }
    }

    // Automatic Fallback to Gmail Direct SMTP
    return await sendGmailEmail({
      toEmail: options.toEmail,
      toName: options.toName,
      subject: options.subject,
      html: options.html,
      text: options.text
    });
  } catch (err: any) {
    console.error('[Mailbluster Exception]: Falling back to Gmail Direct SMTP...', err);
    return await sendGmailEmail({
      toEmail: options.toEmail,
      toName: options.toName,
      subject: options.subject,
      html: options.html,
      text: options.text
    });
  }
}
