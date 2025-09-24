// Set environment variables before any imports
process.env.PESAPAL_CONSUMER_KEY = 'test_key';
process.env.PESAPAL_CONSUMER_SECRET = 'test_secret';
process.env.PESAPAL_CALLBACK_URL = 'https://test.com/callback';
process.env.PESAPAL_IPN_URL = 'https://test.com/ipn';
process.env.PESAPAL_IPN_ID = 'test_ipn_id';
process.env.PESAPAL_ENV = 'sandbox';

// Mock the services before importing
jest.mock('../src/services/HttpClient');
jest.mock('../src/services/AuthService');
jest.mock('../src/services/PaymentService');

import { initialize, getPesapalService, isInitialized, PesapalConfigError } from '../src/index';
import { PaymentService } from '../src/services/PaymentService';

describe('Pesapal Singleton Pattern', () => {
  beforeEach(() => {
    // Reset singleton state before each test
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('initialize()', () => {
    it('should initialize and return PaymentService instance', () => {
      const service = initialize();
      
      expect(service).toBeInstanceOf(PaymentService);
      expect(isInitialized()).toBe(true);
    });

    it('should initialize with custom config', () => {
      const customConfig = {
        consumerKey: 'custom_key',
        consumerSecret: 'custom_secret'
      };

      const service = initialize(customConfig);
      
      expect(service).toBeInstanceOf(PaymentService);
      expect(isInitialized()).toBe(true);
    });

    it('should throw PesapalConfigError for invalid config', () => {
      const invalidConfig = {
        consumerKey: '',
        consumerSecret: 'valid_secret'
      };

      expect(() => initialize(invalidConfig)).toThrow(PesapalConfigError);
      expect(() => initialize(invalidConfig)).toThrow('Missing or empty required configuration fields: consumerKey');
    });

    it('should replace previous instance when called multiple times', () => {
      const service1 = initialize();
      const service2 = initialize({ consumerKey: 'different_key' });
      
      expect(service1).toBeInstanceOf(PaymentService);
      expect(service2).toBeInstanceOf(PaymentService);
      expect(getPesapalService()).toBe(service2);
    });
  });

  describe('getPesapalService()', () => {
    it('should return initialized service', () => {
      const originalService = initialize();
      const retrievedService = getPesapalService();
      
      expect(retrievedService).toBe(originalService);
    });

    it('should throw error when not initialized', () => {
      expect(() => getPesapalService()).toThrow('Pesapal SDK not initialized. Call initialize() first.');
    });

    it('should return same instance on multiple calls', () => {
      initialize();
      
      const service1 = getPesapalService();
      const service2 = getPesapalService();
      
      expect(service1).toBe(service2);
    });
  });

  describe('isInitialized()', () => {
    it('should return false when not initialized', () => {
      expect(isInitialized()).toBe(false);
    });

    it('should return true after initialization', () => {
      initialize();
      expect(isInitialized()).toBe(true);
    });
  });

  describe('Singleton behavior', () => {
    it('should maintain singleton across multiple getPesapalService calls', () => {
      const service = initialize();
      
      const retrieved1 = getPesapalService();
      const retrieved2 = getPesapalService();
      
      expect(retrieved1).toBe(service);
      expect(retrieved2).toBe(service);
      expect(retrieved1).toBe(retrieved2);
    });

    it('should update singleton when re-initialized', () => {
      const service1 = initialize({ consumerKey: 'key1' });
      const service2 = initialize({ consumerKey: 'key2' });
      
      expect(getPesapalService()).toBe(service2);
      expect(getPesapalService()).not.toBe(service1);
    });
  });
});
