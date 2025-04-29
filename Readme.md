# @xmoney/api-sdk

## Instalaltion

`npm install @xmoney/api-sdk`
<br />
<br />

## Usage

#### Get needed params for checkout initialization:
```typescript
import xMoney from "@xmoney/api-sdk";

const xMoneyCheckout = new xMoney({
  secretKey: "sk_test_secretKey",
  hostedCheckoutRedirectUrl: "https://secure-stage.twispay.com",
});

const order = xMoneyCheckout.initializeCheckout({
  publicKey: 'pk_test_abc123',
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

#### Get HTML for hosted checkout (mobile/webview):
HostedCheckoutRedirectUrl: <br />
Use `https://secure-stage.twispay.com` for staging environment. <br />
Use `https://secure.twispay.com` for prod environment
```typescript
import xMoney from "@xmoney/api-sdk";

const xMoneyCheckout = new xMoney({
  secretKey: "sk_test_secretKey",
});

const orderHtml = xMoneyCheckout.initializeHostedCheckout({
  publicKey: 'pk_test_abc123',
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
import xMoney from "@xmoney/api-sdk";

const xMoneyCheckout = new xMoney({
  secretKey: "sk_test_secretKey",
});

const webhookPayload = 'ecryptedPayload'; 

console.log(
    xMoneyCheckout.decryptOrderResponse(webhookPayload)
);
```


