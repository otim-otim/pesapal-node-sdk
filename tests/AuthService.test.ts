import { AuthService } from '../src/services/AuthService';
import { HttpClient } from '../src/services/HttpClient';
import { IPesapalConfig } from '../src/interfaces';

jest.mock('../src/services/HttpClient');

describe('AuthService', () => {
  const mockConfig: IPesapalConfig = {
    consumerKey: 'test_key',
    consumerSecret: 'test_secret',
    apiUrl: 'https://test.api',
    callbackUrl: 'https://test/callback',
    ipnUrl: 'https://test/ipn',
    env: 'sandbox'
  };

  it('authenticates successfully', async () => {
    const mockToken = 'test_token';
    const mockPost = jest.fn().mockResolvedValue({ token: mockToken });
    (HttpClient as jest.Mock).mockImplementation(() => ({
      post: mockPost
    }));

    const auth = new AuthService(new HttpClient(mockConfig), mockConfig);
    const token = await auth.authenticate();

    expect(mockPost).toHaveBeenCalledWith('/api/Auth/RequestToken', {
      consumer_key: mockConfig.consumerKey,
      consumer_secret: mockConfig.consumerSecret
    });
    expect(token).toBe(mockToken);
  });
});