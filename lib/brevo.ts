/**
 * Brevo Transactional Email Integration Module for Go_Repireo
 */

export interface SendEmailPayload {
  toEmail: string;
  toName?: string;
  templateId?: number;
  params?: Record<string, any>;
  subject?: string;
  html?: string;
}

/**
 * Core function to send transactional emails via Brevo REST API v3
 * Supports direct HTML delivery to any Gmail address
 */
export async function sendBrevoEmail({ toEmail, toName, templateId, params, subject, html }: SendEmailPayload) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.warn('BREVO_API_KEY is not configured in environment variables.');
    return { success: false, error: 'BREVO_API_KEY is missing' };
  }

  try {
    const payload: any = {
      sender: { name: 'Go_Repireo', email: 'gorepireo@gmail.com' },
      to: [
        {
          email: toEmail,
          name: toName || 'Valued Customer',
        },
      ],
    };

    if (html && subject) {
      payload.subject = subject;
      payload.htmlContent = html;
    } else if (templateId) {
      payload.templateId = Number(templateId);
      payload.params = params || {};
    } else {
      payload.subject = subject || '[Go_Repireo] Notification';
      payload.htmlContent = html || `<p>Hello ${toName || 'User'}, thank you for choosing Go_Repireo.</p>`;
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Brevo API Error:', data);
      return { success: false, error: data.message || 'Failed to send email via Brevo' };
    }

    return { success: true, messageId: data.messageId };
  } catch (error: any) {
    console.error('Error connecting to Brevo API:', error);
    return { success: false, error: error.message };
  }
}
