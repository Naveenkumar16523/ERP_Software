import React, { useState } from 'react';
import { Plus, Megaphone, Users, BarChart3, Share2 } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';

export default function MarketingModule() {
  const {
    marketingCampaigns, addMarketingCampaign,
    marketingLeads, addMarketingLead,
    marketingAnalytics, addMarketingAnalytics,
    socialMediaPosts, addSocialMediaPost,
    addToast
  } = useERPStore();
  const [activeTab, setActiveTab] = useState('campaigns');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'EMAIL', budget: 0, startDate: '', endDate: '', email: '', source: '', platform: '', content: '' });

  const handleAdd = () => {
    if (!form.name) return addToast('Name required', 'error');
    if (activeTab === 'campaigns') addMarketingCampaign({ ...form, budget: parseFloat(form.budget), spent: 0, leads: 0, conversions: 0 });
    else if (activeTab === 'leads') addMarketingLead({ ...form, score: 75, status: 'NEW' });
    else if (activeTab === 'social') addSocialMediaPost({ ...form, publishedDate: form.startDate });
    addToast('Record added successfully', 'success');
    setModal(false);
    setForm({ name: '', type: 'EMAIL', budget: 0, startDate: '', endDate: '', email: '', source: '', platform: '', content: '' });
  };

  const TABS = [
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'social', label: 'Social Media', icon: Share2 }
  ];

  const totalBudget = marketingCampaigns.reduce((s, c) => s + (c.budget || 0), 0);
  const totalLeads = marketingLeads.length;
  const totalConversions = marketingCampaigns.reduce((s, c) => s + (c.conversions || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Marketing</h1>
          <p className="text-sm text-muted mt-1">Campaign management, lead generation, and ROI tracking</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Campaigns', value: marketingCampaigns.length, color: 'text-indigo-400' },
          { label: 'Leads', value: totalLeads, color: 'text-sky-400' },
          { label: 'Conversions', value: totalConversions, color: 'text-emerald-400' },
          { label: 'Social Posts', value: socialMediaPosts.length, color: 'text-violet-400' },
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

      {activeTab === 'campaigns' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Campaigns ({marketingCampaigns.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Period</th>
                <th className="px-4 py-2.5 text-right">Budget</th>
                <th className="px-4 py-2.5 text-right">Spent</th>
                <th className="px-4 py-2.5 text-right">Leads</th>
                <th className="px-4 py-2.5 text-right">Conversions</th>
              </tr></thead>
              <tbody>
                {marketingCampaigns.map(c => (
                  <tr key={c.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{c.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{c.type}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : c.status === 'COMPLETED' ? 'bg-surface text-dimmed' : 'bg-amber-500/10 text-amber-400'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{c.startDate} → {c.endDate}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{c.budget.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-muted">₹{c.spent.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{c.leads}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{c.conversions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'leads' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Leads ({marketingLeads.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Source</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Score</th>
                <th className="px-4 py-2.5">Assigned To</th>
              </tr></thead>
              <tbody>
                {marketingLeads.map(lead => (
                  <tr key={lead.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{lead.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{lead.email}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{lead.source}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lead.status === 'NEW' ? 'bg-emerald-500/10 text-emerald-400' : lead.status === 'CONTACTED' ? 'bg-sky-500/10 text-sky-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{lead.score}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{lead.assignedTo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Analytics ({marketingAnalytics.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Campaign</th>
                <th className="px-4 py-2.5">Metric</th>
                <th className="px-4 py-2.5 text-right">Value</th>
                <th className="px-4 py-2.5">Unit</th>
                <th className="px-4 py-2.5">Date</th>
              </tr></thead>
              <tbody>
                {marketingAnalytics.map(analytics => (
                  <tr key={analytics.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{analytics.campaignName}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{analytics.metric}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{analytics.value}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{analytics.unit}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{analytics.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'social' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Social Media Posts ({socialMediaPosts.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Platform</th>
                <th className="px-4 py-2.5">Content</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Published Date</th>
                <th className="px-4 py-2.5 text-right">Likes</th>
                <th className="px-4 py-2.5 text-right">Shares</th>
                <th className="px-4 py-2.5 text-right">Comments</th>
              </tr></thead>
              <tbody>
                {socialMediaPosts.map(post => (
                  <tr key={post.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{post.platform}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{post.content}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${post.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{post.publishedDate}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{post.likes}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{post.shares}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{post.comments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Marketing Record">
        <div className="space-y-4">
          <div><label className="form-label">Name / Campaign Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          {activeTab === 'campaigns' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="form-label">Type</label>
                  <select className="form-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="EMAIL">Email</option>
                    <option value="SOCIAL">Social</option>
                    <option value="DISPLAY">Display</option>
                    <option value="SEARCH">Search</option>
                  </select>
                </div>
                <div><label className="form-label">Budget (₹)</label><input type="number" className="form-input" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="form-label">Start Date</label><input type="date" className="form-input" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} /></div>
                <div><label className="form-label">End Date</label><input type="date" className="form-input" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} /></div>
              </div>
            </>
          )}
          {activeTab === 'leads' && (
            <>
              <div><label className="form-label">Email</label><input className="form-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              <div><label className="form-label">Source</label><input className="form-input" value={form.source} onChange={e => setForm({...form, source: e.target.value})} /></div>
            </>
          )}
          {activeTab === 'social' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="form-label">Platform</label>
                  <select className="form-input" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Twitter">Twitter</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                  </select>
                </div>
                <div><label className="form-label">Published Date</label><input type="date" className="form-input" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} /></div>
              </div>
              <div><label className="form-label">Content</label><textarea className="form-input" value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={3} /></div>
            </>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAdd} className="btn-primary text-sm">Add Record</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}