import React, { useState } from 'react';
import { Plus, BarChart3, FileText, LayoutDashboard, TrendingUp, TrendingDown } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';

export default function AnalyticsHubModule() {
  const {
    kpis, addKPI, updateKPI,
    reports, addReport, generateReport,
    dashboards, addDashboard,
    addToast
  } = useERPStore();

  const [activeTab, setActiveTab] = useState('kpi');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    name: '', value: 0, target: 0, unit: '', department: '', trend: 'UP', change: 0
  });

  const handleAddKPI = () => {
    if (!form.name || !form.value) return addToast('Name and value required', 'error');
    addKPI({
      ...form,
      value: parseFloat(form.value),
      target: parseFloat(form.target),
      change: parseFloat(form.change)
    });
    addToast('KPI added successfully', 'success');
    setModal(false);
  };

  const TABS = [
    { id: 'kpi', label: 'KPIs', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'dashboards', label: 'Dashboards', icon: LayoutDashboard }
  ];

  const avgKPIProgress = kpis.length > 0 ? Math.round(kpis.reduce((s, k) => s + (k.value / k.target * 100), 0) / kpis.length) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Analytics Hub</h1>
          <p className="text-sm text-muted mt-1">Dashboard analytics, reports generation & KPI tracking</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add KPI
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total KPIs', value: kpis.length, color: 'text-indigo-400' },
          { label: 'Reports Generated', value: reports.filter(r => r.status === 'COMPLETED').length, color: 'text-emerald-400' },
          { label: 'Dashboards', value: dashboards.length, color: 'text-sky-400' },
          { label: 'Avg Progress', value: `${avgKPIProgress}%`, color: 'text-amber-400' },
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

      {activeTab === 'kpi' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Key Performance Indicators ({kpis.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">KPI Name</th>
                <th className="px-4 py-2.5">Department</th>
                <th className="px-4 py-2.5 text-right">Value</th>
                <th className="px-4 py-2.5 text-right">Target</th>
                <th className="px-4 py-2.5">Progress</th>
                <th className="px-4 py-2.5">Trend</th>
                <th className="px-4 py-2.5 text-right">Change</th>
              </tr></thead>
              <tbody>
                {kpis.map(kpi => (
                  <tr key={kpi.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{kpi.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{kpi.department}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{kpi.unit}{kpi.value.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-muted">{kpi.unit}{kpi.target.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-surface rounded-full overflow-hidden">
                          <div className={`h-full ${kpi.value >= kpi.target ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(kpi.value / kpi.target * 100, 100)}%` }} />
                        </div>
                        <span className="text-xs text-muted">{Math.round(kpi.value / kpi.target * 100)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {kpi.trend === 'UP' ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm font-data">{kpi.change > 0 ? '+' : ''}{kpi.change}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Reports ({reports.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Report Name</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Generated Date</th>
                <th className="px-4 py-2.5">Generated By</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr></thead>
              <tbody>
                {reports.map(report => (
                  <tr key={report.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{report.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{report.type}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{report.generatedDate || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{report.generatedBy || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${report.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {report.status === 'SCHEDULED' && (
                        <button onClick={() => { generateReport(report.id); addToast('Report generated', 'success'); }} className="text-xs text-emerald-400 hover:underline">Generate</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'dashboards' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Dashboards ({dashboards.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Dashboard Name</th>
                <th className="px-4 py-2.5">Description</th>
                <th className="px-4 py-2.5">Widgets</th>
                <th className="px-4 py-2.5">Created By</th>
              </tr></thead>
              <tbody>
                {dashboards.map(dashboard => (
                  <tr key={dashboard.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{dashboard.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted max-w-xs truncate">{dashboard.description}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1 flex-wrap">
                        {dashboard.widgets.map((widget, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">{widget}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{dashboard.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add New KPI">
        <div className="space-y-4">
          <div><label className="form-label">KPI Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Value</label><input type="number" className="form-input" value={form.value} onChange={e => setForm({...form, value: e.target.value})} /></div>
            <div><label className="form-label">Target</label><input type="number" className="form-input" value={form.target} onChange={e => setForm({...form, target: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Unit</label><input className="form-input" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} placeholder="e.g., ₹, %, x" /></div>
            <div><label className="form-label">Department</label>
              <select className="form-input" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                <option value="">Select department...</option>
                <option value="Finance">Finance</option>
                <option value="HR">HR</option>
                <option value="Inventory">Inventory</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Sales">Sales</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Trend</label>
              <select className="form-input" value={form.trend} onChange={e => setForm({...form, trend: e.target.value})}>
                <option value="UP">Up</option>
                <option value="DOWN">Down</option>
              </select>
            </div>
            <div><label className="form-label">Change (%)</label><input type="number" className="form-input" value={form.change} onChange={e => setForm({...form, change: e.target.value})} /></div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAddKPI} className="btn-primary text-sm">Add KPI</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
