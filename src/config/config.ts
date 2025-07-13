import { IPesapalConfig } from '../interfaces';

const getConfig = (): IPesapalConfig => ({
  consumerKey: process.env.PESAPAL_CONSUMER_KEY!,
  consumerSecret: process.env.PESAPAL_CONSUMER_SECRET!,
  apiUrl: process.env.PESAPAL_API_URL || 'https://api.pesapal.com',
  callbackUrl: process.env.PESAPAL_CALLBACK_URL!,
  ipnUrl: process.env.PESAPAL_IPN_URL!,
  env: (process.env.PESAPAL_ENV as 'sandbox' | 'live') || 'sandbox'
});

export default getConfig;