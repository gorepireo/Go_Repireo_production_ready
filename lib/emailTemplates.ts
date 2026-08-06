/**
 * Custom HTML Email Templates for Go_Repireo
 */

export interface OrderEmailParams {
  customerName: string;
  orderId: string;
  serviceName: string;
  totalPrice: number;
  paymentMethod: string;
  paymentStatus: string;
  startOtp?: string;
  completionOtp?: string;
  address?: string;
  supportPhone?: string;
}

export function getOrderConfirmationTemplate(params: OrderEmailParams): string {
  const {
    customerName,
    orderId,
    serviceName,
    totalPrice,
    paymentMethod,
    paymentStatus,
    startOtp,
    completionOtp,
    address,
    supportPhone = '+91 8679245568'
  } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #007AFF 0%, #0051a8 100%); padding: 30px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; }
    .header p { margin: 5px 0 0 0; font-size: 13px; opacity: 0.9; }
    .body { padding: 30px; }
    .card { background: #f1f5f9; border-radius: 14px; padding: 20px; margin-bottom: 20px; }
    .otp-box { background: #e0f2fe; border: 2px dashed #0284c7; border-radius: 12px; padding: 15px; text-align: center; margin: 20px 0; }
    .otp-code { font-size: 28px; font-weight: 900; color: #0369a1; letter-spacing: 4px; }
    .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .table td { padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .table td.bold { font-weight: bold; text-align: right; }
    .footer { background: #0f172a; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; }
    .footer a { color: #38bdf8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Go_Repireo</h1>
      <p>Service Booking Confirmation</p>
    </div>
    <div class="body">
      <p>Hello <strong>${customerName}</strong>,</p>
      <p>Thank you for choosing <strong>Go_Repireo</strong>! Your service request has been received.</p>
      
      <div class="card">
        <div style="font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: bold;">Booking Reference</div>
        <div style="font-size: 18px; font-weight: 900; color: #007AFF;">#${orderId.slice(0, 8)}</div>
      </div>

      ${startOtp ? `
      <div class="otp-box">
        <div style="font-size: 11px; font-weight: bold; color: #0369a1; uppercase;">YOUR SERVICE START OTP</div>
        <div class="otp-code">${startOtp}</div>
        <div style="font-size: 11px; color: #475569; margin-top: 5px;">Give this 4-digit code to your expert upon arrival</div>
      </div>
      ` : ''}

      ${completionOtp ? `
      <div class="otp-box" style="background: #f0fdf4; border-color: #16a34a;">
        <div style="font-size: 11px; font-weight: bold; color: #15803d; uppercase;">COMPLETION OTP</div>
        <div class="otp-code" style="color: #15803d;">${completionOtp}</div>
        <div style="font-size: 11px; color: #475569; margin-top: 5px;">Give to worker after work is verified</div>
      </div>
      ` : ''}

      <table class="table">
        <tr>
          <td>Service Type</td>
          <td class="bold" style="text-transform: capitalize;">${serviceName}</td>
        </tr>
        <tr>
          <td>Payment Method</td>
          <td class="bold">${paymentMethod.toUpperCase()}</td>
        </tr>
        <tr>
          <td>Payment Status</td>
          <td class="bold" style="color: ${paymentStatus === 'paid' ? '#16a34a' : '#d97706'};">${paymentStatus.toUpperCase()}</td>
        </tr>
        ${address ? `
        <tr>
          <td>Service Address</td>
          <td class="bold">${address}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="font-size: 16px; font-weight: bold;">Total Price</td>
          <td class="bold" style="font-size: 18px; color: #007AFF;">₹${totalPrice}</td>
        </tr>
      </table>

      <p style="font-size: 13px; color: #64748b; margin-top: 25px;">
        Need help? Call our support team anytime at <strong>${supportPhone}</strong>.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Go_Repireo. All rights reserved.<br>
      High-Quality Expert Home Services & Technical Maintenance.
    </div>
  </div>
</body>
</html>
  `;
}

export function getCustomMarketingTemplate(title: string, messageBody: string, ctaText?: string, ctaLink?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; }
    .body { padding: 30px; font-size: 15px; line-height: 1.6; color: #334155; }
    .cta-btn { display: inline-block; background: #007AFF; color: #ffffff; padding: 14px 28px; border-radius: 50px; font-weight: bold; text-decoration: none; margin-top: 20px; }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Go_Repireo</h1>
    </div>
    <div class="body">
      <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin-top: 0;">${title}</h2>
      <div>${messageBody}</div>
      ${ctaText && ctaLink ? `
        <div style="text-align: center;">
          <a href="${ctaLink}" class="cta-btn">${ctaText}</a>
        </div>
      ` : ''}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Go_Repireo • Support: +91 8679245568
    </div>
  </div>
</body>
</html>
  `;
}
