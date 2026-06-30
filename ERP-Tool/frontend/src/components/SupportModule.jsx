import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Check, X, Clock, AlertCircle } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useSupportTickets, useCreateSupportTicket } from '../hooks/useSupport';
import Modal from './ui/Modal';
import api from '../utils/api';

export default function SupportModule() {
  const { addToast, currentUser } = useERPStore();
  const { data: supportTickets = [] } = useSupportTickets();
  const createTicket = useCreateSupportTicket();
  const qc = useQueryClient();
  const updateTicketMutation = useMutation({
    mutationFn: ({ id, status }) => apiClient.patch(`/support/tickets/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support', 'supportTickets'] })
  });
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', category: 'Technical' });
  const [filter, setFilter] = useState('ALL');


  const handleAdd = async () => {
    if (!form.title) return addToast('Title required', 'error');
    try {
      const ticketPayload = {
        title: form.title,
        description: form.description,
        category: form.category,
        customer: currentUser?.fullName || "Self",
        priority: form.priority,
        assignedTo: currentUser?.fullName || null
      };
      
      await createTicket.mutateAsync(ticketPayload);
      addToast('Support ticket created', 'success');
      setForm({ title: '', description: '', priority: 'MEDIUM', category: 'Technical' });
      setModal(false);
    } catch (err) {
      addToast(err.message || 'Failed to create support ticket', 'error');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateTicketMutation.mutateAsync({ id, status });
      addToast(`Ticket status updated to ${status}`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update ticket status', 'error');
    }
  };

  const filtered = filter === 'ALL' ? supportTickets : supportTickets.filter(t => t.status === filter);

  const CATEGORIES = ['Technical', 'Finance', 'HR', 'Inventory', 'General'];
  const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const STATUSES = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

  const STATUS_STYLES = { OPEN: 'text-sky-400 bg-sky-500/10', IN_PROGRESS: 'text-amber-400 bg-amber-500/10', RESOLVED: 'text-emerald-400 bg-emerald-500/10', CLOSED: 'text-slate-400 bg-slate-500/10' };
  const PRIORITY_STYLES = { CRITICAL: 'text-rose-400 bg-rose-500/10', HIGH: 'text-orange-400 bg-orange-500/10', MEDIUM: 'text-amber-400 bg-amber-500/10', LOW: 'text-sky-400 bg-sky-500/10' };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Support Center</h1>
          <p className="text-sm text-muted mt-1">IT helpdesk and support ticket management</p>
        </div>
        <button onClick={() => setModal(true)} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary-hover border-primary/20 transition-all duration-300"><Plus className="w-4 h-4" /> New Ticket</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Tickets', value: supportTickets.length, color: 'text-indigo-400' },
          { label: 'Open', value: supportTickets.filter(t => t.status === 'OPEN').length, color: 'text-sky-400' },
          { label: 'In Progress', value: supportTickets.filter(t => t.status === 'IN_PROGRESS').length, color: 'text-amber-400' },
          { label: 'Resolved', value: supportTickets.filter(t => t.status === 'RESOLVED').length, color: 'text-emerald-400' }
        ].map(s => (
          <div key={s.label} className="theme-card p-4">
            <p className="text-xs text-muted">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-surface p-1 rounded-xl w-fit flex-wrap">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === s ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-main'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="theme-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="text-left text-xs text-muted border-b border-main bg-surface">
              <th className="px-4 py-2.5">Ticket No</th><th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5">Category</th><th className="px-4 py-2.5">Priority</th>
              <th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="border-b border-main/50 hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-2.5 text-xs font-mono text-primary">{t.ticketNo}</td>
                  <td className="px-4 py-2.5">
                    <p className="text-sm text-main">{t.title}</p>
                    {t.description && <p className="text-xs text-dimmed mt-0.5 max-w-xs truncate">{t.description}</p>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted">{t.category}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_STYLES[t.priority] || ''}`}>{t.priority}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[t.status] || ''}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-2.5 flex gap-2">
                    {t.status === 'OPEN' && <button onClick={() => handleUpdateStatus(t.id, 'IN_PROGRESS')} className="text-xs text-amber-400 hover:underline">Pick Up</button>}
                    {t.status === 'IN_PROGRESS' && <button onClick={() => handleUpdateStatus(t.id, 'RESOLVED')} className="text-xs text-emerald-400 hover:underline">Resolve</button>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-dimmed">No tickets matching "{filter}"</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="New Support Ticket">
        <div className="space-y-4">
          <div><label className="form-label">Title</label><input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Brief description of the issue" /></div>
          <div><label className="form-label">Description</label><textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Detailed description..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Category</label>
              <select className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="form-label">Priority</label>
              <select className="form-input" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Cancel</button>
            <button onClick={handleAdd} className="btn-primary text-sm">Create Ticket</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}