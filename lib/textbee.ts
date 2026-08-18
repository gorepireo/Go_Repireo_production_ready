export interface TextBeeSmsOptions {
  phoneNumber: string;
  message: string;
  deviceId?: string;
}

/**
 * Send SMS via TextBee Gateway API (Free Real SMS Gateway)
 * API Key: txb_682Sr8nbqFYlABQcrUF0RnCyyCcTueeE
 */
export async function sendTextBeeSms(options: TextBeeSmsOptions) {
  try {
    const apiKey = process.env.TEXTBEE_API_KEY || 'txb_682Sr8nbqFYlABQcrUF0RnCyyCcTueeE';
    const deviceId = options.deviceId || process.env.TEXTBEE_DEVICE_ID;

    // Clean phone number (ensure country code +91 for India)
    let formattedPhone = options.phoneNumber.trim().replace(/\s+/g, '');
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.length === 10) {
        formattedPhone = '+91' + formattedPhone;
      } else {
        formattedPhone = '+' + formattedPhone;
      }
    }

    const endpoint = deviceId 
      ? `https://api.textbee.dev/api/v1/gateway/devices/${deviceId}/send-sms`
      : `https://api.textbee.dev/api/v1/gateway/send-sms`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipients: [formattedPhone],
        message: options.message
      })
    });

    const data = await response.json();
    if (response.ok && data.success !== false) {
      console.log(`[TextBee SMS Success] Sent SMS to ${formattedPhone}`);
      return { success: true, data };
    } else {
      console.warn('[TextBee SMS Note]:', data.error || data);
      return { success: false, error: data.error || 'SMS Dispatch pending device connection' };
    }
  } catch (err: any) {
    console.error('[TextBee SMS Exception]:', err);
    return { success: false, error: err.message };
  }
}
