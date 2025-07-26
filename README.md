# Pesapal Node Integration

![Pesapal Logo](./assets/images/pesapallogo.png)

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
// Express.js example
import { paymentService } from 'pesapal-node-sdk';

app.get('/pesapal-callback', async (req, res) => {
  const status = await paymentService.getPaymentStatus(req.query.orderId);
  
  if (status.paymentStatus === 'COMPLETED') {
    // Update your database
    res.send('Payment successful!');
  } else {
    res.send('Payment processing...');
  }
});
```

3. Handle IPN (Instant Payment Notification)
```typescript
app.post('/pesapal-ipn', async (req, res) => {
  const notification = req.body;
  
  // Verify and process payment update
  console.log('Payment update:', {
    orderId: notification.order_tracking_id,
    status: notification.payment_status
  });
  
  res.status(200).end();
});
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
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

📜 License
MIT © Otim Isaac