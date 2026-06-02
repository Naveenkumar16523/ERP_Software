import React, { useState } from 'react';
import { Leaf, Plus, Zap, Droplets, Recycle } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';

export default function SustainabilityModule() {
  const { sustainabilityMetrics, sustainabilityOffsets, purchaseCarbonOffset, addToast } = useERPStore();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ project: '', credits: 0, cost: 0 });

  const handlePurchase = () => {
    if (!form.project || !form.credits) return addToast('Project and credits required', 'error');
    purchaseCarbonOffset({ ...form, credits: parseInt(form.credits), cost: parseFloat(form.cost) });
    addToast(`Carbon offset purchased: ${form.credits} credits`, 'success');
    setModal(false);
    setForm({ project: '', credits: 0, cost: 0 });
  };

  const metrics = sustainabilityMetrics || {};
  const totalOffsetCredits = sustainabilityOffsets.reduce((s, o) => s + (o.credits || 0), 0);

  const INDICATORS = [
    { label: 'Carbon Footprint', value: `${metrics.carbonFootprint || 0} tCO₂`, target: `Target: ${metrics.target?.carbonFootprint || 0} tCO₂`, color: 'text-rose-400', pct: metrics.target?.carbonFootprint ? Math.round(((metrics.target.carbonFootprint) / (metrics.carbonFootprint || 1)) * 100) : 80, barColor: 'bg-rose-500' },
    { label: 'Renewable Energy', value: `${metrics.renewableEnergy || 0}%`, target: `Target: ${metrics.target?.renewableEnergy || 0}%`, color: 'text-emerald-400', pct: metrics.target?.renewableEnergy ? Math.round((metrics.renewableEnergy / metrics.target.renewableEnergy) * 100) : 63, barColor: 'bg-emerald-500' },
    { label: 'Waste Recycled', value: `${metrics.wasteRecycled || 0}%`, target: `Target: ${metrics.target?.wasteRecycled || 0}%`, color: 'text-sky-400', pct: metrics.target?.wasteRecycled ? Math.round((metrics.wasteRecycled / metrics.target.wasteRecycled) * 100) : 85, barColor: 'bg-sky-500' },
    { label: 'Carbon Offsets', value: `${totalOffsetCredits} credits`, target: 'Total purchased', color: 'text-violet-400', pct: 100, barColor: 'bg-violet-500' }
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {INDICATORS.map(ind => (
          <div key={ind.label} className="theme-card p-4">
            <p className="text-xs text-dimmed">{ind.label}</p>
            <p className={`text-xl font-bold mt-1 font-data ${ind.color}`}>{ind.value}</p>
            <p className="text-[10px] text-dimmed mt-0.5">{ind.target}</p>
            <div className="h-1.5 bg-surface rounded-full mt-2 border border-main/20">
              <div className={`h-full ${ind.barColor} rounded-full transition-all`} style={{ width: `${Math.min(ind.pct, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="theme-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-main bg-surface/30">
          <h3 className="text-sm font-semibold text-main">Carbon Offset Projects</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="text-left text-xs text-dimmed border-b border-main bg-surface/10">
              <th className="px-4 py-2.5 font-semibold">Project</th><th className="px-4 py-2.5 text-right font-semibold">Credits</th>
              <th className="px-4 py-2.5 text-right font-semibold">Cost</th><th className="px-4 py-2.5 font-semibold">Date</th><th className="px-4 py-2.5 font-semibold">Status</th>
            </tr></thead>
            <tbody>
              {sustainabilityOffsets.map(o => (
                <tr key={o.id} className="border-b border-main hover:bg-surface/40 transition-colors">
                  <td className="px-4 py-2.5 text-sm text-main">{o.project}</td>
                  <td className="px-4 py-2.5 text-right text-sm font-data text-emerald-400">{o.credits} tCO₂</td>
                  <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{(o.cost || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-2.5 text-xs text-muted">{o.date}</td>
                  <td className="px-4 py-2.5"><span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-medium">{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Purchase Carbon Offset">
        <div className="space-y-4">
          <div><label className="form-label">Project Name</label><input className="form-input w-full" value={form.project} onChange={e => setForm({...form, project: e.target.value})} placeholder="e.g. Solar Farm Initiative" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Credits (tCO₂)</label><input type="number" className="form-input w-full" value={form.credits} onChange={e => setForm({...form, credits: e.target.value})} /></div>
            <div><label className="form-label">Cost (₹)</label><input type="number" className="form-input w-full" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} /></div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handlePurchase} className="btn-primary text-sm">Purchase</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}