/**
 * Fast2SMS API Module for Instant SMS OTP Dispatch to Indian Mobile Numbers (+91)
 */
export interface Fast2SMSOptions {
  numbers: string; // 10-digit mobile number (e.g. 9812345678)
  otpCode: string;
}

export async function sendFast2SMS(options: Fast2SMSOptions) {
  try {
    const apiKey = process.env.FAST2SMS_API_KEY || 'mH1X7kxbAn9ly5PLSODotGNeQa4YMF3i0VBrUJfuTC6zqEv8jIztTjFuVavE3qWXGJ8nsgDprR9wm0QI';
    const cleanNumber = options.numbers.replace(/[^0-9]/g, '').slice(-10);

    if (!cleanNumber || cleanNumber.length !== 10) {
      return { success: false, error: 'Invalid 10-digit Indian mobile number' };
    }

    const payload = {
      route: 'otp',
      variables_values: options.otpCode,
      numbers: cleanNumber,
    };

    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.return === true) {
      return { success: true, message: 'SMS OTP dispatched successfully via Fast2SMS', data };
    } else {
      // If OTP route requires website verification, fallback to Quick SMS route (route: 'q')
      const fallbackPayload = {
        route: 'q',
        message: `Your Go_Repireo verification code is ${options.otpCode}. Valid for 10 mins.`,
        flash: '0',
        numbers: cleanNumber,
      };

      const fallbackRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fallbackPayload),
      });

      const fallbackData = await fallbackRes.json();
      if (fallbackRes.ok && fallbackData.return === true) {
        return { success: true, message: 'SMS OTP dispatched via Quick SMS route', data: fallbackData };
      }

      console.warn('[Fast2SMS Note]:', data.message || fallbackData.message);
      return { success: false, error: data.message || fallbackData.message || 'Fast2SMS dispatch error' };
    }
  } catch (err: any) {
    console.error('[Fast2SMS Exception]:', err);
    return { success: false, error: err?.message || 'SMS network error' };
  }
}
