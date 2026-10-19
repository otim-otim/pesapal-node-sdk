# Pesapal Node.js SDK

A TypeScript package for seamless Pesapal payments integration in Node.js applications. This community-driven package provides a simple and type-safe way to integrate [Pesapal API 3.0](https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/api-reference) into your Node.js applications.

Supported Pesapal endpoints:

| Pesapal endpoint | SDK method |
|---|---|
| `Auth/RequestToken` | handled automatically (tokens are cached until shortly before expiry) |
| `URLSetup/RegisterIPN` | `registerIPN()`, `getIPNId()` |
| `URLSetup/GetIpnList` | `getRegisteredIPNs()` |
| `Transactions/SubmitOrderRequest` (incl. recurring payments) | `submitOrder()` |
| `Transactions/GetTransactionStatus` | `getPaymentStatus()` |
| `Transactions/RefundRequest` | `requestRefund()` |
| `Transactions/CancelOrder` | `cancelOrder()` |

## 📦 Installation

```bash
npm install pesapal-node-sdk
# or
yarn add pesapal-node-sdk
```

## ⚙️ Configuration

### Option 1: Environment Variables (Recommended)
Create a `.env` file in your project root:

```makefile
# Required
PESAPAL_CONSUMER_KEY=your_key_here
PESAPAL_CONSUMER_SECRET=your_secret_here
PESAPAL_CALLBACK_URL=https://yourapp.com/callback
PESAPAL_IPN_URL=https://yourapp.com/ipn

# Optional
PESAPAL_IPN_ID=your_ipn_id_here  # if omitted, PESAPAL_IPN_URL is registered on the first order
PESAPAL_ENV=sandbox              # 'live' for production, anything else uses the sandbox
```

### Option 2: Runtime Configuration
You can also pass configuration directly when initializing. Any field you omit falls back to the environment variables above.

```typescript
import { initialize } from 'pesapal-node-sdk';

const pesapal = initialize({
  consumerKey: 'your_key_here',
  consumerSecret: 'your_secret_here',
  callbackUrl: 'https://yourapp.com/callback',
  ipnUrl: 'https://yourapp.com/ipn',
  ipnId: 'your_ipn_id',

  // Optional: defaults to the sandbox, or live when PESAPAL_ENV=live
  apiUrl: 'https://pay.pesapal.com/v3/api'
});
```

| Environment | API URL |
|---|---|
| Sandbox | `https://cybqa.pesapal.com/pesapalv3/api` |
| Live | `https://pay.pesapal.com/v3/api` |

