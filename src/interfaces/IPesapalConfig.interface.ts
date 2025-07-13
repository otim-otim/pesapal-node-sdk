export interface IPesapalConfig {
    consumerKey: string;
    consumerSecret: string;
    apiUrl: string;
    callbackUrl: string;
    ipnUrl: string;
    env: 'sandbox' | 'live';
  }