import { HttpClient } from './HttpClient';
import { IPesapalAuthResponse, IPesapalConfig } from '../interfaces';
import { assertPesapalSuccess, PesapalApiError } from './errors';

// Refresh the token this long before Pesapal's reported expiry.
const EXPIRY_MARGIN_MS = 30 * 1000;
// Pesapal tokens are valid for up to 5 minutes; used if expiryDate is missing or unparseable.
const DEFAULT_TOKEN_LIFETIME_MS = 5 * 60 * 1000;

export class AuthService {
  private token: string | null = null;
  private expiresAt = 0;

  constructor(
    private http: HttpClient,
    private config: IPesapalConfig
  ) {}

  async authenticate() {
    if (this.token && Date.now() < this.expiresAt - EXPIRY_MARGIN_MS) {
      return this.token;
    }

    const response = await this.http.post<IPesapalAuthResponse>(
      '/Auth/RequestToken',
      {
        consumer_key: this.config.consumerKey,
        consumer_secret: this.config.consumerSecret
      }
    );
    const data = response.data;
    assertPesapalSuccess(data, 'Failed to authenticate with Pesapal');
    if (!data?.token) {
      throw new PesapalApiError('Pesapal did not return an access token', response.status);
    }

    this.token = data.token;
    this.expiresAt = this.parseExpiry(data.expiryDate);
    return this.token;
  }

  private parseExpiry(expiryDate?: string): number {
    if (expiryDate) {
      // Pesapal returns UTC timestamps, sometimes without a zone designator.
      const iso = /Z|[+-]\d{2}:?\d{2}$/.test(expiryDate) ? expiryDate : `${expiryDate}Z`;
      const parsed = Date.parse(iso);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return Date.now() + DEFAULT_TOKEN_LIFETIME_MS;
  }
}
