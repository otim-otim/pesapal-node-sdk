# Pesapal Node.js SDK

A TypeScript package for seamless Pesapal payments integration in Node.js applications. This community-driven package provides a simple and type-safe way to integrate Pesapal payments into your Node.js applications.

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
PESAPAL_IPN_ID=your_ipn_id_here
PESAPAL_ENV=sandbox  # 'live' for production, 'sandbox' for testing
```

### Option 2: Runtime Configuration
You can also pass configuration directly when initializing:

```typescript
import { initialize } from 'pesapal-node-sdk';

// Initialize with configuration
const pesapal = initialize({
  consumerKey: 'your_key_here',
  consumerSecret: 'your_secret_here',
  environment: 'sandbox', // or 'live' for production
  
  // Optional overrides
  apiUrl: 'https://cybqa.pesapal.com/v3/api', // sandbox URL
  callbackUrl: 'https://yourapp.com/callback',
  ipnUrl: 'https://yourapp.com/ipn',
  ipnId: 'your_ipn_id'
});
```

### Configuration Notes
- Get your consumer key and secret from your [Pesapal account dashboard](https://developer.pesapal.com/)
- For testing, use sandbox credentials from: [Pesapal Demo Keys](https://developer.pesapal.com/api3-demo-keys.txt)
- Generate IPN ID from:
  - **Sandbox**: [Sandbox IPN Registration](https://cybqa.pesapal.com/PesapalIframe/PesapalIframe3/IpnRegistration)
  - **Live**: [Live IPN Registration](https://pay.pesapal.com/iframe/PesapalIframe3/IpnRegistration)

## 📋 Type Reference

The SDK provides TypeScript type definitions for better development experience. Here are the main types you can use:

### Core Types

#### `IPaymentRequest`
```typescript
interface IPaymentRequest {
  id: string;                    // Unique order ID
  currency: string;              // Currency code (e.g., 'KES')
  amount: number;                // Payment amount
  description: string;           // Order description
  callbackUrl: string;           // Callback URL for payment status
  notificationId: string;        // IPN ID for payment notifications
  billingAddress: {
    emailAddress: string;        // Customer's email
    phoneNumber?: string;        // Customer's phone number
    firstName?: string;          // Customer's first name
    lastName?: string;           // Customer's last name
    // ... other address fields
  };
  // ... other fields
}
```

#### `ISubmitOrderResponse`
```typescript
interface ISubmitOrderResponse {
  orderTrackingId: string;      // Unique tracking ID for the order
  redirectUrl: string;          // URL to redirect customer for payment
  status: string;               // Order status
}
```

#### `IPaymentStatusResponse`
```typescript
interface IPaymentStatusResponse {
  paymentMethod: string;        // Payment method used
  amount: number;               // Payment amount
  createdDate: string;          // ISO date string of payment creation
  paymentStatus: string;        // Current payment status
  // ... other status fields
}
```

#### `IErrorResponse`
```typescript
interface IErrorResponse {
  error: string;               // Error message
  status?: number;             // Optional HTTP status code
  // ... other error details
}
```

### Configuration Types

#### `IPesapalConfig`
```typescript
interface IPesapalConfig {
  consumerKey: string;         // Your Pesapal consumer key
  consumerSecret: string;      // Your Pesapal consumer secret
  environment: 'sandbox' | 'production';
  // ... other configuration fields
}
```

### Usage Example with Types

```typescript
import { 
  initialize, 
  getPesapalService, 
  IPaymentRequest, 
  ISubmitOrderResponse,
  IPaymentStatusResponse
} from 'pesapal-node-sdk';

// Initialize with type-safe config
const pesapal = initialize({
  consumerKey: 'your_key',
  consumerSecret: 'your_secret',
  environment: 'sandbox'
});

// Create payment with typed request
const paymentData: IPaymentRequest = {
  id: `order-${Date.now()}`,
  currency: 'KES',
  amount: 1000,
  description: 'Test Payment',
  callbackUrl: 'https://yourapp.com/callback',
  notificationId: 'your_ipn_id',
  billingAddress: {
    emailAddress: 'customer@example.com'
  }
};

