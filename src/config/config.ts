import { IPesapalConfig } from '../interfaces';

const getConfig = (config?: Partial<IPesapalConfig>): IPesapalConfig => ({
  consumerKey: config?.consumerKey ?? process.env.PESAPAL_CONSUMER_KEY!,
  consumerSecret: config?.consumerSecret ?? process.env.PESAPAL_CONSUMER_SECRET!,
  apiUrl: config?.apiUrl ?? (process.env.PESAPAL_ENV === 'live' ? 'https://pay.pesapal.com/v3/api' : 'https://cybqa.pesapal.com/pesapalv3/api'),
  callbackUrl: config?.callbackUrl ?? process.env.PESAPAL_CALLBACK_URL!,
  ipnUrl: config?.ipnUrl ?? process.env.PESAPAL_IPN_URL!,
  ipnId: config?.ipnId ?? process.env.PESAPAL_IPN_ID!,
});

export default getConfig;