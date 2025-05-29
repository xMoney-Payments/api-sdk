# @xmoney/api-sdk

A modern, type-safe API SDK for the XMoney API. Built with TypeScript-first design principles, featuring explicit error handling, async generators for efficient pagination, and cross-platform support.

## Installation

```sh
# npm
npm install @xmoney/api-sdk

# pnpm
pnpm add @xmoney/api-sdk

# yarn
yarn add @xmoney/api-sdk

# bun
bun add @xmoney/api-sdk
```

## Quick Start

#### Get needed params for checkout initialization:
```typescript
import XMoney from '@xmoney/api-sdk'

const xMoneyCheckout = new XMoney({
  secretKey: 'sk_test_secretKey',
})

const order = xMoneyCheckout.initializeCheckout({
  publicKey: 'pk_test_abc123',
  customer: {
    identifier: 'customerIdentifier',
    firstName: 'John',
    lastName: 'Doe',
    country: 'RO',
    city: 'Bucharest',
    email: 'john.doe@test.com',
  },
  order: {
    orderId: 'myUniqueOrderId',
    description: 'Order Description',
    type: 'purchase',
    amount: 100,
    currency: 'EUR',
  },
  cardTransactionMode: 'authAndCapture',
  backUrl: 'https://127.0.0.1:8080',
})
```

#### Get HTML for hosted checkout (mobile/webview):
```typescript
import XMoney from '@xmoney/api-sdk'

const xMoneyCheckout = new XMoney({
  secretKey: 'sk_test_secretKey',
})

const orderHtml = xMoneyCheckout.initializeHostedCheckout({
  publicKey: 'pk_test_abc123',
  customer: {
    identifier: 'customerIdentifier',
    firstName: 'John',
    lastName: 'Doe',
    country: 'RO',
    city: 'Bucharest',
    email: 'john.doe@test.com',
  },
  order: {
    orderId: 'myUniqueOrderId',
    description: 'Order Description',
    type: 'purchase',
    amount: 100,
    currency: 'EUR',
  },
  cardTransactionMode: 'authAndCapture',
  backUrl: 'https://127.0.0.1:8080',
})
```

#### How to decrypt order webhook payload:
```typescript
import XMoney from '@xmoney/api-sdk'

const xMoneyCheckout = new XMoney({
  secretKey: 'sk_test_secretKey',
})

const webhookPayload = 'ecryptedPayload'

console.log(
  xMoneyCheckout.decryptOrderResponse(webhookPayload)
)
```

CryptoProvider.ts - abstract class for crypto operations
NodeCryptoProvider.ts - Node implementation of CryptoProvider
SubtleCryptoProvider.ts - Browser implementation of CryptoProvider (using SubtleCrypto)
error.ts - errors
HttpClient.ts - abstract class for HTTP client operations
FetchHttpClient.ts - Fetch HTTP client implementation
NodeHttpClient.ts - Node HTTP client implementation
types.ts - Common types used in the SDK
RequestHandler.ts - handles requests and responses
PlatformFunctions.ts - abstract class for platform-specific functions so that the SDK can work in both Node.js and browser environments
NodePlatformFunctions.ts - Node.js implementation of PlatformFunctions
BrowserPlatformFunctions.ts - Browser implementation of PlatformFunctions
Customers.ts - handles customer-related operations
Transactions.ts - handles transaction-related operations
Cards.ts - handles card-related operations
Orders.ts - handles order-related operations
XMoney.ts - main class that ties everything together and provides the SDK interface
