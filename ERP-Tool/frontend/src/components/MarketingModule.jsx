import React, { useState, useEffect } from 'react';
import { Plus, Megaphone, Users, BarChart3, Mail, Handshake, Target, ShieldCheck } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import { api } from '../utils/api';
import Modal from './ui/Modal';

export default function MarketingModule() {
  const {
    marketingCampaigns, setMarketingCampaigns, addMarketingCampaign,
    marketingLeads, setMarketingLeads, addMarketingLead,
    marketingAnalytics,
    addToast
  } = useERPStore();
  
  const [activeTab, setActiveTab] = useState('campaigns');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'EMAIL', budget: 0, startDate: '', endDate: '', email: '', source: '', companySize: '10-50', estimatedValue: 0 });

  // Fetch marketing data from DB on mount
  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const camps = await api.marketing.getCampaigns();
        const leads = await api.marketing.getLeads();
        if (active) {
          if (Array.isArray(camps)) setMarketingCampaigns(camps);
          if (Array.isArray(leads)) setMarketingLeads(leads);
        }
      } catch (err) {
        console.error('Error fetching B2B marketing data:', err);
      }
    };
    fetchData();
    return () => { active = false; };
  }, [setMarketingCampaigns, setMarketingLeads]);

  const handleAdd = async () => {
    if (!form.name) return addToast('Name / Account Name required', 'error');
    try {
      if (activeTab === 'campaigns') {
        const payload = { ...form, budget: parseFloat(form.budget), spent: 0, leads: 0, conversions: 0 };
        const saved = await api.marketing.createCampaign(payload);
        addMarketingCampaign(saved || payload);
      } else if (activeTab === 'leads') {
        const payload = { ...form, score: 80, status: 'NEW' };
        const saved = await api.marketing.createLead(payload);
        addMarketingLead(saved || payload);
      }
      addToast('Record added successfully', 'success');
    } catch {
      if (activeTab === 'campaigns') {
        addMarketingCampaign({ ...form, budget: parseFloat(form.budget), spent: 0, leads: 0, conversions: 0 });
      } else if (activeTab === 'leads') {
        addMarketingLead({ ...form, score: 80, status: 'NEW' });
      }
      addToast('Record saved locally', 'info');
    }
    setModal(false);
    setForm({ name: '', type: 'EMAIL', budget: 0, startDate: '', endDate: '', email: '', source: '', companySize: '10-50', estimatedValue: 0 });
  };

  const TABS = [
    { id: 'campaigns', label: 'B2B Campaigns', icon: Megaphone },
    { id: 'leads', label: 'Acquisition Leads', icon: Users },
    { id: 'analytics', label: 'ROI Analytics', icon: BarChart3 }
  ];

  const totalLeads = marketingLeads.length;
  const totalConversions = marketingCampaigns.reduce((s, c) => s + (c.conversions || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Marketing & B2B Acquisition</h1>
          <p className="text-sm text-muted mt-1">Acquiring corporate logistics accounts, managing targeted B2B campaigns, and ROI analysis</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> {activeTab === 'campaigns' ? 'Launch Campaign' : 'Add Lead Account'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'B2B Campaigns Active', value: marketingCampaigns.length, color: 'text-indigo-400', icon: Megaphone },
          { label: 'Corporate Leads', value: totalLeads, color: 'text-sky-400', icon: Users },
          { label: 'Client Conversions', value: totalConversions, color: 'text-emerald-400', icon: Target },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="theme-card p-5 flex items-center justify-between hover:scale-[1.01] transition-all">
              <div>
                <p className="text-xs text-dimmed">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 font-data ${s.color}`}>{s.value}</p>
              </div>
              <div className="p-3 bg-surface rounded-xl border border-main/20">
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface p-1 rounded-xl w-fit border border-main">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-muted hover:text-main'}`}>
              <Icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          );
        })}
      </div>

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Targeted B2B Outreach Campaigns ({marketingCampaigns.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-dimmed border-b border-main bg-surface/50">
                  <th className="px-4 py-3">Campaign Name</th>
                  <th className="px-4 py-3">Outreach Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Active Period</th>
                  <th className="px-4 py-3 text-right">Budget</th>
                  <th className="px-4 py-3 text-right">Spent</th>
                  <th className="px-4 py-3 text-right">Accounts Engaged</th>
                  <th className="px-4 py-3 text-right">Conversions</th>
                </tr>
              </thead>
              <tbody>
                {marketingCampaigns.map(c => (
                  <tr key={c.id} className="border-b border-main hover:bg-surface/40 transition-colors">
                    <td className="px-4 py-3 text-sm text-main font-semibold">{c.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-surface border border-main text-muted font-medium">
                        {c.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-surface text-dimmed'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted font-mono">{c.startDate} → {c.endDate}</td>
                    <td className="px-4 py-3 text-right text-sm font-data text-main">₹{c.budget?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right text-sm font-data text-muted">₹{c.spent?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right text-sm font-data text-main font-bold">{c.leads}</td>
                    <td className="px-4 py-3 text-right text-sm font-data text-emerald-400 font-bold">{c.conversions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leads Tab */}
      {activeTab === 'leads' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Corporate Prospect & Acquisition Leads ({marketingLeads.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-dimmed border-b border-main bg-surface/50">
                  <th className="px-4 py-3">Prospect Account / Contact</th>
                  <th className="px-4 py-3">Corporate Email</th>
                  <th className="px-4 py-3">Lead Source</th>
                  <th className="px-4 py-3">Deal Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned Owner</th>
                </tr>
              </thead>
              <tbody>
                {marketingLeads.map(lead => (
                  <tr key={lead.id} className="border-b border-main hover:bg-surface/40 transition-colors">
                    <td className="px-4 py-3 text-sm text-main font-semibold">
                      <div>{lead.name}</div>
                      <div className="text-[10px] text-muted font-normal">Est. Contract Value: ₹{(lead.estimatedValue || lead.value || 0).toLocaleString('en-IN')}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{lead.email}</td>
                    <td className="px-4 py-3 text-xs text-muted">{lead.source}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-surface rounded-full overflow-hidden border border-main">
                          <div className={`h-full ${lead.score >= 80 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${lead.score}%` }} />
                        </div>
                        <span className="text-xs font-bold font-data text-main">{lead.score}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        lead.status === 'NEW' ? 'bg-emerald-500/10 text-emerald-400' :
                        lead.status === 'CONTACTED' ? 'bg-sky-500/10 text-sky-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>{lead.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{lead.assignedTo || 'Unassigned'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Campaign Lead Acquisition Metrics</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-dimmed border-b border-main bg-surface/50">
                  <th className="px-4 py-3">Outreach Campaign</th>
                  <th className="px-4 py-3">Target KPI Metric</th>
                  <th className="px-4 py-3 text-right">Performance Value</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Evaluation Date</th>
                </tr>
              </thead>
              <tbody>
                {marketingAnalytics.map(analytics => (
                  <tr key={analytics.id} className="border-b border-main hover:bg-surface/40 transition-colors">
                    <td className="px-4 py-3 text-sm text-main font-semibold">{analytics.campaignName}</td>
                    <td className="px-4 py-3 text-xs text-muted">{analytics.metric}</td>
                    <td className="px-4 py-3 text-right text-sm font-data text-main font-bold">{analytics.value}</td>
                    <td className="px-4 py-3 text-xs text-muted font-mono">{analytics.unit}</td>
                    <td className="px-4 py-3 text-xs text-muted">{analytics.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title={activeTab === 'campaigns' ? 'Create New Outreach Campaign' : 'Add Corporate Prospect Lead'}>
        {activeTab === 'campaigns' ? (
          <div className="space-y-4">
            <div><label className="form-label">Campaign Title</label>
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Q3 Manufacturing Logistics Pitch" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Channel Type</label>
                <select className="form-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="EMAIL">Email Cold Outreach</option>
                  <option value="CONFERENCE">Industry Conference / Trade Show</option>
                  <option value="REFERRAL">B2B Broker Referral</option>
                  <option value="SEO_SEM">SEO & Search Acquisition</option>
                </select>
              </div>
              <div><label className="form-label">Approved Budget (₹)</label>
                <input type="number" className="form-input" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Start Date</label><input type="date" className="form-input" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} /></div>
              <div><label className="form-label">End Date</label><input type="date" className="form-input" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} /></div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleAdd} className="btn-primary text-sm">Launch Campaign</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div><label className="form-label">Corporate Account / Prospect Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Nexus Retail Group" />
            </div>
            <div><label className="form-label">Contact Person Corporate Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="e.g., shipping@nexus.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Lead Source</label>
                <input className="form-input" value={form.source} onChange={e => setForm({...form, source: e.target.value})} placeholder="e.g., Industry Expo" />
              </div>
              <div><label className="form-label">Est. Monthly Contract Value (₹)</label>
                <input type="number" className="form-input" value={form.estimatedValue} onChange={e => setForm({...form, estimatedValue: parseFloat(e.target.value) || 0})} />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleAdd} className="btn-primary text-sm">Save Prospect Account</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}