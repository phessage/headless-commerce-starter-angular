import { Component, OnInit, signal } from '@angular/core';
type Product = {
  id: string;
  name: string;
  description: string;
  price: { amount: string; currency: string };
  available: boolean;
};
type Cart = { items: Array<{ id: string; quantity: number }> };
type Option = { id: string; name: string; capabilities?: { requiresHostedCheckout?: boolean; canPlaceOrder?: boolean } };
type Order = { orderNumber: string; status: string; paymentStatus: string; requiresPayment: false };
type Checkout = {
  shippingOptions: Option[];
  paymentMethods: Option[];
  selectedShippingMethodId: string | null;
  selectedPaymentMethodId: string | null;
  ready: boolean;
  missing: string[];
};
type RuntimeConfig = { apiUrl: string; publishableKey: string };
type StoreConfig = { storeId: string; bootstrapUrl?: string };
@Component({
  selector: 'app-root',
  styleUrls: ['./app.css', './checkout.css'],
  templateUrl: './app.html',
})
export class App implements OnInit {
  readonly products = signal<Product[]>([]);
  readonly cart = signal<Cart>({ items: [] });
  readonly checkout = signal<Checkout | null>(null);
  readonly order = signal<Order | null>(null);
  readonly error = signal('');
  readonly status = signal('');
  readonly busy = signal(false);
  private config: RuntimeConfig = { apiUrl: '', publishableKey: '' };
  private token = sessionStorage.getItem('headless-cart-token') ?? '';
  private orderIntent = '';
  async ngOnInit() {
    try {
      const store = await fetch('/headless-config.json', { cache: 'no-store' }).then((r) => {
        if (!r.ok) throw new Error('Store configuration unavailable');
        return r.json() as Promise<StoreConfig>;
      });
      const bootstrap = (store.bootstrapUrl ?? 'https://api.1ecomm.com').replace(/\/$/, '');
      const configured = await fetch(`${bootstrap}/v1/headless/stores/${encodeURIComponent(store.storeId)}/config`);
      if (!configured.ok) throw new Error('Store is not configured for headless commerce');
      const runtime = (await configured.json()).data as RuntimeConfig & { storeId: string };
      if (runtime.storeId !== store.storeId || !runtime.publishableKey.startsWith('pk_')) throw new Error('Invalid store bootstrap response');
      this.config = runtime;
      const response = await fetch(`${this.base()}/v1/headless/products`, { headers: this.headers() });
      if (!response.ok) throw new Error('Catalog unavailable');
      this.products.set((await response.json()).data);
    } catch (error) {
      this.error.set((error as Error).message);
    }
  }
  async add(product: Product) {
    if (!this.config.apiUrl) return this.error.set('Store configuration is not ready');
    this.busy.set(true);
    this.error.set('');
    try {
      await this.ensureCart();
      const response = await fetch(`${this.base()}/v1/headless/carts/current/items`, {
        method: 'POST',
        headers: this.headers(true),
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      if (!response.ok) throw new Error('Item could not be added');
      this.cart.set((await response.json()).data);
      this.status.set(`${product.name} added`);
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
  async prepare(event: SubmitEvent) {
    event.preventDefault();
    if (!this.config.apiUrl) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const data = new FormData(event.target as HTMLFormElement);
      const address = {
        firstName: String(data.get('firstName')),
        lastName: String(data.get('lastName')),
        email: String(data.get('email')),
        address1: String(data.get('address1')),
        city: String(data.get('city')),
        state: String(data.get('state')),
        postalCode: String(data.get('postalCode')),
        country: String(data.get('country')),
      };
      const response = await fetch(`${this.base()}/v1/headless/carts/current/checkout`, {
        method: 'PATCH',
        headers: this.headers(true),
        body: JSON.stringify({
          customerInfo: {
            firstName: address.firstName,
            lastName: address.lastName,
            email: address.email,
          },
          billingAddress: address,
          shippingAddress: { sameAsBilling: true },
        }),
      });
      if (!response.ok) throw new Error('Checkout preparation failed');
      this.checkout.set((await response.json()).data);
      this.status.set('Checkout prepared');
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
  async select(kind: 'shipping-method' | 'payment-method', event: Event) {
    const id = (event.target as HTMLSelectElement).value;
    if (!id) return;
    const response = await fetch(`${this.base()}/v1/headless/carts/current/checkout/${kind}`, {
      method: 'PUT',
      headers: this.headers(true),
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      this.error.set('Selection failed');
      return;
    }
    this.checkout.set((await response.json()).data);
    this.status.set(`${kind} selected`);
  }
  async placeOrder() {
    const checkout = this.checkout();
    const selected = checkout?.paymentMethods.find((method) => method.id === checkout.selectedPaymentMethodId);
    if (!checkout?.ready || selected?.capabilities?.requiresHostedCheckout !== false || selected.capabilities.canPlaceOrder !== true) return this.error.set('Choose a supported non-hosted payment method');
    this.busy.set(true); this.error.set(''); this.orderIntent ||= crypto.randomUUID();
    try {
      const response = await fetch(`${this.base()}/v1/headless/carts/current/checkout/order`, { method: 'POST', headers: { ...this.headers(), 'Idempotency-Key': this.orderIntent } });
      if (!response.ok) { const problem = await response.json().catch(() => null) as { detail?: string; title?: string } | null; throw new Error(problem?.detail ?? problem?.title ?? `Order placement failed (${response.status})`); }
      this.order.set((await response.json()).data); this.status.set('Pending order placed');
    } catch (error) { this.error.set((error as Error).message); } finally { this.busy.set(false); }
  }
  private async ensureCart() {
    if (this.token) return;
    const response = await fetch(`${this.base()}/v1/headless/carts`, {
      method: 'POST',
      headers: this.headers(),
    });
    if (!response.ok) throw new Error('Cart unavailable');
    this.token = (await response.json()).cartToken;
    sessionStorage.setItem('headless-cart-token', this.token);
  }
  private base() {
    return this.config.apiUrl.replace(/\/$/, '');
  }
  private headers(json = false): Record<string, string> {
    return {
      ...(this.config.publishableKey ? { 'x-publishable-key': this.config.publishableKey } : {}),
      ...(this.token ? { 'x-cart-token': this.token } : {}),
      ...(json ? { 'content-type': 'application/json' } : {}),
    };
  }
}
