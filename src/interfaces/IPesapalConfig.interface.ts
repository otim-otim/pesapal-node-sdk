export interface IPesapalConfig {
    consumerKey: string;
    consumerSecret: string;
    apiUrl: string;
    callbackUrl: string;
    ipnUrl: string;
    ipnId?: string;
    env: 'sandbox' | 'live';
  }