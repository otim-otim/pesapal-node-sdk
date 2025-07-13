import axios, { AxiosInstance } from 'axios';
import { IPesapalConfig } from '../interfaces/IPesapalConfig.interface';

export class HttpClient {
  private client: AxiosInstance;
  
  constructor(private config: IPesapalConfig) {
    this.client = axios.create({
      baseURL: this.config.apiUrl,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async post<T>(url: string, data: any, token?: string) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return this.client.post<T>(url, data, { headers });
  }

  async get<T>(url: string, token: string) {
    return this.client.get<T>(url, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
  }
}