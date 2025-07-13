import { AuthService } from './AuthService';
import { IPaymentRequest } from '../interfaces';
import { HttpClient } from './HttpClient';

export class PaymentService {
  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private config: IPesapalConfig
  ) {}

  async submitOrder(payment: IPaymentRequest) {
    const token = await this.auth.authenticate();
    return this.http.post(
      '/v3/api/Transactions/SubmitOrderRequest',
      {
        ...payment,
        callback_url: payment.callbackUrl || this.config.callbackUrl,
        notification_id: payment.notificationId || this.config.ipnUrl
      },
      token
    );
  }

  async getPaymentStatus(orderId: string) {
    const token = await this.auth.authenticate();
    return this.http.get(
      `/v3/api/Transactions/GetTransactionStatus?orderId=${orderId}`,
      token
    );
  }
}