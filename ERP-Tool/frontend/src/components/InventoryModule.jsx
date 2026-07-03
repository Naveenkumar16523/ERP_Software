import React, { useState, useMemo, useCallback } from 'react';
import { AlertTriangle, Package, Warehouse, Scan, BarChart3, Layers, Plus } from 'lucide-react';
import { useProducts, useWarehouses, useInventoryBatches, useStockMovements, useCreateWarehouse, useCreateStockMovement, useCreateProduct } from '../hooks/useInventory';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';

const Barcode = ({ value }) => {
  if (!value) return null;
  // Simple deterministic hash to binary for visual barcode simulation
  const bits = Array.from(value).map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join('').split('');
  return (
    <svg height="24" width="80" xmlns="http://www.w3.org/2000/svg" className="inline-block opacity-80" viewBox="0 0 80 24" preserveAspectRatio="none">
      {bits.map((bit, i) => (
        bit === '1' && <rect key={i} x={i} y="0" width="1.2" height="24" fill="currentColor" />
      ))}
    </svg>
  );
};

const InventoryModule = React.memo(function InventoryModule() {
  const { addToast } = useERPStore();

  const { data: products = [] } = useProducts();
  const { data: warehouses = [] } = useWarehouses();
  const { data: inventoryBatches = [] } = useInventoryBatches();
  const { data: stockMovements = [] } = useStockMovements();

  const createWarehouse = useCreateWarehouse();
  const createStockMovement = useCreateStockMovement();
  const createProduct = useCreateProduct();

  const [activeTab, setActiveTab] = useState('products');
  const [search, setSearch] = useState('');
  const [barcodeScan, setBarcodeScan] = useState('');

  const [warehouseModal, setWarehouseModal] = useState(false);
  const [txModal, setTxModal] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({ name: '', location: '' });
  const [newTx, setNewTx] = useState({ inventoryId: '', type: 'IN', quantity: 1, notes: '' });
  const filtered = useMemo(() => products.filter(
    p =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.includes(search.toLowerCase())
  ), [products, search]);
  
  const lowStock = useMemo(() => products.filter(p => p.currentStock <= p.reorderLevel), [products]);
  const expiringBatches = useMemo(() => inventoryBatches.filter(b => b.expiryDate && new Date(b.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)), [inventoryBatches]);

  const handleBarcodeScan = useCallback(() => {
    const product = products.find(p => p.barcode === barcodeScan);
    if (product) {
      addToast(`Found: ${product.name} - Stock: ${product.currentStock}`, 'success');
    } else {
      addToast('Product not found with this barcode', 'error');
    }
    setBarcodeScan('');
  }, [products, barcodeScan, addToast]);

  const TABS = [
    { id: 'products', label: 'Products', icon: Package },
    { id: 'batches', label: 'Batch Tracking', icon: Layers },
    { id: 'warehouses', label: 'Warehouses', icon: Warehouse },
    { id: 'movements', label: 'Stock Movements', icon: BarChart3 },
    { id: 'scanner', label: 'Barcode Scanner', icon: Scan }
  ];

  const handleCreateWarehouse = async () => {
    try {
      await createWarehouse.mutateAsync(newWarehouse);
      addToast('Warehouse created', 'success');
      setWarehouseModal(false);
      setNewWarehouse({ name: '', location: '' });
    } catch (err) {
      addToast(err.message || 'Failed to create warehouse', 'error');
    }
  };

  const handleCreateTx = async () => {
    try {
      await createStockMovement.mutateAsync(newTx);
      addToast('Transaction recorded', 'success');
      setTxModal(false);
      setNewTx({ inventoryId: '', type: 'IN', quantity: 1, notes: '' });
    } catch (err) {
      addToast(err.message || 'Failed to record transaction', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Inventory Management</h1>
          <p className="text-sm text-muted mt-1">Real-time stock tracking and reorder management</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'warehouses' && (
            <button onClick={() => setWarehouseModal(true)} className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary-hover border-primary/20 transition-all">
              <Plus className="w-4 h-4" /> New Warehouse
            </button>
          )}
          {activeTab === 'movements' && (
            <button onClick={() => setTxModal(true)} className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary-hover border-primary/20 transition-all">
              <Plus className="w-4 h-4" /> Log Transaction
            </button>
          )}
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

      {/* Tabs */}
      <div className="flex gap-1 bg-surface p-1 rounded-xl w-fit border border-main">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-primary text-white' : 'text-muted hover:text-main'}`}>
              <Icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'products' && (
        <>
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
                    <th className="px-4 py-2.5">Barcode</th>
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
                        <td className="px-4 py-2.5 text-main">
                          <Barcode value={p.barcode || p.sku} />
                          <p className="text-[9px] font-mono mt-0.5 opacity-50">{p.barcode || p.sku}</p>
                        </td>
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
        </>
      )}

      {activeTab === 'batches' && (
        <div className="theme-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Batch Tracking ({inventoryBatches.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Batch Number</th>
                <th className="px-4 py-2.5">Product</th>
                <th className="px-4 py-2.5">Quantity</th>
                <th className="px-4 py-2.5">Manufacture Date</th>
                <th className="px-4 py-2.5">Expiry Date</th>
                <th className="px-4 py-2.5">Warehouse</th>
                <th className="px-4 py-2.5">Status</th>
              </tr></thead>
              <tbody>
                {inventoryBatches.map(batch => {
                  const product = products.find(p => p.id === batch.productId);
                  const isExpiring = batch.expiryDate && new Date(batch.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                  return (
                    <tr key={batch.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                      <td className="px-4 py-2.5 text-xs font-mono text-primary">{batch.batchNumber}</td>
                      <td className="px-4 py-2.5 text-sm text-main">{product?.name || 'Unknown'}</td>
                      <td className="px-4 py-2.5 text-sm font-data text-main">{batch.quantity}</td>
                      <td className="px-4 py-2.5 text-xs text-muted">{batch.manufactureDate}</td>
                      <td className="px-4 py-2.5 text-xs text-muted">{batch.expiryDate || '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-muted">{batch.warehouse}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isExpiring ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {isExpiring ? 'Expiring Soon' : batch.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'warehouses' && (
        <div className="theme-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Warehouses ({warehouses.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Warehouse ID</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Location</th>
                <th className="px-4 py-2.5 text-right">Capacity</th>
                <th className="px-4 py-2.5 text-right">Current Stock</th>
                <th className="px-4 py-2.5">Manager</th>
              </tr></thead>
              <tbody>
                {warehouses.map(wh => (
                  <tr key={wh.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-primary">{wh.id}</td>
                    <td className="px-4 py-2.5 text-sm text-main">{wh.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{wh.location}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{wh.capacity.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{wh.currentStock.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{wh.manager}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'movements' && (
        <div className="theme-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Stock Movements ({stockMovements.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Product</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5 text-right">Quantity</th>
                <th className="px-4 py-2.5">From</th>
                <th className="px-4 py-2.5">To</th>
                <th className="px-4 py-2.5">Reason</th>
              </tr></thead>
              <tbody>
                {stockMovements.map(movement => {
                  const product = products.find(p => p.id === movement.productId);
                  return (
                    <tr key={movement.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-muted">{new Date(movement.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-sm text-main">{movement.productName || 'Unknown'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${movement.type === 'IN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {movement.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm font-data text-main">{movement.quantity}</td>
                      <td className="px-4 py-2.5 text-xs text-muted">{movement.referenceId || '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-muted">—</td>
                      <td className="px-4 py-2.5 text-xs text-muted max-w-xs truncate">{movement.notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'scanner' && (
        <div className="theme-card p-6">
          <h3 className="text-sm font-semibold text-main mb-4">Barcode/QR Scanner</h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Scan or enter barcode..."
              value={barcodeScan}
              onChange={e => setBarcodeScan(e.target.value)}
              className="form-input flex-1"
            />
            <button onClick={handleBarcodeScan} className="btn-primary">Scan</button>
          </div>
          <p className="text-xs text-muted">Scan product barcodes to quickly check stock levels and product details.</p>
        </div>
      )}

      <Modal isOpen={warehouseModal} onClose={() => setWarehouseModal(false)} title="New Warehouse">
        <div className="space-y-4">
          <div><label className="form-label">Name</label>
            <input className="form-input" value={newWarehouse.name} onChange={e => setNewWarehouse({...newWarehouse, name: e.target.value})} />
          </div>
          <div><label className="form-label">Location</label>
            <input className="form-input" value={newWarehouse.location} onChange={e => setNewWarehouse({...newWarehouse, location: e.target.value})} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setWarehouseModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all">Cancel</button>
            <button onClick={handleCreateWarehouse} className="btn-primary text-sm">Create</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={txModal} onClose={() => setTxModal(false)} title="Log Stock Transaction">
        <div className="space-y-4">
          <div><label className="form-label">Product</label>
            <select className="form-input" value={newTx.inventoryId} onChange={e => setNewTx({...newTx, inventoryId: e.target.value})}>
              <option value="">Select Product...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Type</label>
              <select className="form-input" value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value})}>
                <option value="IN">IN (Receive)</option>
                <option value="OUT">OUT (Deduct)</option>
              </select>
            </div>
            <div><label className="form-label">Quantity</label>
              <input type="number" min="1" className="form-input" value={newTx.quantity} onChange={e => setNewTx({...newTx, quantity: parseInt(e.target.value)})} />
            </div>
          </div>
          <div><label className="form-label">Notes</label>
            <input className="form-input" value={newTx.notes} onChange={e => setNewTx({...newTx, notes: e.target.value})} placeholder="Reason for transaction" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setTxModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all">Cancel</button>
            <button onClick={handleCreateTx} className="btn-primary text-sm">Log Transaction</button>
          </div>
        </div>
      </Modal>
    </div>
  );
});

export default InventoryModule;
