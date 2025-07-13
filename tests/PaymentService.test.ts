import { PaymentService } from '../src/services/PaymentService';
import { AuthService } from '../src/services/AuthService';
import { HttpClient } from '../src/services/HttpClient';
import { IPaymentRequest } from '../src/interfaces';

jest.mock('../src/services/AuthService');
jest.mock('../src/services/HttpClient');

describe('PaymentService', () => {
  const mockPayment: IPaymentRequest = {
    id: 'order-123',
    currency: 'KES',
    amount: 100,
    description: 'Test payment'
  };

  it('submits order successfully', async () => {
    const mockToken = 'test_token';
    const mockAuth = {
      authenticate: jest.fn().mockResolvedValue(mockToken)
    };
    const mockHttp = {
      post: jest.fn().mockResolvedValue({})
    };

    (AuthService as jest.Mock).mockImplementation(() => mockAuth);
    (HttpClient as jest.Mock).mockImplementation(() => mockHttp);

    const service = new PaymentService(
      mockAuth as unknown as AuthService,
      mockHttp as unknown as HttpClient,
      {} as any
    );

    await service.submitOrder(mockPayment);

    expect(mockAuth.authenticate).toHaveBeenCalled();
    expect(mockHttp.post).toHaveBeenCalledWith(
      '/v3/api/Transactions/SubmitOrderRequest',
      expect.objectContaining({
        id: 'order-123',
        amount: 100
      }),
      mockToken
    );
  });
});