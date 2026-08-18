import nodemailer from 'nodemailer';

export interface GmailEmailOptions {
  toEmail: string;
  toName?: string;
  subject: string;
  html: string;
}

/**
 * Send Transactional Email via Gmail SMTP (500 FREE Emails / Day)
 * Uses Gmail App Password from GMAIL_APP_PASSWORD
 */
export async function sendGmailEmail(options: GmailEmailOptions) {
  try {
    const user = process.env.GMAIL_USER || 'gorepireo@gmail.com';
    const pass = process.env.GMAIL_APP_PASSWORD || 'bddcuzcihncjpuod';

    if (!user || !pass) {
      console.warn('Gmail SMTP credentials missing');
      return { success: false, error: 'Gmail credentials missing' };
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass: pass.replace(/\s+/g, ''), // Strip spaces from app password
      },
    });

    const info = await transporter.sendMail({
      from: `"Go_Repireo" <${user}>`,
      to: options.toName ? `"${options.toName}" <${options.toEmail}>` : options.toEmail,
      subject: options.subject,
      html: options.html,
    });

    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error('Gmail SMTP Exception:', err);
    return { success: false, error: err.message };
  }
}
