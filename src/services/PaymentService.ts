import { AuthService } from './AuthService';
import { IPaymentRequest, ISubmitOrderResponse, IPesapalOrderResponse } from '../interfaces';


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
    try {
      const token = await this.auth.authenticate();
      const response = await this.http.post(
        '/Transactions/SubmitOrderRequest',
        {
          ...payment,
          callback_url: payment.callbackUrl || process.env.PESAPAL_CALLBACK_URL,
          notification_id: this.notificationId || await this.getIPNId()
        },
        token
      );
      if(response.status === 200){
        const data = response.data as IPesapalOrderResponse;
        return {
          orderTrackingId: data.order_tracking_id,
          redirectUrl: data.redirect_url
        } as ISubmitOrderResponse
      }
      throw new Error('Failed to submit order');
      
    } catch (error: unknown) {
      if (error instanceof Error) {
        return {
          error: error.message,
          status: 'status' in error ? error.status : undefined
        };
      }
      return {
        error: 'An unknown error occurred',
        status: undefined
      };
      
    }
  }

  async getPaymentStatus(orderId: string) {
    try {
      const token = await this.auth.authenticate();
      const res = this.http.get(
        `/Transactions/GetTransactionStatus?orderId=${orderId}`,
        token
      );

      return {

      }
      
    } catch (error) {
      
    }
  }
}