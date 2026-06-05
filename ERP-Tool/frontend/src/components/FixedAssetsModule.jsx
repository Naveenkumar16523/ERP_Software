import React, { useState } from 'react';
import { Plus, Package, TrendingDown, Wrench, Trash2 } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';

export default function FixedAssetsModule() {
  const {
    assets, addAsset, updateAssetStatus,
    depreciationRecords, addDepreciationRecord,
    maintenanceSchedules, addMaintenanceSchedule, updateMaintenanceStatus,
    addToast
  } = useERPStore();

  const [activeTab, setActiveTab] = useState('assets');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    name: '', category: 'IT Equipment', serialNumber: '', purchaseDate: '', purchasePrice: 0, depreciationRate: 10, location: ''
  });

  const handleAddAsset = () => {
    if (!form.name || !form.purchasePrice) return addToast('Name and purchase price required', 'error');
    addAsset({
      ...form,
      purchasePrice: parseFloat(form.purchasePrice),
      currentValue: parseFloat(form.purchasePrice),
      depreciationRate: parseFloat(form.depreciationRate)
    });
    addToast('Asset added successfully', 'success');
    setModal(false);
  };

  const TABS = [
    { id: 'assets', label: 'Asset Register', icon: Package },
    { id: 'depreciation', label: 'Depreciation', icon: TrendingDown },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench }
  ];

  const totalAssetValue = assets.reduce((s, a) => s + (a.currentValue || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Fixed Assets</h1>
          <p className="text-sm text-muted mt-1">Asset register, depreciation tracking & maintenance schedules</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Asset
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Assets', value: assets.length, color: 'text-indigo-400' },
          { label: 'Total Value', value: `₹${totalAssetValue.toLocaleString('en-IN')}`, color: 'text-emerald-400' },
          { label: 'Maintenance Due', value: maintenanceSchedules.filter(m => m.status === 'SCHEDULED').length, color: 'text-amber-400' },
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-muted hover:text-main'}`}>
              <Icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'assets' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Asset Register ({assets.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Asset Name</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Serial Number</th>
                <th className="px-4 py-2.5">Purchase Date</th>
                <th className="px-4 py-2.5 text-right">Purchase Price</th>
                <th className="px-4 py-2.5 text-right">Current Value</th>
                <th className="px-4 py-2.5">Location</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr></thead>
              <tbody>
                {assets.map(asset => (
                  <tr key={asset.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{asset.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{asset.category}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-indigo-400">{asset.serialNumber}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{asset.purchaseDate}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{asset.purchasePrice.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-emerald-400">₹{asset.currentValue.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{asset.location}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${asset.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {asset.status === 'ACTIVE' && (
                        <button
                          onClick={() => { updateAssetStatus(asset.id, 'DISPOSED'); addToast('Asset disposed', 'success'); }}
                          className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Dispose
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

      {activeTab === 'depreciation' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Depreciation Records ({depreciationRecords.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Asset</th>
                <th className="px-4 py-2.5">Period</th>
                <th className="px-4 py-2.5 text-right">Depreciation Amount</th>
                <th className="px-4 py-2.5 text-right">Accumulated</th>
                <th className="px-4 py-2.5 text-right">Book Value</th>
                <th className="px-4 py-2.5">Method</th>
              </tr></thead>
              <tbody>
                {depreciationRecords.map(record => (
                  <tr key={record.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{record.assetName}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{record.period}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-rose-400">-₹{record.depreciationAmount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{record.accumulatedDepreciation.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data font-bold text-emerald-400">₹{record.bookValue.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{record.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Maintenance Schedules ({maintenanceSchedules.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Asset</th>
                <th className="px-4 py-2.5">Scheduled Date</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Description</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr></thead>
              <tbody>
                {maintenanceSchedules.map(schedule => (
                  <tr key={schedule.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{schedule.assetName}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{schedule.scheduledDate}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{schedule.type}</td>
                    <td className="px-4 py-2.5 text-xs text-muted max-w-xs truncate">{schedule.description}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${schedule.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {schedule.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {schedule.status === 'SCHEDULED' && (
                        <button
                          onClick={() => { updateMaintenanceStatus(schedule.id, 'COMPLETED'); addToast('Maintenance completed', 'success'); }}
                          className="text-xs text-emerald-400 hover:underline"
                        >
                          Complete
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

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add New Asset">
        <div className="space-y-4">
          <div><label className="form-label">Asset Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Category</label>
              <select className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="IT Equipment">IT Equipment</option>
                <option value="Furniture">Furniture</option>
                <option value="Vehicles">Vehicles</option>
                <option value="Machinery">Machinery</option>
                <option value="Office Equipment">Office Equipment</option>
              </select>
            </div>
            <div><label className="form-label">Serial Number</label><input className="form-input" value={form.serialNumber} onChange={e => setForm({...form, serialNumber: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Purchase Date</label><input type="date" className="form-input" value={form.purchaseDate} onChange={e => setForm({...form, purchaseDate: e.target.value})} /></div>
            <div><label className="form-label">Purchase Price (₹)</label><input type="number" className="form-input" value={form.purchasePrice} onChange={e => setForm({...form, purchasePrice: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Depreciation Rate (%)</label><input type="number" className="form-input" value={form.depreciationRate} onChange={e => setForm({...form, depreciationRate: e.target.value})} /></div>
            <div><label className="form-label">Location</label><input className="form-input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAddAsset} className="btn-primary text-sm">Add Asset</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
