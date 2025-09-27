# Changelog

All notable changes to the `pesapal-node-sdk` will be documented in this file.

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
