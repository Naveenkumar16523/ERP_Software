import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import { api } from '../utils/api';
import Modal from './ui/Modal';

const CATEGORIES = ['Machinery', 'IT Equipment', 'Vehicles', 'Buildings', 'Furniture', 'Other'];

export default function AssetModule() {
  const { assets, setAssets, addAsset, addToast } = useERPStore();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    name: '', category: '', purchaseCost: 0, depreciationRate: 10, location: '', assignedTo: ''
  });

  // Fetch assets from DB on mount
  useEffect(() => {
    let active = true;
    const fetchAssets = async () => {
      try {
        const data = await api.assets.getAssets();
        if (active && Array.isArray(data)) setAssets(data);
      } catch (err) {
        console.error('Error fetching assets:', err);
      }
    };
    fetchAssets();
    return () => { active = false; };
  }, [setAssets]);

  const totalValue = assets.reduce((s, a) => s + (a.currentValue || 0), 0);
  const totalCost = assets.reduce((s, a) => s + (a.purchaseCost || 0), 0);

  const handleAdd = async () => {
    if (!form.name || !form.category) return addToast('Name and category required', 'error');
    const payload = {
      ...form,
      purchaseCost: parseFloat(form.purchaseCost) || 0,
      currentValue: parseFloat(form.purchaseCost) || 0,
      depreciationRate: parseFloat(form.depreciationRate) || 10,
    };
    try {
      const saved = await api.assets.addAsset(payload);
      addAsset(saved || payload);
      addToast('Asset registered successfully', 'success');
    } catch {
      addAsset(payload);
      addToast('Asset saved locally', 'info');
    }
    setForm({ name: '', category: '', purchaseCost: 0, depreciationRate: 10, location: '', assignedTo: '' });
    setModal(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Fixed Assets</h1>
          <p className="text-sm text-muted mt-1">Asset registry with depreciation tracking</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Register Asset
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Assets', value: assets.length, color: 'text-indigo-400' },
          { label: 'Original Cost', value: `₹${totalCost.toLocaleString('en-IN')}`, color: 'text-amber-400' },
          { label: 'Current Book Value', value: `₹${totalValue.toLocaleString('en-IN')}`, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="theme-card p-4">
            <p className="text-xs text-dimmed">{s.label}</p>
            <p className={`text-xl font-bold mt-1 font-data ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="theme-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-main">
          <h3 className="text-sm font-semibold text-main">Asset Registry ({assets.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Asset Tag</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Location</th>
                <th className="px-4 py-2.5 text-right">Purchase Cost</th>
                <th className="px-4 py-2.5 text-right">Current Value</th>
                <th className="px-4 py-2.5 text-right">Depreciated</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(a => {
                const depr = ((a.purchaseCost - a.currentValue) / (a.purchaseCost || 1) * 100).toFixed(1);
                return (
                  <tr key={a.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-dimmed">{a.assetTag}</td>
                    <td className="px-4 py-2.5 text-sm text-main">{a.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{a.category}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{a.location}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{(a.purchaseCost||0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-emerald-400">₹{(a.currentValue||0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-right text-xs font-data text-rose-400">{depr}%</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        a.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-surface text-dimmed'
                      }`}>{a.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Register New Asset">
        <div className="space-y-4">
          <div><label className="form-label">Asset Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div><label className="form-label">Category</label>
            <select className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              <option value="">Select...</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Purchase Cost (₹)</label>
              <input type="number" className="form-input" value={form.purchaseCost} onChange={e => setForm({...form, purchaseCost: e.target.value})} />
            </div>
            <div><label className="form-label">Depreciation Rate (%/yr)</label>
              <input type="number" className="form-input" value={form.depreciationRate} onChange={e => setForm({...form, depreciationRate: e.target.value})} />
            </div>
          </div>
          <div><label className="form-label">Location</label>
            <input className="form-input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Cancel</button>
            <button onClick={handleAdd} className="btn-primary text-sm">Register</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}