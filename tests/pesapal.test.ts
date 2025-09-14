import { initializePesapal, PesapalConfigError } from '../src/pesapal';
import { PaymentService } from '../src/services/PaymentService';
import { HttpClient } from '../src/services/HttpClient';
import { AuthService } from '../src/services/AuthService';

jest.mock('../src/services/HttpClient');
jest.mock('../src/services/AuthService');
jest.mock('../src/services/PaymentService');

// Mock environment variables
const originalEnv = process.env;

describe('Pesapal SDK Initialization', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      PESAPAL_CONSUMER_KEY: 'test_key',
      PESAPAL_CONSUMER_SECRET: 'test_secret',
      PESAPAL_CALLBACK_URL: 'https://test.com/callback',
      PESAPAL_IPN_URL: 'https://test.com/ipn',
      PESAPAL_IPN_ID: 'test_ipn_id',
      PESAPAL_ENV: 'sandbox'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('Configuration Validation', () => {
    it('should throw PesapalConfigError when consumerKey is missing', () => {
      delete process.env.PESAPAL_CONSUMER_KEY;
      
      expect(() => initializePesapal()).toThrow(PesapalConfigError);
      expect(() => initializePesapal()).toThrow('Missing or empty required configuration fields: consumerKey');
    });

    it('should throw PesapalConfigError when consumerSecret is missing', () => {
      delete process.env.PESAPAL_CONSUMER_SECRET;
      
      expect(() => initializePesapal()).toThrow(PesapalConfigError);
      expect(() => initializePesapal()).toThrow('Missing or empty required configuration fields: consumerSecret');
    });

    it('should throw PesapalConfigError when callbackUrl is missing', () => {
      delete process.env.PESAPAL_CALLBACK_URL;
      
      expect(() => initializePesapal()).toThrow(PesapalConfigError);
      expect(() => initializePesapal()).toThrow('Missing or empty required configuration fields: callbackUrl');
    });

    it('should throw PesapalConfigError when ipnUrl is missing', () => {
      delete process.env.PESAPAL_IPN_URL;
      
      expect(() => initializePesapal()).toThrow(PesapalConfigError);
      expect(() => initializePesapal()).toThrow('Missing or empty required configuration fields: ipnUrl');
    });

    it('should throw PesapalConfigError when multiple fields are missing', () => {
      delete process.env.PESAPAL_CONSUMER_KEY;
      delete process.env.PESAPAL_CONSUMER_SECRET;
      
      expect(() => initializePesapal()).toThrow(PesapalConfigError);
      expect(() => initializePesapal()).toThrow('Missing or empty required configuration fields: consumerKey, consumerSecret');
    });

    it('should throw PesapalConfigError when fields are empty strings', () => {
      process.env.PESAPAL_CONSUMER_KEY = '';
      process.env.PESAPAL_CONSUMER_SECRET = '   '; // whitespace only
      
      expect(() => initializePesapal()).toThrow(PesapalConfigError);
      expect(() => initializePesapal()).toThrow('Missing or empty required configuration fields: consumerKey, consumerSecret');
    });

    it('should not throw error when all required fields are present', () => {
      expect(() => initializePesapal()).not.toThrow();
    });
  });

  describe('Configuration Override', () => {
    it('should use provided config values over environment variables', () => {
      const customConfig = {
        consumerKey: 'custom_key',
        consumerSecret: 'custom_secret'
      };

      initializePesapal(customConfig);
      // Verify that HttpClient was called with merged config
      expect(HttpClient).toHaveBeenCalledWith(
        expect.objectContaining({
          consumerKey: 'custom_key',
          consumerSecret: 'custom_secret',
          callbackUrl: 'https://test.com/callback', // from env
          ipnUrl: 'https://test.com/ipn', // from env
          ipnId: 'test_ipn_id' // from env
        })
      );
    });

    it('should fall back to environment variables for missing config fields', () => {
      const partialConfig = {
        consumerKey: 'custom_key'
        // Other fields should come from environment
      };

      initializePesapal(partialConfig);
      expect(HttpClient).toHaveBeenCalledWith(
        expect.objectContaining({
          consumerKey: 'custom_key',
          consumerSecret: 'test_secret', // from env
          callbackUrl: 'https://test.com/callback', // from env
          ipnUrl: 'https://test.com/ipn', // from env
          ipnId: 'test_ipn_id' // from env
        })
      );
    });

    it('should throw error when override config has empty required fields', () => {
      const invalidConfig = {
        consumerKey: '',
        consumerSecret: 'valid_secret'
      };

      expect(() => initializePesapal(invalidConfig)).toThrow(PesapalConfigError);
      expect(() => initializePesapal(invalidConfig)).toThrow('Missing or empty required configuration fields: consumerKey');
    });

    it('should handle live environment URL correctly', () => {
      process.env.PESAPAL_ENV = 'live';
      
      initializePesapal();
      
      expect(HttpClient).toHaveBeenCalledWith(
        expect.objectContaining({
          apiUrl: 'https://pay.pesapal.com/v3/api'
        })
      );
    });

    it('should default to sandbox URL for non-live environment', () => {
      process.env.PESAPAL_ENV = 'sandbox';
      
      initializePesapal();
      
      expect(HttpClient).toHaveBeenCalledWith(
        expect.objectContaining({
          apiUrl: 'https://cybqa.pesapal.com/pesapalv3/api'
        })
      );
    });

    it('should allow custom apiUrl override', () => {
      const customConfig = {
        apiUrl: 'https://custom-api.com/v3/api'
      };

      initializePesapal(customConfig);
      
      expect(HttpClient).toHaveBeenCalledWith(
        expect.objectContaining({
          apiUrl: 'https://custom-api.com/v3/api'
        })
      );
    });
  });

  describe('Service Initialization', () => {
    it('should create PaymentService with all required dependencies', () => {
      const result = initializePesapal();
      
      expect(HttpClient).toHaveBeenCalledTimes(1);
      expect(AuthService).toHaveBeenCalledTimes(1);
      expect(PaymentService).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(PaymentService);
    });

    it('should pass config to all services', () => {
      initializePesapal();
      
      const expectedConfig = {
        consumerKey: 'test_key',
        consumerSecret: 'test_secret',
        apiUrl: 'https://cybqa.pesapal.com/pesapalv3/api',
        callbackUrl: 'https://test.com/callback',
        ipnUrl: 'https://test.com/ipn',
        ipnId: 'test_ipn_id'
      };

      expect(HttpClient).toHaveBeenCalledWith(expectedConfig);
      expect(AuthService).toHaveBeenCalledWith(
        expect.any(Object), // HttpClient instance
        expectedConfig
      );
      expect(PaymentService).toHaveBeenCalledWith(
        expect.any(Object), // AuthService instance
        expect.any(Object), // HttpClient instance
        expectedConfig
      );
    });
  });

  describe('PesapalConfigError', () => {
    it('should be an instance of Error', () => {
      const error = new PesapalConfigError('test message');
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('PesapalConfigError');
      expect(error.message).toBe('test message');
    });

    it('should have correct error name', () => {
      const error = new PesapalConfigError('test');
      expect(error.name).toBe('PesapalConfigError');
    });
  });
});