// Handle response with proper type
async function processPayment(): Promise<void> {
  try {
    const response: ISubmitOrderResponse = await pesapal.submitOrder(paymentData);
    console.log('Payment URL:', response.redirectUrl);
    
    // Later, check status with type
    const status: IPaymentStatusResponse = await pesapal.getTransactionStatus(response.orderTrackingId);
    console.log('Payment status:', status.paymentStatus);
    
  } catch (error) {
    const err = error as IErrorResponse;
    console.error('Payment error:', err.error);
  }
}
```

## 🚀 Basic Usage

### 1. Initialize the SDK

```typescript
import { initialize, getPesapalService } from 'pesapal-node-sdk';

// Initialize with environment variables
const pesapal = initialize();

// Or with explicit configuration
// const pesapal = initialize({
//   consumerKey: 'your_key',
//   consumerSecret: 'your_secret',
//   environment: 'sandbox'
// });
```

### 2. Submit a Payment Request

```typescript
import { IPaymentRequest } from 'pesapal-node-sdk';

async function createPayment() {
  const paymentData: IPaymentRequest = {
    id: `order-${Date.now()}`,
    currency: 'KES',
    amount: 1000,
    description: 'Online Purchase',
    callbackUrl: 'https://yourapp.com/callback',
    notificationId: 'your_ipn_id',
    billingAddress: {
      emailAddress: 'customer@example.com',
      phoneNumber: '+254712345678',
      firstName: 'John',
      lastName: 'Doe',
      line1: '123 Main St',
      city: 'Nairobi',
      country: 'KE'
    }
  };

  try {
    // Submit payment
    const payment = await pesapal.submitOrder(paymentData);
    console.log('Payment URL:', payment.redirectUrl);
    
    // Redirect user to payment.redirectUrl
    return payment;
  } catch (error) {
    console.error('Payment submission failed:', error);
    throw error;
  }
}
```

### 3. Handle Payment Callback

```typescript
import { getPesapalService } from 'pesapal-node-sdk';

// Example with Express
app.get('/payment/callback', async (req, res) => {
  const { orderTrackingId, orderMerchantReference } = req.query;
  
  if (!orderTrackingId || !orderMerchantReference) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Get the singleton service instance
    const pesapal = getPesapalService();
    
    // Get payment status
    const status = await pesapal.getTransactionStatus(orderTrackingId as string);
    
    // Update your database with the payment status
    await updateOrderStatus(orderMerchantReference as string, status.paymentStatus);
    
    // Redirect to success/failure page
    if (status.paymentStatus === 'COMPLETED') {
      return res.redirect('/payment/success');
    } else {
      return res.redirect('/payment/pending');
    }
  } catch (error) {
    console.error('Error processing callback:', error);
    return res.status(500).json({ error: 'Failed to process payment status' });
  }
});
```

### 4. Handle IPN (Instant Payment Notification)

```typescript
import { getPesapalService } from 'pesapal-node-sdk';

// Example IPN handler with Express
app.post('/api/pesapal/ipn', async (req, res) => {
  const { OrderNotificationType, OrderTrackingId, OrderMerchantReference } = req.body;
  
  if (!OrderTrackingId || !OrderMerchantReference) {
    return res.status(400).json({ status: 'error', message: 'Missing required parameters' });
  }

  try {
    const pesapal = getPesapalService();
    const status = await pesapal.getTransactionStatus(OrderTrackingId);
    
    // Update your database with the latest status
    await updateOrderInDatabase(OrderMerchantReference, {
      status: status.paymentStatus,
      paymentMethod: status.paymentMethod,
      amount: status.amount,
      currency: status.currency,
      lastUpdated: new Date()
    });
    
    // Acknowledge receipt of the IPN
    res.status(200).json({
      status: 'success',
      message: 'IPN received and processed',
      orderId: OrderMerchantReference,
      paymentStatus: status.paymentStatus
    });
    
  } catch (error) {
    console.error('IPN processing error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to process IPN',
      error: error.message 
    });
  }
});
```

### Handle IPN (Instant Payment Notification)
```typescript
// This is a generic IPN handler that can be used with any framework or serverless environment
import { IPaymentNotification } from 'pesapal-node-sdk';

