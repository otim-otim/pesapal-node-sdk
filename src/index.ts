import { HttpClient } from './services/HttpClient';
import { AuthService } from './services/AuthService';
import { PaymentService } from './services/PaymentService';
import { IPaymentRequest, IPesapalConfig } from './interfaces';
import getConfig from './config/config';

/**
 * Initialize Pesapal SDK with optional configuration
 * @param configOverrides Optional configuration overrides
 * @returns PaymentService instance
 */
const initializePesapal = (configOverrides?: Partial<IPesapalConfig>): PaymentService => {
  const config = getConfig(configOverrides);
  const httpClient = new HttpClient(config);
  const authService = new AuthService(httpClient, config);
  const paymentService = new PaymentService(authService, httpClient, config);
  
  return paymentService;
};

// Default instance for backward compatibility
const paymentService = initializePesapal();

export {
  paymentService,
  initializePesapal
};

export type {
  IPaymentRequest,
  IPesapalConfig
};