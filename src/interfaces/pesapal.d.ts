export interface IPesapalOrderResponse {
    order_tracking_id: string;
    redirect_url: string;
    status: string;
}

export interface IPesapalError {
    error_type: string | null;
    code: string | null;
    message: string | null;
    call_back_url: string | null;
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
    error: IPesapalError;
    status: string;
}
