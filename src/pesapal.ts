import { HttpClient } from './services/HttpClient';
import { AuthService } from './services/AuthService';
import { PaymentService } from './services/PaymentService';
import { IPesapalConfig } from './interfaces';
import getConfig from './config/config';

/**
 * Custom error class for Pesapal configuration validation
 */
export class PesapalConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PesapalConfigError';
  }
}

/**
 * Validates that all required configuration values are present and not empty
 * @param config Configuration object to validate
 * @throws PesapalConfigError if any required field is missing or empty
 */
const validateConfig = (config: IPesapalConfig): void => {
  const requiredFields: (keyof IPesapalConfig)[] = [
    'consumerKey',
    'consumerSecret', 
    'apiUrl',
    'callbackUrl',
    'ipnUrl'
  ];

  const missingFields: string[] = [];

  for (const field of requiredFields) {
    const value = config[field];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    throw new PesapalConfigError(
      `Missing or empty required configuration fields: ${missingFields.join(', ')}`
    );
  }
};

/**
 * Initialize Pesapal SDK with optional configuration
 * @param configOverrides Optional configuration overrides
 * @returns PaymentService instance
 * @throws PesapalConfigError if configuration is invalid
 */
export const initializePesapal = (configOverrides?: Partial<IPesapalConfig>): PaymentService => {
  const config = getConfig(configOverrides);
  
  // Validate configuration before proceeding
  validateConfig(config);
  
  const httpClient = new HttpClient(config);
  const authService = new AuthService(httpClient, config);
  const paymentService = new PaymentService(authService, httpClient, config);
  
  return paymentService;
};
