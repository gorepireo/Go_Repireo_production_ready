export interface SmsGateOptions {
  phoneNumber: string;
  message: string;
}

/**
 * Send Mobile SMS via SMS-Gate App API (https://api.sms-gate.app)
 * Sends real SMS OTPs directly to mobile phone numbers (+91 XXXXXXXXXX)
 */
export async function sendSmsGate(options: SmsGateOptions) {
  try {
    const username = (process.env.SMS_GATE_USERNAME || '').trim();
    const password = (process.env.SMS_GATE_PASSWORD || '').trim();

    if (!username || !password) {
      console.warn('SMS-Gate App credentials missing in SMS_GATE_USERNAME and SMS_GATE_PASSWORD');
      return { success: false, error: 'SMS-Gate credentials missing' };
    }

    // Format phone number with country code if needed (+91 for India)
    let formattedPhone = options.phoneNumber.trim().replace(/[\s-()]/g, '');
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.length === 10) {
        formattedPhone = '+91' + formattedPhone;
      } else {
        formattedPhone = '+' + formattedPhone;
      }
    }

    const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

    const response = await fetch('https://api.sms-gate.app/3rdparty/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        textMessage: {
          text: options.message
        },
        phoneNumbers: [formattedPhone]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('SMS-Gate API error response:', data);
      return { success: false, error: data?.message || 'SMS dispatch failed' };
    }

    console.log(`[SMS-Gate Success] Dispatched SMS to ${formattedPhone}, Response:`, data);
    return { success: true, data };
  } catch (err: any) {
    console.error('SMS-Gate Exception:', err);
    return { success: false, error: err?.message || 'SMS network exception' };
  }
}
