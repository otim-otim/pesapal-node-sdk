# Changelog

All notable changes to the `pesapal-node-sdk` will be documented in this file.

## [3.1.0] - 2026-10-19

Aligns the SDK with the [Pesapal API 3.0 reference](https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/api-reference).

### 🐛 Bug Fixes
- **submitOrder**: the billing address is now sent as `billing_address` with snake_case fields (`email_address`, `phone_number`, `first_name`, ...). Previously the camelCase `billingAddress` object was sent as-is and Pesapal ignored it. The camelCase `callbackUrl`/`notificationId` keys are no longer leaked into the request body.
- **getPaymentStatus**: queries `GetTransactionStatus?orderTrackingId=` (previously `?orderId=`, which Pesapal answers with 404). The parameter is the order tracking ID returned by `submitOrder`.
- Pesapal errors returned inside HTTP 200 responses (an `error` object or a non-200 `status`) are now reported as errors instead of being treated as success.
- The `ipnId` and `callbackUrl` config values are now used; previously only the environment variables were read.
- Error responses now include Pesapal's error message, `code` and `errorType` rather than the generic Axios message.
- The published type definitions now include the interfaces. Previously `dist/index.d.ts` imported `./interfaces`, which was missing from the package.

### 🚀 New Features
- `requestRefund()` for `Transactions/RefundRequest`.
- `cancelOrder()` for `Transactions/CancelOrder`.
- `registerIPN()` (with `GET` or `POST` notifications) and `getRegisteredIPNs()` for `URLSetup/GetIpnList`.
- `submitOrder` supports `redirectMode`, `cancellationUrl`, `branch`, `accountNumber` and `subscriptionDetails` (recurring payments), and all `billing_address` fields (`middleName`, `line1`, `line2`, `city`, `state`, `postalCode`, `zipCode`).
- `submitOrder` returns `merchantReference`.
- `getPaymentStatus` returns `subscriptionTransactionInfo` for recurring payments.
- Access tokens are cached until shortly before their `expiryDate` instead of being requested on every call.
- `PesapalApiError` and the new request/response types are exported.

### ⚠️ Type Changes
- `IPaymentRequest.billingAddress` is now required, and must contain `emailAddress` or `phoneNumber`, matching Pesapal's requirements. Orders without one were already rejected by Pesapal; they are now rejected before the request is sent.
- `billingAddress.email` is deprecated in favour of `billingAddress.emailAddress` (both are accepted).

## [3.0.0] - 2025-09-27

### 🚀 New Features
- **TypeScript Support**: Full TypeScript support with type definitions
- **Singleton Pattern**: Added singleton pattern for better resource management
- **Improved Error Handling**: Better error types and messages
- **Type-Safe API**: All API responses are now properly typed

### 💥 Breaking Changes
- **Initialization**: Changed from direct instantiation to singleton pattern
  - Old: `const service = new PaymentService(config)`
  - New: `const service = initialize(config)`
- **Type Exports**: All types are now properly exported from the main package
- **Configuration**: Environment variable names have been standardized

### 🛠️ Improvements
- **Documentation**: Comprehensive README with usage examples
- **Testing**: Improved test coverage
- **Error Messages**: More descriptive error messages
- **Code Quality**: Better code organization and structure

### 🐛 Bug Fixes
- Fixed issues with singleton instance management
- Resolved type definition exports
- Fixed error handling in async operations

### 🔄 Dependencies
- Updated all dependencies to their latest versions
- Added TypeScript as a peer dependency

### Migration Guide from v2 to v3

1. **Update Initialization**
   ```typescript
   // Old (v2)
   import { PaymentService } from 'pesapal-node-sdk';
   const service = new PaymentService(config);

   // New (v3)
   import { initialize } from 'pesapal-node-sdk';
   const service = initialize(config);
   ```

2. **Environment Variables**
   - `PESAPAL_CONSUMER_KEY` (no change)
   - `PESAPAL_CONSUMER_SECRET` (no change)
   - `PESAPAL_CALLBACK_URL` (no change)
   - `PESAPAL_IPN_URL` (no change)
   - `PESAPAL_IPN_ID` (no change)
   - `PESAPAL_ENV` (now required, must be 'sandbox' or 'production')

3. **TypeScript Usage**
   All responses are now properly typed. Make sure to update your type annotations:
   ```typescript
   // Old (v2)
   const response = await service.submitOrder(data);
   
   // New (v3)
   import { ISubmitOrderResponse } from 'pesapal-node-sdk';
   const response: ISubmitOrderResponse = await service.submitOrder(data);
   ```

### Deprecations
- Direct instantiation of `PaymentService` is deprecated in favor of the `initialize()` function
- Legacy environment variable names are no longer supported

---

For previous versions, please see the [GitHub Releases](https://github.com/otim-otim/pesapal-node-sdk/releases) page.
