import { IPaymentRequest, IPesapalConfig } from './interfaces';
import { initializePesapal, PesapalConfigError } from './pesapal';

// Default instance for backward compatibility
const paymentService = initializePesapal();

export {
  paymentService,
  initializePesapal,
  PesapalConfigError
};

export type {
  IPaymentRequest,
  IPesapalConfig
};