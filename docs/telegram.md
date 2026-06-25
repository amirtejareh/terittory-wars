# Telegram Mini App And Stars Setup

## Mini App

1. Create a bot with BotFather.
2. Configure the main Mini App URL to your Vercel deployment.
3. Put the bot token in `TELEGRAM_BOT_TOKEN`.
4. The web client sends `Telegram.WebApp.initData` to `/api/session`.
5. The server validates the HMAC signature before creating or returning the user profile.

Telegram's Mini App docs require the backend to validate `Telegram.WebApp.initData` by building the sorted data-check-string and comparing it to the HMAC-SHA-256 hash derived from the bot token.

## Stars Purchase Flow

1. The client calls `/api/shop/invoice` with a catalog item id.
2. The server calls Telegram `createInvoiceLink` with:
   - `currency: "XTR"`
   - `provider_token: ""`
   - exactly one `prices` item for Stars payments
3. The client calls `Telegram.WebApp.openInvoice(invoiceUrl)`.
4. Telegram sends webhook updates for `pre_checkout_query` and `successful_payment`.
5. The server answers pre-checkout queries within 10 seconds and grants inventory only after `successful_payment`.
6. The server stores `telegram_payment_charge_id` and rejects duplicates.

For test Mini Apps, Telegram's test environment uses `https://api.telegram.org/bot<token>/test/METHOD_NAME` and allows HTTP Mini App links while testing.

