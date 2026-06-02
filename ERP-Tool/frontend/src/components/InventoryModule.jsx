import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';

export default function InventoryModule() {
  const { products, addToast } = useERPStore();
  const [search, setSearch] = useState('');
  const filtered = products.filter(
    p =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
  );
  const lowStock = products.filter(p => p.currentStock <= p.reorderLevel);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Inventory Management</h1>
          <p className="text-sm text-muted mt-1">Real-time stock tracking and reorder management</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total SKUs', value: products.length, color: 'text-indigo-400' },
          { label: 'Low Stock Alerts', value: lowStock.length, color: 'text-amber-400' },
          {
            label: 'Total Stock Units',
            value: products.reduce((s, p) => s + (p.currentStock || 0), 0).toLocaleString(),
            color: 'text-emerald-400',
          },
          {
            label: 'Inventory Value',
            value: `₹${products
              .reduce((s, p) => s + (p.currentStock || 0) * (p.costPrice || 0), 0)
              .toLocaleString('en-IN')}`,
            color: 'text-sky-400',
          },
        ].map(s => (
          <div key={s.label} className="theme-card p-4">
            <p className="text-xs text-dimmed">{s.label}</p>
            <p className={`text-xl font-bold mt-1 font-data ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="theme-card p-4" style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-400">Low Stock Alerts</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(p => (
              <span
                key={p.id}
                className="text-xs bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full border border-amber-500/20"
              >
                {p.name} — {p.currentStock} {p.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="theme-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-main">
          <h3 className="text-sm font-semibold text-main">Product Catalogue ({products.length})</h3>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input text-xs w-48 py-1.5"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">SKU</th>
                <th className="px-4 py-2.5">Product Name</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5 text-right">Stock</th>
                <th className="px-4 py-2.5 text-right">Cost Price</th>
                <th className="px-4 py-2.5 text-right">Selling Price</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const isLow = p.currentStock <= p.reorderLevel;
                return (
                  <tr key={p.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-dimmed">{p.sku}</td>
                    <td className="px-4 py-2.5 text-sm text-main">{p.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{p.category}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data font-semibold text-main">
                      {p.currentStock} <span className="text-dimmed font-normal">{p.unit}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-muted">
                      ₹{p.costPrice?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-emerald-400">
                      ₹{p.sellingPrice?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isLow
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        {isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
