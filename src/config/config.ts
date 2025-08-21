import { IPesapalConfig } from '../interfaces';

const getConfig = (): IPesapalConfig => ({
  consumerKey: process.env.PESAPAL_CONSUMER_KEY!,
  consumerSecret: process.env.PESAPAL_CONSUMER_SECRET!,
  apiUrl: process.env.PESAPAL_ENV === 'sandbox' ? 'https://cybqa.pesapal.com/pesapalv3/api' : 'https://pay.pesapal.com/v3/api',
  callbackUrl: process.env.PESAPAL_CALLBACK_URL!,
  ipnUrl: process.env.PESAPAL_IPN_URL!,
  ipnId: process.env.PESAPAL_IPN_ID!,
});

export default getConfig;