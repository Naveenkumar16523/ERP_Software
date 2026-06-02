import React, { useState } from 'react';
import { Plus, Factory } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';

export default function ManufacturingModule() {
  const { productionBatches, addProductionBatch, updateBatchProgress, qaInspections, products, addToast } = useERPStore();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ productId: '', quantity: 0, startDate: '', targetDate: '' });

  const handleAdd = () => {
    if (!form.productId || !form.quantity) return addToast('Product and quantity required', 'error');
    const prod = products.find(p => p.id === form.productId);
    addProductionBatch({
      ...form,
      quantity: parseInt(form.quantity),
      productName: prod?.name || 'Unknown',
      batchNo: `BATCH-${Date.now().toString().slice(-6)}`,
    });
    addToast('Production batch created', 'success');
    setModal(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Manufacturing</h1>
          <p className="text-sm text-muted mt-1">Production planning, batch tracking & quality assurance</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Batch
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Batches', value: productionBatches.length, color: 'text-indigo-400' },
          { label: 'In Progress', value: productionBatches.filter(b => b.status === 'IN_PROGRESS').length, color: 'text-amber-400' },
          { label: 'QA Inspections', value: qaInspections.length, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="theme-card p-4">
            <p className="text-xs text-dimmed">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="theme-card overflow-hidden">
        <div className="px-4 py-3 border-b border-main">
          <h3 className="text-sm font-semibold text-main">Production Batches</h3>
        </div>
        <div className="divide-y divide-main">
          {productionBatches.map(b => (
            <div key={b.id} className="px-4 py-3 hover:bg-surface/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-medium text-main">{b.productName}</span>
                  <span className="text-xs text-dimmed ml-2">#{b.batchNo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    b.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                    b.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-surface text-dimmed'
                  }`}>{b.status}</span>
                  <span className="text-xs text-muted">Qty: {b.quantity}</span>
                </div>
              </div>
              {b.status !== 'COMPLETED' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-dimmed">
                    <span>Progress</span><span>{b.progress || 0}%</span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden border border-main">
                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${b.progress || 0}%` }} />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[25, 50, 75, 100].map(pct => (
                      <button
                        key={pct}
                        onClick={() => { updateBatchProgress(b.id, pct, pct === 100 ? 'COMPLETED' : 'IN_PROGRESS'); addToast(`Batch progress updated to ${pct}%`, 'info'); }}
                        className="text-xs bg-surface border border-main hover:bg-surface/80 text-muted hover:text-main px-2 py-0.5 rounded transition-colors"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {productionBatches.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-dimmed">No production batches yet</div>
          )}
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="New Production Batch">
        <div className="space-y-4">
          <div><label className="form-label">Product</label>
            <select className="form-input" value={form.productId} onChange={e => setForm({...form, productId: e.target.value})}>
              <option value="">Select product...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          <div><label className="form-label">Quantity</label>
            <input type="number" className="form-input" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Start Date</label><input type="date" className="form-input" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} /></div>
            <div><label className="form-label">Target Date</label><input type="date" className="form-input" value={form.targetDate} onChange={e => setForm({...form, targetDate: e.target.value})} /></div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAdd} className="btn-primary text-sm">Create Batch</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}