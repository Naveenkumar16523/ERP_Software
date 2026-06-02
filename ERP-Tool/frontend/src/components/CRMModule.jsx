import React, { useState } from 'react';
import { Plus, Handshake } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';

const STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST'];
const STAGE_COLORS = {
  NEW: 'text-sky-400 bg-sky-500/10',
  CONTACTED: 'text-blue-400 bg-blue-500/10',
  QUALIFIED: 'text-violet-400 bg-violet-500/10',
  PROPOSAL: 'text-amber-400 bg-amber-500/10',
  WON: 'text-emerald-400 bg-emerald-500/10',
  LOST: 'text-rose-400 bg-rose-500/10',
};

export default function CRMModule() {
  const { leads, addLead, updateLeadStage, customers, addCustomer, addToast } = useERPStore();
  const [activeTab, setActiveTab] = useState('pipeline');
  const [leadModal, setLeadModal] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', company: '', email: '', phone: '', source: 'Website', value: 0 });

  const totalPipelineValue = leads
    .filter(l => !['WON', 'LOST'].includes(l.status))
    .reduce((s, l) => s + (l.value || 0), 0);

  const handleAddLead = () => {
    if (!newLead.name || !newLead.email) return addToast('Name and email required', 'error');
    addLead({ ...newLead, value: parseFloat(newLead.value) || 0 });
    addToast('Lead added to pipeline', 'success');
    setNewLead({ name: '', company: '', email: '', phone: '', source: 'Website', value: 0 });
    setLeadModal(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">CRM & Sales Pipeline</h1>
          <p className="text-sm text-muted mt-1">Lead management and customer relationships</p>
        </div>
        <button onClick={() => setLeadModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Lead
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Leads', value: leads.length, color: 'text-indigo-400' },
          { label: 'Pipeline Value', value: `₹${totalPipelineValue.toLocaleString('en-IN')}`, color: 'text-emerald-400' },
          { label: 'Won', value: leads.filter(l => l.status === 'WON').length, color: 'text-emerald-400' },
          { label: 'Customers', value: customers.length, color: 'text-sky-400' },
        ].map(s => (
          <div key={s.label} className="theme-card p-4">
            <p className="text-xs text-dimmed">{s.label}</p>
            <p className={`text-xl font-bold mt-1 font-data ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-surface p-1 rounded-xl w-fit border border-main">
        {['pipeline', 'customers'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              activeTab === tab ? 'bg-indigo-600 text-white' : 'text-muted hover:text-main'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'pipeline' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Sales Pipeline — {leads.length} leads</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-dimmed border-b border-main">
                  <th className="px-4 py-2.5">Lead</th>
                  <th className="px-4 py-2.5">Company</th>
                  <th className="px-4 py-2.5">Stage</th>
                  <th className="px-4 py-2.5">Source</th>
                  <th className="px-4 py-2.5 text-right">Value</th>
                  <th className="px-4 py-2.5">Move</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5">
                      <p className="text-sm text-main">{lead.name}</p>
                      <p className="text-xs text-dimmed">{lead.email}</p>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-muted">{lead.company}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[lead.status] || 'text-muted bg-surface'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{lead.source}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{(lead.value || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5">
                      <select
                        className="form-input text-xs py-1 px-2"
                        value={lead.status}
                        onChange={e => { updateLeadStage(lead.id, e.target.value); addToast('Lead stage updated', 'info'); }}
                      >
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Customer Accounts ({customers.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-dimmed border-b border-main">
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5">Industry</th>
                  <th className="px-4 py-2.5 text-right">Total Spend</th>
                  <th className="px-4 py-2.5">Type</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{c.name}</td>
                    <td className="px-4 py-2.5 text-sm text-muted">{c.industry}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{(c.totalSpend || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.isReturning ? 'bg-emerald-500/10 text-emerald-400' : 'bg-sky-500/10 text-sky-400'}`}>
                        {c.isReturning ? 'Returning' : 'New'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={leadModal} onClose={() => setLeadModal(false)} title="Add New Lead">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Full Name</label><input className="form-input" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} /></div>
            <div><label className="form-label">Company</label><input className="form-input" value={newLead.company} onChange={e => setNewLead({...newLead, company: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Email</label><input className="form-input" type="email" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} /></div>
            <div><label className="form-label">Phone</label><input className="form-input" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Source</label>
              <select className="form-input" value={newLead.source} onChange={e => setNewLead({...newLead, source: e.target.value})}>
                {['Website','Referral','Cold Outreach','Social Media','Exhibition'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="form-label">Deal Value (₹)</label><input type="number" className="form-input" value={newLead.value} onChange={e => setNewLead({...newLead, value: e.target.value})} /></div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setLeadModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAddLead} className="btn-primary text-sm">Add Lead</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}