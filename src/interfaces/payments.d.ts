export interface IPaymentRequest {
    id: string;
    currency: string;
    amount: number;
    description: string;
    callbackUrl?: string;
    notificationId?: string;
    billingAddress?: {
      email: string;
      phoneNumber?: string;
      countryCode?: string;
      firstName?: string;
      lastName?: string;
    };
  }

export interface ISubmitOrderResponse {
    orderTrackingId: string;
    redirectUrl: string;
}

export interface IErrorResponse{
  error: string;
  status?: number;
}

export interface IPaymentStatusResponse {
  paymentMethod: string;
  amount: number;
  createdDate: string;
  confirmationCode: string;
  paymentStatusDescription: string;
  description: string;
  message: string;
  paymentAccount: string;
  callBackUrl: string;
  statusCode: number;
  merchantReference: string;
  paymentStatusCode: string;
  currency: string;
  error: IPesapalError;
  status: string;
}
    