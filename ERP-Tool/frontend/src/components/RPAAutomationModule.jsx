import React, { useState } from 'react';
import { Plus, Workflow, Bot, Calendar, BarChart3 } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';

export default function RPAAutomationModule() {
  const {
    rpaWorkflows, addRPAWorkflow,
    rpaBots, addRPABot,
    rpaTasks, addRPATask,
    rpaPerformance, addRPAPerformance,
    addToast
  } = useERPStore();
  const [activeTab, setActiveTab] = useState('workflows');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: '', workflowId: '', taskName: '', scheduledTime: '', botId: '', metric: '', value: 0, unit: '' });

  const handleAdd = () => {
    if (!form.name) return addToast('Name required', 'error');
    if (activeTab === 'workflows') addRPAWorkflow({ ...form, lastRun: new Date().toISOString().split('T')[0], successRate: 0, tasksCompleted: 0 });
    else if (activeTab === 'bots') addRPABot({ ...form });
    else if (activeTab === 'tasks') addRPATask({ ...form, workflowName: rpaWorkflows.find(w => w.id === form.workflowId)?.name || '' });
    else if (activeTab === 'performance') addRPAPerformance({ ...form, botName: rpaBots.find(b => b.id === form.botId)?.name || '', date: new Date().toISOString().split('T')[0] });
    addToast('Record added successfully', 'success');
    setModal(false);
    setForm({ name: '', type: '', workflowId: '', taskName: '', scheduledTime: '', botId: '', metric: '', value: 0, unit: '' });
  };

  const TABS = [
    { id: 'workflows', label: 'Workflows', icon: Workflow },
    { id: 'bots', label: 'Bots', icon: Bot },
    { id: 'tasks', label: 'Tasks', icon: Calendar },
    { id: 'performance', label: 'Performance', icon: BarChart3 }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">RPA Automation</h1>
          <p className="text-sm text-muted mt-1">Workflow automation, bot management, task scheduling, and performance monitoring</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Workflows', value: rpaWorkflows.length, color: 'text-indigo-400' },
          { label: 'Active Bots', value: rpaBots.filter(b => b.status === 'RUNNING').length, color: 'text-emerald-400' },
          { label: 'Tasks', value: rpaTasks.length, color: 'text-sky-400' },
          { label: 'Performance Metrics', value: rpaPerformance.length, color: 'text-amber-400' },
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

      {activeTab === 'workflows' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">RPA Workflows ({rpaWorkflows.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Last Run</th>
                <th className="px-4 py-2.5 text-right">Success Rate</th>
                <th className="px-4 py-2.5 text-right">Tasks Completed</th>
              </tr></thead>
              <tbody>
                {rpaWorkflows.map(workflow => (
                  <tr key={workflow.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{workflow.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{workflow.type}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${workflow.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {workflow.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{workflow.lastRun}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{workflow.successRate}%</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{workflow.tasksCompleted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'bots' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">RPA Bots ({rpaBots.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Uptime</th>
                <th className="px-4 py-2.5 text-right">Tasks Processed</th>
                <th className="px-4 py-2.5 text-right">Errors</th>
              </tr></thead>
              <tbody>
                {rpaBots.map(bot => (
                  <tr key={bot.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{bot.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{bot.type}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bot.status === 'RUNNING' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {bot.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{bot.uptime}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{bot.tasksProcessed.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-rose-400">{bot.errors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">RPA Tasks ({rpaTasks.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Workflow</th>
                <th className="px-4 py-2.5">Task Name</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Scheduled Time</th>
                <th className="px-4 py-2.5">Completed Time</th>
                <th className="px-4 py-2.5 text-right">Duration (s)</th>
              </tr></thead>
              <tbody>
                {rpaTasks.map(task => (
                  <tr key={task.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-muted">{task.workflowName}</td>
                    <td className="px-4 py-2.5 text-sm text-main">{task.name}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{task.scheduledTime}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{task.completedTime || '—'}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{task.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Performance Metrics ({rpaPerformance.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Bot</th>
                <th className="px-4 py-2.5">Metric</th>
                <th className="px-4 py-2.5 text-right">Value</th>
                <th className="px-4 py-2.5">Unit</th>
                <th className="px-4 py-2.5">Date</th>
              </tr></thead>
              <tbody>
                {rpaPerformance.map(perf => (
                  <tr key={perf.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{perf.botName}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{perf.metric}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{perf.value}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{perf.unit}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{perf.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add RPA Record">
        <div className="space-y-4">
          <div><label className="form-label">Name / Task Name / Metric</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          {activeTab === 'workflows' && (
            <div><label className="form-label">Type</label><input className="form-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})} /></div>
          )}
          {activeTab === 'tasks' && (
            <>
              <div><label className="form-label">Workflow</label>
                <select className="form-input" value={form.workflowId} onChange={e => setForm({...form, workflowId: e.target.value})}>
                  <option value="">Select Workflow</option>
                  {rpaWorkflows.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div><label className="form-label">Scheduled Time</label><input type="datetime-local" className="form-input" value={form.scheduledTime} onChange={e => setForm({...form, scheduledTime: e.target.value})} /></div>
            </>
          )}
          {activeTab === 'performance' && (
            <>
              <div><label className="form-label">Bot</label>
                <select className="form-input" value={form.botId} onChange={e => setForm({...form, botId: e.target.value})}>
                  <option value="">Select Bot</option>
                  {rpaBots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="form-label">Value</label><input type="number" className="form-input" value={form.value} onChange={e => setForm({...form, value: e.target.value})} /></div>
                <div><label className="form-label">Unit</label><input className="form-input" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} /></div>
              </div>
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
