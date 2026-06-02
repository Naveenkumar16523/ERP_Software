import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';

const CHANNELS = ['Email', 'Social', 'Display', 'Search', 'Affiliate', 'Content'];
const CHANNEL_COLORS = {
  Email: 'text-sky-400', Social: 'text-violet-400', Display: 'text-amber-400',
  Search: 'text-emerald-400', Affiliate: 'text-rose-400', Content: 'text-indigo-400',
};

export default function MarketingModule() {
  const { marketingCampaigns, launchCampaign, updateCampaignStatus, addToast } = useERPStore();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', channel: 'Email', budget: 0, startDate: '', endDate: '' });

  const handleLaunch = () => {
    if (!form.name || !form.budget) return addToast('Campaign name and budget required', 'error');
    launchCampaign({ ...form, budget: parseFloat(form.budget), spent: 0 });
    addToast(`Campaign "${form.name}" launched!`, 'success');
    setModal(false);
    setForm({ name: '', channel: 'Email', budget: 0, startDate: '', endDate: '' });
  };

  const totalBudget = marketingCampaigns.reduce((s, c) => s + (c.budget || 0), 0);
  const totalLeads = marketingCampaigns.reduce((s, c) => s + (c.leads || 0), 0);
  const totalConversions = marketingCampaigns.reduce((s, c) => s + (c.conversions || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Marketing Campaigns</h1>
          <p className="text-sm text-muted mt-1">Campaign management, lead generation, and ROI tracking</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Launch Campaign
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Campaigns', value: marketingCampaigns.filter(c => c.status === 'ACTIVE').length, color: 'text-emerald-400' },
          { label: 'Total Budget', value: `₹${totalBudget.toLocaleString('en-IN')}`, color: 'text-indigo-400' },
          { label: 'Leads Generated', value: totalLeads, color: 'text-sky-400' },
          { label: 'Conversions', value: totalConversions, color: 'text-violet-400' },
        ].map(s => (
          <div key={s.label} className="theme-card p-4">
            <p className="text-xs text-dimmed">{s.label}</p>
            <p className={`text-xl font-bold mt-1 font-data ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {marketingCampaigns.map(c => {
          const spentPct = c.budget > 0 ? Math.round((c.spent || 0) / c.budget * 100) : 0;
          const convRate = c.leads > 0 ? ((c.conversions / c.leads) * 100).toFixed(1) : 0;
          return (
            <div key={c.id} className="theme-card p-4 hover:border-indigo-500/30 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-main">{c.name}</h4>
                    <span className={`text-xs font-medium ${CHANNEL_COLORS[c.channel] || 'text-dimmed'}`}>{c.channel}</span>
                  </div>
                  <p className="text-xs text-dimmed mt-0.5">{c.startDate} → {c.endDate}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    c.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                    c.status === 'COMPLETED' ? 'bg-surface text-dimmed' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>{c.status}</span>
                  {c.status === 'ACTIVE' && (
                    <button
                      onClick={() => { updateCampaignStatus(c.id, 'PAUSED'); addToast('Campaign paused', 'info'); }}
                      className="text-xs text-dimmed hover:text-main transition-colors"
                    >
                      Pause
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 text-center text-xs">
                <div className="bg-surface rounded-lg p-2 border border-main/30">
                  <p className="text-main font-data font-bold">{c.leads}</p>
                  <p className="text-dimmed">Leads</p>
                </div>
                <div className="bg-surface rounded-lg p-2 border border-main/30">
                  <p className="text-main font-data font-bold">{c.conversions}</p>
                  <p className="text-dimmed">Converted</p>
                </div>
                <div className="bg-surface rounded-lg p-2 border border-main/30">
                  <p className="text-emerald-400 font-data font-bold">{convRate}%</p>
                  <p className="text-dimmed">Conv. Rate</p>
                </div>
                <div className="bg-surface rounded-lg p-2 border border-main/30">
                  <p className="text-amber-400 font-data font-bold">{spentPct}%</p>
                  <p className="text-dimmed">Budget Used</p>
                </div>
              </div>

              <div className="mt-3">
                <div className="h-1.5 bg-surface rounded-full border border-main/20">
                  <div
                    className={`h-full rounded-full ${spentPct > 90 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                    style={{ width: `${Math.min(spentPct, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-dimmed mt-1">
                  ₹{(c.spent || 0).toLocaleString()} spent of ₹{(c.budget || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Launch New Campaign">
        <div className="space-y-4">
          <div><label className="form-label">Campaign Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Channel</label>
              <select className="form-input" value={form.channel} onChange={e => setForm({...form, channel: e.target.value})}>
                {CHANNELS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="form-label">Budget (₹)</label>
              <input type="number" className="form-input" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Start Date</label>
              <input type="date" className="form-input" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
            </div>
            <div><label className="form-label">End Date</label>
              <input type="date" className="form-input" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleLaunch} className="btn-primary text-sm">Launch</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}