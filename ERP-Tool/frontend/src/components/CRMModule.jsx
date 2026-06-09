import React, { useState, useEffect } from 'react';
import { Plus, Handshake, TrendingUp, Target, Activity } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';
import api from '../utils/api';

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
  const {
    leads, addLead, updateLeadStage,
    customers, addCustomer,
    salesForecast, addSalesForecast,
    opportunities, addOpportunity, updateOpportunityStage,
    activities, addActivity,
    addToast,
    setLeads,
    setCustomers
  } = useERPStore();

  const [activeTab, setActiveTab] = useState('pipeline');
  const [leadModal, setLeadModal] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', company: '', email: '', phone: '', source: 'Website', value: 0 });

  useEffect(() => {
    let active = true;
    async function loadCRMData() {
      try {
        const [leadsData, customersData] = await Promise.all([
          api.crm.getLeads(),
          api.crm.getCustomers()
        ]);
        if (active) {
          setLeads(leadsData);
          setCustomers(customersData);
        }
      } catch (err) {
        console.error("Failed to load CRM data", err);
      }
    }
    loadCRMData();
    return () => { active = false; };
  }, [setLeads, setCustomers]);

  const handleAddLead = async () => {
    if (!newLead.name || !newLead.email) return addToast('Name and email required', 'error');
    try {
      const leadPayload = {
        name: newLead.name,
        company: newLead.company,
        email: newLead.email,
        phone: newLead.phone || null,
        status: 'NEW',
        source: newLead.source,
        value: parseFloat(newLead.value) || 0
      };
      const created = await api.crm.addLead(leadPayload);
      if (created && created.id) {
        addLead(created);
      }
      addToast('Lead added to pipeline', 'success');
      setNewLead({ name: '', company: '', email: '', phone: '', source: 'Website', value: 0 });
      setLeadModal(false);
    } catch (err) {
      addToast(err.message || 'Failed to add lead', 'error');
    }
  };

  const handleUpdateLeadStage = async (id, stage) => {
    try {
      await api.crm.updateLeadStage(id, stage);
      updateLeadStage(id, stage);
      addToast('Lead stage updated', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update lead stage', 'error');
    }
  };

  const totalPipelineValue = leads
    .filter(l => !['WON', 'LOST'].includes(l.status))
    .reduce((s, l) => s + (l.value || 0), 0);

  const TABS = [
    { id: 'pipeline', label: 'Lead Pipeline', icon: Handshake },
    { id: 'customers', label: 'Customers', icon: Handshake },
    { id: 'forecast', label: 'Sales Forecast', icon: TrendingUp },
    { id: 'opportunities', label: 'Opportunities', icon: Target },
    { id: 'activities', label: 'Activities', icon: Activity }
  ];

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
                        onChange={e => handleUpdateLeadStage(lead.id, e.target.value)}
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

      {activeTab === 'forecast' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Sales Forecast ({salesForecast.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Period</th>
                <th className="px-4 py-2.5 text-right">Target</th>
                <th className="px-4 py-2.5 text-right">Projected</th>
                <th className="px-4 py-2.5 text-right">Confidence %</th>
                <th className="px-4 py-2.5">Status</th>
              </tr></thead>
              <tbody>
                {salesForecast.map(forecast => (
                  <tr key={forecast.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{forecast.period}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{forecast.target.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{forecast.projected.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{forecast.confidence}%</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${forecast.status === 'ON_TRACK' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {forecast.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'opportunities' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Opportunities ({opportunities.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Opportunity</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5 text-right">Value</th>
                <th className="px-4 py-2.5">Stage</th>
                <th className="px-4 py-2.5 text-right">Probability %</th>
                <th className="px-4 py-2.5">Expected Close</th>
              </tr></thead>
              <tbody>
                {opportunities.map(opp => (
                  <tr key={opp.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{opp.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{opp.customerName}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{opp.value.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${opp.stage === 'WON' ? 'bg-emerald-500/10 text-emerald-400' : opp.stage === 'LOST' ? 'bg-rose-500/10 text-rose-400' : 'bg-surface text-dimmed'}`}>
                        {opp.stage}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{opp.probability}%</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{opp.expectedClose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'activities' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Activity Log ({activities.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Entity</th>
                <th className="px-4 py-2.5">Description</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5 text-right">Duration (min)</th>
                <th className="px-4 py-2.5">Outcome</th>
              </tr></thead>
              <tbody>
                {activities.map(activity => (
                  <tr key={activity.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${activity.type === 'CALL' ? 'bg-sky-500/10 text-sky-400' : activity.type === 'EMAIL' ? 'bg-violet-500/10 text-violet-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {activity.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-main">{activity.leadName || activity.customerName}</td>
                    <td className="px-4 py-2.5 text-xs text-muted max-w-xs truncate">{activity.description}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{activity.date}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{activity.duration || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${activity.outcome === 'POSITIVE' || activity.outcome === 'SUCCESSFUL' ? 'bg-emerald-500/10 text-emerald-400' : activity.outcome === 'NEGATIVE' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {activity.outcome}
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