import { AuthService } from './AuthService';
import { IPaymentRequest } from '../interfaces/IPayment.interface';
import { HttpClient } from './HttpClient';
import { IPesapalConfig } from '../interfaces/IPesapalConfig.interface';

export class PaymentService {
  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private config: IPesapalConfig
  ) {}

  private notificationId: string = process.env.PESAPAL_IPN_ID || '';
  
  async getIPNId(): Promise<string> {
    const token = await this.auth.authenticate();
    const response = await this.http.post<{ipn_id: string}>('/URLSetup/RegisterIPN', {
      url: this.config.ipnUrl || process.env.PESAPAL_IPN_URL,
      ipn_notification_type: "POST"
    }, token);
    this.notificationId = response.data.ipn_id;
    return this.notificationId;
  }
  
  async submitOrder(payment: IPaymentRequest) {
    const token = await this.auth.authenticate();
    return this.http.post(
      '/Transactions/SubmitOrderRequest',
      {
        ...payment,
        callback_url: payment.callbackUrl || process.env.PESAPAL_CALLBACK_URL,
        notification_id: this.notificationId || await this.getIPNId()
      },
      token
    );
  }

  async getPaymentStatus(orderId: string) {
    const token = await this.auth.authenticate();
    return this.http.get(
      `/Transactions/GetTransactionStatus?orderId=${orderId}`,
      token
    );
  }
}