### Configuration Notes
- Get your consumer key and secret from your [Pesapal account dashboard](https://developer.pesapal.com/)
- For testing, use sandbox credentials from: [Pesapal Demo Keys](https://developer.pesapal.com/api3-demo-keys.txt)
- Register an IPN URL with `registerIPN()` (see below), or from:
  - **Sandbox**: [Sandbox IPN Registration](https://cybqa.pesapal.com/PesapalIframe/PesapalIframe3/IpnRegistration)
  - **Live**: [Live IPN Registration](https://pay.pesapal.com/iframe/PesapalIframe3/IpnRegistration)

## 🚀 Basic Usage

### 1. Initialize the SDK

```typescript
import { initialize, getPesapalService } from 'pesapal-node-sdk';

// Initialize once (e.g. at startup) using environment variables
initialize();

// Anywhere else in your app
const pesapal = getPesapalService();
```

### 2. Submit a Payment Request

`billingAddress` is required and must include an `emailAddress` or a `phoneNumber`. The SDK converts the request to the snake_case body Pesapal expects (`billing_address.email_address`, `callback_url`, and so on).

```typescript
import { IPaymentRequest } from 'pesapal-node-sdk';

const paymentData: IPaymentRequest = {
  id: `order-${Date.now()}`,       // max 50 chars: letters, digits, - _ . :
  currency: 'KES',
  amount: 1000,
  description: 'Online Purchase',  // max 100 chars
  callbackUrl: 'https://yourapp.com/callback',      // optional, defaults to config
  cancellationUrl: 'https://yourapp.com/cancelled', // optional
  redirectMode: 'TOP_WINDOW',                       // optional: 'TOP_WINDOW' | 'PARENT_WINDOW'
  billingAddress: {
    emailAddress: 'customer@example.com',
    phoneNumber: '+254712345678',
    firstName: 'John',
    lastName: 'Doe',
    line1: '123 Main St',
    city: 'Nairobi',
    countryCode: 'KE'
  }
};

const result = await pesapal.submitOrder(paymentData);

if ('error' in result) {
  console.error('Payment submission failed:', result.error);
} else {
  // Save result.orderTrackingId, then send the customer to result.redirectUrl
  console.log('Payment URL:', result.redirectUrl);
}
```

### 3. Handle the Payment Callback

Pesapal redirects the customer to your callback URL with `OrderTrackingId` and `OrderMerchantReference` query parameters.

```typescript
import { getPesapalService } from 'pesapal-node-sdk';

app.get('/payment/callback', async (req, res) => {
  const { OrderTrackingId, OrderMerchantReference } = req.query;

  if (!OrderTrackingId || !OrderMerchantReference) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const status = await getPesapalService().getPaymentStatus(OrderTrackingId as string);

  // IPaymentStatusResponse also has an `error` field, so narrow on statusCode
  if (!('statusCode' in status)) {
    return res.status(502).json({ error: status.error });
  }

  // statusCode: 0 = INVALID or not paid yet, 1 = COMPLETED, 2 = FAILED, 3 = REVERSED
  return res.redirect(status.statusCode === 1 ? '/payment/success' : '/payment/pending');
});
```

### 4. Handle IPN (Instant Payment Notification)

Pesapal sends `OrderTrackingId`, `OrderNotificationType` and `OrderMerchantReference` to your IPN URL (as query parameters for `GET` IPNs, or in the body for `POST`). The IPN carries no payment details, so look up the status, then acknowledge it in the format Pesapal expects.

```typescript
import { getPesapalService } from 'pesapal-node-sdk';

app.post('/api/pesapal/ipn', async (req, res) => {
  const { OrderNotificationType, OrderTrackingId, OrderMerchantReference } = req.body;

  const ack = (status: 200 | 500) => res.json({
    orderNotificationType: OrderNotificationType,
    orderTrackingId: OrderTrackingId,
    orderMerchantReference: OrderMerchantReference,
    status
  });

  const status = await getPesapalService().getPaymentStatus(OrderTrackingId);
  if (!('statusCode' in status)) {
    return ack(500);
  }

  await updateOrderInDatabase(OrderMerchantReference, {
    status: status.paymentStatusDescription,
    statusCode: status.statusCode,
    paymentMethod: status.paymentMethod,
    confirmationCode: status.confirmationCode, // needed for refunds
    amount: status.amount,
    currency: status.currency
  });

  return ack(200);
});
```

### 5. Recurring Payments

Pass `accountNumber` and, optionally, `subscriptionDetails` to let the customer opt in to recurring payments. Recurring IPNs arrive with `OrderNotificationType: 'RECURRING'`, and `getPaymentStatus()` then includes `subscriptionTransactionInfo`.

```typescript
await pesapal.submitOrder({
  ...paymentData,
  accountNumber: 'INV-2026-001',
  subscriptionDetails: {
    startDate: '01-11-2026', // dd-MM-yyyy
    endDate: '31-10-2027',
    frequency: 'MONTHLY'     // 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  }
});
```

### 6. Refunds and Cancellations

```typescript
// Refund a COMPLETED payment, using the confirmationCode from getPaymentStatus()
const refund = await pesapal.requestRefund({
  confirmationCode: status.confirmationCode,
  amount: 1000,
  username: 'admin@yourapp.com',
  remarks: 'Customer requested a refund'
});

// Cancel a pending or failed order
const cancellation = await pesapal.cancelOrder(orderTrackingId);
```

A successful refund response only means Pesapal received the request; the merchant still has to approve it. Mobile money payments can only be refunded in full, and only one refund can be requested per payment.

### 7. IPN Registration

```typescript
// Register an IPN URL (defaults to the configured ipnUrl and POST notifications)
const ipn = await pesapal.registerIPN({ url: 'https://yourapp.com/ipn', ipnNotificationType: 'POST' });

// List registered IPN URLs
const ipns = await pesapal.getRegisteredIPNs();
```

## 🚨 Error Handling

### Configuration Errors
`initialize()` throws a `PesapalConfigError` when required configuration is missing.

```typescript
import { initialize, PesapalConfigError } from 'pesapal-node-sdk';

try {
  initialize({ consumerKey: '' });
} catch (error) {
  if (error instanceof PesapalConfigError) {
    console.error(error.message);
    // "Missing or empty required configuration fields: consumerKey, ..."
  }
}
```

### API Errors
The payment methods don't throw. When something goes wrong they return an `IErrorResponse`. That includes HTTP errors, network errors, and HTTP 200 responses whose body carries a Pesapal `error` object or a non-200 `status`.

```typescript
interface IErrorResponse {
  error: string;       // Error message
  status?: number;     // HTTP or Pesapal status code
  code?: string;       // Pesapal error code, e.g. 'invalid_consumer_key_or_secret_provided'
  errorType?: string;  // Pesapal error type, e.g. 'api_error'
}
```

`getIPNId()` is the exception: it throws a `PesapalApiError` (exported) on failure.

## 📚 API Reference

### `initialize(config?: Partial<IPesapalConfig>): PaymentService`
Initializes the SDK singleton. Missing fields fall back to environment variables. Throws `PesapalConfigError` if required configuration is missing. `initializePesapal()` creates a standalone (non-singleton) instance with the same options.

### `submitOrder(payment: IPaymentRequest): Promise<ISubmitOrderResponse | IErrorResponse>`

```typescript
interface IPaymentRequest {
  id: string;
  currency: string;
  amount: number;
  description: string;
  billingAddress: IBillingAddress;
  callbackUrl?: string;        // defaults to config.callbackUrl
  notificationId?: string;     // defaults to config.ipnId, otherwise ipnUrl is registered
  redirectMode?: 'TOP_WINDOW' | 'PARENT_WINDOW';
  cancellationUrl?: string;
  branch?: string;
  accountNumber?: string;
  subscriptionDetails?: { startDate: string; endDate: string; frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' };
}

interface IBillingAddress {
  emailAddress?: string;       // emailAddress or phoneNumber is required
  phoneNumber?: string;
  countryCode?: string;        // ISO 3166-1 alpha-2
  firstName?: string;
  middleName?: string;
  lastName?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;              // max 3 chars
  postalCode?: string | number;
  zipCode?: string | number;
}

interface ISubmitOrderResponse {
  orderTrackingId: string;
  merchantReference: string;
  redirectUrl: string;
}
```

### `getPaymentStatus(orderTrackingId: string): Promise<IPaymentStatusResponse | IErrorResponse>`
Takes the `orderTrackingId` returned by `submitOrder()` (or sent in the callback/IPN), not your merchant reference.

An order that hasn't been paid yet is returned as a normal status with `statusCode: 0`, not as an error. Pesapal's `error` object is kept on the result, so you can tell an unpaid order apart from an invalid one:

```typescript
import { PAYMENT_PENDING_ERROR_CODE } from 'pesapal-node-sdk';

const status = await pesapal.getPaymentStatus(orderTrackingId);
if ('statusCode' in status && status.error?.code === PAYMENT_PENDING_ERROR_CODE) {
  // Not paid yet: check again later
}
```

```typescript
interface IPaymentStatusResponse {
  paymentMethod: string;
  amount: number;
  createdDate: string;
  confirmationCode: string;
  paymentStatusDescription: string;  // e.g. 'Completed', 'Failed'
  description: string;
  message: string;
  paymentAccount: string;
  callBackUrl: string;
  statusCode: number;                // 0 INVALID or not paid yet, 1 COMPLETED, 2 FAILED, 3 REVERSED
  merchantReference: string;
  paymentStatusCode: string;
  currency: string;
  subscriptionTransactionInfo?: {
    accountReference: string;
    amount: number;
    firstName: string;
    lastName: string;
    correlationId: number | string;
  };
  error: IPesapalError;
  status: string;
}
```

### `requestRefund(refund: IRefundRequest): Promise<IStatusMessageResponse | IErrorResponse>`
`IRefundRequest` is `{ confirmationCode, amount, username, remarks }`.

### `cancelOrder(orderTrackingId: string): Promise<IStatusMessageResponse | IErrorResponse>`
Only pending or failed orders can be cancelled, once per order.

### `registerIPN(request?: { url?: string; ipnNotificationType?: 'GET' | 'POST' }): Promise<IIpnResponse | IErrorResponse>`
### `getRegisteredIPNs(): Promise<IIpnResponse[] | IErrorResponse>`
### `getIPNId(): Promise<string>`
Registers the configured `ipnUrl` and returns its `ipn_id`.

## 🧪 Testing

```typescript
import { paymentService } from 'pesapal-node-sdk';

test('should process payment successfully', async () => {
  jest.spyOn(paymentService, 'submitOrder').mockResolvedValue({
    orderTrackingId: 'tracking-123',
    merchantReference: 'order-123',
    redirectUrl: 'https://cybqa.pesapal.com/pesapaliframe/PesapalIframe3/Index?OrderTrackingId=tracking-123'
  });

  const result = await paymentService.submitOrder(testPayment);
  expect('redirectUrl' in result).toBe(true);
});
```

🤝 Contributing
1. Fork the [repository](https://github.com/otim-otim/pesapal-node-sdk)
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

📜 License
MIT © Otim Isaac
