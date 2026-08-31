import { Component, OnInit, signal } from '@angular/core';
type Product={id:string;name:string;description:string;price:{amount:string;currency:string};available:boolean};

@Component({
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit {
  readonly products=signal<Product[]>([]);readonly cart=signal(0);readonly error=signal('');
  ngOnInit(){fetch('/products.json').then(r=>{if(!r.ok)throw new Error('Catalog unavailable');return r.json()}).then(v=>this.products.set(v.data)).catch(e=>this.error.set(e.message))}
  add(){this.cart.update(value=>value+1)}
}
