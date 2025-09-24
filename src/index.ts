import { IPaymentRequest, IPesapalConfig } from './interfaces';
import { initializePesapal as createPesapalService, PesapalConfigError } from './pesapal';
import { PaymentService } from './services/PaymentService';

// Singleton instance
let _pesapalInstance: PaymentService | null = null;

// For testing purposes
export const _resetSingleton = () => {
  _pesapalInstance = null;
  _defaultInstance = null;
};

/**
 * Initialize the Pesapal SDK singleton with configuration
 * @param config Optional configuration overrides
 * @returns PaymentService singleton instance
 * @throws PesapalConfigError if configuration is invalid
 */
export const initialize = (config?: Partial<IPesapalConfig>): PaymentService => {
  _pesapalInstance = createPesapalService(config);
  return _pesapalInstance;
};

/**
 * Get the initialized Pesapal service instance
 * @returns PaymentService instance
 * @throws Error if not initialized
 */
export const getPesapalService = (): PaymentService => {
  if (!_pesapalInstance) {
    throw new Error('Pesapal SDK not initialized. Call initialize() first.');
  }
  return _pesapalInstance;
};

/**
 * Check if Pesapal SDK has been initialized
 * @returns boolean indicating if SDK is initialized
 */
export const isInitialized = (): boolean => {
  return _pesapalInstance !== null;
};

// Backward compatibility exports
export const initializePesapal = createPesapalService;

// Default instance for backward compatibility (lazy-loaded)
let _defaultInstance: PaymentService | null = null;
export const paymentService = new Proxy({} as PaymentService, {
  get(target, prop) {
    if (!_defaultInstance) {
      _defaultInstance = _pesapalInstance || createPesapalService();
    }
    return (_defaultInstance as any)[prop];
  }
});

export { PesapalConfigError };

export type {
  IPaymentRequest,
  IPesapalConfig
};