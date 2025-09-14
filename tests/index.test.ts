import { paymentService, initializePesapal, PesapalConfigError } from '../src/index';
import { PaymentService } from '../src/services/PaymentService';

jest.mock('../src/pesapal');

describe('Index Module', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Exports', () => {
    it('should export paymentService instance', () => {
      expect(paymentService).toBeDefined();
      expect(paymentService).toBeInstanceOf(PaymentService);
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
      expect(paymentService).toBeInstanceOf(PaymentService);
    });
  });

  describe('Re-exports from pesapal module', () => {
    it('should re-export initializePesapal function', () => {
      // Call the re-exported function to verify it works
      const result = initializePesapal({ consumerKey: 'test' });
      
      // Verify it returns a PaymentService instance
      expect(result).toBeInstanceOf(PaymentService);
    });

    it('should re-export PesapalConfigError class', () => {
      // Create instance of re-exported class
      const error = new PesapalConfigError('test message');
      
      // Verify it's properly constructed
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('PesapalConfigError');
      expect(error.message).toBe('test message');
    });
  });
});
