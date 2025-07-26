# Pesapal Node Integration



A TypeScript package for seamless Pesapal payments integration in Node.js powered applications. While this package is not an official pesapal package, it is a community-driven package that provides a simple and easy way to integrate Pesapal payments into your Node.js applications.

## 📦 Installation

```bash
npm install pesapal-node-sdk axios dotenv
```

⚙️ Configuration
Create a .env file in your project root:

```makefile
# Required
PESAPAL_CONSUMER_KEY=your_key_here
PESAPAL_CONSUMER_SECRET=your_secret_here
PESAPAL_CALLBACK_URL=https://yourapp.com/callback
PESAPAL_IPN_URL=https://yourapp.com/ipn

# Optional (defaults shown)
PESAPAL_API_URL=https://api.pesapal.com
PESAPAL_ENV=sandbox  # or 'live'
```

🚀 Basic Usage
1. Initialize Payment
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

2. Handle Callback
```typescript
// This is a generic example that can be adapted to any framework or serverless environment
import { paymentService } from 'pesapal-node-sdk';

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

3. Handle IPN (Instant Payment Notification)
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

### Error Handling
```typescript
import { paymentService, PesapalAuthError, PesapalApiError } from 'pesapal-node-sdk';

try {
  const result = await paymentService.submitOrder(paymentData);
} catch (error) {
  if (error instanceof PesapalAuthError) {
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

📚 API Reference
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