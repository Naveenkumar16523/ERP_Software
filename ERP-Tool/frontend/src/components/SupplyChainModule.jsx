import React, { useState } from 'react';
import { Plus, Truck, Map, Building2 } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';

const STATUS_COLORS = {
  DISPATCHED: 'text-sky-400 bg-sky-500/10',
  IN_TRANSIT: 'text-amber-400 bg-amber-500/10',
  DELIVERED: 'text-emerald-400 bg-emerald-500/10',
  RETURNED: 'text-rose-400 bg-rose-500/10',
  PENDING: 'text-amber-500/10 text-amber-400',
};

export default function SupplyChainModule() {
  const {
    shipments, addShipment, updateShipmentStatus,
    carriers, addCarrier,
    routes, addRoute,
    fieldWorkOrders, addToast
  } = useERPStore();

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

  const TABS = [
    { id: 'shipments', label: 'Shipments', icon: Truck },
    { id: 'carriers', label: 'Carriers', icon: Building2 },
    { id: 'routes', label: 'Routes', icon: Map },
    { id: 'work-orders', label: 'Work Orders', icon: Building2 }
  ];

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

      {activeTab === 'carriers' && (
        <div className="theme-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Carrier Name</th>
                <th className="px-4 py-2.5">Contact</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5 text-right">Rating</th>
                <th className="px-4 py-2.5 text-right">Active Shipments</th>
                <th className="px-4 py-2.5 text-right">On-Time Rate</th>
              </tr></thead>
              <tbody>
                {carriers.map(carrier => (
                  <tr key={carrier.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{carrier.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{carrier.contact}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{carrier.email}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{carrier.rating} ⭐</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{carrier.activeShipments}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{carrier.onTimeRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'routes' && (
        <div className="theme-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Origin</th>
                <th className="px-4 py-2.5">Destination</th>
                <th className="px-4 py-2.5 text-right">Distance (km)</th>
                <th className="px-4 py-2.5 text-right">Est. Time (hrs)</th>
                <th className="px-4 py-2.5">Preferred Carrier</th>
                <th className="px-4 py-2.5 text-right">Cost/km</th>
              </tr></thead>
              <tbody>
                {routes.map(route => (
                  <tr key={route.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{route.origin}</td>
                    <td className="px-4 py-2.5 text-sm text-main">{route.destination}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{route.distance}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{route.estimatedTime}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{route.preferredCarrier}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{route.costPerKm}</td>
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