import { sendGmailEmail } from './gmail';

export interface MailjetEmailOptions {
  toEmail: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send Transactional Email via Mailjet API v3.1 with Automatic Gmail SMTP Fallback
 * API Key: fcb3ee7838198ab09e72a5e72bc25e6a
 * Secret Key: 482fb5181d2e95661469fd5fb45fdb06
 */
export async function sendMailjetEmail(options: MailjetEmailOptions) {
  try {
    const apiKey = process.env.MAILJET_API_KEY || 'fcb3ee7838198ab09e72a5e72bc25e6a';
    const secretKey = process.env.MAILJET_SECRET_KEY || '482fb5181d2e95661469fd5fb45fdb06';
    const senderEmail = process.env.MAILJET_SENDER_EMAIL || 'mandiprithibi31102006@gmail.com';

    const auth = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');
    const plainText = options.text || options.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Messages: [
          {
            From: {
              Email: senderEmail,
              Name: 'Go_Repireo'
            },
            To: [
              {
                Email: options.toEmail,
                Name: options.toName || options.toEmail
              }
            ],
            Subject: options.subject,
            TextPart: plainText,
            HTMLPart: options.html
          }
        ]
      })
    });

    const data = await response.json();

    if (response.ok && data.Messages?.[0]?.Status === 'success') {
      console.log(`[Mailjet API Success] Sent email to ${options.toEmail}`);
      return { success: true, provider: 'mailjet_api', data };
    } else {
      console.warn('[Mailjet API Note]: Account verification pending. Falling back to Gmail SMTP Direct...', data?.ErrorMessage || data);
      
      // Automatic Fallback to Gmail SMTP Direct Engine
      return await sendGmailEmail({
        toEmail: options.toEmail,
        toName: options.toName,
        subject: options.subject,
        html: options.html,
        text: options.text
      });
    }
  } catch (err: any) {
    console.error('[Mailjet Exception]: Falling back to Gmail SMTP Direct...', err);
    return await sendGmailEmail({
      toEmail: options.toEmail,
      toName: options.toName,
      subject: options.subject,
      html: options.html,
      text: options.text
    });
  }
}
