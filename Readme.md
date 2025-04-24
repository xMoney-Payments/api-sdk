# @xmoney/api-sdk

## Instalaltion

`npm install @xmoney/api-sdk`
<br />
<br />

## Usage

#### Get needed params for checkout initialization:
```typescript
import InlineCheckoutApiSdk from "@xmoney/api-sdk";

const inlineCheckout = new InlineCheckoutApiSdk({
  secretKey: "mySecretKey",
});

const order = inlineCheckout.initializeCheckout({
  siteId: 1,
  customer: {
    identifier: "customerIdentifier",
    firstName: "John",
    lastName: "Doe",
    country: "RO",
    city: "Bucharest",
    email: "john.doe@test.com",
  },
  order: {
    orderId: "myUniqueOrderId",
    description: "Order Description",
    type: "purchase",
    amount: 100,
    currency: "EUR",
  },
  cardTransactionMode: "authAndCapture",
  backUrl: "https://127.0.0.1:8080",
});
```

#### How to decrypt order webhook payload:
```typescript
import InlineCheckoutApiSdk from "@xmoney/api-sdk";

const inlineCheckout = new InlineCheckoutApiSdk({
  secretKey: "mySecretKey",
});

const webhookPayload = 'ecryptedPayload'; 

console.log(
    inlineCheckout.decryptOrderResponse(webhookPayload)
);
```


