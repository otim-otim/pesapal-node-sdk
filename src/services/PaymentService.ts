import { AuthService } from './AuthService';
import {
  IPaymentRequest,
  ISubmitOrderResponse,
  IPesapalOrderResponse,
  IPesapalOrderRequest,
  IPesapalConfig,
  IPesapalTransactionStatusResponse,
  IPaymentStatusResponse,
  IBillingAddress,
  IPesapalBillingAddress,
  IPesapalIpnResponse,
  IIpnResponse,
  IRegisterIPNRequest,
  IRefundRequest,
  IPesapalStatusMessageResponse,
  IStatusMessageResponse,
  IErrorResponse
} from '../interfaces';
import { HttpClient } from './HttpClient';
import { assertPesapalSuccess, PesapalApiError, toErrorResponse } from './errors';

// Pesapal reports an order that hasn't been paid yet as an error with this code.
export const PAYMENT_PENDING_ERROR_CODE = 'payment_details_not_found';

export class PaymentService {
  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private config: IPesapalConfig
  ) {}

  private notificationId: string = this.config.ipnId || process.env.PESAPAL_IPN_ID || '';

  private toIpnResponse(data: IPesapalIpnResponse): IIpnResponse {
    return {
      url: data.url,
      createdDate: data.created_date,
      ipnId: data.ipn_id,
      notificationType: data.notification_type,
      ipnNotificationTypeDescription: data.ipn_notification_type_description,
      ipnStatus: data.ipn_status,
      ipnStatusDescription: data.ipn_status_description
    };
  }

  private toPesapalBillingAddress(address: IBillingAddress): IPesapalBillingAddress {
    return {
      email_address: address.emailAddress ?? address.email,
      phone_number: address.phoneNumber,
      country_code: address.countryCode,
      first_name: address.firstName,
      middle_name: address.middleName,
      last_name: address.lastName,
      line_1: address.line1,
      line_2: address.line2,
      city: address.city,
      state: address.state,
      postal_code: address.postalCode,
      zip_code: address.zipCode
    };
  }

  /**
   * Registers an IPN URL with Pesapal (URLSetup/RegisterIPN).
   * Defaults to the configured ipnUrl and POST notifications.
   */
  async registerIPN(request?: Partial<IRegisterIPNRequest>): Promise<IIpnResponse | IErrorResponse> {
    try {
      const data = await this.postRegisterIPN(request);
      return this.toIpnResponse(data);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  /** Lists the IPN URLs registered for this merchant (URLSetup/GetIpnList). */
  async getRegisteredIPNs(): Promise<IIpnResponse[] | IErrorResponse> {
    try {
      const token = await this.auth.authenticate();
      const response = await this.http.get<IPesapalIpnResponse[]>('/URLSetup/GetIpnList', token);
      assertPesapalSuccess(response.data as never, 'Failed to get registered IPNs');
      return (response.data || []).map((ipn) => this.toIpnResponse(ipn));
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  /**
   * Registers the configured IPN URL and returns its ipn_id.
   * Throws on failure; prefer registerIPN() for the full response.
   */
  async getIPNId(): Promise<string> {
    const data = await this.postRegisterIPN();
    this.notificationId = data.ipn_id;
    return this.notificationId;
  }

  private async postRegisterIPN(request?: Partial<IRegisterIPNRequest>): Promise<IPesapalIpnResponse> {
    const token = await this.auth.authenticate();
    const response = await this.http.post<IPesapalIpnResponse>('/URLSetup/RegisterIPN', {
      url: request?.url || this.config.ipnUrl || process.env.PESAPAL_IPN_URL,
      ipn_notification_type: request?.ipnNotificationType || 'POST'
    }, token);
    assertPesapalSuccess(response.data, 'Failed to register IPN URL');
    if (!response.data?.ipn_id) {
      throw new PesapalApiError('Pesapal did not return an ipn_id', response.status);
    }
    return response.data;
  }

  /** Creates a payment order (Transactions/SubmitOrderRequest). */
  async submitOrder(payment: IPaymentRequest): Promise<ISubmitOrderResponse | IErrorResponse> {
    try {
      const address = payment.billingAddress;
      if (!address || !(address.emailAddress || address.email || address.phoneNumber)) {
        throw new PesapalApiError('billingAddress requires an emailAddress or phoneNumber');
      }

      const token = await this.auth.authenticate();
      const order: IPesapalOrderRequest = {
        id: payment.id,
        currency: payment.currency,
        amount: payment.amount,
        description: payment.description,
        callback_url: payment.callbackUrl || this.config.callbackUrl || process.env.PESAPAL_CALLBACK_URL || '',
        notification_id: payment.notificationId || this.notificationId || await this.getIPNId(),
        billing_address: this.toPesapalBillingAddress(address),
        redirect_mode: payment.redirectMode,
        cancellation_url: payment.cancellationUrl,
        branch: payment.branch,
        account_number: payment.accountNumber,
        subscription_details: payment.subscriptionDetails && {
          start_date: payment.subscriptionDetails.startDate,
          end_date: payment.subscriptionDetails.endDate,
          frequency: payment.subscriptionDetails.frequency
        }
      };

      const response = await this.http.post<IPesapalOrderResponse>(
        '/Transactions/SubmitOrderRequest',
        order,
        token
      );
      const data = response.data;
      assertPesapalSuccess(data, 'Failed to submit order');
      if (!data?.order_tracking_id) {
        throw new PesapalApiError('Failed to submit order', response.status);
      }
      return {
        orderTrackingId: data.order_tracking_id,
        merchantReference: data.merchant_reference,
        redirectUrl: data.redirect_url
      };
    } catch (error: unknown) {
      return toErrorResponse(error);
    }
  }

  /** Gets the status of a transaction (Transactions/GetTransactionStatus). */
  async getPaymentStatus(orderTrackingId: string): Promise<IPaymentStatusResponse | IErrorResponse> {
    try {
      const token = await this.auth.authenticate();
      const response = await this.http.get<IPesapalTransactionStatusResponse>(
        `/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
        token
      );
      const data = response.data;
      // An unpaid order isn't a failure: return it as a normal status (statusCode 0)
      // and keep Pesapal's error object so callers can tell it apart from INVALID.
      if (data?.error?.code !== PAYMENT_PENDING_ERROR_CODE) {
        assertPesapalSuccess(data, 'Failed to get payment status');
      }
      const subscription = data.subscription_transaction_info;

      return {
        paymentMethod: data.payment_method,
        amount: data.amount,
        createdDate: data.created_date,
        confirmationCode: data.confirmation_code,
        paymentStatusDescription: data.payment_status_description,
        description: data.description,
        message: data.message,
        paymentAccount: data.payment_account,
        callBackUrl: data.call_back_url,
        statusCode: data.status_code ?? 0,
        merchantReference: data.merchant_reference,
        paymentStatusCode: data.payment_status_code,
        currency: data.currency,
        subscriptionTransactionInfo: subscription ? {
          accountReference: subscription.account_reference,
          amount: subscription.amount,
          firstName: subscription.first_name,
          lastName: subscription.last_name,
          correlationId: subscription.correlation_id
        } : undefined,
        error: data.error,
        status: data.status
      };
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  /** Requests a refund for a COMPLETED payment (Transactions/RefundRequest). */
  async requestRefund(refund: IRefundRequest): Promise<IStatusMessageResponse | IErrorResponse> {
    try {
      const token = await this.auth.authenticate();
      const response = await this.http.post<IPesapalStatusMessageResponse>(
        '/Transactions/RefundRequest',
        {
          confirmation_code: refund.confirmationCode,
          amount: refund.amount,
          username: refund.username,
          remarks: refund.remarks
        },
        token
      );
      assertPesapalSuccess(response.data, 'Refund request was rejected');
      return { status: String(response.data.status), message: response.data.message };
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  /** Cancels a pending or failed order (Transactions/CancelOrder). */
  async cancelOrder(orderTrackingId: string): Promise<IStatusMessageResponse | IErrorResponse> {
    try {
      const token = await this.auth.authenticate();
      const response = await this.http.post<IPesapalStatusMessageResponse>(
        '/Transactions/CancelOrder',
        { order_tracking_id: orderTrackingId },
        token
      );
      assertPesapalSuccess(response.data, 'Failed to cancel order');
      return { status: String(response.data.status), message: response.data.message };
    } catch (error) {
      return toErrorResponse(error);
    }
  }
}
