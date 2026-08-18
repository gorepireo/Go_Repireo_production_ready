import nodemailer from 'nodemailer';

export interface GmailEmailOptions {
  toEmail: string;
  toName?: string;
  subject: string;
  html: string;
}

/**
 * Send Transactional Email via Gmail SMTP (500 FREE Emails / Day)
 * Uses SSL Port 465 for instant Cloud/Vercel Serverless Function delivery.
 */
export async function sendGmailEmail(options: GmailEmailOptions) {
  try {
    const rawUser = process.env.GMAIL_USER || 'gorepireo@gmail.com';
    const rawPass = process.env.GMAIL_APP_PASSWORD || 'bddcuzcihncjpuod';

    const user = rawUser.trim();
    const pass = rawPass.trim().replace(/\s+/g, '');

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL Port 465 for 100% Vercel Cloud Serverless Function compatibility
      auth: {
        user: user,
        pass: pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    const info = await transporter.sendMail({
      from: `"Go_Repireo" <${user}>`,
      to: options.toName ? `"${options.toName}" <${options.toEmail}>` : options.toEmail,
      subject: options.subject,
      html: options.html,
    });

    console.log(`[Gmail SMTP Success] Sent email to ${options.toEmail}, MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error('[Gmail SMTP Error]:', err);
    return { success: false, error: err?.message || 'SMTP sending failed' };
  }
}
