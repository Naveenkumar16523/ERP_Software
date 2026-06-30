import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Handshake, Target, Activity, Ticket, IndianRupee, Mail, Building, Phone } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import { useLeads, useAddLead, useUpdateLeadStatus } from '../hooks/useCRM';
import { useSupportTickets, useCreateSupportTicket, useUpdateSupportTicketStatus } from '../hooks/useSupport';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import Modal from './ui/Modal';
import api from '../utils/api';

const STAGES = ['New', 'Contacted', 'Qualified', 'Won', 'Lost'];
const STAGE_COLORS = {
  New: 'border-sky-500',
  Contacted: 'border-blue-500',
  Qualified: 'border-violet-500',
  Won: 'border-emerald-500',
  Lost: 'border-rose-500',
};

const TICKET_STATUS_COLORS = {
  Open: 'bg-rose-500/10 text-rose-400',
  'In Progress': 'bg-amber-500/10 text-amber-400',
  Resolved: 'bg-emerald-500/10 text-emerald-400'
};

export default function CRMModule() {
  const addToast = useERPStore(s => s.addToast);

  const { data: leads = [] } = useLeads();
  const addLeadMutation = useAddLead();
  const updateLeadStatusMutation = useUpdateLeadStatus();
  
  const { data: tickets = [] } = useSupportTickets();
  const createTicket = useCreateSupportTicket();
  const qc = useQueryClient();
  const updateTicketMutation = useMutation({
    mutationFn: ({ id, status }) => apiClient.patch(`/crm/tickets/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support', 'supportTickets'] })
  });
  
  const [activeTab, setActiveTab] = useState('pipeline');
  const [leadModal, setLeadModal] = useState(false);
  const [ticketModal, setTicketModal] = useState(false);
  
  const [newLead, setNewLead] = useState({ name: '', company: '', email: '', phone: '', expectedRevenue: 0 });
  const [newTicket, setNewTicket] = useState({ title: '', description: '', leadId: '', priority: 'Medium' });



  const handleAddLead = async () => {
    if (!newLead.name || !newLead.company) return addToast('Name and Company required', 'error');
    try {
      await addLeadMutation.mutateAsync(newLead);
      addToast('Lead added successfully', 'success');
      setNewLead({ name: '', company: '', email: '', phone: '', expectedRevenue: 0 });
      setLeadModal(false);
    } catch (err) {
      addToast(err.message || 'Failed to add lead', 'error');
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    const newStage = destination.droppableId;
    
    // The useOptimisticMutation will automatically handle optimistic updates for 'leads'
    try {
      await updateLeadStatusMutation.mutateAsync({ id: draggableId, status: newStage });
      addToast('Lead stage updated', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update lead stage', 'error');
    }
  };

  const handleAddTicket = async () => {
    if (!newTicket.title) return addToast('Title required', 'error');
    try {
      await createTicket.mutateAsync({
        title: newTicket.title,
        description: newTicket.description,
        leadId: newTicket.leadId || null,
        priority: newTicket.priority
      });
      addToast('Ticket created', 'success');
      setNewTicket({ title: '', description: '', leadId: '', priority: 'Medium' });
      setTicketModal(false);
    } catch (err) {
      addToast(err.message || 'Failed to create ticket', 'error');
    }
  };

  const handleUpdateTicketStatus = async (id, status) => {
    try {
      await updateTicketMutation.mutateAsync({ id, status });
      addToast('Ticket status updated', 'success');
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
    { id: 'pipeline', label: 'Kanban Pipeline', icon: Target },
    { id: 'tickets', label: 'Support Tickets', icon: Ticket }
  ];

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-main">CRM & Pipeline</h1>
          <p className="text-sm text-muted mt-1">Lead management and ticketing</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTicketModal(true)} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary-hover border-primary/20 transition-all duration-300">
            <Plus className="w-4 h-4" /> New Ticket
          </button>
          <button onClick={() => setLeadModal(true)} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary-hover border-primary/20 transition-all duration-300">
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
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
      <div className="flex gap-1 bg-surface p-1 rounded-xl w-fit border border-main shrink-0">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-primary text-white' : 'text-muted hover:text-main'}`}>
              <Icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'pipeline' && (
        <div className="flex-1 overflow-x-auto pb-4">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 min-w-max h-[500px]">
              {STAGES.map(stage => {
                const stageLeads = leads.filter(l => l.status === stage);
                return (
                  <div key={stage} className="w-[300px] flex flex-col bg-surface rounded-xl border border-main overflow-hidden shadow-lg">
                    <div className={`px-4 py-3 border-b border-main bg-black/20 flex justify-between items-center border-t-2 ${STAGE_COLORS[stage]}`}>
                      <h3 className="text-sm font-semibold text-main">{stage}</h3>
                      <span className="text-xs font-mono bg-black/40 text-muted px-2 py-0.5 rounded-full">{stageLeads.length}</span>
                    </div>
                    
                    <Droppable droppableId={stage}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 p-3 overflow-y-auto space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
                        >
                          {stageLeads.map((lead, index) => (
                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`theme-card p-3 shadow-md border-l-4 ${STAGE_COLORS[stage]} transition-all ${snapshot.isDragging ? 'shadow-xl scale-[1.02] rotate-1 ring-1 ring-primary/50' : 'hover:border-primary'}`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-sm font-bold text-main leading-tight">{lead.name}</h4>
                                    <span className="text-xs font-data font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                      ₹{(lead.expectedRevenue || 0).toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                  <div className="space-y-1.5 mt-3">
                                    <p className="text-xs text-muted flex items-center gap-1.5"><Building className="w-3 h-3 text-dimmed"/> {lead.company}</p>
                                    <p className="text-[10px] text-dimmed flex items-center gap-1.5"><Mail className="w-3 h-3"/> {lead.email}</p>
                                    <p className="text-[10px] text-dimmed flex items-center gap-1.5"><Phone className="w-3 h-3"/> {lead.phone}</p>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="theme-card overflow-hidden shrink-0">
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