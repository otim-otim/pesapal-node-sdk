import { PaymentService } from '../src/services/PaymentService';
import { AuthService } from '../src/services/AuthService';
import { HttpClient } from '../src/services/HttpClient';
import { IPaymentRequest, IPesapalConfig } from '../src/interfaces';

jest.mock('../src/services/AuthService');
jest.mock('../src/services/HttpClient');

// Mock the environment variables
process.env.PESAPAL_IPN_ID = 'test-ipn-id';
process.env.PESAPAL_IPN_URL = 'https://test.com/ipn';
process.env.PESAPAL_CALLBACK_URL = 'https://test.com/callback';

describe('PaymentService', () => {
  const mockToken = 'test_token';

  const mockPayment: IPaymentRequest = {
    id: 'order-123',
    currency: 'KES',
    amount: 100,
    description: 'Test payment',
    billingAddress: { emailAddress: 'customer@example.com' }
  };

  const mockConfig: IPesapalConfig = {
    consumerKey: 'test_key',
    consumerSecret: 'test_secret',
    apiUrl: 'https://cybqa.pesapal.com/pesapalv3/api',
    callbackUrl: 'https://test.com/callback',
    ipnUrl: 'https://test.com/ipn',
    ipnId: 'test-ipn-id',
  };

  const orderResponse = {
    status: 200,
    data: {
      order_tracking_id: 'tracking-123',
      merchant_reference: 'order-123',
      redirect_url: 'https://pay.test/123',
      error: null,
      status: '200'
    }
  };

  const createService = (http: Record<string, jest.Mock>, config: IPesapalConfig = mockConfig) => {
    const mockAuth = { authenticate: jest.fn().mockResolvedValue(mockToken) };
    const service = new PaymentService(
      mockAuth as unknown as AuthService,
      http as unknown as HttpClient,
      config
    );
    return { service, mockAuth };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits order successfully with IPN ID', async () => {
    const mockHttp = { post: jest.fn().mockResolvedValue(orderResponse) };
    const { service, mockAuth } = createService(mockHttp);

    const result = await service.submitOrder(mockPayment);

    expect(mockAuth.authenticate).toHaveBeenCalled();
    expect(mockHttp.post).toHaveBeenCalledWith(
      '/Transactions/SubmitOrderRequest',
      expect.objectContaining({
        id: 'order-123',
        amount: 100,
        currency: 'KES',
        description: 'Test payment',
        callback_url: 'https://test.com/callback',
        notification_id: 'test-ipn-id'
      }),
      mockToken
    );
    expect(result).toEqual({
      orderTrackingId: 'tracking-123',
      merchantReference: 'order-123',
      redirectUrl: 'https://pay.test/123'
    });

    // Since we have an IPN ID in the config, RegisterIPN should not be called
    expect(mockHttp.post.mock.calls.some(([url]: [string]) => url === '/URLSetup/RegisterIPN')).toBe(false);
  });

  it('sends the order to Pesapal in snake_case', async () => {
    const mockHttp = { post: jest.fn().mockResolvedValue(orderResponse) };
    const { service } = createService(mockHttp);

    await service.submitOrder({
      ...mockPayment,
      callbackUrl: 'https://test.com/custom-callback',
      notificationId: 'custom-ipn-id',
      redirectMode: 'PARENT_WINDOW',
      cancellationUrl: 'https://test.com/cancel',
      branch: 'Kampala',
      accountNumber: 'INV-001',
      subscriptionDetails: { startDate: '24-01-2026', endDate: '31-12-2026', frequency: 'MONTHLY' },
      billingAddress: {
        emailAddress: 'customer@example.com',
        phoneNumber: '0700000000',
        countryCode: 'KE',
        firstName: 'Jane',
        lastName: 'Doe',
        line1: '1 Main St'
      }
    });

    const body = JSON.parse(JSON.stringify(mockHttp.post.mock.calls[0][1]));
    expect(body).toEqual({
      id: 'order-123',
      currency: 'KES',
      amount: 100,
      description: 'Test payment',
      callback_url: 'https://test.com/custom-callback',
      notification_id: 'custom-ipn-id',
      redirect_mode: 'PARENT_WINDOW',
      cancellation_url: 'https://test.com/cancel',
      branch: 'Kampala',
      account_number: 'INV-001',
      subscription_details: { start_date: '24-01-2026', end_date: '31-12-2026', frequency: 'MONTHLY' },
      billing_address: {
        email_address: 'customer@example.com',
        phone_number: '0700000000',
        country_code: 'KE',
        first_name: 'Jane',
        last_name: 'Doe',
        line_1: '1 Main St'
      }
    });
  });

  it('maps the legacy billingAddress.email field to email_address', async () => {
    const mockHttp = { post: jest.fn().mockResolvedValue(orderResponse) };
    const { service } = createService(mockHttp);

    await service.submitOrder({ ...mockPayment, billingAddress: { email: 'old@example.com' } });

    expect(JSON.parse(JSON.stringify(mockHttp.post.mock.calls[0][1].billing_address)))
      .toEqual({ email_address: 'old@example.com' });
  });

  it('rejects an order without an email address or phone number', async () => {
    const mockHttp = { post: jest.fn() };
    const { service } = createService(mockHttp);

    const result = await service.submitOrder({ ...mockPayment, billingAddress: { firstName: 'Jane' } });

    expect(result).toMatchObject({ error: expect.stringContaining('emailAddress or phoneNumber') });
    expect(mockHttp.post).not.toHaveBeenCalled();
  });

  it('returns an error when Pesapal reports one in a 200 response', async () => {
    const mockHttp = {
      post: jest.fn().mockResolvedValue({
        status: 200,
        data: {
          error: { error_type: 'api_error', code: 'invalid_ipn_id', message: 'Invalid notification id' },
          status: '500'
        }
      })
    };
    const { service } = createService(mockHttp);

    const result = await service.submitOrder(mockPayment);

    expect(result).toEqual({
      error: 'Invalid notification id',
      status: 500,
      code: 'invalid_ipn_id',
      errorType: 'api_error'
    });
  });

  it('registers an IPN when none is configured', async () => {
    delete process.env.PESAPAL_IPN_ID;
    const mockHttp = {
      post: jest.fn((url: string, _body?: unknown) => url.includes('RegisterIPN')
        ? Promise.resolve({ status: 200, data: { ipn_id: 'new-ipn-id', error: null, status: '200' } })
        : Promise.resolve(orderResponse))
    };
    const { service } = createService(mockHttp, { ...mockConfig, ipnId: undefined });
    process.env.PESAPAL_IPN_ID = 'test-ipn-id';

    await service.submitOrder(mockPayment);

    expect(mockHttp.post.mock.calls[0][0]).toBe('/URLSetup/RegisterIPN');
    expect((mockHttp.post.mock.calls[1][1] as { notification_id: string }).notification_id).toBe('new-ipn-id');
  });

  it('gets IPN ID successfully', async () => {
    const mockHttp = {
      post: jest.fn().mockResolvedValue({ data: { ipn_id: 'new-ipn-id' } })
    };
    const { service, mockAuth } = createService(mockHttp);

    const ipnId = await service.getIPNId();

    expect(ipnId).toBe('new-ipn-id');
    expect(mockAuth.authenticate).toHaveBeenCalled();
    expect(mockHttp.post).toHaveBeenCalledWith(
      '/URLSetup/RegisterIPN',
      {
        url: 'https://test.com/ipn',
        ipn_notification_type: 'POST'
      },
      mockToken
    );
  });

  it('registers an IPN with a custom URL and GET notifications', async () => {
    const mockHttp = {
      post: jest.fn().mockResolvedValue({
        data: {
          url: 'https://test.com/other-ipn',
          created_date: '2026-01-01T00:00:00Z',
          ipn_id: 'ipn-2',
          ipn_status: 1,
          ipn_status_description: 'Active',
          error: null,
          status: '200'
        }
      })
    };
    const { service } = createService(mockHttp);

    const result = await service.registerIPN({ url: 'https://test.com/other-ipn', ipnNotificationType: 'GET' });

    expect(mockHttp.post).toHaveBeenCalledWith(
      '/URLSetup/RegisterIPN',
      { url: 'https://test.com/other-ipn', ipn_notification_type: 'GET' },
      mockToken
    );
    expect(result).toMatchObject({ ipnId: 'ipn-2', url: 'https://test.com/other-ipn', ipnStatus: 1 });
  });

  it('lists registered IPNs', async () => {
    const mockHttp = {
      get: jest.fn().mockResolvedValue({
        data: [{ url: 'https://test.com/ipn', created_date: '2026-01-01', ipn_id: 'ipn-1', error: null, status: '200' }]
      })
    };
    const { service } = createService(mockHttp);

    const result = await service.getRegisteredIPNs();

    expect(mockHttp.get).toHaveBeenCalledWith('/URLSetup/GetIpnList', mockToken);
    expect(result).toEqual([expect.objectContaining({ ipnId: 'ipn-1', url: 'https://test.com/ipn' })]);
  });

  it('queries transaction status by orderTrackingId', async () => {
    const mockHttp = {
      get: jest.fn().mockResolvedValue({
        status: 200,
        data: {
          payment_status_description: 'Completed',
          amount: 100,
          currency: 'KES',
          status_code: 1,
          subscription_transaction_info: {
            account_reference: 'INV-001',
            amount: 100,
            first_name: 'Jane',
            last_name: 'Doe',
            correlation_id: 42
          },
          error: { error_type: null, code: null, message: null, call_back_url: null },
          status: '200'
        }
      })
    };
    const { service } = createService(mockHttp);

    const status = await service.getPaymentStatus('tracking 123');

    expect(mockHttp.get).toHaveBeenCalledWith(
      '/Transactions/GetTransactionStatus?orderTrackingId=tracking%20123',
      mockToken
    );
    expect(status).toMatchObject({
      paymentStatusDescription: 'Completed',
      amount: 100,
      statusCode: 1,
      subscriptionTransactionInfo: { accountReference: 'INV-001', correlationId: 42 }
    });
  });

  it('requests a refund', async () => {
    const mockHttp = {
      post: jest.fn().mockResolvedValue({ data: { status: '200', message: 'Refund request successfully' } })
    };
    const { service } = createService(mockHttp);

    const result = await service.requestRefund({
      confirmationCode: 'ABC123',
      amount: 50,
      username: 'admin',
      remarks: 'Customer request'
    });

    expect(mockHttp.post).toHaveBeenCalledWith(
      '/Transactions/RefundRequest',
      { confirmation_code: 'ABC123', amount: 50, username: 'admin', remarks: 'Customer request' },
      mockToken
    );
    expect(result).toEqual({ status: '200', message: 'Refund request successfully' });
  });

  it('cancels an order', async () => {
    const mockHttp = {
      post: jest.fn().mockResolvedValue({ data: { status: '200', message: 'Order successfully cancelled.' } })
    };
    const { service } = createService(mockHttp);

    const result = await service.cancelOrder('tracking-123');

    expect(mockHttp.post).toHaveBeenCalledWith(
      '/Transactions/CancelOrder',
      { order_tracking_id: 'tracking-123' },
      mockToken
    );
    expect(result).toEqual({ status: '200', message: 'Order successfully cancelled.' });
  });

  it('returns an error when cancellation is rejected', async () => {
    const mockHttp = {
      post: jest.fn().mockResolvedValue({ data: { status: '500', message: 'Order cannot be cancelled.' } })
    };
    const { service } = createService(mockHttp);

    const result = await service.cancelOrder('tracking-123');

    expect(result).toMatchObject({ error: 'Order cannot be cancelled.', status: 500 });
  });
});
