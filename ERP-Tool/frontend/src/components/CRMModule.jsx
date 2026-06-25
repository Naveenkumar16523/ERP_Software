import React, { useState, useEffect } from 'react';
import { Plus, Handshake, Target, Activity, Ticket, IndianRupee } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';
import api from '../utils/api';

const STAGES = ['New', 'Contacted', 'Qualified', 'Won', 'Lost'];
const STAGE_COLORS = {
  New: 'text-sky-400 bg-sky-500/10',
  Contacted: 'text-blue-400 bg-blue-500/10',
  Qualified: 'text-violet-400 bg-violet-500/10',
  Won: 'text-emerald-400 bg-emerald-500/10',
  Lost: 'text-rose-400 bg-rose-500/10',
};

const TICKET_STATUS_COLORS = {
  Open: 'bg-rose-500/10 text-rose-400',
  'In Progress': 'bg-amber-500/10 text-amber-400',
  Resolved: 'bg-emerald-500/10 text-emerald-400'
};

export default function CRMModule() {
  const { addToast } = useERPStore();

  const [leads, setLeads] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [activeTab, setActiveTab] = useState('pipeline');
  const [leadModal, setLeadModal] = useState(false);
  const [ticketModal, setTicketModal] = useState(false);
  
  const [newLead, setNewLead] = useState({ name: '', company: '', email: '', phone: '', expectedRevenue: 0 });
  const [newTicket, setNewTicket] = useState({ title: '', description: '', leadId: '', priority: 'Medium' });

  const loadData = async () => {
    try {
      const [leadsData, ticketsData] = await Promise.all([
        api.crm.getLeads(),
        api.crm.getTickets()
      ]);
      setLeads(leadsData || []);
      setTickets(ticketsData || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddLead = async () => {
    if (!newLead.name || !newLead.email) return addToast('Name and email required', 'error');
    try {
      await api.crm.createLead({
        name: newLead.name,
        company: newLead.company,
        email: newLead.email,
        phone: newLead.phone,
        expectedRevenue: parseFloat(newLead.expectedRevenue) || 0
      });
      addToast('Lead added to pipeline', 'success');
      setNewLead({ name: '', company: '', email: '', phone: '', expectedRevenue: 0 });
      setLeadModal(false);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to add lead', 'error');
    }
  };

  const handleUpdateLeadStage = async (id, stage) => {
    try {
      await api.crm.updateLeadStatus(id, stage);
      addToast('Lead stage updated', 'success');
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to update lead stage', 'error');
    }
  };

  const handleAddTicket = async () => {
    if (!newTicket.title) return addToast('Title required', 'error');
    try {
      await api.crm.createTicket({
        title: newTicket.title,
        description: newTicket.description,
        leadId: newTicket.leadId || null,
        priority: newTicket.priority
      });
      addToast('Support ticket created', 'success');
      setNewTicket({ title: '', description: '', leadId: '', priority: 'Medium' });
      setTicketModal(false);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to create ticket', 'error');
    }
  };

  const handleUpdateTicketStatus = async (id, status) => {
    try {
      await api.crm.updateTicketStatus(id, status);
      addToast('Ticket status updated', 'success');
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to update ticket status', 'error');
    }
  };

  // Pipeline Value is the expected revenue from Qualified leads
  const pipelineValue = leads
    .filter(l => l.status === 'Qualified')
    .reduce((s, l) => s + (l.expectedRevenue || 0), 0);

  const wonValue = leads
    .filter(l => l.status === 'Won')
    .reduce((s, l) => s + (l.expectedRevenue || 0), 0);

  const TABS = [
    { id: 'pipeline', label: 'Lead Pipeline', icon: Handshake },
    { id: 'tickets', label: 'Support Tickets', icon: Ticket }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">CRM & Support</h1>
          <p className="text-sm text-muted mt-1">Lead management and ticketing</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTicketModal(true)} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300">
            <Plus className="w-4 h-4" /> New Ticket
          </button>
          <button onClick={() => setLeadModal(true)} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300">
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Leads', value: leads.length, color: 'text-indigo-400', icon: Handshake },
          { label: 'Pipeline Value (Qualified)', value: `₹${pipelineValue.toLocaleString('en-IN')}`, color: 'text-emerald-400', icon: IndianRupee },
          { label: 'Revenue (Won)', value: `₹${wonValue.toLocaleString('en-IN')}`, color: 'text-sky-400', icon: IndianRupee },
          { label: 'Open Tickets', value: tickets.filter(t => t.status === 'Open').length, color: 'text-rose-400', icon: Ticket },
        ].map(s => (
          <div key={s.label} className="theme-card p-4 relative overflow-hidden">
            <s.icon className={`absolute right-4 top-4 w-10 h-10 opacity-10 ${s.color}`} />
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
                  <th className="px-4 py-2.5 text-right">Expected Revenue</th>
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
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{(lead.expectedRevenue || 0).toLocaleString('en-IN')}</td>
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

      {activeTab === 'tickets' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Support Tickets ({tickets.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-dimmed border-b border-main">
                  <th className="px-4 py-2.5">Ticket</th>
                  <th className="px-4 py-2.5">Lead/Customer</th>
                  <th className="px-4 py-2.5">Priority</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Update Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5">
                      <p className="text-sm text-main">{t.title}</p>
                      <p className="text-xs text-dimmed max-w-xs truncate">{t.description}</p>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-muted">{t.leadName || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium ${t.priority === 'High' ? 'text-rose-400' : t.priority === 'Medium' ? 'text-amber-400' : 'text-sky-400'}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TICKET_STATUS_COLORS[t.status] || 'text-muted bg-surface'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        className="form-input text-xs py-1 px-2"
                        value={t.status}
                        onChange={e => handleUpdateTicketStatus(t.id, e.target.value)}
                      >
                        {['Open', 'In Progress', 'Resolved'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
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
          <div>
            <label className="form-label">Expected Revenue (₹)</label><input type="number" className="form-input" value={newLead.expectedRevenue} onChange={e => setNewLead({...newLead, expectedRevenue: e.target.value})} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setLeadModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Cancel</button>
            <button onClick={handleAddLead} className="btn-primary text-sm">Add Lead</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={ticketModal} onClose={() => setTicketModal(false)} title="New Support Ticket">
        <div className="space-y-4">
          <div><label className="form-label">Title</label>
            <input className="form-input" value={newTicket.title} onChange={e => setNewTicket({...newTicket, title: e.target.value})} />
          </div>
          <div><label className="form-label">Description</label>
            <textarea className="form-input" rows="3" value={newTicket.description} onChange={e => setNewTicket({...newTicket, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Link to Lead</label>
              <select className="form-input" value={newTicket.leadId} onChange={e => setNewTicket({...newTicket, leadId: e.target.value})}>
                <option value="">None</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.name} ({l.company})</option>)}
              </select>
            </div>
            <div><label className="form-label">Priority</label>
              <select className="form-input" value={newTicket.priority} onChange={e => setNewTicket({...newTicket, priority: e.target.value})}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setTicketModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Cancel</button>
            <button onClick={handleAddTicket} className="btn-primary text-sm">Create Ticket</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}