// Example function to process IPN data
async function handleIPNNotification(notification: IPaymentNotification): Promise<void> {
  try {
    // Verify and process payment update
    console.log('Payment update received:', {
      orderId: notification.order_tracking_id,
      status: notification.payment_status,
      reference: notification.payment_method,
      amount: notification.amount,
      currency: notification.currency
    });

    // Update your database or trigger other business logic
    await updateOrderStatus(notification.order_tracking_id, notification.payment_status);
    
    // Send confirmation email, update inventory, etc.
    if (notification.payment_status === 'COMPLETED') {
      await sendConfirmationEmail(notification.billing_address?.email);
    }
  } catch (error) {
    console.error('Error processing IPN:', error);
    // Implement your error handling strategy (retry logic, logging, etc.)
    throw error;
  }
}

// Example usage with a web framework would look like:
// app.post('/ipn', async (req, res) => {
//   await handleIPNNotification(req.body);
//   res.status(200).end();
// });

// Helper functions (implement according to your needs)
async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  // Implementation for updating order status in your database
}

async function sendConfirmationEmail(email?: string): Promise<void> {
  // Implementation for sending confirmation email
  if (!email) return;
  // Email sending logic here
}
```

## 🚨 Error Handling

### Configuration Errors
```typescript
import { initializePesapal, PesapalConfigError } from 'pesapal-node-sdk';

try {
  const paymentService = initializePesapal({
    consumerKey: '', // Empty value will trigger error
    // Missing other required fields
  });
} catch (error) {
  if (error instanceof PesapalConfigError) {
    console.error('Configuration Error:', error.message);
    // Example: "Missing or empty required configuration fields: consumerKey, consumerSecret"
  }
}
```

### Payment Processing Errors
```typescript
import { paymentService, PesapalAuthError, PesapalApiError } from 'pesapal-node-sdk';

try {
  const result = await paymentService.submitOrder(paymentData);
} catch (error) {
  if (error instanceof PesapalConfigError) {
    console.error('Configuration Error:', error.message);
  } else if (error instanceof PesapalAuthError) {
    console.error('Authentication failed');
  } else if (error instanceof PesapalApiError) {
    console.error('API Error:', error.responseData);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Checking Payment Status
```typescript
import { paymentService } from 'pesapal-node-sdk';

const status = await paymentService.getPaymentStatus('order-123');

console.log(`
  Payment Status: ${status.paymentStatus}
  Amount: ${status.amount} ${status.currency}
  Method: ${status.paymentMethod}
`);
```

🧪 Testing
```typescript
import { paymentService } from 'pesapal-node-sdk';

// Using Jest
test('should process payment successfully', async () => {
  const mockResponse = {
    redirectUrl: 'https://sandbox.pesapal.com/pay/123'
  };
  
  jest.spyOn(paymentService, 'submitOrder').mockResolvedValue(mockResponse);
  
  const result = await paymentService.submitOrder(testPayment);
  expect(result.redirectUrl).toBeDefined();
});
```

## 📚 API Reference

### `initializePesapal(config?: Partial<IPesapalConfig>): PaymentService`
Initializes the Pesapal SDK with optional configuration overrides.

**Parameters:**
- `config` (optional): Partial configuration object. Missing fields fall back to environment variables.

**Returns:** PaymentService instance

**Throws:** `PesapalConfigError` if required configuration is missing or empty

**Example:**
```typescript
// Use all environment variables
const service1 = initializePesapal();

// Override specific values
const service2 = initializePesapal({
  consumerKey: 'custom-key',
  apiUrl: 'https://custom-api.com'
});
```

### `submitOrder(payment: IPaymentRequest)`
Submits a payment request to Pesapal

Parameters:
```typescript
{
  id: string;             // Unique order ID
  currency: string;       // Currency code (KES, USD, etc)
  amount: number;         // Payment amount
  description: string;    // Payment description
  billingAddress: {       // Customer info
    email: string;
    phoneNumber?: string;
    // ...other optional fields
  }
}
```

### `getPaymentStatus(orderId: string)`
Retrieves payment status

Returns:
```typescript
{
  paymentStatus: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  // ...other fields
}
```

🤝 Contributing
1. Fork the [repository](https://github.com/otim-otim/pesapal-node-sdk)
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

📜 License
MIT © Otim Isaac