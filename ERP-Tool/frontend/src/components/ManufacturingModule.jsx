import React, { useState } from 'react';
import { Plus, Truck, ClipboardList, AlertCircle, Wrench, ShieldAlert, CheckCircle, Clock, Calendar } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';

export default function FleetAndOperationsModule() {
  const {
    workOrders, addWorkOrder, updateWorkOrderStatus,
    machines, addMachine, updateMachineStatus,
    downtimeLogs, addDowntimeLog,
    addToast
  } = useERPStore();

  const [activeTab, setActiveTab] = useState('machines');
  const [modal, setModal] = useState(false);
  const [formType, setFormType] = useState('machine'); // machine, workorder, downtime

  // Forms state
  const [machineForm, setMachineForm] = useState({ name: '', type: 'Heavy Truck', location: '', capacity: '', currentLoad: '', status: 'RUNNING' });
  const [workOrderForm, setWorkOrderForm] = useState({ machineId: '', priority: 'MEDIUM', description: '', startDate: '', dueDate: '' });
  const [downtimeForm, setDowntimeForm] = useState({ machineId: '', reason: '', type: 'UNPLANNED', duration: '', startTime: '' });

  const handleOpenAddModal = () => {
    if (activeTab === 'machines') {
      setFormType('machine');
      setMachineForm({ name: '', type: 'Heavy Truck', location: '', capacity: '', currentLoad: '', status: 'RUNNING' });
    } else if (activeTab === 'workorders') {
      setFormType('workorder');
      setWorkOrderForm({ machineId: '', priority: 'MEDIUM', description: '', startDate: '', dueDate: '' });
    } else {
      setFormType('downtime');
      setDowntimeForm({ machineId: '', reason: '', type: 'UNPLANNED', duration: '', startTime: new Date().toISOString().slice(0, 16) });
    }
    setModal(true);
  };

  const handleAddMachine = () => {
    if (!machineForm.name || !machineForm.location) {
      return addToast('Name and location are required', 'error');
    }
    addMachine({
      ...machineForm,
      capacity: machineForm.capacity || 'N/A',
      currentLoad: machineForm.currentLoad || '0',
      efficiency: machineForm.status === 'RUNNING' ? 95 : 0
    });
    addToast('New vehicle/machinery registered', 'success');
    setModal(false);
  };

  const handleAddWorkOrder = () => {
    if (!workOrderForm.machineId || !workOrderForm.description) {
      return addToast('Vehicle/Machinery and Description are required', 'error');
    }
    const machineObj = machines.find(m => m.id === workOrderForm.machineId);
    addWorkOrder({
      orderNumber: `WO-MAIN-${Date.now().toString().slice(-4)}`,
      productId: workOrderForm.machineId,
      productName: machineObj?.name || 'Unknown',
      priority: workOrderForm.priority,
      status: 'PENDING',
      startDate: workOrderForm.startDate || new Date().toISOString().split('T')[0],
      dueDate: workOrderForm.dueDate || new Date().toISOString().split('T')[0],
      description: workOrderForm.description
    });
    addToast('Service Work Order created', 'success');
    setModal(false);
  };

  const handleAddDowntime = () => {
    if (!downtimeForm.machineId || !downtimeForm.reason || !downtimeForm.duration) {
      return addToast('Vehicle, reason, and duration are required', 'error');
    }
    addDowntimeLog({
      machineId: downtimeForm.machineId,
      startTime: downtimeForm.startTime || new Date().toISOString(),
      endTime: new Date(new Date(downtimeForm.startTime || new Date()).getTime() + parseFloat(downtimeForm.duration) * 3600000).toISOString(),
      duration: parseFloat(downtimeForm.duration) || 0,
      reason: downtimeForm.reason,
      type: downtimeForm.type
    });
    // Set vehicle status to breakdown if unplanned breakdown
    if (downtimeForm.type === 'UNPLANNED') {
      updateMachineStatus(downtimeForm.machineId, 'BREAKDOWN');
    } else {
      updateMachineStatus(downtimeForm.machineId, 'MAINTENANCE');
    }
    addToast('Downtime event logged', 'success');
    setModal(false);
  };

  const TABS = [
    { id: 'machines', label: 'Fleet & Machinery', icon: Truck },
    { id: 'workorders', label: 'Service Work Orders', icon: ClipboardList },
    { id: 'downtime', label: 'Breakdown Logs', icon: AlertCircle }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Fleet & Operations</h1>
          <p className="text-sm text-muted mt-1">Vehicle maintenance schedules, machinery servicing, and breakdown logs</p>
        </div>
        <button onClick={handleOpenAddModal} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> {activeTab === 'machines' ? 'Register Fleet' : activeTab === 'workorders' ? 'New Service Order' : 'Log Breakdown'}
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Fleet Size', value: machines.length, color: 'text-indigo-400', desc: 'Vehicles & warehouse machinery' },
          { label: 'Active Fleet', value: machines.filter(m => m.status === 'RUNNING').length, color: 'text-emerald-400', desc: 'Operating normally' },
          { label: 'Pending Service Orders', value: workOrders.filter(w => w.status !== 'COMPLETED').length, color: 'text-amber-400', desc: 'Awaiting completion' }
        ].map(s => (
          <div key={s.label} className="theme-card p-4">
            <p className="text-xs text-dimmed">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted mt-1">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 bg-surface p-1 rounded-xl w-fit border border-main">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-muted hover:text-main'}`}>
              <Icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. Fleet & Machinery List */}
      {activeTab === 'machines' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines.map(machine => (
            <div key={machine.id} className="theme-card p-5 hover:border-indigo-500/30 transition-all relative overflow-hidden group">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-main group-hover:text-indigo-400 transition-colors">{machine.name}</h4>
                  <span className="text-xs text-muted font-mono">{machine.type}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  machine.status === 'RUNNING' ? 'bg-emerald-500/10 text-emerald-400' :
                  machine.status === 'MAINTENANCE' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-rose-500/10 text-rose-400'
                }`}>{machine.status}</span>
              </div>
              <div className="space-y-2 text-xs border-t border-main/30 pt-3 mt-3">
                <div className="flex justify-between"><span className="text-dimmed">Current Location:</span><span className="text-main">{machine.location}</span></div>
                <div className="flex justify-between"><span className="text-dimmed">Payload Capacity:</span><span className="text-main font-data">{machine.capacity}</span></div>
                <div className="flex justify-between"><span className="text-dimmed">Current Load:</span><span className="text-main font-data">{machine.currentLoad}</span></div>
                <div className="flex justify-between"><span className="text-dimmed">Operating Efficiency:</span><span className="text-main font-data">{machine.efficiency}%</span></div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-main/20 justify-end">
                {machine.status !== 'RUNNING' && (
                  <button onClick={() => { updateMachineStatus(machine.id, 'RUNNING'); addToast(`${machine.name} status updated to RUNNING`, 'success'); }}
                    className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded hover:bg-emerald-500/20 transition-all">
                    Set Running
                  </button>
                )}
                {machine.status !== 'MAINTENANCE' && (
                  <button onClick={() => { updateMachineStatus(machine.id, 'MAINTENANCE'); addToast(`${machine.name} sent to MAINTENANCE`, 'info'); }}
                    className="text-xs px-2 py-1 bg-amber-500/10 text-amber-400 rounded hover:bg-amber-500/20 transition-all">
                    Send to Service
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Service Work Orders Tab */}
      {activeTab === 'workorders' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main flex items-center justify-between">
            <h3 className="text-sm font-semibold text-main">Service & Maintenance Work Orders ({workOrders.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-dimmed border-b border-main bg-surface/50">
                  <th className="px-4 py-3">Order Number</th>
                  <th className="px-4 py-3">Vehicle/Equipment</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Timeline</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map(wo => (
                  <tr key={wo.id} className="border-b border-main hover:bg-surface/40 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-indigo-400">{wo.orderNumber}</td>
                    <td className="px-4 py-3 text-sm text-main font-semibold">{wo.productName}</td>
                    <td className="px-4 py-3 text-xs text-muted max-w-xs truncate" title={wo.description || wo.notes}>{wo.description || 'Routine maintenance check'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        wo.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400' :
                        wo.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-sky-500/10 text-sky-400'
                      }`}>{wo.priority}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      <div className="flex items-center gap-1"><Calendar className="w-3 h-3 text-dimmed" /> {wo.startDate} → {wo.dueDate}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        wo.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                        wo.status === 'IN_PROGRESS' ? 'bg-sky-500/10 text-sky-400' :
                        'bg-surface text-dimmed'
                      }`}>{wo.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {wo.status === 'PENDING' && (
                        <button onClick={() => { updateWorkOrderStatus(wo.id, 'IN_PROGRESS'); addToast('Service order started', 'info'); }}
                          className="text-indigo-400 hover:underline flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> Start Service
                        </button>
                      )}
                      {wo.status === 'IN_PROGRESS' && (
                        <button onClick={() => { 
                          updateWorkOrderStatus(wo.id, 'COMPLETED');
                          // Also restore machine back to running
                          const order = workOrders.find(o => o.id === wo.id);
                          if (order && order.productId) {
                            updateMachineStatus(order.productId, 'RUNNING');
                          }
                          addToast('Service order marked completed. Vehicle is back in service.', 'success'); 
                        }}
                          className="text-emerald-400 hover:underline flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" /> Mark Completed
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {workOrders.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-sm text-dimmed">No service orders logged</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Breakdown & Downtime Logs Tab */}
      {activeTab === 'downtime' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Breakdown & Downtime Logs ({downtimeLogs.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-dimmed border-b border-main bg-surface/50">
                  <th className="px-4 py-3">Vehicle/Equipment</th>
                  <th className="px-4 py-3">Event Type</th>
                  <th className="px-4 py-3">Reason / Details</th>
                  <th className="px-4 py-3">Breakdown Start</th>
                  <th className="px-4 py-3 text-right">Duration (hours)</th>
                </tr>
              </thead>
              <tbody>
                {downtimeLogs.map(log => {
                  const mObj = machines.find(m => m.id === log.machineId);
                  return (
                    <tr key={log.id} className="border-b border-main hover:bg-surface/40 transition-colors">
                      <td className="px-4 py-3 text-sm text-main font-semibold">{mObj?.name || 'Unknown Fleet Item'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          log.type === 'PLANNED' ? 'bg-sky-500/10 text-sky-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {log.type === 'PLANNED' ? 'Planned Service' : 'Unplanned Breakdown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted max-w-xs truncate">{log.reason}</td>
                      <td className="px-4 py-3 text-xs text-muted">{new Date(log.startTime).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-sm font-data text-main font-bold">{log.duration} hrs</td>
                    </tr>
                  );
                })}
                {downtimeLogs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-sm text-dimmed">No breakdown/downtime incidents logged</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Modals */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={formType === 'machine' ? 'Register New Fleet Asset' : formType === 'workorder' ? 'Create Service Work Order' : 'Log Fleet Breakdown'}>
        {formType === 'machine' && (
          <div className="space-y-4">
            <div><label className="form-label">Asset Name</label>
              <input className="form-input" value={machineForm.name} onChange={e => setMachineForm({...machineForm, name: e.target.value})} placeholder="e.g., Freightliner Cascadia #106" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Asset Type</label>
                <select className="form-input" value={machineForm.type} onChange={e => setMachineForm({...machineForm, type: e.target.value})}>
                  <option value="Heavy Truck">Heavy Truck</option>
                  <option value="Medium Delivery Van">Medium Delivery Van</option>
                  <option value="Warehouse Forklift">Warehouse Forklift</option>
                  <option value="Refrigerated Truck">Refrigerated Truck</option>
                  <option value="Packaging Equipment">Packaging Equipment</option>
                </select>
              </div>
              <div><label className="form-label">Location / Base</label>
                <input className="form-input" value={machineForm.location} onChange={e => setMachineForm({...machineForm, location: e.target.value})} placeholder="e.g., Sector 4 Warehouse" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Payload Capacity</label>
                <input className="form-input" value={machineForm.capacity} onChange={e => setMachineForm({...machineForm, capacity: e.target.value})} placeholder="e.g., 20 Ton" />
              </div>
              <div><label className="form-label">Current Load</label>
                <input className="form-input" value={machineForm.currentLoad} onChange={e => setMachineForm({...machineForm, currentLoad: e.target.value})} placeholder="e.g., 15 Ton" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleAddMachine} className="btn-primary text-sm">Register Asset</button>
            </div>
          </div>
        )}

        {formType === 'workorder' && (
          <div className="space-y-4">
            <div><label className="form-label">Select Fleet Vehicle / Machinery</label>
              <select className="form-input" value={workOrderForm.machineId} onChange={e => setWorkOrderForm({...workOrderForm, machineId: e.target.value})}>
                <option value="">Select asset...</option>
                {machines.map(m => <option key={m.id} value={m.id}>{m.name} ({m.type}) · {m.status}</option>)}
              </select>
            </div>
            <div><label className="form-label">Service Priority</label>
              <select className="form-input" value={workOrderForm.priority} onChange={e => setWorkOrderForm({...workOrderForm, priority: e.target.value})}>
                <option value="LOW">Low - Routine Check</option>
                <option value="MEDIUM">Medium - Performance Issue</option>
                <option value="HIGH">High - Immediate Repair</option>
              </select>
            </div>
            <div><label className="form-label">Work Description</label>
              <textarea className="form-input" rows={2} value={workOrderForm.description} onChange={e => setWorkOrderForm({...workOrderForm, description: e.target.value})} placeholder="Describe service and part replacements required..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Start Date</label>
                <input type="date" className="form-input" value={workOrderForm.startDate} onChange={e => setWorkOrderForm({...workOrderForm, startDate: e.target.value})} />
              </div>
              <div><label className="form-label">Due Date</label>
                <input type="date" className="form-input" value={workOrderForm.dueDate} onChange={e => setWorkOrderForm({...workOrderForm, dueDate: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleAddWorkOrder} className="btn-primary text-sm">Create Work Order</button>
            </div>
          </div>
        )}

        {formType === 'downtime' && (
          <div className="space-y-4">
            <div><label className="form-label">Select Affected Fleet Asset</label>
              <select className="form-input" value={downtimeForm.machineId} onChange={e => setDowntimeForm({...downtimeForm, machineId: e.target.value})}>
                <option value="">Select asset...</option>
                {machines.map(m => <option key={m.id} value={m.id}>{m.name} ({m.type}) · {m.status}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Breakdown Category</label>
                <select className="form-input" value={downtimeForm.type} onChange={e => setDowntimeForm({...downtimeForm, type: e.target.value})}>
                  <option value="UNPLANNED">Unplanned Breakdown</option>
                  <option value="PLANNED">Planned Maintenance</option>
                </select>
              </div>
              <div><label className="form-label">Downtime Duration (hours)</label>
                <input type="number" step="0.5" className="form-input" value={downtimeForm.duration} onChange={e => setDowntimeForm({...downtimeForm, duration: e.target.value})} placeholder="e.g., 4" />
              </div>
            </div>
            <div><label className="form-label">Incidence Start Time</label>
              <input type="datetime-local" className="form-input" value={downtimeForm.startTime} onChange={e => setDowntimeForm({...downtimeForm, startTime: e.target.value})} />
            </div>
            <div><label className="form-label">Breakdown Reason / Cause</label>
              <textarea className="form-input" rows={2} value={downtimeForm.reason} onChange={e => setDowntimeForm({...downtimeForm, reason: e.target.value})} placeholder="e.g., Clutch failure on highway, engine cooling breakdown..." />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleAddDowntime} className="btn-primary text-sm">Log Breakdown</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}