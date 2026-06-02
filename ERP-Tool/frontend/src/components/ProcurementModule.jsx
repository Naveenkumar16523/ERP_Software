import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';

export default function ProcurementModule() {
  const { suppliers, purchaseOrders, addPurchaseOrder, approvePurchaseOrder, addToast } = useERPStore();
  const [activeTab, setActiveTab] = useState('pos');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ supplierId: '', description: '', totalAmount: 0 });

  const handleAdd = () => {
    if (!form.supplierId || !form.totalAmount) return addToast('Supplier and amount required', 'error');
    const sup = suppliers.find(s => s.id === form.supplierId);
    addPurchaseOrder({
      ...form,
      supplierName: sup?.name || 'Unknown',
      totalAmount: parseFloat(form.totalAmount),
      items: [{ desc: form.description, qty: 1, price: parseFloat(form.totalAmount) }],
    });
    addToast('Purchase order created', 'success');
    setModal(false);
  };

  const pendingPos = purchaseOrders.filter(po => po.status === 'PENDING');
  const totalSpend = purchaseOrders.reduce((s, po) => s + (po.totalAmount || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Procurement</h1>
          <p className="text-sm text-muted mt-1">Purchase orders, supplier management & RFQ</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New PO
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Suppliers', value: suppliers.length, color: 'text-indigo-400' },
          { label: 'Total POs', value: purchaseOrders.length, color: 'text-violet-400' },
          { label: 'Pending Approval', value: pendingPos.length, color: 'text-amber-400' },
          { label: 'Total Spend', value: `₹${totalSpend.toLocaleString('en-IN')}`, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="theme-card p-4">
            <p className="text-xs text-dimmed">{s.label}</p>
            <p className={`text-xl font-bold mt-1 font-data ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-surface p-1 rounded-xl w-fit border border-main">
        {['pos', 'suppliers'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              activeTab === tab ? 'bg-indigo-600 text-white' : 'text-muted hover:text-main'
            }`}
          >
            {tab === 'pos' ? 'Purchase Orders' : 'Suppliers'}
          </button>
        ))}
      </div>

      {activeTab === 'pos' && (
        <div className="theme-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-dimmed border-b border-main">
                  <th className="px-4 py-2.5">PO Number</th>
                  <th className="px-4 py-2.5">Supplier</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map(po => (
                  <tr key={po.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-indigo-400">{po.poNo}</td>
                    <td className="px-4 py-2.5 text-sm text-main">{po.supplierName}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{(po.totalAmount||0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        po.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                        po.status === 'APPROVED' ? 'bg-sky-500/10 text-sky-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>{po.status}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      {po.status === 'PENDING' && (
                        <button
                          onClick={() => { approvePurchaseOrder(po.id); addToast('PO approved', 'success'); }}
                          className="text-xs text-emerald-400 hover:underline"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'suppliers' && (
        <div className="theme-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-dimmed border-b border-main">
                  <th className="px-4 py-2.5">Supplier</th>
                  <th className="px-4 py-2.5">Email</th>
                  <th className="px-4 py-2.5 text-right">Quality Score</th>
                  <th className="px-4 py-2.5 text-right">Overall</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{s.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{s.email}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-sky-400">{s.qualityScore}%</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data font-bold text-emerald-400">{s.overallScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="New Purchase Order">
        <div className="space-y-4">
          <div><label className="form-label">Supplier</label>
            <select className="form-input" value={form.supplierId} onChange={e => setForm({...form, supplierId: e.target.value})}>
              <option value="">Select supplier...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div><label className="form-label">Description</label>
            <input className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div><label className="form-label">Total Amount (₹)</label>
            <input type="number" className="form-input" value={form.totalAmount} onChange={e => setForm({...form, totalAmount: e.target.value})} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAdd} className="btn-primary text-sm">Create PO</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}