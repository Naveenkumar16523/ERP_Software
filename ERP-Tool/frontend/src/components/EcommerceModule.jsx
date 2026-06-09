import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Package, CreditCard, FileText } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import { api } from '../utils/api';

export default function EcommerceModule() {
  const {
    ecommerceProducts, setEcommerceProducts, cart, addToCart, updateCartQty, removeFromCart, clearCart,
    ecommerceOrders, setEcommerceOrders, addEcommerceOrder, updateEcommerceOrderStatus,
    payments, addPayment,
    addToast
  } = useERPStore();
  const [activeTab, setActiveTab] = useState('shop');

  // Fetch products and orders from DB on mount
  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const [prods, ords] = await Promise.all([
          api.ecommerce.getProducts(),
          api.ecommerce.getOrders()
        ]);
        if (active) {
          if (Array.isArray(prods)) setEcommerceProducts(prods);
          if (Array.isArray(ords)) setEcommerceOrders(ords);
        }
      } catch (err) {
        console.error('Error fetching e-commerce data:', err);
      }
    };
    fetchData();
    return () => { active = false; };
  }, [setEcommerceProducts, setEcommerceOrders]);

  const cartTotal = cart.reduce((s, c) => s + c.qty * (c.product?.price || 0), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return addToast('Cart is empty', 'error');
    const payload = {
      customerName: 'Online Customer',
      customerEmail: 'customer@example.com',
      shippingAddress: 'Default Address',
      items: cart.map(c => ({ productId: c.productId || c.id, quantity: c.qty || 1 }))
    };
    try {
      const saved = await api.ecommerce.checkout(payload);
      const orderData = {
        id: saved.id || `eorder-${Date.now()}`,
        orderNumber: saved.orderNo || `ECO-${Date.now()}`,
        customerName: saved.customerName || payload.customerName,
        customerEmail: saved.customerEmail || payload.customerEmail,
        items: cart.map(c => ({ productId: c.productId, qty: c.qty, price: c.product?.price })),
        total: saved.totalAmount || cartTotal,
        paymentMethod: 'CREDIT_CARD',
        status: saved.status || 'PLACED'
      };
      addEcommerceOrder(orderData);
      addToast('Order placed successfully!', 'success');
      // Refresh orders from DB
      const refreshed = await api.ecommerce.getOrders().catch(() => null);
      if (refreshed && Array.isArray(refreshed)) setEcommerceOrders(refreshed);
    } catch {
      const orderId = `eorder-${Date.now()}`;
      addEcommerceOrder({
        orderNumber: `ECO-${Date.now()}`,
        customerName: 'Online Customer',
        customerEmail: 'customer@example.com',
        items: cart.map(c => ({ productId: c.productId, qty: c.qty, price: c.product?.price })),
        total: cartTotal,
        paymentMethod: 'CREDIT_CARD'
      });
      addPayment({
        orderId,
        orderNumber: `ECO-${Date.now()}`,
        amount: cartTotal,
        method: 'CREDIT_CARD',
        transactionId: `TXN-${Date.now()}`
      });
      addToast('Order placed (offline mode)', 'info');
    }
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

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Products Listed', value: ecommerceProducts.length, color: 'text-indigo-400' },
          { label: 'Cart Items', value: cart.reduce((s, c) => s + c.qty, 0), color: 'text-amber-400' },
          { label: 'Total Orders', value: ecommerceOrders.length, color: 'text-emerald-400' },
          { label: 'Payments', value: payments.length, color: 'text-sky-400' },
        ].map(s => (
          <div key={s.label} className="theme-card p-4">
            <p className="text-xs text-dimmed">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface p-1 rounded-xl w-fit border border-main">
        {[
          { id: 'shop', label: 'Shop', icon: Package },
          { id: 'cart', label: 'Cart', icon: ShoppingCart },
          { id: 'orders', label: 'Orders', icon: FileText },
          { id: 'payments', label: 'Payments', icon: CreditCard }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-muted hover:text-main'}`}>
              <Icon className="w-3.5 h-3.5" />{tab.label} {tab.id === 'cart' && cart.length > 0 && `(${cart.length})`}
            </button>
          );
        })}
      </div>

      {activeTab === 'shop' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ecommerceProducts.map(p => (
            <div key={p.id} className="theme-card p-4 hover:border-indigo-500/30 transition-all group">
              <div className="w-full h-32 rounded-lg bg-surface flex items-center justify-center mb-3 border border-main/20">
                <Package className="w-10 h-10 text-dimmed" />
              </div>
              <h4 className="text-sm font-medium text-main truncate">{p.name}</h4>
              <p className="text-xs text-dimmed mt-0.5">{p.category} · {p.stock} in stock</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-lg font-bold text-emerald-400 font-data">₹{p.price?.toLocaleString('en-IN')}</span>
                <button
                  onClick={() => { addToCart(p); addToast(`${p.name} added to cart`, 'success'); }}
                  disabled={p.stock === 0}
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
                    <p className="text-xs text-dimmed">₹{c.product?.price?.toLocaleString('en-IN')} each</p>
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
                    ₹{(c.qty * (c.product?.price || 0)).toLocaleString('en-IN')}
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
            <h3 className="text-sm font-semibold text-main">Orders ({ecommerceOrders.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Order No</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5 text-right">Total</th>
                <th className="px-4 py-2.5">Payment</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr></thead>
              <tbody>
                {ecommerceOrders.map(o => (
                  <tr key={o.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-indigo-400">{o.orderNumber}</td>
                    <td className="px-4 py-2.5 text-sm text-main">{o.customerName}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{o.total.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{o.paymentMethod}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400' : o.status === 'SHIPPED' ? 'bg-sky-500/10 text-sky-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {o.status === 'PROCESSING' && (
                        <button onClick={async () => { 
                          try { await api.ecommerce.updateOrderStatus(o.id, 'SHIPPED'); } catch {}
                          updateEcommerceOrderStatus(o.id, 'SHIPPED'); addToast('Order shipped', 'success'); 
                        }} className="text-xs text-emerald-400 hover:underline">Ship</button>
                      )}
                      {o.status === 'SHIPPED' && (
                        <button onClick={async () => { 
                          try { await api.ecommerce.updateOrderStatus(o.id, 'DELIVERED'); } catch {}
                          updateEcommerceOrderStatus(o.id, 'DELIVERED'); addToast('Order delivered', 'success'); 
                        }} className="text-xs text-emerald-400 hover:underline">Deliver</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Payments ({payments.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Order No</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="px-4 py-2.5">Method</th>
                <th className="px-4 py-2.5">Transaction ID</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Processed At</th>
              </tr></thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-indigo-400">{payment.orderNumber}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{payment.amount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{payment.method}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-indigo-400">{payment.transactionId}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${payment.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{new Date(payment.processedAt).toLocaleString()}</td>
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