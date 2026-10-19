    export interface IPesapalConfig {
    consumerKey: string;
    consumerSecret: string;
    apiUrl: string;
    callbackUrl: string;
    ipnUrl: string;
    ipnId?: string;
  }

export type PesapalIpnNotificationType = 'GET' | 'POST';
export type PesapalRedirectMode = 'TOP_WINDOW' | 'PARENT_WINDOW';
export type PesapalSubscriptionFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface IPesapalError {
    error_type: string | null;
    code: string | null;
    message: string | null;
    call_back_url?: string | null;
}

export interface IPesapalAuthResponse {
    token: string;
    expiryDate: string;
    error: IPesapalError | null;
    status: string;
    message: string;
}

export interface IPesapalIpnResponse {
    url: string;
    created_date: string;
    ipn_id: string;
    notification_type?: number;
    ipn_notification_type_description?: string;
    ipn_status?: number;
    ipn_status_description?: string;
    error: IPesapalError | null;
    status: string;
}

export interface IPesapalBillingAddress {
    email_address?: string;
    phone_number?: string;
    country_code?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    line_1?: string;
    line_2?: string;
    city?: string;
    state?: string;
    postal_code?: string | number;
    zip_code?: string | number;
}

export interface IPesapalSubscriptionDetails {
    start_date: string;
    end_date: string;
    frequency: PesapalSubscriptionFrequency;
}

export interface IPesapalOrderRequest {
    id: string;
    currency: string;
    amount: number;
    description: string;
    callback_url: string;
    notification_id: string;
    billing_address: IPesapalBillingAddress;
    redirect_mode?: PesapalRedirectMode;
    cancellation_url?: string;
    branch?: string;
    account_number?: string;
    subscription_details?: IPesapalSubscriptionDetails;
}

export interface IPesapalOrderResponse {
    order_tracking_id: string;
    merchant_reference: string;
    redirect_url: string;
    error: IPesapalError | null;
    message?: string;
    status: string;
}

export interface IPesapalSubscriptionTransactionInfo {
    account_reference: string;
    amount: number;
    first_name: string;
    last_name: string;
    correlation_id: number | string;
}

export interface IPesapalTransactionStatusResponse {
    payment_method: string;
    amount: number;
    created_date: string;
    confirmation_code: string;
    payment_status_description: string;
    description: string;
    message: string;
    payment_account: string;
    call_back_url: string;
    status_code: number;
    merchant_reference: string;
    payment_status_code: string;
    currency: string;
    subscription_transaction_info?: IPesapalSubscriptionTransactionInfo | null;
    error: IPesapalError;
    status: string;
}

export interface IPesapalRefundRequest {
    confirmation_code: string;
    amount: number;
    username: string;
    remarks: string;
}

export interface IPesapalStatusMessageResponse {
    status: string;
    message: string;
    error?: IPesapalError | null;
}
