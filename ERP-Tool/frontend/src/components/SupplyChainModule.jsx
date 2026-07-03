import React, { useState, useEffect, useRef } from 'react';
import { Plus, Truck, Map as MapIcon, PenTool, CheckCircle, Package, Users, Route, FileText, Settings } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import { useOrders, useCreateOrder, useShipments, useCreateShipment, useCarriers, useCreateCarrier, useUpdateShipmentStatus, useUpdateShipmentPod, useDrivers, useCreateDriver, useUpdateDriver, useStartDuty, useEndDuty, useTrips, useCreateTrip, useUpdateTrip, useAssignShipmentToTrip, useLorryReceipts, useCreateLorryReceipt, downloadLRPdf, useVehicleMaintenance, useCreateMaintenance, useUpdateMaintenance } from '../hooks/useSupplyChain';
import { useCompliance } from '../hooks/useCompliance';
import Modal from './ui/Modal';
import ExportExcelButton from './ui/ExportExcelButton';
import api from '../utils/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon issue
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
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
  const { data: drivers = [] } = useDrivers();
  const { data: trips = [] } = useTrips();
  const { data: lorryReceipts = [] } = useLorryReceipts();
  const { data: maintenanceLogs = [] } = useVehicleMaintenance();
  
  const { getEwayBills, createEwayBill, downloadEwayBillPdf } = useCompliance();
  const { data: ewaybills = [] } = getEwayBills;

  const createShipment = useCreateShipment();
  const createCarrier = useCreateCarrier();
  const updateShipmentStatus = useUpdateShipmentStatus();
  const updateShipmentPod = useUpdateShipmentPod();
  const createDriver = useCreateDriver();
  const createTrip = useCreateTrip();
  const updateDriver = useUpdateDriver();
  const startDuty = useStartDuty();
  const endDuty = useEndDuty();
  const updateTrip = useUpdateTrip();
  const assignShipmentToTrip = useAssignShipmentToTrip();
  const createLorryReceipt = useCreateLorryReceipt();
  const createMaintenance = useCreateMaintenance();
  const updateMaintenance = useUpdateMaintenance();

  const [activeTab, setActiveTab] = useState('shipments');
  
  // Modals
  const [vehicleModal, setVehicleModal] = useState(false);
  const [shipModal, setShipModal] = useState(false);
  const [podModal, setPodModal] = useState(false);
  const [driverModal, setDriverModal] = useState(false);
  const [tripModal, setTripModal] = useState(false);
  const [lrModal, setLrModal] = useState(false);
  const [ewbModal, setEwbModal] = useState(false);
  const [maintModal, setMaintModal] = useState(false);
  
  const [newVehicle, setNewVehicle] = useState({ registrationNumber: '', vehicleType: 'Truck' });
  const [newShipment, setNewShipment] = useState({ trackingNumber: '', origin: '', destination: '', vehicleId: '', tripId: '' });
  const [newDriver, setNewDriver] = useState({ name: '', licenseNumber: '', licenseExpiryDate: '', phone: '', assignedVehicleId: '' });
  const [newTrip, setNewTrip] = useState({ vehicleId: '', driverId: '', origin: '', destination: '' });
  const [newLR, setNewLR] = useState({ lrNumber: `LR-${Date.now()}`, consignor: '', consignee: '', goodsDescription: '', weight: '', freightTerms: 'TO PAY', amount: '' });
  const [newEWB, setNewEWB] = useState({ ewayBillNumber: '', fromGstin: '', toGstin: '', fromAddress: '', toAddress: '', goodsValue: '', hsnCode: '', distanceKm: '' });
  const [newMaint, setNewMaint] = useState({ vehicleId: '', description: '', cost: '', scheduledDate: '' });
  
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
      setNewShipment({ trackingNumber: '', origin: '', destination: '', vehicleId: '', tripId: '' });
    } catch (err) {
      addToast(err.message || 'Failed to create shipment', 'error');
    }
  };

  const handleAddDriver = async () => {
    if (!newDriver.name || !newDriver.licenseNumber) return addToast('Name and License required', 'error');
    try {
      await createDriver.mutateAsync({ ...newDriver, licenseExpiryDate: newDriver.licenseExpiryDate ? new Date(newDriver.licenseExpiryDate).toISOString() : new Date().toISOString() });
      addToast('Driver added', 'success');
      setDriverModal(false);
      setNewDriver({ name: '', licenseNumber: '', licenseExpiryDate: '', phone: '', assignedVehicleId: '' });
    } catch (err) {
      addToast(err.message || 'Failed to add driver', 'error');
    }
  };

  const handleAddTrip = async () => {
    if (!newTrip.vehicleId || !newTrip.driverId || !newTrip.origin || !newTrip.destination) return addToast('All fields required', 'error');
    try {
      await createTrip.mutateAsync(newTrip);
      addToast('Trip created', 'success');
      setTripModal(false);
      setNewTrip({ vehicleId: '', driverId: '', origin: '', destination: '' });
    } catch (err) {
      addToast(err.message || 'Failed to create trip', 'error');
    }
  };

  const handleAddLR = async () => {
    if (!newLR.lrNumber || !newLR.consignor || !newLR.consignee) return addToast('Required fields missing', 'error');
    try {
      await createLorryReceipt.mutateAsync(newLR);
      addToast('Lorry Receipt Created', 'success');
      setLrModal(false);
      setNewLR({ lrNumber: `LR-${Date.now()}`, consignor: '', consignee: '', goodsDescription: '', weight: '', freightTerms: 'TO PAY', amount: '' });
    } catch (err) {
      addToast(err.message || 'Failed to create LR', 'error');
    }
  };

  const handleAddEWB = async () => {
    if (!newEWB.fromGstin || !newEWB.toGstin || !newEWB.goodsValue || !newEWB.hsnCode) return addToast('Required fields missing', 'error');
    try {
      await createEwayBill.mutateAsync(newEWB);
      addToast('E-Way Bill Created', 'success');
      setEwbModal(false);
      setNewEWB({ ewayBillNumber: '', fromGstin: '', toGstin: '', fromAddress: '', toAddress: '', goodsValue: '', hsnCode: '', distanceKm: '' });
    } catch (err) {
      addToast(err.message || 'Failed to create E-Way Bill', 'error');
    }
  };

  const handleAddMaintenance = async () => {
    if (!newMaint.vehicleId || !newMaint.description || !newMaint.scheduledDate) return addToast('Required fields missing', 'error');
    try {
      await createMaintenance.mutateAsync({
        ...newMaint,
        scheduledDate: new Date(newMaint.scheduledDate).toISOString()
      });
      addToast('Maintenance log created', 'success');
      setMaintModal(false);
      setNewMaint({ vehicleId: '', description: '', cost: '', scheduledDate: '' });
    } catch (err) {
      addToast(err.message || 'Failed to create maintenance log', 'error');
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
    { id: 'trips', label: 'Trips & Routes', icon: Route },
    { id: 'drivers', label: 'Drivers', icon: Users },
    { id: 'fleet', label: 'Fleet & Tracking', icon: Truck },
    { id: 'lr', label: 'Lorry Receipts', icon: FileText },
    { id: 'ewaybills', label: 'E-Way Bills', icon: FileText },
    { id: 'maintenance', label: 'Maintenance', icon: Settings }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Supply Chain & Logistics</h1>
          <p className="text-sm text-muted mt-1">Manage fleet, tracking, trips, PODs, and LRs</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'shipments' && (
            <button onClick={() => setShipModal(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Shipment
            </button>
          )}
          {activeTab === 'fleet' && (
            <button onClick={() => setVehicleModal(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Vehicle
            </button>
          )}
          {activeTab === 'drivers' && (
            <button onClick={() => setDriverModal(true)} className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary-hover border-primary/20 transition-all">
              <Plus className="w-4 h-4" /> New Driver
            </button>
          )}
          {activeTab === 'lr' && (
            <button onClick={() => setLrModal(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Lorry Receipt
            </button>
          )}
          {activeTab === 'ewaybills' && (
            <button onClick={() => setEwbModal(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Generate EWB
            </button>
          )}
          {activeTab === 'maintenance' && (
            <button onClick={() => setMaintModal(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Schedule Maintenance
            </button>
          )}
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
          <div className="flex items-center justify-between p-4 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Shipments</h3>
            <ExportExcelButton data={shipments} />
          </div>
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
                      <td className="px-4 py-2.5 flex gap-2 items-center">
                        {s.status === 'Pending' && (
                           <>
                             <button onClick={() => handleUpdateStatus(s.id, 'In Transit')} className="text-xs text-sky-400 hover:underline">Mark In Transit</button>
                             <select 
                               className="form-input py-1 px-2 text-xs w-28 h-7 ml-2" 
                               value={s.tripId || ''} 
                               onChange={(e) => assignShipmentToTrip.mutate({ id: s.id, tripId: e.target.value })}
                             >
                               <option value="">Assign Trip...</option>
                               {trips.filter(t => t.status !== 'Completed').map(t => (
                                 <option key={t.id} value={t.id}>{t.origin.slice(0,3)}→{t.destination.slice(0,3)}</option>
                               ))}
                             </select>
                           </>
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

      {activeTab === 'lr' && (
        <div className="theme-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Lorry Receipts</h3>
            <ExportExcelButton data={lorryReceipts} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-dimmed border-b border-main">
                  <th className="px-4 py-2.5">LR No</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Consignor</th>
                  <th className="px-4 py-2.5">Consignee</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lorryReceipts.map(lr => (
                  <tr key={lr.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-primary">{lr.lrNumber}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{new Date(lr.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2.5 text-xs text-main">{lr.consignor}</td>
                    <td className="px-4 py-2.5 text-xs text-main">{lr.consignee}</td>
                    <td className="px-4 py-2.5 text-right text-xs font-data">{lr.amount || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium text-emerald-400 bg-emerald-500/10">
                        {lr.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right flex justify-end gap-2">
                      <button onClick={() => downloadLRPdf(lr.id)} className="text-xs text-indigo-400 hover:underline">Download PDF</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ewaybills' && (
        <div className="theme-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-main">
            <h3 className="text-sm font-semibold text-main">E-Way Bills</h3>
            <ExportExcelButton data={ewaybills} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-dimmed border-b border-main">
                  <th className="px-4 py-2.5">EWB No</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">From GSTIN</th>
                  <th className="px-4 py-2.5">To GSTIN</th>
                  <th className="px-4 py-2.5 text-right">Value (Rs)</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ewaybills.map(ewb => (
                  <tr key={ewb.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-primary">{ewb.ewayBillNumber}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{new Date(ewb.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2.5 text-xs text-main">{ewb.fromGstin}</td>
                    <td className="px-4 py-2.5 text-xs text-main">{ewb.toGstin}</td>
                    <td className="px-4 py-2.5 text-right text-xs font-data">{ewb.goodsValue}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ewb.status === 'ACTIVE' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                        {ewb.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right flex justify-end gap-2">
                      <button onClick={() => downloadEwayBillPdf(ewb.id)} className="text-xs text-indigo-400 hover:underline">Download PDF</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="theme-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-dimmed border-b border-main">
                  <th className="px-4 py-2.5">Vehicle</th>
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5">Scheduled Date</th>
                  <th className="px-4 py-2.5">Cost</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceLogs.map(m => {
                  const v = vehicles.find(v => v.id === m.vehicleId);
                  return (
                    <tr key={m.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-main">{v ? v.registrationNumber : '—'}</td>
                      <td className="px-4 py-2.5 text-sm text-main">{m.description}</td>
                      <td className="px-4 py-2.5 text-xs text-muted">{new Date(m.scheduledDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5 text-xs text-main">{m.cost || '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 flex gap-2">
                        {m.status === 'Scheduled' && (
                           <button onClick={() => updateMaintenance.mutate({ id: m.id, status: 'Completed' })} className="text-xs text-emerald-400 hover:underline">Mark Completed</button>
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

      {activeTab === 'trips' && (
        <div className="theme-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-dimmed border-b border-main">
                  <th className="px-4 py-2.5">Trip ID</th>
                  <th className="px-4 py-2.5">Route</th>
                  <th className="px-4 py-2.5">Driver</th>
                  <th className="px-4 py-2.5">Vehicle</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Shipments</th>
                  <th className="px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trips.map(t => {
                  const d = drivers.find(d => d.id === t.driverId);
                  const v = vehicles.find(v => v.id === t.vehicleId);
                  const tripShipments = shipments.filter(s => s.tripId === t.id);
                  return (
                    <tr key={t.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-primary font-mono">{t.id.slice(0,8)}</td>
                      <td className="px-4 py-2.5 text-sm text-main">{t.origin} → {t.destination}</td>
                      <td className="px-4 py-2.5 text-xs text-muted">{d ? d.name : '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-muted">{v ? v.registrationNumber : '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-sky-500/10 text-sky-400'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted">{tripShipments.length}</td>
                      <td className="px-4 py-2.5 flex gap-2">
                        {t.status === 'Planned' && (
                           <button onClick={() => updateTrip.mutate({ id: t.id, status: 'In Progress' })} className="text-xs text-sky-400 hover:underline">Start</button>
                        )}
                        {t.status === 'In Progress' && (
                           <button onClick={() => updateTrip.mutate({ id: t.id, status: 'Completed' })} className="text-xs text-emerald-400 hover:underline">Complete</button>
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

      {activeTab === 'drivers' && (
        <div className="theme-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-dimmed border-b border-main">
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">License No</th>
                  <th className="px-4 py-2.5">Phone</th>
                  <th className="px-4 py-2.5">Assigned Vehicle</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => {
                  const v = vehicles.find(v => v.id === d.assignedVehicleId);
                  return (
                    <tr key={d.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                      <td className="px-4 py-2.5 text-sm text-main font-semibold">{d.name}</td>
                      <td className="px-4 py-2.5 text-xs text-muted font-mono">{d.licenseNumber}</td>
                      <td className="px-4 py-2.5 text-xs text-muted">{d.phone}</td>
                      <td className="px-4 py-2.5 text-xs text-main">{v ? v.registrationNumber : '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400' : d.status === 'On Duty' ? 'bg-amber-500/10 text-amber-400' : 'bg-surface text-dimmed'}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 flex gap-2">
                        {d.status === 'Available' ? (
                           <button onClick={() => startDuty.mutate({ id: d.id, startTime: new Date().toISOString() })} className="text-xs text-amber-400 hover:underline">Start Duty</button>
                        ) : d.status === 'On Duty' ? (
                           <button onClick={() => endDuty.mutate(d.id)} className="text-xs text-emerald-400 hover:underline">End Duty</button>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'fleet' && (
        <div className="space-y-6">
          <div className="theme-card overflow-hidden h-[500px] relative">
            <div className="absolute top-4 left-4 z-[400] bg-surface/90 backdrop-blur border border-main p-3 rounded-lg shadow-lg">
              <h3 className="text-sm font-semibold text-main mb-2">Live Fleet (Simulated)</h3>
              <p className="text-xs text-dimmed">Tracking {vehicles.filter(v => v.currentLocation).length} active vehicles</p>
            </div>
            
            <div className="w-full h-full bg-surface border border-main flex flex-col items-center justify-center text-muted relative z-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-main/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <p className="text-sm font-medium">Interactive Map view is currently in offline mode.</p>
              <p className="text-xs">Tracking {vehicles.filter(v => v.currentLocation).length} vehicles.</p>
            </div>
          </div>

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

      <Modal isOpen={driverModal} onClose={() => setDriverModal(false)} title="New Driver">
        <div className="space-y-4">
          <div><label className="form-label">Name</label>
            <input className="form-input" value={newDriver.name} onChange={e => setNewDriver({...newDriver, name: e.target.value})} />
          </div>
          <div><label className="form-label">License Number</label>
            <input className="form-input" value={newDriver.licenseNumber} onChange={e => setNewDriver({...newDriver, licenseNumber: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Phone</label>
              <input className="form-input" value={newDriver.phone} onChange={e => setNewDriver({...newDriver, phone: e.target.value})} />
            </div>
            <div><label className="form-label">Expiry Date</label>
              <input type="date" className="form-input" value={newDriver.licenseExpiryDate} onChange={e => setNewDriver({...newDriver, licenseExpiryDate: e.target.value})} />
            </div>
          </div>
          <div><label className="form-label">Assign Vehicle</label>
            <select className="form-input" value={newDriver.assignedVehicleId} onChange={e => setNewDriver({...newDriver, assignedVehicleId: e.target.value})}>
              <option value="">None</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.registrationNumber}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setDriverModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Cancel</button>
            <button onClick={handleAddDriver} className="btn-primary text-sm">Create</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={tripModal} onClose={() => setTripModal(false)} title="New Trip">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Origin</label>
              <input className="form-input" value={newTrip.origin} onChange={e => setNewTrip({...newTrip, origin: e.target.value})} />
            </div>
            <div><label className="form-label">Destination</label>
              <input className="form-input" value={newTrip.destination} onChange={e => setNewTrip({...newTrip, destination: e.target.value})} />
            </div>
          </div>
          <div><label className="form-label">Driver</label>
            <select className="form-input" value={newTrip.driverId} onChange={e => setNewTrip({...newTrip, driverId: e.target.value})}>
              <option value="">Select Driver</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div><label className="form-label">Vehicle</label>
            <select className="form-input" value={newTrip.vehicleId} onChange={e => setNewTrip({...newTrip, vehicleId: e.target.value})}>
              <option value="">Select Vehicle</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.registrationNumber}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setTripModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Cancel</button>
            <button onClick={handleAddTrip} className="btn-primary text-sm">Create</button>
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
      <Modal isOpen={lrModal} onClose={() => setLrModal(false)} title="New Lorry Receipt">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">LR Number</label>
              <input className="form-input" value={newLR.lrNumber} onChange={e => setNewLR({...newLR, lrNumber: e.target.value})} />
            </div>
            <div><label className="form-label">Amount</label>
              <input type="number" className="form-input" value={newLR.amount} onChange={e => setNewLR({...newLR, amount: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Consignor (Sender)</label>
              <input className="form-input" value={newLR.consignor} onChange={e => setNewLR({...newLR, consignor: e.target.value})} />
            </div>
            <div><label className="form-label">Consignee (Receiver)</label>
              <input className="form-input" value={newLR.consignee} onChange={e => setNewLR({...newLR, consignee: e.target.value})} />
            </div>
          </div>
          <div><label className="form-label">Goods Description</label>
            <input className="form-input" value={newLR.goodsDescription} onChange={e => setNewLR({...newLR, goodsDescription: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Weight</label>
              <input className="form-input" value={newLR.weight} onChange={e => setNewLR({...newLR, weight: e.target.value})} />
            </div>
            <div><label className="form-label">Freight Terms</label>
              <select className="form-input" value={newLR.freightTerms} onChange={e => setNewLR({...newLR, freightTerms: e.target.value})}>
                <option value="TO PAY">TO PAY</option>
                <option value="PAID">PAID</option>
                <option value="TO BE BILLED">TO BE BILLED</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setLrModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Cancel</button>
            <button onClick={handleAddLR} className="btn-primary text-sm">Create LR</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={ewbModal} onClose={() => setEwbModal(false)} title="Generate E-Way Bill">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">From GSTIN</label>
              <input className="form-input" value={newEWB.fromGstin} onChange={e => setNewEWB({...newEWB, fromGstin: e.target.value})} />
            </div>
            <div><label className="form-label">To GSTIN</label>
              <input className="form-input" value={newEWB.toGstin} onChange={e => setNewEWB({...newEWB, toGstin: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">From Address</label>
              <input className="form-input" value={newEWB.fromAddress} onChange={e => setNewEWB({...newEWB, fromAddress: e.target.value})} />
            </div>
            <div><label className="form-label">To Address</label>
              <input className="form-input" value={newEWB.toAddress} onChange={e => setNewEWB({...newEWB, toAddress: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Goods Value (Rs)</label>
              <input type="number" className="form-input" value={newEWB.goodsValue} onChange={e => setNewEWB({...newEWB, goodsValue: e.target.value})} />
            </div>
            <div><label className="form-label">HSN Code</label>
              <input className="form-input" value={newEWB.hsnCode} onChange={e => setNewEWB({...newEWB, hsnCode: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Distance (Km)</label>
              <input type="number" className="form-input" value={newEWB.distanceKm} onChange={e => setNewEWB({...newEWB, distanceKm: e.target.value})} />
            </div>
            <div><label className="form-label">Vehicle Number</label>
              <input className="form-input" value={newEWB.vehicleNumber} onChange={e => setNewEWB({...newEWB, vehicleNumber: e.target.value})} />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setEwbModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Cancel</button>
            <button onClick={handleAddEWB} className="btn-primary text-sm">Generate</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={maintModal} onClose={() => setMaintModal(false)} title="Schedule Maintenance">
        <div className="space-y-4">
          <div><label className="form-label">Vehicle</label>
            <select className="form-input" value={newMaint.vehicleId} onChange={e => setNewMaint({...newMaint, vehicleId: e.target.value})}>
              <option value="">Select Vehicle</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.registrationNumber}</option>)}
            </select>
          </div>
          <div><label className="form-label">Description</label>
            <input className="form-input" value={newMaint.description} onChange={e => setNewMaint({...newMaint, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Scheduled Date</label>
              <input type="date" className="form-input" value={newMaint.scheduledDate} onChange={e => setNewMaint({...newMaint, scheduledDate: e.target.value})} />
            </div>
            <div><label className="form-label">Estimated Cost</label>
              <input type="number" className="form-input" value={newMaint.cost} onChange={e => setNewMaint({...newMaint, cost: e.target.value})} />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setMaintModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all">Cancel</button>
            <button onClick={handleAddMaintenance} className="btn-primary text-sm">Schedule</button>
          </div>
        </div>
      </Modal>

    </div>
  );
}