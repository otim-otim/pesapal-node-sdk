import getConfig from './config/config';
import { HttpClient } from './services/HttpClient';
import { AuthService } from './services/AuthService';
import { PaymentService } from './services/PaymentService';
import { IPaymentRequest, IPesapalConfig } from './interfaces';

const config = getConfig();
const httpClient = new HttpClient(config);
const authService = new AuthService(httpClient, config);
const paymentService = new PaymentService(authService, httpClient, config);

export {
  paymentService,
  
};

export type {
  IPaymentRequest,
  IPesapalConfig
};