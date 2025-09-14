# Pesapal Node Integration



A TypeScript package for seamless Pesapal payments integration in Node.js powered applications. While this package is not an official pesapal package, it is a community-driven package that provides a simple and easy way to integrate Pesapal payments into your Node.js applications.

## 📦 Installation

```bash
npm install pesapal-node-sdk
```

## ⚙️ Configuration

### Option 1: Environment Variables (Recommended)
Create a .env file in your project root:

```makefile
# Required
PESAPAL_CONSUMER_KEY=your_key_here
PESAPAL_CONSUMER_SECRET=your_secret_here
PESAPAL_CALLBACK_URL=https://yourapp.com/your_post_process_redirect_url
PESAPAL_IPN_URL=https://yourapp.com/your_notification_url
PESAPAL_IPN_ID=your_ipn_id_here
PESAPAL_ENV=live  # 'live' for production, anything else defaults to sandbox
```

### Option 2: Runtime Configuration
You can also pass configuration directly when initializing:

```typescript
import { initializePesapal } from 'pesapal-node-sdk';

const paymentService = initializePesapal({
  consumerKey: 'your_key_here',
  consumerSecret: 'your_secret_here',
  apiUrl: 'https://pay.pesapal.com/v3/api', // or sandbox URL
  callbackUrl: 'https://yourapp.com/callback',
  ipnUrl: 'https://yourapp.com/ipn',
  ipnId: 'your_ipn_id'
});
```

### Configuration Notes
- The consumer key and secret can be found in your Pesapal account dashboard
- For testing, use credentials from: https://developer.pesapal.com/api3-demo-keys.txt
- The IPN ID can be generated from:
  - **Sandbox**: https://cybqa.pesapal.com/PesapalIframe/PesapalIframe3/IpnRegistration
  - **Live**: https://pay.pesapal.com/iframe/PesapalIframe3/IpnRegistration
- **Important**: All required fields must be provided, or the SDK will throw a `PesapalConfigError`

## 🚀 Basic Usage

### Method 1: Using Default Instance (Environment Variables)
```typescript
import { paymentService } from 'pesapal-node-sdk';

const paymentData = {
  id: 'order-' + Date.now(),
  currency: 'KES',
  amount: 1000,
  description: 'Online Purchase',
  billingAddress: {
    email: 'customer@example.com',
    phoneNumber: '+254712345678'
  }
};

const payment = await paymentService.submitOrder(paymentData);
// Redirect user to payment.redirectUrl
```

### Method 2: Using Custom Configuration
```typescript
import { initializePesapal, PesapalConfigError } from 'pesapal-node-sdk';

try {
  const paymentService = initializePesapal({
    consumerKey: 'your_custom_key',
    consumerSecret: 'your_custom_secret',
    // Other fields will fall back to environment variables
  });
  
  const payment = await paymentService.submitOrder(paymentData);
  // Redirect user to payment.redirectUrl
} catch (error) {
  if (error instanceof PesapalConfigError) {
    console.error('Configuration Error:', error.message);
    // Handle missing or invalid configuration
  }
}
```

### Handle Callback
```typescript
// This is a generic example that can be adapted to any framework or serverless environment
import { paymentService } from 'pesapal-node-sdk';
// Or use: import { initializePesapal } from 'pesapal-node-sdk';

// Example function that would be called with the order ID from the callback URL
async function handlePaymentCallback(orderId: string): Promise<{ status: string; message: string }> {
  try {
    const status = await paymentService.getPaymentStatus(orderId);
    
    if (status.paymentStatus === 'COMPLETED') {
      // Update your database or trigger other business logic
      return { 
        status: 'success', 
        message: 'Payment processed successfully' 
      };
    } else {
      return { 
        status: 'pending', 
        message: 'Payment is being processed' 
      };
    }
  } catch (error) {
    console.error('Error processing payment callback:', error);
    return { 
      status: 'error', 
      message: 'Failed to process payment status' 
    };
  }
}

// Example usage with a web framework would look like:
// app.get('/callback', async (req, res) => {
//   const result = await handlePaymentCallback(req.query.orderId);
//   res.json(result);
// });
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