import React, { useState, useEffect } from 'react';
import { Plus, Factory, ClipboardList, Settings, AlertCircle, BarChart3, Wrench } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import { api } from '../utils/api';
import Modal from './ui/Modal';

export default function ManufacturingModule() {
  const {
    productionBatches, setProductionBatches, addProductionBatch, updateBatchProgress,
    qaInspections,
    workOrders, addWorkOrder, updateWorkOrderStatus,
    billOfMaterials,
    machines, addMachine, updateMachineStatus,
    machineSchedule,
    downtimeLogs, addDowntimeLog,
    productionReports,
    products, addToast
  } = useERPStore();

  // Fetch production batches from DB on mount
  useEffect(() => {
    let active = true;
    const fetchBatches = async () => {
      try {
        const data = await api.manufacturing.getBatches();
        if (active && Array.isArray(data)) setProductionBatches(data);
      } catch (err) {
        console.error('Error fetching manufacturing batches:', err);
      }
    };
    fetchBatches();
    return () => { active = false; };
  }, [setProductionBatches]);

  const [activeTab, setActiveTab] = useState('batches');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ productId: '', quantity: 0, startDate: '', targetDate: '' });

  const handleAdd = async () => {
    if (!form.productId || !form.quantity) return addToast('Product and quantity required', 'error');
    const prod = products.find(p => p.id === form.productId);
    const payload = {
      ...form,
      quantity: parseInt(form.quantity),
      productName: prod?.name || 'Unknown',
      batchNo: `BATCH-${Date.now().toString().slice(-6)}`,
    };
    try {
      const saved = await api.manufacturing.createBatch(payload);
      addProductionBatch(saved || payload);
      addToast('Production batch created', 'success');
    } catch {
      addProductionBatch(payload);
      addToast('Production batch saved locally', 'info');
    }
    setModal(false);
  };

  const TABS = [
    { id: 'batches', label: 'Production Batches', icon: Factory },
    { id: 'workorders', label: 'Work Orders', icon: ClipboardList },
    { id: 'bom', label: 'Bill of Materials', icon: Settings },
    { id: 'machines', label: 'Machines', icon: Wrench },
    { id: 'downtime', label: 'Downtime Logs', icon: AlertCircle },
    { id: 'reports', label: 'Production Reports', icon: BarChart3 }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Manufacturing</h1>
          <p className="text-sm text-muted mt-1">Production planning, batch tracking & quality assurance</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Batch
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Batches', value: productionBatches.length, color: 'text-indigo-400' },
          { label: 'In Progress', value: productionBatches.filter(b => b.status === 'IN_PROGRESS').length, color: 'text-amber-400' },
          { label: 'Work Orders', value: workOrders.length, color: 'text-sky-400' },
          { label: 'Active Machines', value: machines.filter(m => m.status === 'RUNNING').length, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="theme-card p-4">
            <p className="text-xs text-dimmed">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
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

      {activeTab === 'batches' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Production Batches</h3>
          </div>
          <div className="divide-y divide-main">
            {productionBatches.map(b => (
              <div key={b.id} className="px-4 py-3 hover:bg-surface/40 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-main">{b.productName}</span>
                    <span className="text-xs text-dimmed ml-2">#{b.batchNo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      b.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                      b.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-surface text-dimmed'
                    }`}>{b.status}</span>
                    <span className="text-xs text-muted">Qty: {b.quantity}</span>
                  </div>
                </div>
                {b.status !== 'COMPLETED' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-dimmed">
                      <span>Progress</span><span>{b.progress || 0}%</span>
                    </div>
                    <div className="h-1.5 bg-surface rounded-full overflow-hidden border border-main">
                      <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${b.progress || 0}%` }} />
                    </div>
                    <div className="flex gap-2 mt-2">
                      {[25, 50, 75, 100].map(pct => (
                        <button
                          key={pct}
                          onClick={async () => {
                            updateBatchProgress(b.id, pct, pct === 100 ? 'COMPLETED' : 'IN_PROGRESS');
                            try { await api.manufacturing.updateBatchProgress(b.id, pct); } catch {}
                            addToast(`Batch progress updated to ${pct}%`, 'info');
                          }}
                          className="text-xs bg-surface border border-main hover:bg-surface/80 text-muted hover:text-main px-2 py-0.5 rounded transition-colors"
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {productionBatches.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-dimmed">No production batches yet</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'workorders' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Work Orders ({workOrders.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Order No</th>
                <th className="px-4 py-2.5">Product</th>
                <th className="px-4 py-2.5 text-right">Quantity</th>
                <th className="px-4 py-2.5">Priority</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Due Date</th>
              </tr></thead>
              <tbody>
                {workOrders.map(wo => (
                  <tr key={wo.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-indigo-400">{wo.orderNumber}</td>
                    <td className="px-4 py-2.5 text-sm text-main">{wo.productName}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{wo.quantity}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${wo.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400' : wo.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {wo.priority}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${wo.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : wo.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400' : 'bg-surface text-dimmed'}`}>
                        {wo.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{wo.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'bom' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Bill of Materials ({billOfMaterials.length})</h3>
          </div>
          <div className="p-4 space-y-4">
            {billOfMaterials.map(bom => (
              <div key={bom.id} className="bg-surface p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-main font-medium">{bom.productName}</p>
                  <span className="text-xs text-muted">{bom.version}</span>
                </div>
                <div className="space-y-2">
                  {(bom.components || []).map((comp, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-muted">{comp.name}</span>
                      <span className="text-main">{comp.quantity} {comp.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'machines' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Machines ({machines.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Location</th>
                <th className="px-4 py-2.5 text-right">Capacity</th>
                <th className="px-4 py-2.5 text-right">Load</th>
                <th className="px-4 py-2.5 text-right">Efficiency</th>
                <th className="px-4 py-2.5">Status</th>
              </tr></thead>
              <tbody>
                {machines.map(machine => (
                  <tr key={machine.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{machine.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{machine.type}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{machine.location}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{machine.capacity}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{machine.currentLoad}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{machine.efficiency}%</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${machine.status === 'RUNNING' ? 'bg-emerald-500/10 text-emerald-400' : machine.status === 'MAINTENANCE' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {machine.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'downtime' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Downtime Logs ({downtimeLogs.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Machine</th>
                <th className="px-4 py-2.5">Start Time</th>
                <th className="px-4 py-2.5">End Time</th>
                <th className="px-4 py-2.5 text-right">Duration (hrs)</th>
                <th className="px-4 py-2.5">Reason</th>
                <th className="px-4 py-2.5">Type</th>
              </tr></thead>
              <tbody>
                {downtimeLogs.map(log => {
                  const machine = machines.find(m => m.id === log.machineId);
                  return (
                    <tr key={log.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                      <td className="px-4 py-2.5 text-sm text-main">{machine?.name || 'Unknown'}</td>
                      <td className="px-4 py-2.5 text-xs text-muted">{new Date(log.startTime).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-xs text-muted">{new Date(log.endTime).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right text-sm font-data text-main">{log.duration}</td>
                      <td className="px-4 py-2.5 text-xs text-muted">{log.reason}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.type === 'PLANNED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {log.type}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Production Reports ({productionReports.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Period</th>
                <th className="px-4 py-2.5 text-right">Total Batches</th>
                <th className="px-4 py-2.5 text-right">Completed</th>
                <th className="px-4 py-2.5 text-right">Total Units</th>
                <th className="px-4 py-2.5 text-right">Defect Rate %</th>
                <th className="px-4 py-2.5 text-right">Efficiency %</th>
              </tr></thead>
              <tbody>
                {productionReports.map(report => (
                  <tr key={report.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{report.period}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{report.totalBatches}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{report.completedBatches}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{report.totalUnits}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{report.defectRate}%</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{report.efficiency}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="New Production Batch">
        <div className="space-y-4">
          <div><label className="form-label">Product</label>
            <select className="form-input" value={form.productId} onChange={e => setForm({...form, productId: e.target.value})}>
              <option value="">Select product...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          <div><label className="form-label">Quantity</label>
            <input type="number" className="form-input" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Start Date</label><input type="date" className="form-input" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} /></div>
            <div><label className="form-label">Target Date</label><input type="date" className="form-input" value={form.targetDate} onChange={e => setForm({...form, targetDate: e.target.value})} /></div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAdd} className="btn-primary text-sm">Create Batch</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}