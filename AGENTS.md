# AI engineering guide

Read this file, `README.md`, `docs/architecture.md`, `src/app/*`, Angular configuration and both Playwright suites before editing.

## Boundary and contract

This is an Angular 22 standalone/signals reference. One `storeId` in `public/headless-config.json` bootstraps public runtime values. It fails closed and must not embed secrets or synthetic fallback commerce. Canonical HTTP truth is `phessage/ecommerce-service/contracts/headless-commerce-v1.openapi.yaml`.

The service owns tenant scope, price, inventory, shipping/payment choices and orders. `x-cart-token` is a bearer capability; never log or place it in a URL. Do not retry mutations or lookup; only retry order placement with the same intent key. Order line count is `items.length`, not `itemCount`.

## Angular practices

- Use standalone components, signals/computed/effect and `inject`; avoid adding NgModules or RxJS state where signals suffice.
- Keep templates declarative and typed. Use built-in control flow and track stable IDs.
- Use `HttpClient`/interceptors for transport concerns; do not calculate commerce truth in the component.
- Clean up subscriptions/effects and prevent stale async responses from overwriting newer state.
- Preserve semantic forms, labels, focus, live errors and keyboard behavior.
- Angular 22.1 supports TypeScript `>=6.0 <6.1`; do not “upgrade” to TypeScript 7 until Angular's official compatibility table permits it.

## Verification

Run `rm -rf node_modules && npm ci`, `npm run check`, then the authorized sandbox live suite. Tests must cross the real transport boundary and assert rendered commerce results. Update package-lock with dependency changes and never bypass Angular peer requirements or disable version checks.
