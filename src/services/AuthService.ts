import { HttpClient } from './HttpClient';
import { IPesapalConfig } from '../interfaces/IPesapalConfig.interface';

export class AuthService {
  constructor(
    private http: HttpClient,
    private config: IPesapalConfig
  ) {}

  async authenticate() {
    const response = await this.http.post<{ token: string }>(
      '/api/Auth/RequestToken',
      {
        consumer_key: this.config.consumerKey,
        consumer_secret: this.config.consumerSecret
      }
    );
    return response.data.token;
  }
}