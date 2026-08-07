const apiKey = process.env.BREVO_API_KEY;
const recipientEmail = 'mandiprithibi31102006@gmail.com';
const recipientName = 'Prithibi Mandi';

const emailTests = [
  {
    templateId: 13,
    title: '1. Security OTP',
    params: {
      CUSTOMER_NAME: recipientName,
      OTP_CODE: '849201'
    }
  },
  {
    templateId: 14,
    title: '2. Welcome & Account Signup',
    params: {
      CUSTOMER_NAME: recipientName
    }
  },
  {
    templateId: 15,
    title: '3. Order Placed & Booking Confirmation',
    params: {
      CUSTOMER_NAME: recipientName,
      ORDER_ID: 'ORD_9841203',
      SERVICE_NAME: 'Plumbing & Tap Leak Repair',
      START_OTP: '3942',
      PAYMENT_METHOD: 'Prepaid Online (Razorpay)',
      TOTAL_PRICE: '306'
    }
  },
  {
    templateId: 16,
    title: '4. Specialist Dispatched & Assigned',
    params: {
      CUSTOMER_NAME: recipientName,
      ORDER_ID: 'ORD_9841203',
      WORKER_NAME: 'Rajesh Kumar',
      WORKER_RATING: '4.9'
    }
  },
  {
    templateId: 17,
    title: '5. Work Completed & Final Invoice',
    params: {
      CUSTOMER_NAME: recipientName,
      ORDER_ID: 'ORD_9841203',
      SERVICE_NAME: 'Plumbing & Tap Leak Repair',
      PAYMENT_ID: 'pay_P8x1203a9814',
      TOTAL_PAID: '306'
    }
  },
  {
    templateId: 18,
    title: '6. New Job Request Alert (For Technicians)',
    params: {
      WORKER_NAME: recipientName,
      SERVICE_NAME: 'Electrical DB Box Inspection',
      DISTANCE_KM: '2.4',
      TOTAL_PRICE: '499'
    }
  }
];

async function sendAllTestEmails() {
  console.log(`Sending all 6 email templates to ${recipientEmail}...`);
  for (const test of emailTests) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'content-type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          to: [{ email: recipientEmail, name: recipientName }],
          templateId: test.templateId,
          params: test.params
        })
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ Sent '${test.title}' (Template ID ${test.templateId}) -> Message ID: ${data.messageId}`);
      } else {
        console.error(`❌ Failed '${test.title}':`, data);
      }
    } catch (e) {
      console.error(`Error sending '${test.title}':`, e);
    }
  }
}

sendAllTestEmails();
