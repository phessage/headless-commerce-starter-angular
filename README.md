# 1Ecomm Angular Storefront Starter

Change only `storeId` in `public/headless-config.json` to run the catalog, anonymous-cart, checkout-preparation and non-hosted pending-order app for another configured store. The same compiled artifact resolves its public runtime configuration at startup.

Angular standalone-components and signals reference storefront for the 1Ecomm headless catalog, anonymous cart and checkout-preparation preview.

Run `npm install && npm run check`. The default HTTP fixture is synthetic and contains no production data. See [architecture](docs/architecture.md).

Replace `public/headless-config.json` at deployment with a dedicated test or merchant environment's API URL and publishable key. It is runtime configuration so the same build can move between environments; never place an administrative secret there.

`npm run test:e2e:live` fails closed without `HEADLESS_API_URL` and `HEADLESS_PUBLISHABLE_KEY` and exercises the deployed catalog, a real fixture cart, addresses, and server-returned shipping/payment selections. It does not finalize an order or collect payment, and test environments must not clone production customer data.
