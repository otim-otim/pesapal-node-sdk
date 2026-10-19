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
        ipnId: 'test_ipn_id',
    };

    it('authenticates successfully', async () => {
        const mockToken = 'test_token';
        const mockPost = jest.fn().mockResolvedValue({ data: { token: mockToken } });
        (HttpClient as jest.Mock).mockImplementation(() => ({
            post: mockPost
        }));

        const auth = new AuthService(new HttpClient(mockConfig), mockConfig);
        const token = await auth.authenticate();

        expect(mockPost).toHaveBeenCalledWith('/Auth/RequestToken', {
            consumer_key: mockConfig.consumerKey,
            consumer_secret: mockConfig.consumerSecret
        });
        expect(token).toBe(mockToken);
    });

    it('reuses the token until it is about to expire', async () => {
        const expiryDate = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        const mockPost = jest.fn().mockResolvedValue({ data: { token: 'cached', expiryDate, status: '200' } });
        (HttpClient as jest.Mock).mockImplementation(() => ({ post: mockPost }));

        const auth = new AuthService(new HttpClient(mockConfig), mockConfig);
        await auth.authenticate();
        const token = await auth.authenticate();

        expect(token).toBe('cached');
        expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it('requests a new token once the cached one has expired', async () => {
        const expiryDate = new Date(Date.now() - 1000).toISOString();
        const mockPost = jest.fn().mockResolvedValue({ data: { token: 'expired', expiryDate, status: '200' } });
        (HttpClient as jest.Mock).mockImplementation(() => ({ post: mockPost }));

        const auth = new AuthService(new HttpClient(mockConfig), mockConfig);
        await auth.authenticate();
        await auth.authenticate();

        expect(mockPost).toHaveBeenCalledTimes(2);
    });

    it('throws when Pesapal rejects the credentials', async () => {
        const mockPost = jest.fn().mockResolvedValue({
            data: {
                token: null,
                error: { error_type: 'api_error', code: 'invalid_consumer_key_or_secret_provided', message: '' },
                status: '500'
            }
        });
        (HttpClient as jest.Mock).mockImplementation(() => ({ post: mockPost }));

        const auth = new AuthService(new HttpClient(mockConfig), mockConfig);

        await expect(auth.authenticate()).rejects.toMatchObject({
            name: 'PesapalApiError',
            code: 'invalid_consumer_key_or_secret_provided'
        });
    });
});
