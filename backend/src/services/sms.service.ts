import env from '../config/env';

export interface SendSmsOptions {
  to: string;
  body: string;
}

export async function sendSms(options: SendSmsOptions): Promise<boolean> {
  const { to, body } = options;

  if (env.SMS_PROVIDER === 'twilio' && env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
      const authHeader = 'Basic ' + Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');

      const params = new URLSearchParams();
      params.append('To', to);
      params.append('From', env.TWILIO_FROM_NUMBER);
      params.append('Body', body);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📱 [SMS Service] Twilio API Error:', errorText);
        return false;
      }

      console.log(`📱 [SMS Service] SMS successfully sent to ${to} via Twilio.`);
      return true;
    } catch (error) {
      console.error('📱 [SMS Service] Failed to send SMS via Twilio:', error);
      return false;
    }
  }

  // Console fallback mode for development/testing
  console.log('========================================');
  console.log(`📱 [SMS Console] Message to ${to}:`);
  console.log(`   ${body}`);
  console.log('========================================');
  return true;
}
