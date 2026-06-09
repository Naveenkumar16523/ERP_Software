import React, { useState, useEffect } from 'react';
import { Plus, FolderKanban, CheckSquare, Users, Flag } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import { api } from '../utils/api';
import Modal from './ui/Modal';

export default function ProjectsModule() {
  const {
    projects, setProjects, addProject, updateProjectStatus,
    tasks, setTasks, addTask, updateTaskStatus,
    milestones, addMilestone, updateMilestoneStatus,
    resourceAllocations, addResourceAllocation,
    addToast
  } = useERPStore();

  useEffect(() => {
    let active = true;
    const fetchProjects = async () => {
      try {
        const data = await api.projects.getProjects();
        if (active && Array.isArray(data)) {
          setProjects(data);
          const allTasks = data.flatMap(p => p.tasks || []).map(t => ({
            ...t,
            priority: t.priority || 'MEDIUM',
            actualHours: t.actualHours || 0,
            estimatedHours: t.estimatedHours || 8,
            assigneeName: t.assignedTo || 'Unassigned'
          }));
          setTasks(allTasks);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    };
    fetchProjects();
    return () => {
      active = false;
    };
  }, [setProjects, setTasks]);

  const [activeTab, setActiveTab] = useState('projects');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', priority: 'MEDIUM', startDate: '', endDate: '', budget: 0, manager: ''
  });

  const handleAddProject = async () => {
    if (!form.name || !form.budget) return addToast('Name and budget required', 'error');
    const managerName = form.manager || 'Unassigned';
    const payload = {
      name: form.name,
      code: `PROJ-${Date.now().toString().slice(-4)}`,
      description: form.description || '',
      manager: managerName,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      budget: parseFloat(form.budget) || 0.0
    };

    try {
      const savedProj = await api.projects.addProject(payload);
      const formattedProj = {
        ...savedProj,
        managerName: savedProj.manager || 'Unassigned',
        progress: 0,
        spent: 0,
        tasks: []
      };
      
      const exists = projects.some(p => p.code === formattedProj.code);
      if (!exists) {
        addProject(formattedProj);
      }
      addToast('Project created successfully', 'success');
    } catch (err) {
      addToast(`Error creating project: ${err.message}`, 'error');
    }
    setModal(false);
  };

  const TABS = [
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'resources', label: 'Resources', icon: Users },
    { id: 'milestones', label: 'Milestones', icon: Flag }
  ];

  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
  const totalSpent = projects.reduce((s, p) => s + (p.spent || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Projects</h1>
          <p className="text-sm text-muted mt-1">Project tracking, task management & resource allocation</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Active Projects', value: projects.filter(p => p.status === 'IN_PROGRESS').length, color: 'text-indigo-400' },
          { label: 'Total Budget', value: `₹${totalBudget.toLocaleString('en-IN')}`, color: 'text-emerald-400' },
          { label: 'Total Spent', value: `₹${totalSpent.toLocaleString('en-IN')}`, color: 'text-amber-400' },
          { label: 'Pending Tasks', value: tasks.filter(t => t.status === 'PENDING').length, color: 'text-sky-400' },
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

      {activeTab === 'projects' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Projects ({projects.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Project Name</th>
                <th className="px-4 py-2.5">Manager</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Priority</th>
                <th className="px-4 py-2.5 text-right">Budget</th>
                <th className="px-4 py-2.5 text-right">Spent</th>
                <th className="px-4 py-2.5">Progress</th>
                <th className="px-4 py-2.5">End Date</th>
              </tr></thead>
              <tbody>
                {projects.map(project => (
                  <tr key={project.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{project.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{project.managerName}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${project.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : project.status === 'IN_PROGRESS' ? 'bg-sky-500/10 text-sky-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${project.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400' : project.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' : 'bg-sky-500/10 text-sky-400'}`}>
                        {project.priority}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{project.budget.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{project.spent.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-surface rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${project.progress}%` }} />
                        </div>
                        <span className="text-xs text-muted">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{project.endDate}</td>
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
            <h3 className="text-sm font-semibold text-main">Tasks ({tasks.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Task</th>
                <th className="px-4 py-2.5">Project</th>
                <th className="px-4 py-2.5">Assignee</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Priority</th>
                <th className="px-4 py-2.5">Due Date</th>
                <th className="px-4 py-2.5 text-right">Hours</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr></thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{task.title}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{task.projectId}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{task.assigneeName}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : task.status === 'IN_PROGRESS' ? 'bg-sky-500/10 text-sky-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${task.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400' : 'bg-sky-500/10 text-sky-400'}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{task.dueDate}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-muted">{task.actualHours}/{task.estimatedHours}</td>
                    <td className="px-4 py-2.5">
                      {task.status !== 'COMPLETED' && (
                        <button
                          onClick={() => { updateTaskStatus(task.id, 'COMPLETED'); addToast('Task completed', 'success'); }}
                          className="text-xs text-emerald-400 hover:underline"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Resource Allocations ({resourceAllocations.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Employee</th>
                <th className="px-4 py-2.5">Project</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5 text-right">Allocation %</th>
                <th className="px-4 py-2.5">Start Date</th>
                <th className="px-4 py-2.5">End Date</th>
              </tr></thead>
              <tbody>
                {resourceAllocations.map(allocation => (
                  <tr key={allocation.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{allocation.employeeName}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{allocation.projectId}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{allocation.role}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{allocation.allocation}%</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{allocation.startDate}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{allocation.endDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'milestones' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Milestones ({milestones.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Milestone</th>
                <th className="px-4 py-2.5">Project</th>
                <th className="px-4 py-2.5">Description</th>
                <th className="px-4 py-2.5">Due Date</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr></thead>
              <tbody>
                {milestones.map(milestone => (
                  <tr key={milestone.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{milestone.title}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{milestone.projectId}</td>
                    <td className="px-4 py-2.5 text-xs text-muted max-w-xs truncate">{milestone.description}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{milestone.dueDate}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${milestone.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {milestone.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {milestone.status !== 'COMPLETED' && (
                        <button
                          onClick={() => { updateMilestoneStatus(milestone.id, 'COMPLETED'); addToast('Milestone completed', 'success'); }}
                          className="text-xs text-emerald-400 hover:underline"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Create New Project">
        <div className="space-y-4">
          <div><label className="form-label">Project Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div><label className="form-label">Description</label><textarea className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Priority</label>
              <select className="form-input" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div><label className="form-label">Budget (₹)</label><input type="number" className="form-input" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Start Date</label><input type="date" className="form-input" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} /></div>
            <div><label className="form-label">End Date</label><input type="date" className="form-input" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} /></div>
          </div>
          <div><label className="form-label">Manager ID</label><input className="form-input" value={form.manager} onChange={e => setForm({...form, manager: e.target.value})} placeholder="e.g., emp-1" /></div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAddProject} className="btn-primary text-sm">Create Project</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
