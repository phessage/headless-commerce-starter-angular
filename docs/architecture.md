# Architecture

The starter uses Angular standalone components and signals. At startup it resolves the public runtime from the single configured `storeId`, then calls the deployed catalog, cart, checkout-preparation, selection, order-placement and guest-order lookup contracts with the returned publishable key. Bootstrap and API failures fail closed; the application does not substitute synthetic products or commerce results. Local Playwright interception is test infrastructure only, while the deployed sandbox gate qualifies platform compatibility.
