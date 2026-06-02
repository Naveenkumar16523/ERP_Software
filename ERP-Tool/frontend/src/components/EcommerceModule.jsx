import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Package } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';

export default function EcommerceModule() {
  const { products, cart, addToCart, updateCartQty, removeFromCart, placeOrder, orders, addToast } = useERPStore();
  const [activeTab, setActiveTab] = useState('shop');

  const cartTotal = cart.reduce((s, c) => s + c.qty * (c.product?.sellingPrice || 0), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return addToast('Cart is empty', 'error');
    placeOrder({ items: cart, totalAmount: cartTotal, customerName: 'Online Customer', orderNo: `ORD-${Date.now()}` });
    addToast('Order placed successfully!', 'success');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">E-Commerce</h1>
          <p className="text-sm text-muted mt-1">Online storefront and order management</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Cart: {cart.length} items</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Products Listed', value: products.length, color: 'text-indigo-400' },
          { label: 'Cart Items', value: cart.reduce((s, c) => s + c.qty, 0), color: 'text-amber-400' },
          { label: 'Total Orders', value: orders.length, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="theme-card p-4">
            <p className="text-xs text-dimmed">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-surface p-1 rounded-xl w-fit border border-main">
        {['shop', 'cart', 'orders'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              activeTab === tab ? 'bg-indigo-600 text-white' : 'text-muted hover:text-main'
            }`}
          >
            {tab} {tab === 'cart' && cart.length > 0 && `(${cart.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'shop' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(p => (
            <div key={p.id} className="theme-card p-4 hover:border-indigo-500/30 transition-all group">
              <div className="w-full h-32 rounded-lg bg-surface flex items-center justify-center mb-3 border border-main/20">
                <Package className="w-10 h-10 text-dimmed" />
              </div>
              <h4 className="text-sm font-medium text-main truncate">{p.name}</h4>
              <p className="text-xs text-dimmed mt-0.5">{p.category} · {p.currentStock} in stock</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-lg font-bold text-emerald-400 font-data">₹{p.sellingPrice?.toLocaleString('en-IN')}</span>
                <button
                  onClick={() => { addToCart(p); addToast(`${p.name} added to cart`, 'success'); }}
                  disabled={p.currentStock === 0}
                  className="btn-primary text-xs px-2 py-1 flex items-center gap-1 disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'cart' && (
        <div className="space-y-3">
          {cart.length === 0 ? (
            <div className="theme-card p-12 text-center">
              <ShoppingCart className="w-8 h-8 text-dimmed mx-auto mb-2" />
              <p className="text-dimmed text-sm">Your cart is empty</p>
            </div>
          ) : (
            <>
              {cart.map(c => (
                <div key={c.productId} className="theme-card p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 border border-main/20">
                    <Package className="w-5 h-5 text-dimmed" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-main">{c.product?.name}</p>
                    <p className="text-xs text-dimmed">₹{c.product?.sellingPrice?.toLocaleString('en-IN')} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateCartQty(c.productId, c.qty - 1)} className="w-6 h-6 rounded bg-surface border border-main flex items-center justify-center text-main hover:bg-surface/80">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-data text-main w-6 text-center">{c.qty}</span>
                    <button onClick={() => updateCartQty(c.productId, c.qty + 1)} className="w-6 h-6 rounded bg-surface border border-main flex items-center justify-center text-main hover:bg-surface/80">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-sm font-bold font-data text-main w-24 text-right">
                    ₹{(c.qty * (c.product?.sellingPrice || 0)).toLocaleString('en-IN')}
                  </span>
                  <button onClick={() => removeFromCart(c.productId)} className="text-rose-400 hover:text-rose-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="theme-card p-4 border-emerald-500/30 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">Total</p>
                  <p className="text-2xl font-bold text-emerald-400 font-data">₹{cartTotal.toLocaleString('en-IN')}</p>
                </div>
                <button onClick={handleCheckout} className="btn-primary">Place Order</button>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Orders ({orders.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-dimmed border-b border-main">
                  <th className="px-4 py-2.5">Order No</th>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-indigo-400">{o.orderNo}</td>
                    <td className="px-4 py-2.5 text-sm text-main">{o.customerName}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{(o.totalAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        o.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400' :
                        o.status === 'FULFILLED' ? 'bg-sky-500/10 text-sky-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}