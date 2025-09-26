import { ThemeEnum } from 'src/typings/enums';

export const getWebviewCheckoutHtmlString = (
  publicKey: string,
  payload: string,
  checksum: string,
  theme: ThemeEnum,
  sessionToken?: string,
  userId?: number,
): string => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>XMoney Payment Form</title>
    <script src="https://secure-stage.xmoney.com/sdk/0.0.9/xmoney.js"></script>
    <style>
      .payment-form-container {
        position: relative;
        border-radius: 8px;
        min-height: 150px;
      }
      .loading-overlay {
        position: absolute;
        inset: 0;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <div class="payment-form-container">
      <div class="loading-overlay" id="loading-overlay">
        Loading payment form...
      </div>
      <div id="payment-form-widget" style="opacity: 0"></div>
    </div>

    <script>
      // Simulated props (replace with your real data)
      const result = {
        payload: "${payload}",
        checksum: "${checksum}"
      };

      let paymentFormInstance = null;

      function initPaymentForm() {
        if (!window.XMoneyPaymentForm) {
          console.error("XMoneyPaymentForm SDK not loaded");
          return;
        }

        paymentFormInstance = new window.XMoneyPaymentForm({
           container: "payment-form-widget",
           elementsOptions: {
             appearance: {
               theme: "${theme}",
             },
            },
            options: {
              enableBackgroundRefresh: true,
              displayCardHolderName: true,
            },
            checksum: result.checksum,
            payload: result.payload,
            publicKey: "${publicKey}",
            sessionToken: "${sessionToken}",
            userId: "${userId}",
            onReady: () => setIsReady(true),
            onError: (err) => console.error("❌ Payment error", err),
            onReady: () => {
              document.getElementById("loading-overlay").style.display = "none";
              document.getElementById("payment-form-widget").style.opacity = "1";
            },
            onPaymentComplete: (result) => {
              setTransactionResult(result);
              window.scrollTo({ top: 0, behavior: "smooth" });
            },
        });
      }

      window.addEventListener("DOMContentLoaded", () => {
        initPaymentForm();
      });

      window.addEventListener("beforeunload", () => {
        paymentFormInstance?.destroy?.();
      });
    </script>
  </body>
</html>`;
