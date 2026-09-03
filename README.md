# 1Ecomm Angular Storefront Starter

Free for authorized 1Ecomm customers and their developers to build and operate 1Ecomm-connected storefronts. You may deploy the finished store, but may not redistribute, resell, sublicense, mirror, or republish this starter or a reusable derivative. See [LICENSE.md](LICENSE.md).

This is a ready-to-run Angular shop using standalone components and signals. It shows products, cart, guest checkout choices and a pending non-hosted order confirmation. It never charges a card or wallet.

## Run it

1. Install Node.js 22 or newer.
2. Open `public/headless-config.json` and replace only `storeId` with your provisioned 1Ecomm store ID. The included ID is a safe test fixture.

The required CI browser gate allocates its own expiring fixture, drives the real deployed catalog/cart/checkout/order/lookup APIs through this UI, and always revokes the temporary key. Local merchant setup remains store-ID-only.
3. Run:

```bash
npm ci
npm run check
npm start
```

4. Open `http://localhost:4200`. You should see products from the selected store. The same compiled web files can be moved to another provisioned store by replacing the runtime configuration file.

`npm run check` builds the production application, runs Angular tests, launches it, and exercises the UI in a browser. `npm run test:e2e:live` creates an isolated fixture cart and pending bank-transfer test order against the deployed API. It does not move money.

Never put an administrator password or secret API key in `headless-config.json`. See [architecture](docs/architecture.md) for technical details.
