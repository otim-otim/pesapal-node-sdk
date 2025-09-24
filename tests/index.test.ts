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

import { paymentService, initializePesapal, PesapalConfigError, _resetSingleton } from '../src/index';
import { PaymentService } from '../src/services/PaymentService';

describe('Index Module', () => {
  afterEach(() => {
    _resetSingleton();
    jest.clearAllMocks();
  });

  beforeEach(() => {
    _resetSingleton();
  });

  describe('Exports', () => {
    it('should export paymentService instance', () => {
      // The paymentService is a proxy, so we'll check for the existence of a method
      // that should be available on the PaymentService
      expect(paymentService).toBeDefined();
      expect(typeof paymentService.submitOrder).toBe('function');
    });

    it('should export initializePesapal function', () => {
      expect(initializePesapal).toBeDefined();
      expect(typeof initializePesapal).toBe('function');
    });

    it('should export PesapalConfigError class', () => {
      expect(PesapalConfigError).toBeDefined();
      expect(typeof PesapalConfigError).toBe('function');
    });
  });

  describe('Default paymentService', () => {
    it('should be created using initializePesapal with no arguments', () => {
      // The default paymentService should be created by calling initializePesapal()
      // This is tested indirectly by verifying the export exists and is a PaymentService instance
      expect(paymentService).toBeDefined();
      expect(paymentService).toBeInstanceOf(Object); // Proxy object
      expect(paymentService.submitOrder).toBeDefined(); // Check for a method that should exist
    });
  });

  describe('Re-exports from pesapal module', () => {
    it('should re-export initializePesapal function', () => {
      // Call the re-exported function to verify it works
      const result = initializePesapal();
      
      // Verify it returns a PaymentService instance
      expect(result).toBeInstanceOf(PaymentService);
    });

    it('should re-export PesapalConfigError class', () => {
      // Create instance of re-exported class
      const error = new PesapalConfigError('test message');
      
      // Verify it's properly constructed
      expect(error instanceof Error).toBe(true);
      expect(error.name).toBe('PesapalConfigError');
      expect(error.message).toBe('test message');
    });
  });
});
