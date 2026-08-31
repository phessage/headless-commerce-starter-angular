import { Component, OnInit, signal } from '@angular/core';
type Product = {
  id: string;
  name: string;
  description: string;
  price: { amount: string; currency: string };
  available: boolean;
};
type Cart = { items: Array<{ id: string; quantity: number }> };
type Option = { id: string; name: string };
type Checkout = {
  shippingOptions: Option[];
  paymentMethods: Option[];
  selectedShippingMethodId: string | null;
  selectedPaymentMethodId: string | null;
  ready: boolean;
  missing: string[];
};
type RuntimeConfig = { apiUrl: string; publishableKey: string };
@Component({
  selector: 'app-root',
  styleUrls: ['./app.css', './checkout.css'],
  templateUrl: './app.html',
})
export class App implements OnInit {
  readonly products = signal<Product[]>([]);
  readonly cart = signal<Cart>({ items: [] });
  readonly checkout = signal<Checkout | null>(null);
  readonly error = signal('');
  readonly status = signal('');
  readonly busy = signal(false);
  private config: RuntimeConfig = { apiUrl: '', publishableKey: '' };
  private token = '';
  async ngOnInit() {
    try {
      this.config = await fetch('/headless-config.json').then((r) =>
        r.ok ? r.json() : this.config,
      );
      const response = await fetch(
        this.config.apiUrl ? `${this.base()}/v1/headless/products` : '/products.json',
        { headers: this.headers() },
      );
      if (!response.ok) throw new Error('Catalog unavailable');
      this.products.set((await response.json()).data);
    } catch (error) {
      this.error.set((error as Error).message);
    }
  }
  async add(product: Product) {
    if (!this.config.apiUrl) {
      this.cart.update((cart) => ({ items: [...cart.items, { id: product.id, quantity: 1 }] }));
      this.status.set('Synthetic demo only; configure a live sandbox for checkout');
      return;
    }
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
