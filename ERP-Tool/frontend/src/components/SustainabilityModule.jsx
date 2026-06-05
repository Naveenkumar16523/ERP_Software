import React, { useState } from 'react';
import { Leaf, Plus, Zap, Droplets, Recycle, FileText, BarChart3 } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';

export default function SustainabilityModule() {
  const {
    carbonFootprints, addCarbonFootprint,
    esgReports, addESGReport,
    energyConsumption, addEnergyConsumption,
    wasteManagement, addWasteManagement,
    addToast
  } = useERPStore();
  const [activeTab, setActiveTab] = useState('carbon');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ category: '', scope: '', value: 0, unit: '', period: '', target: 0 });

  const handleAdd = () => {
    if (!form.category || !form.value) return addToast('Category and value required', 'error');
    if (activeTab === 'carbon') addCarbonFootprint({ ...form, value: parseFloat(form.value), target: parseFloat(form.target) });
    else if (activeTab === 'energy') addEnergyConsumption({ ...form, consumption: parseFloat(form.value), cost: parseFloat(form.target) });
    else if (activeTab === 'waste') addWasteManagement({ ...form, amount: parseFloat(form.value), recycled: parseFloat(form.target) });
    addToast('Record added successfully', 'success');
    setModal(false);
    setForm({ category: '', scope: '', value: 0, unit: '', period: '', target: 0 });
  };

  const TABS = [
    { id: 'carbon', label: 'Carbon Footprint', icon: Leaf },
    { id: 'esg', label: 'ESG Reports', icon: FileText },
    { id: 'energy', label: 'Energy', icon: Zap },
    { id: 'waste', label: 'Waste', icon: Recycle }
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Sustainability</h1>
          <p className="text-sm text-muted mt-1">ESG metrics, carbon tracking, and sustainability initiatives</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Purchase Offset</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Carbon Records', value: carbonFootprints.length, color: 'text-rose-400' },
          { label: 'ESG Reports', value: esgReports.length, color: 'text-emerald-400' },
          { label: 'Energy Records', value: energyConsumption.length, color: 'text-sky-400' },
          { label: 'Waste Records', value: wasteManagement.length, color: 'text-amber-400' },
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

      {activeTab === 'carbon' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Carbon Footprint ({carbonFootprints.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Scope</th>
                <th className="px-4 py-2.5 text-right">Value</th>
                <th className="px-4 py-2.5">Unit</th>
                <th className="px-4 py-2.5">Period</th>
                <th className="px-4 py-2.5 text-right">Target</th>
              </tr></thead>
              <tbody>
                {carbonFootprints.map(cf => (
                  <tr key={cf.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{cf.category}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{cf.scope}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{cf.value}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{cf.unit}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{cf.period}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-muted">{cf.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'esg' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">ESG Reports ({esgReports.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Report Type</th>
                <th className="px-4 py-2.5">Period</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Published Date</th>
                <th className="px-4 py-2.5 text-right">Score</th>
              </tr></thead>
              <tbody>
                {esgReports.map(report => (
                  <tr key={report.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{report.reportType}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{report.period}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${report.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{report.publishedDate || '—'}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{report.score || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'energy' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Energy Consumption ({energyConsumption.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Facility</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5 text-right">Consumption</th>
                <th className="px-4 py-2.5">Unit</th>
                <th className="px-4 py-2.5 text-right">Cost</th>
                <th className="px-4 py-2.5 text-right">Efficiency</th>
              </tr></thead>
              <tbody>
                {energyConsumption.map(energy => (
                  <tr key={energy.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{energy.facility}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{energy.type}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{energy.consumption}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{energy.unit}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{energy.cost.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{energy.efficiency}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'waste' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Waste Management ({wasteManagement.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="px-4 py-2.5">Unit</th>
                <th className="px-4 py-2.5 text-right">Recycled</th>
                <th className="px-4 py-2.5">Disposal Method</th>
              </tr></thead>
              <tbody>
                {wasteManagement.map(waste => (
                  <tr key={waste.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{waste.type}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{waste.amount}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{waste.unit}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-emerald-400">{waste.recycled}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{waste.disposalMethod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Sustainability Record">
        <div className="space-y-4">
          <div><label className="form-label">Category / Facility / Type</label><input className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Scope / Period</label><input className="form-input" value={form.scope || form.period} onChange={e => setForm({...form, scope: e.target.value, period: e.target.value})} /></div>
            <div><label className="form-label">Value / Consumption / Amount</label><input type="number" className="form-input" value={form.value} onChange={e => setForm({...form, value: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Unit</label><input className="form-input" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} /></div>
            <div><label className="form-label">Target / Cost / Recycled</label><input type="number" className="form-input" value={form.target} onChange={e => setForm({...form, target: e.target.value})} /></div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAdd} className="btn-primary text-sm">Add Record</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}