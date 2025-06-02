[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

# XMoney API SDK

A modern, type-safe API SDK for the XMoney payment platform. Built with TypeScript-first design principles, featuring explicit error handling, async generators for efficient pagination, and cross-platform support for Node.js and browsers.

## Features

- **TypeScript-first** - Full type safety with comprehensive TypeScript support
- **Async generators** - Memory-efficient pagination for large datasets
- **Cross-platform** - Works in Node.js, browsers, and edge environments
- **Type-safe errors** - Explicit error handling with typed error responses
- **Modular design** - Tree-shakeable with minimal bundle size
- **Secure by default** - Built-in encryption for sensitive operations

## 📦 Installation

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

## 🚀 Quick Start

### Initialize the SDK

```typescript
import { createXMoneyClient } from '@xmoney/api-sdk'

// Simple initialization
const xMoney = createXMoneyClient('sk_test_your_secret_key')

// Advanced initialization with custom configuration
const advancedXMoney = createXMoneyClient({
  apiKey: 'sk_test_your_secret_key',
  host: 'api-stage.xmoney.com', // optional
  timeout: 30000, // optional, in milliseconds
})
```

### Basic Usage Examples

#### Create a Customer

```typescript
const customer = await xMoney.customers.create({
  identifier: 'customer_123',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  country: 'US',
  state: 'NY',
  city: 'New York',
  zipCode: '10001',
})
```

#### Create an Order

```typescript
const order = await xMoney.orders.create({
  customerId: customer.id,
  ip: '192.168.1.1',
  amount: 10000, // Amount in smallest currency unit (e.g., cents)
  currency: 'USD',
  orderType: 'purchase',
  externalOrderId: `order_${Date.now()}`,
  description: 'Premium subscription',
  cardTransactionMode: 'authAndCapture',
  cardNumber: '4111111111111111',
  cardExpiryDate: '12/25',
  cardCvv: '123',
  cardHolderName: 'John Doe',
})
```

#### List Transactions with Pagination

```typescript
// Using async iteration for memory-efficient pagination
for await (const transaction of xMoney.transactions.list({
  perPage: 20,
  transactionStatus: ['complete-ok'],
  currency: 'USD'
})) {
  console.log(transaction.id, transaction.amount, transaction.status)
}
```

## 📚 API Resources

### Customers

Manage customer profiles and information.

```typescript
// Create a customer (identifier and email required)
await xMoney.customers.create({
  identifier: 'customer_123',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  country: 'US',
  state: 'NY',
})

// Retrieve a customer by ID
await xMoney.customers.retrieve(customerId)

// Update customer details
await xMoney.customers.update(customerId, {
  email: 'new@email.com',
  city: 'Los Angeles',
  state: 'CA'
})

// Delete a customer
await xMoney.customers.delete(customerId)

// List customers with filters
for await (const customer of xMoney.customers.list({
  perPage: 50,
  country: 'US',
  createdAtFrom: new Date('2024-01-01')
})) {
  // Process each customer
}

// Search customers
const results = await xMoney.customers.search({
  email: 'john.doe@example.com',
  identifier: 'customer_123'
})
```

### Orders

Handle payment orders and recurring billing.

```typescript
// Create a purchase order with new card
await xMoney.orders.create({
  customerId: 12345,
  ip: '192.168.1.1',
  amount: 5000,
  currency: 'USD',
  orderType: 'purchase',
  externalOrderId: 'unique_order_id',
  cardTransactionMode: 'authAndCapture',
  cardNumber: '4111111111111111',
  cardExpiryDate: '12/25',
  cardCvv: '123',
  saveCard: true,
})

// Create a recurring order
await xMoney.orders.create({
  customerId: 12345,
  ip: '192.168.1.1',
  amount: 2999,
  currency: 'USD',
  orderType: 'recurring',
  intervalType: 'month',
  intervalValue: 1,
  cardId: 'saved_card_id',
})

// Retrieve an order
await xMoney.orders.retrieve(orderId)

// Cancel an order
await xMoney.orders.cancel(orderId, {
  reason: 'customer-demand',
  message: 'Customer requested cancellation'
})

// Rebill a recurring order
await xMoney.orders.rebill(orderId, {
  customerId: 12345,
  amount: 2999
})

// Update order card
await xMoney.orders.updateCard(orderId, {
  customerId: '12345', // Note: string type required
  ip: '192.168.1.1',
  amount: 2999,
  currency: 'USD',
  cardNumber: '5555555555554444',
  cardExpiryDate: '12/26',
  cardCvv: '456'
})
```

### Transactions

Manage payment transactions, captures, and refunds.

```typescript
// Retrieve a transaction
await xMoney.transactions.retrieve(transactionId)

// Capture an authorized transaction
await xMoney.transactions.capture(transactionId, {
  amount: 5000, // Required, can be partial
})

// Refund a transaction
await xMoney.transactions.refund(transactionId, {
  amount: 2500, // Optional partial refund
  reason: 'customer-demand',
  message: 'Product return'
})

// List transactions with filters
for await (const transaction of xMoney.transactions.list({
  transactionStatus: ['complete-ok', 'in-progress'],
  transactionMethod: 'card',
  currency: 'USD',
  amountFrom: 1000,
  amountTo: 10000,
  createdAtFrom: new Date('2024-01-01')
})) {
  // Process transactions
}
```

### Cards

Manage stored payment cards.

```typescript
// Retrieve a card (both parameters required)
await xMoney.cards.retrieve(cardId, customerId)

// Delete a card
await xMoney.cards.delete(cardId)

// List customer cards
for await (const card of xMoney.cards.list({
  customerId: 12345,
  hasToken: 'yes',
  cardStatus: 'all'
})) {
  console.log(card.last4, card.expiryMonth, card.expiryYear)
}
```

### Checkout

Create hosted checkout sessions for secure payment collection.

```typescript
// Create a checkout session
const checkout = await xMoney.checkout.create({
  publicKey: 'pk_test_your_public_key',
  customer: {
    identifier: 'customer_123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    country: 'US',
    state: 'NY',
    city: 'New York',
    zipCode: '10001',
    phone: '+1234567890',
  },
  order: {
    orderId: 'order_123',
    description: 'Product purchase',
    type: 'purchase',
    amount: 10000,
    currency: 'USD',
    items: [
      {
        name: 'Premium Subscription',
        units: 1,
        unitPrice: 10000,
        amount: 10000,
      }
    ],
    tags: ['subscription', 'premium'],
  },
  cardTransactionMode: 'authAndCapture',
  backUrl: 'https://your-site.com/checkout/complete',
})

// Generate HTML form for embedded checkout
const htmlForm = await xMoney.checkout.form({
  // Same parameters as create()
})

// Decrypt webhook response
const decryptedData = await xMoney.checkout.decrypt(encryptedPayload)
```

### Notifications

Access webhook notifications and delivery logs.

```typescript
// List all notifications with filters
for await (const notification of xMoney.notifications.list({
  perPage: 50,
  type: 'order',
  status: 'delivered',
  createdAtFrom: new Date('2024-01-01')
})) {
  console.log(notification.type, notification.status)
}

// List order-specific notifications
const orderNotifications = await xMoney.notifications.listForOrders({
  orderId: 12345,
  perPage: 20,
})

// List transaction-specific notifications
const txNotifications = await xMoney.notifications.listForTransactions({
  transactionId: 67890,
  status: 'failed',
})
```

## ⚠️ Error Handling

The SDK provides typed error responses for better error handling:

```typescript
import { XMoneyError } from '@xmoney/api-sdk'

try {
  await xMoney.orders.create({ /* ... */ })
}
catch (error) {
  if (error instanceof XMoneyError) {
    console.error('API Error:', error.message)
    console.error('Error Code:', error.code)
    console.error('Status:', error.status)
    console.error('Request ID:', error.requestId)
  }
}
```

## 📄 Pagination

All list methods return async iterators for memory-efficient processing:

```typescript
// Iterate through pages automatically
for await (const order of xMoney.orders.list({
  perPage: 100,
  orderType: 'purchase',
  currency: 'USD'
})) {
  // Process each order
}

// Get a specific page
const page = await xMoney.orders.list({
  page: 2,
  perPage: 50,
  reverseSorting: 1
})
console.log(page.data) // Array of orders
console.log(page.pagination) // Pagination

// Use search method for complex queries
const searchResults = await xMoney.customers.search({
  email: 'john@example.com',
  country: 'US',
  tag: ['vip', 'premium']
})
```

## 🔐 Hosted Checkout Integration

The checkout resource provides secure payment form generation and response handling:

```typescript
// Create encrypted checkout payload
const { payload, checksum } = xMoney.checkout.create({
  publicKey: 'pk_test_your_public_key',
  customer: {
    identifier: 'customer_123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    country: 'US',
    state: 'NY',
    city: 'New York',
  },
  order: {
    orderId: 'order_123',
    description: 'Product purchase',
    type: 'purchase',
    amount: 10000,
    currency: 'USD',
  },
  cardTransactionMode: 'authAndCapture',
  backUrl: 'https://your-site.com/checkout/complete',
  saveCard: true,
})

// Generate complete HTML form for direct submission
const checkoutHtml = xMoney.checkout.form({
  publicKey: 'pk_test_your_public_key',
  customer: { /* ... */ },
  order: { /* ... */ },
  url: 'https://secure.twispay.com', // optional, defaults to production URL
})

// Decrypt IPN webhook response
const orderData = xMoney.checkout.decrypt(encryptedPayload)
console.log(orderData.transactionStatus) // 'complete-ok', 'complete-failed', etc.
console.log(orderData.orderId, orderData.transactionId)
```

## 📘 TypeScript Support

The SDK is written in TypeScript and provides comprehensive type definitions:

```typescript
import type {
  Card,
  Customer,
  Order,
  PaginatedResponse,
  Transaction,
  XMoneyConfig,
} from '@xmoney/api-sdk'
```

## 🌐 Platform Support

The SDK automatically detects and adapts to your runtime environment:

- **Node.js**: Uses native crypto and Node.js HTTP client
- **Browsers**: Uses SubtleCrypto API and Fetch API
- **Edge Workers**: Cloudflare Workers, Vercel Edge, etc.
- **Deno/Bun**: Uses web-standard APIs

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

- 📧 Email: support@xmoney.com
- 📖 Documentation: https://docs.xmoney.com
- 🐛 Issues: https://github.com/Twispay/api-sdk/issues

[npm-version-src]: https://img.shields.io/npm/v/@xmoney/api-sdk?style=flat&colorA=080f12&colorB=7c4dff
[npm-version-href]: https://npmjs.com/package/@xmoney/api-sdk
[npm-downloads-src]: https://img.shields.io/npm/dm/@xmoney/api-sdk?style=flat&colorA=080f12&colorB=7c4dff
[npm-downloads-href]: https://npmjs.com/package/@xmoney/api-sdk
[bundle-src]: https://img.shields.io/bundlephobia/minzip/@xmoney/api-sdk?style=flat&colorA=080f12&colorB=7c4dff&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=@xmoney/api-sdk
[license-src]: https://img.shields.io/github/license/Twispay/api-sdk.svg?style=flat&colorA=080f12&colorB=7c4dff
[license-href]: https://github.com/Twispay/api-sdk/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=7c4dff
[jsdocs-href]: https://www.jsdocs.io/package/@xmoney/api-sdk
