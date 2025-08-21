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
  const mockPayment: IPaymentRequest = {
    id: 'order-123',
    currency: 'KES',
    amount: 100,
    description: 'Test payment'
  };

  const mockConfig: IPesapalConfig = {
    consumerKey: 'test_key',
    consumerSecret: 'test_secret',
    apiUrl: 'https://cybqa.pesapal.com/pesapalv3/api',
    callbackUrl: 'https://test.com/callback',
    ipnUrl: 'https://test.com/ipn',
    ipnId: 'test-ipn-id',
    env: 'sandbox'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits order successfully with IPN ID', async () => {
    const mockToken = 'test_token';
    const mockAuth = {
      authenticate: jest.fn().mockResolvedValue(mockToken)
    };
    
    const mockHttp = {
      post: jest.fn((url: string) => {
        if (url.includes('RegisterIPN')) {
          return Promise.resolve({ data: { ipn_id: 'test-ipn-id' } });
        }
        return Promise.resolve({ data: { order_tracking_id: 'order-123' } });
      })
    };

    (AuthService as unknown as jest.Mock).mockImplementation(() => mockAuth);
    (HttpClient as unknown as jest.Mock).mockImplementation(() => mockHttp);

    const service = new PaymentService(
      mockAuth as unknown as AuthService,
      mockHttp as unknown as HttpClient,
      mockConfig
    );

    await service.submitOrder(mockPayment);

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
    
    // Get all calls to the post method
    const postCalls = (mockHttp.post as jest.Mock).mock.calls;
    
    // Verify order submission was called with the correct parameters
    const submitOrderCall = postCalls.find(([url]: [string]) => url === '/Transactions/SubmitOrderRequest');
    expect(submitOrderCall).toBeDefined();
    expect(submitOrderCall[1]).toMatchObject({
      id: 'order-123',
      amount: 100,
      currency: 'KES',
      description: 'Test payment',
      callback_url: 'https://test.com/callback',
      notification_id: 'test-ipn-id' // Using the IPN ID from config
    });
    
    // Since we have an IPN ID in the config, RegisterIPN should not be called
    expect(postCalls.some(([url]: [string]) => url === '/URLSetup/RegisterIPN')).toBe(false);
  });

  it('gets IPN ID successfully', async () => {
    const mockToken = 'test_token';
    const mockAuth = {
      authenticate: jest.fn().mockResolvedValue(mockToken)
    };
    const mockHttp = {
      post: jest.fn().mockResolvedValue({ 
        data: { 
          ipn_id: 'new-ipn-id' 
        } 
      })
    };

    (AuthService as unknown as jest.Mock).mockImplementation(() => mockAuth);
    (HttpClient as unknown as jest.Mock).mockImplementation(() => mockHttp);

    const service = new PaymentService(
      mockAuth as unknown as AuthService,
      mockHttp as unknown as HttpClient,
      mockConfig
    );

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
});