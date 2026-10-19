import {
  IPesapalError,
  PesapalIpnNotificationType,
  PesapalRedirectMode,
  PesapalSubscriptionFrequency
} from './pesapal';

/** Pesapal requires at least one of `emailAddress` or `phoneNumber`. */
export interface IBillingAddress {
    emailAddress?: string;
    /** @deprecated Use `emailAddress`. */
    email?: string;
    phoneNumber?: string;
    /** ISO 3166-1 alpha-2 country code. */
    countryCode?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    line1?: string;
    line2?: string;
    city?: string;
    /** Max 3 characters. */
    state?: string;
    postalCode?: string | number;
    zipCode?: string | number;
  }

export interface ISubscriptionDetails {
    /** Format: dd-MM-yyyy */
    startDate: string;
    /** Format: dd-MM-yyyy */
    endDate: string;
    frequency: PesapalSubscriptionFrequency;
}

export interface IPaymentRequest {
    /** Unique merchant reference, max 50 chars (alphanumeric, `-`, `_`, `.`, `:`). */
    id: string;
    currency: string;
    amount: number;
    /** Max 100 chars. */
    description: string;
    callbackUrl?: string;
    notificationId?: string;
    billingAddress: IBillingAddress;
    redirectMode?: PesapalRedirectMode;
    cancellationUrl?: string;
    branch?: string;
    /** Customer account/invoice number, used for recurring payments. */
    accountNumber?: string;
    subscriptionDetails?: ISubscriptionDetails;
  }

export interface ISubmitOrderResponse {
    orderTrackingId: string;
    merchantReference: string;
    redirectUrl: string;
}

export interface IErrorResponse{
  error: string;
  status?: number;
  code?: string;
  errorType?: string;
}

export interface IRegisterIPNRequest {
  url: string;
  ipnNotificationType?: PesapalIpnNotificationType;
}

export interface IIpnResponse {
  url: string;
  createdDate: string;
  ipnId: string;
  notificationType?: number;
  ipnNotificationTypeDescription?: string;
  ipnStatus?: number;
  ipnStatusDescription?: string;
}

export interface ISubscriptionTransactionInfo {
  accountReference: string;
  amount: number;
  firstName: string;
  lastName: string;
  correlationId: number | string;
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
  /** 0 = INVALID, 1 = COMPLETED, 2 = FAILED, 3 = REVERSED */
  statusCode: number;
  merchantReference: string;
  paymentStatusCode: string;
  currency: string;
  subscriptionTransactionInfo?: ISubscriptionTransactionInfo;
  error: IPesapalError;
  status: string;
}

export interface IRefundRequest {
  /** Confirmation code returned by GetTransactionStatus. */
  confirmationCode: string;
  amount: number;
  /** Identity of the user initiating the refund. */
  username: string;
  remarks: string;
}

export interface IStatusMessageResponse {
  status: string;
  message: string;
}
