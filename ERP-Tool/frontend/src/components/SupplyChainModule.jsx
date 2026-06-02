import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';

const STATUS_COLORS = {
  DISPATCHED: 'text-sky-400 bg-sky-500/10',
  IN_TRANSIT: 'text-amber-400 bg-amber-500/10',
  DELIVERED: 'text-emerald-400 bg-emerald-500/10',
  RETURNED: 'text-rose-400 bg-rose-500/10',
};

export default function SupplyChainModule() {
  const { shipments, addShipment, updateShipmentStatus, fieldWorkOrders, addToast } = useERPStore();
  const [activeTab, setActiveTab] = useState('shipments');
  const [shipModal, setShipModal] = useState(false);
  const [form, setForm] = useState({ trackingNo: '', carrier: '', origin: '', destination: '', orderId: '' });

  const handleAdd = () => {
    if (!form.carrier || !form.destination) return addToast('Carrier and destination required', 'error');
    addShipment({ ...form, trackingNo: form.trackingNo || `TRK-${Date.now()}`, dispatchedAt: new Date().toISOString() });
    addToast('Shipment created', 'success');
    setShipModal(false);
    setForm({ trackingNo: '', carrier: '', origin: '', destination: '', orderId: '' });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Supply Chain & Logistics</h1>
          <p className="text-sm text-muted mt-1">Shipment tracking, field work orders, and logistics</p>
        </div>
        <button onClick={() => setShipModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Shipment
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Shipments', value: shipments.length, color: 'text-indigo-400' },
          { label: 'In Transit', value: shipments.filter(s => s.status === 'IN_TRANSIT' || s.status === 'DISPATCHED').length, color: 'text-amber-400' },
          { label: 'Delivered', value: shipments.filter(s => s.status === 'DELIVERED').length, color: 'text-emerald-400' },
          { label: 'Work Orders', value: fieldWorkOrders?.length || 0, color: 'text-violet-400' },
        ].map(s => (
          <div key={s.label} className="theme-card p-4">
            <p className="text-xs text-dimmed">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-surface p-1 rounded-xl w-fit border border-main">
        {['shipments', 'work-orders'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab ? 'bg-indigo-600 text-white' : 'text-muted hover:text-main'
            }`}
          >
            {tab === 'work-orders' ? 'Work Orders' : 'Shipments'}
          </button>
        ))}
      </div>

      {activeTab === 'shipments' && (
        <div className="theme-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-dimmed border-b border-main">
                  <th className="px-4 py-2.5">Tracking No</th>
                  <th className="px-4 py-2.5">Carrier</th>
                  <th className="px-4 py-2.5">Origin → Destination</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map(s => (
                  <tr key={s.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-indigo-400">{s.trackingNo}</td>
                    <td className="px-4 py-2.5 text-sm text-main">{s.carrier}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{s.origin} → {s.destination}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status] || 'text-dimmed bg-surface'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 flex gap-2">
                      {s.status === 'DISPATCHED' && (
                        <button onClick={() => { updateShipmentStatus(s.id, 'IN_TRANSIT'); addToast('Shipment in transit', 'info'); }} className="text-xs text-amber-400 hover:underline">In Transit</button>
                      )}
                      {s.status === 'IN_TRANSIT' && (
                        <button onClick={() => { updateShipmentStatus(s.id, 'DELIVERED'); addToast('Shipment delivered!', 'success'); }} className="text-xs text-emerald-400 hover:underline">Delivered</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'work-orders' && (
        <div className="theme-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-dimmed border-b border-main">
                  <th className="px-4 py-2.5">WO No</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Location</th>
                  <th className="px-4 py-2.5">Priority</th>
                  <th className="px-4 py-2.5">Scheduled</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {(fieldWorkOrders || []).map(wo => (
                  <tr key={wo.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-indigo-400">{wo.woNo}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{wo.type}</td>
                    <td className="px-4 py-2.5 text-sm text-main">{wo.location}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        wo.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400' :
                        wo.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-sky-500/10 text-sky-400'
                      }`}>{wo.priority}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{wo.scheduledDate}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        wo.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                        wo.status === 'IN_PROGRESS' ? 'bg-sky-500/10 text-sky-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>{wo.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={shipModal} onClose={() => setShipModal(false)} title="New Shipment">
        <div className="space-y-4">
          <div><label className="form-label">Carrier</label>
            <input className="form-input" value={form.carrier} onChange={e => setForm({...form, carrier: e.target.value})} placeholder="e.g. BlueDart, FedEx" />
          </div>
          <div><label className="form-label">Tracking Number (optional)</label>
            <input className="form-input" value={form.trackingNo} onChange={e => setForm({...form, trackingNo: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Origin</label>
              <input className="form-input" value={form.origin} onChange={e => setForm({...form, origin: e.target.value})} />
            </div>
            <div><label className="form-label">Destination</label>
              <input className="form-input" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setShipModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAdd} className="btn-primary text-sm">Create Shipment</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}