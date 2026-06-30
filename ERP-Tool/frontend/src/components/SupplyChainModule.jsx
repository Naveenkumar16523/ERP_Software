import React, { useState, useEffect, useRef } from 'react';
import { Plus, Truck, Map as MapIcon, PenTool, CheckCircle, Package } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import { useOrders, useCreateOrder, useShipments, useCreateShipment, useCarriers, useCreateCarrier, useUpdateShipmentStatus, useUpdateShipmentPod } from '../hooks/useSupplyChain';
import Modal from './ui/Modal';
import api from '../utils/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon issue
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

const STATUS_COLORS = {
  Pending: 'text-amber-400 bg-amber-500/10',
  'In Transit': 'text-sky-400 bg-sky-500/10',
  Delivered: 'text-emerald-400 bg-emerald-500/10'
};

export default function SupplyChainModule() {
  const { addToast } = useERPStore();
  const { data: shipments = [] } = useShipments();
  const { data: vehicles = [] } = useCarriers();
  const createShipment = useCreateShipment();
  const createCarrier = useCreateCarrier();
  const updateShipmentStatus = useUpdateShipmentStatus();
  const updateShipmentPod = useUpdateShipmentPod();
  const [activeTab, setActiveTab] = useState('shipments');
  

  // Modals
  const [vehicleModal, setVehicleModal] = useState(false);
  const [shipModal, setShipModal] = useState(false);
  const [podModal, setPodModal] = useState(false);
  
  const [newVehicle, setNewVehicle] = useState({ registrationNumber: '', vehicleType: 'Truck' });
  const [newShipment, setNewShipment] = useState({ trackingNumber: '', origin: '', destination: '', vehicleId: '' });
  
  const [selectedShipmentForPod, setSelectedShipmentForPod] = useState(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);


  const handleAddVehicle = async () => {
    if (!newVehicle.registrationNumber) return addToast('Registration required', 'error');
    try {
      await createCarrier.mutateAsync(newVehicle);
      addToast('Vehicle added', 'success');
      setVehicleModal(false);
      setNewVehicle({ registrationNumber: '', vehicleType: 'Truck' });
    } catch (err) {
      addToast(err.message || 'Failed to add vehicle', 'error');
    }
  };

  const handleAddShipment = async () => {
    if (!newShipment.trackingNumber || !newShipment.origin || !newShipment.destination) return addToast('All fields required', 'error');
    try {
      await createShipment.mutateAsync(newShipment);
      addToast('Shipment created', 'success');
      setShipModal(false);
      setNewShipment({ trackingNumber: '', origin: '', destination: '', vehicleId: '' });
    } catch (err) {
      addToast(err.message || 'Failed to create shipment', 'error');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (status === 'Delivered') {
      setSelectedShipmentForPod(id);
      setPodModal(true);
      return;
    }
    try {
      await updateShipmentStatus.mutateAsync({ id, status });
      addToast(`Status updated to ${status}`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update status', 'error');
    }
  };

  // Canvas Drawing
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };
  
  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  
  const stopDrawing = () => {
    setIsDrawing(false);
  };
  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Setup canvas Context when podModal opens
  useEffect(() => {
    if (podModal && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000';
    }
  }, [podModal]);

  const submitPod = async () => {
    if (!selectedShipmentForPod || !canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    
    // Quick check to see if canvas is empty (simplified)
    const ctx = canvasRef.current.getContext('2d');
    const pixelBuffer = new Uint32Array(ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height).data.buffer);
    if (!pixelBuffer.some(color => color !== 0)) {
      return addToast('Please sign before submitting', 'error');
    }
    
    try {
      await updateShipmentPod.mutateAsync({ id: selectedShipmentForPod, signatureData: dataUrl });
      addToast('POD submitted successfully', 'success');
      setPodModal(false);
      setSelectedShipmentForPod(null);
    } catch(err) {
      addToast(err.message || 'Failed to submit POD', 'error');
    }
  };

  const TABS = [
    { id: 'shipments', label: 'Shipments & POD', icon: Package },
    { id: 'gps', label: 'Live Fleet (GPS)', icon: MapIcon },
    { id: 'vehicles', label: 'Fleet Vehicles', icon: Truck },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Supply Chain & Fleet</h1>
          <p className="text-sm text-muted mt-1">Live tracking, shipments, and fleet management</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setVehicleModal(true)} className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary-hover border-primary/20 transition-all">
            <Plus className="w-4 h-4" /> New Vehicle
          </button>
          <button onClick={() => setShipModal(true)} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary-hover border-primary/20 transition-all duration-300">
            <Plus className="w-4 h-4" /> New Shipment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Shipments', value: shipments.length, color: 'text-indigo-400' },
          { label: 'In Transit', value: shipments.filter(s => s.status === 'In Transit').length, color: 'text-sky-400' },
          { label: 'Delivered', value: shipments.filter(s => s.status === 'Delivered').length, color: 'text-emerald-400' },
          { label: 'Fleet Vehicles', value: vehicles.length, color: 'text-amber-400' },
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-primary text-white' : 'text-muted hover:text-main'}`}>
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
                  <th className="px-4 py-2.5">Origin → Destination</th>
                  <th className="px-4 py-2.5">Vehicle ID</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">POD</th>
                  <th className="px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map(s => {
                  const vehicle = vehicles.find(v => v.id === s.vehicleId);
                  return (
                    <tr key={s.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                      <td className="px-4 py-2.5 text-xs font-mono text-primary">{s.trackingNumber}</td>
                      <td className="px-4 py-2.5 text-xs text-muted">{s.origin} → {s.destination}</td>
                      <td className="px-4 py-2.5 text-xs text-main">{vehicle ? vehicle.registrationNumber : '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status] || 'text-dimmed bg-surface'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {s.podSignature ? (
                           <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : '—'}
                      </td>
                      <td className="px-4 py-2.5 flex gap-2">
                        {s.status === 'Pending' && (
                          <button onClick={() => handleUpdateStatus(s.id, 'In Transit')} className="text-xs text-sky-400 hover:underline">Mark In Transit</button>
                        )}
                        {s.status === 'In Transit' && (
                          <button onClick={() => handleUpdateStatus(s.id, 'Delivered')} className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
                            <PenTool className="w-3 h-3" /> Collect POD
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'gps' && (
        <div className="theme-card overflow-hidden h-[500px] relative">
          <div className="absolute top-4 left-4 z-[400] bg-surface/90 backdrop-blur border border-main p-3 rounded-lg shadow-lg">
            <h3 className="text-sm font-semibold text-main mb-2">Live Fleet (Simulated)</h3>
            <p className="text-xs text-dimmed">Tracking {vehicles.filter(v => v.currentLocation).length} active vehicles</p>
          </div>
          
          <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {vehicles.map(v => {
              if (!v.currentLocation) return null;
              const [latStr, lngStr] = v.currentLocation.split(',');
              const lat = parseFloat(latStr);
              const lng = parseFloat(lngStr);
              if (isNaN(lat) || isNaN(lng)) return null;
              
              return (
                <Marker key={v.id} position={[lat, lng]}>
                  <Popup>
                    <div className="font-sans">
                      <strong>{v.registrationNumber}</strong><br/>
                      {v.vehicleType}<br/>
                      Status: {v.status}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      )}

      {activeTab === 'vehicles' && (
        <div className="theme-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Registration</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Last Known Location</th>
              </tr></thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main font-semibold">{v.registrationNumber}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{v.vehicleType}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-sky-500/10 text-sky-400'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted font-mono">{v.currentLocation || 'Unknown'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={shipModal} onClose={() => setShipModal(false)} title="New Shipment">
        <div className="space-y-4">
          <div><label className="form-label">Tracking Number</label>
            <input className="form-input" value={newShipment.trackingNumber} onChange={e => setNewShipment({...newShipment, trackingNumber: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Origin</label>
              <input className="form-input" value={newShipment.origin} onChange={e => setNewShipment({...newShipment, origin: e.target.value})} />
            </div>
            <div><label className="form-label">Destination</label>
              <input className="form-input" value={newShipment.destination} onChange={e => setNewShipment({...newShipment, destination: e.target.value})} />
            </div>
          </div>
          <div><label className="form-label">Assign Vehicle (Optional)</label>
            <select className="form-input" value={newShipment.vehicleId} onChange={e => setNewShipment({...newShipment, vehicleId: e.target.value})}>
              <option value="">None</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.registrationNumber} ({v.vehicleType})</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setShipModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Cancel</button>
            <button onClick={handleAddShipment} className="btn-primary text-sm">Create</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={vehicleModal} onClose={() => setVehicleModal(false)} title="New Fleet Vehicle">
        <div className="space-y-4">
          <div><label className="form-label">Registration Number</label>
            <input className="form-input" value={newVehicle.registrationNumber} onChange={e => setNewVehicle({...newVehicle, registrationNumber: e.target.value})} />
          </div>
          <div><label className="form-label">Vehicle Type</label>
            <select className="form-input" value={newVehicle.vehicleType} onChange={e => setNewVehicle({...newVehicle, vehicleType: e.target.value})}>
              <option>Truck</option>
              <option>Van</option>
              <option>Refrigerated Truck</option>
              <option>Flatbed</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setVehicleModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Cancel</button>
            <button onClick={handleAddVehicle} className="btn-primary text-sm">Create</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={podModal} onClose={() => setPodModal(false)} title="Proof Of Delivery (Signature)">
        <div className="space-y-4">
          <p className="text-xs text-muted">Please ask the recipient to sign below to confirm delivery.</p>
          <div className="border border-main rounded-xl bg-white overflow-hidden touch-none" style={{ height: '200px' }}>
            <canvas
              ref={canvasRef}
              width={400}
              height={200}
              className="w-full h-full cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          <div className="flex justify-between items-center pt-2">
            <button onClick={clearCanvas} className="text-xs text-rose-400 hover:underline">Clear Signature</button>
            <div className="flex gap-2">
              <button onClick={() => setPodModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Cancel</button>
              <button onClick={submitPod} className="btn-primary text-sm">Submit POD</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}