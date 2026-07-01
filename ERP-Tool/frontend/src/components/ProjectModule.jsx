import React, { useState } from 'react';
import { Plus, FolderPlus, CheckCircle, Clock, AlertCircle, LayoutGrid, BarChartHorizontal } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import { useProjects, useCreateProject, useTasks, useCreateTask } from '../hooks/useProjects';
import Modal from './ui/Modal';

const STATUS_ICON = {
  PLANNING: <Clock className="w-4 h-4 text-amber-400" />,
  IN_PROGRESS: <AlertCircle className="w-4 h-4 text-sky-400" />,
  COMPLETED: <CheckCircle className="w-4 h-4 text-emerald-400" />,
};

export default function ProjectModule() {
  const { addToast } = useERPStore();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useTasks();
  const createProject = useCreateProject();
  const createTask = useCreateTask();
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [taskModal, setTaskModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', budget: 0, startDate: '', endDate: '', managerId: '' });
  const [taskForm, setTaskForm] = useState({ title: '', assigneeId: '' });

  const handleAddProject = async () => {
    if (!form.name) return addToast('Project name required', 'error');
    try {
      await createProject.mutateAsync({ ...form, budget: parseFloat(form.budget) || 0 });
      addToast('Project created', 'success');
      setModal(false);
    } catch (err) {
      addToast(err.message || 'Failed to create project', 'error');
    }
  };

  const handleAddTask = async () => {
    if (!taskForm.title || !selected) return;
    try {
      await createTask.mutateAsync(selected, taskForm);
      addToast('Task added', 'success');
      setTaskModal(false);
      setTaskForm({ title: '', assigneeId: '' });
    } catch (err) {
      addToast(err.message || 'Failed to add task', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Logistics Project Management</h1>
          <p className="text-sm text-muted mt-1">Warehouse setup, fleet expansion, IT integration, and infrastructure projects</p>
        </div>
        <button onClick={() => setModal(true)} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary-hover border-primary/20 transition-all duration-300">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Projects', value: projects.length, color: 'text-indigo-400' },
          { label: 'In Progress', value: projects.filter(p => p.status === 'IN_PROGRESS').length, color: 'text-sky-400' },
          { label: 'Total Budget', value: `₹${projects.reduce((s, p) => s + (p.budget || 0), 0).toLocaleString('en-IN')}`, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="theme-card p-4">
            <p className="text-xs text-dimmed">{s.label}</p>
            <p className={`text-xl font-bold mt-1 font-data ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-surface p-1 rounded-xl w-fit border border-main">
        <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'overview' ? 'bg-primary text-white' : 'text-muted hover:text-main'}`}>
          <LayoutGrid className="w-3.5 h-3.5" /> Overview
        </button>
        <button onClick={() => setActiveTab('gantt')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'gantt' ? 'bg-primary text-white' : 'text-muted hover:text-main'}`}>
          <BarChartHorizontal className="w-3.5 h-3.5" /> Gantt Timeline
        </button>
      </div>

      {activeTab === 'overview' && (
      <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map(proj => {
          const completedTasks = (proj.tasks || []).filter(t => t.status === 'DONE').length;
          const totalTasks = (proj.tasks || []).length;
          const pct = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
          const budgetPct = proj.budget > 0 ? Math.round((proj.spent || 0) / proj.budget * 100) : 0;
          return (
            <div key={proj.id} className="theme-card p-5 hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    {STATUS_ICON[proj.status] || STATUS_ICON.PLANNING}
                    <h3 className="text-sm font-semibold text-main">{proj.name}</h3>
                  </div>
                  <p className="text-xs text-dimmed mt-1">{proj.description}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                  proj.status === 'IN_PROGRESS' ? 'bg-sky-500/10 text-sky-400' :
                  proj.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                  'bg-amber-500/10 text-amber-400'
                }`}>{proj.status}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-dimmed mb-1">
                    <span>Task Progress ({completedTasks}/{totalTasks})</span><span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full border border-main/20">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-dimmed mb-1">
                    <span>Budget Used</span>
                    <span>₹{(proj.spent||0).toLocaleString('en-IN')} / ₹{(proj.budget||0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full border border-main/20">
                    <div className={`h-full rounded-full ${budgetPct > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(budgetPct, 100)}%` }} />
                  </div>
                </div>
              </div>

              {totalTasks > 0 && (
                <div className="mt-3 space-y-1">
                  {(proj.tasks || []).slice(0, 3).map(task => (
                    <div key={task.id} className="flex items-center gap-2 text-xs text-muted">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        task.status === 'DONE' ? 'bg-emerald-400' :
                        task.status === 'IN_PROGRESS' ? 'bg-amber-400' : 'bg-surface border border-main'
                      }`} />
                      <span className={task.status === 'DONE' ? 'line-through text-dimmed' : ''}>{task.title}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => { setSelected(proj.id); setTaskModal(true); }}
                className="mt-3 text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Task
              </button>
            </div>
          );
        })}
      </div>

      {projects.length === 0 && (
        <div className="theme-card p-12 text-center">
          <FolderPlus className="w-8 h-8 text-dimmed mx-auto mb-3" />
          <p className="text-dimmed text-sm">No projects yet. Create your first project.</p>
        </div>
      )}
      </>
      )}

      {activeTab === 'gantt' && (
        <div className="theme-card overflow-x-auto p-6 min-h-[400px]">
          <h3 className="text-sm font-semibold text-main mb-6">Project Timeline</h3>
          <div className="min-w-[800px]">
            <div className="grid grid-cols-12 gap-1 mb-2 text-[10px] text-muted text-center border-b border-main pb-2">
              <div className="text-left font-medium">Project</div>
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => (
                <div key={m}>{m}</div>
              ))}
            </div>
            <div className="space-y-4 pt-2">
              {projects.map(proj => {
                const startMonth = proj.startDate ? new Date(proj.startDate).getMonth() : 0;
                const endMonth = proj.endDate ? new Date(proj.endDate).getMonth() : startMonth + 1;
                const duration = Math.max(1, endMonth - startMonth + 1);
                
                return (
                  <div key={proj.id} className="grid grid-cols-12 gap-1 items-center">
                    <div className="text-xs text-main truncate pr-2 font-medium flex items-center gap-2" title={proj.name}>
                      {STATUS_ICON[proj.status] || STATUS_ICON.PLANNING}
                      {proj.name}
                    </div>
                    <div className="col-span-11 relative h-7 bg-surface/30 rounded border border-main/20">
                       <div 
                         className="absolute top-0 h-full rounded shadow-sm flex items-center px-2 text-[10px] text-white font-medium truncate transition-all hover:brightness-110"
                         style={{
                           left: `${(startMonth / 12) * 100}%`,
                           width: `${(duration / 12) * 100}%`,
                           backgroundColor: proj.status === 'COMPLETED' ? '#10b981' : proj.status === 'IN_PROGRESS' ? '#0ea5e9' : '#f59e0b'
                         }}
                       >
                         {duration > 1 ? `${duration} months` : '1 month'}
                       </div>
                    </div>
                  </div>
                );
              })}
              {projects.length === 0 && <p className="text-center text-xs text-muted py-8">No projects to display on timeline.</p>}
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="New Project">
        <div className="space-y-4">
          <div>
            <label className="form-label">Project Type / Template</label>
            <select 
              className="form-input mb-2" 
              onChange={e => {
                const val = e.target.value;
                if (val === 'warehouse') {
                  setForm({...form, name: 'New Warehouse Setup', description: 'Leasing, layout design, and infrastructure setup for a new Sector warehouse.'});
                } else if (val === 'fleet') {
                  setForm({...form, name: 'Fleet Expansion', description: 'Acquisition, safety testing, and licensing of new heavy cargo freight vehicles.'});
                } else if (val === 'it') {
                  setForm({...form, name: 'IT Route Optimization Integration', description: 'Deploying machine learning algorithms and APIs for real-time fleet dispatch optimization.'});
                }
              }}
            >
              <option value="">Select a template (or enter details below)...</option>
              <option value="warehouse">Warehouse Setup</option>
              <option value="fleet">Fleet Expansion</option>
              <option value="it">Logistics IT Integration</option>
            </select>
          </div>
          <div><label className="form-label">Project Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Warehouse Sector 4" />
          </div>
          <div><label className="form-label">Description</label>
            <textarea className="form-input" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the logistics project objective..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
            <button onClick={() => setModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Cancel</button>
            <button onClick={handleAddProject} className="btn-primary text-sm">Create Project</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={taskModal} onClose={() => setTaskModal(false)} title="Add Task">
        <div className="space-y-4">
          <div><label className="form-label">Task Title</label>
            <input className="form-input" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setTaskModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Cancel</button>
            <button onClick={handleAddTask} className="btn-primary text-sm">Add Task</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}