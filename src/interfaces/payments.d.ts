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


    