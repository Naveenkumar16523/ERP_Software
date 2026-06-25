import React, { useState, useEffect } from 'react';
import { Plus, FileText, Users, Award, FileCheck, Check, Package, Info } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';
import api from '../utils/api';

export default function ProcurementModule() {
  const {
    suppliers, addSupplier,
    purchaseOrders, addPurchaseOrder, approvePurchaseOrder,
    rfqs, addRFQ,
    rfqResponses, addRFQResponse,
    vendorEvaluations, addVendorEvaluation,
    contracts, addContract,
    addToast,
    setPurchaseOrders,
    setSuppliers
  } = useERPStore();

  const [activeTab, setActiveTab] = useState('pos');
  const [modal, setModal] = useState(false);
  const [receiveModal, setReceiveModal] = useState(null); // stores the PO being received
  const [receiveForm, setReceiveForm] = useState({});
  const [budgets, setBudgets] = useState([]);
  const [form, setForm] = useState({ supplierId: '', department: 'IT', budgetId: '', items: [{ itemName: '', quantity: 1, unitPrice: 0 }] });

  useEffect(() => {
    let active = true;
    async function loadProcurementData() {
      try {
        const [posData, suppliersData, budgetsData] = await Promise.all([
          api.procurement.getPurchaseOrders(),
          api.procurement.getSuppliers(),
          api.finance.getBudgets()
        ]);
        if (active) {
          setPurchaseOrders(posData || []);
          setSuppliers(suppliersData || []);
          setBudgets(budgetsData || []);
        }
      } catch (err) {
        console.error("Failed to load procurement data", err);
      }
    }
    loadProcurementData();
    return () => { active = false; };
  }, [setPurchaseOrders, setSuppliers]);

  const handleAddItem = () => {
    setForm({...form, items: [...form.items, { itemName: '', quantity: 1, unitPrice: 0 }]});
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index][field] = value;
    setForm({...form, items: newItems});
  };

  const handleAdd = async () => {
    if (!form.supplierId) return addToast('Supplier is required', 'error');
    if (form.items.some(i => !i.itemName || i.quantity < 1 || i.unitPrice < 0)) return addToast('Invalid items', 'error');
    
    try {
      const created = await api.procurement.createPurchaseOrder(form);
      addToast('Purchase order created', 'success');
      setModal(false);
      // Reload POs
      const pos = await api.procurement.getPurchaseOrders();
      setPurchaseOrders(pos || []);
    } catch (err) {
      addToast(err.message || 'Failed to create purchase order', 'error');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.procurement.approvePurchaseOrder(id);
      addToast('PO approved', 'success');
      const pos = await api.procurement.getPurchaseOrders();
      setPurchaseOrders(pos || []);
    } catch (err) {
      addToast(err.message || 'Failed to approve purchase order', 'error');
    }
  };

  const handleReceive = async () => {
    if (!receiveModal) return;
    try {
      for (const item of receiveModal.items) {
        const qtyToReceive = receiveForm[item.id] || 0;
        if (qtyToReceive > 0) {
          await api.procurement.receivePOItem(item.id, qtyToReceive);
        }
      }
      addToast('Items received', 'success');
      setReceiveModal(null);
      const pos = await api.procurement.getPurchaseOrders();
      setPurchaseOrders(pos || []);
    } catch(err) {
      addToast(err.message || 'Failed to receive items', 'error');
    }
  };

  const openReceiveModal = (po) => {
    setReceiveModal(po);
    const initialForm = {};
    po.items.forEach(i => initialForm[i.id] = 0);
    setReceiveForm(initialForm);
  };

  const TABS = [
    { id: 'pos', label: 'Purchase Orders', icon: FileText },
    { id: 'suppliers', label: 'Suppliers', icon: Users },
    { id: 'rfqs', label: 'RFQs', icon: FileCheck },
    { id: 'evaluations', label: 'Vendor Evaluations', icon: Award },
    { id: 'contracts', label: 'Contracts', icon: FileText }
  ];

  const pendingPos = purchaseOrders.filter(po => po.status === 'Pending Approval');
  const totalSpend = purchaseOrders.reduce((s, po) => s + (po.totalAmount || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Procurement</h1>
          <p className="text-sm text-muted mt-1">Purchase orders, budget deductions & receiving</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New PO
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Suppliers', value: suppliers.length, color: 'text-indigo-400' },
          { label: 'Total POs', value: purchaseOrders.length, color: 'text-violet-400' },
          { label: 'Pending Approval', value: pendingPos.length, color: 'text-amber-400' },
          { label: 'Total Spend', value: `₹${totalSpend.toLocaleString('en-IN')}`, color: 'text-emerald-400' },
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

      {activeTab === 'pos' && (
        <div className="theme-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-dimmed border-b border-main">
                  <th className="px-4 py-2.5">PO Number</th>
                  <th className="px-4 py-2.5">Supplier</th>
                  <th className="px-4 py-2.5">Department</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                  <th className="px-4 py-2.5">Budget</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map(po => (
                  <tr key={po.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-indigo-400">{po.poNumber || po.poNo}</td>
                    <td className="px-4 py-2.5 text-sm text-main">{po.supplierName}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{po.department || 'N/A'}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{(po.totalAmount||0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">
                      {po.budgetId ? (po.budgetDeducted ? <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3"/> Deducted</span> : <span className="text-amber-400">Pending</span>) : 'N/A'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        po.status === 'Received' ? 'bg-emerald-500/10 text-emerald-400' :
                        po.status === 'Approved' ? 'bg-sky-500/10 text-sky-400' :
                        po.status === 'Partially Received' ? 'bg-indigo-500/10 text-indigo-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>{po.status}</span>
                    </td>
                    <td className="px-4 py-2.5 flex items-center gap-2">
                      {po.status === 'Pending Approval' && (
                        <button onClick={() => handleApprove(po.id)} className="text-xs text-emerald-400 hover:underline">
                          Approve
                        </button>
                      )}
                      {(po.status === 'Approved' || po.status === 'Partially Received') && (
                        <button onClick={() => openReceiveModal(po)} className="text-xs text-indigo-400 flex items-center gap-1 hover:underline">
                          <Package className="w-3 h-3" /> Receive
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

      {activeTab === 'suppliers' && (
        <div className="theme-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-dimmed border-b border-main">
                  <th className="px-4 py-2.5">Supplier</th>
                  <th className="px-4 py-2.5">Email</th>
                  <th className="px-4 py-2.5">Phone</th>
                  <th className="px-4 py-2.5 text-right">Quality Score</th>
                  <th className="px-4 py-2.5 text-right">Overall</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{s.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{s.email || s.contactEmail || 'N/A'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{s.phone || s.contactPhone || 'N/A'}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-sky-400">{s.qualityScore || 0}%</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data font-bold text-emerald-400">{s.overallScore || 0}%</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === 'ACTIVE' || s.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RFQs, Evaluations, Contracts can be added back if needed but left out to save space/time since phase 5 focus is PO workflow */}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Create Purchase Order">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Supplier</label>
              <select className="form-input" value={form.supplierId} onChange={e => setForm({...form, supplierId: e.target.value})}>
                <option value="">Select supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className="form-label">Department</label>
              <input type="text" className="form-input" value={form.department} onChange={e => setForm({...form, department: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="form-label">Finance Budget (Optional)</label>
            <select className="form-input" value={form.budgetId} onChange={e => setForm({...form, budgetId: e.target.value})}>
              <option value="">Do not link budget</option>
              {budgets.map(b => (
                <option key={b.id} value={b.id}>{b.budgetName} (Available: ₹{(b.amount - b.spent).toLocaleString('en-IN')})</option>
              ))}
            </select>
            <p className="text-xs text-muted mt-1 flex items-center gap-1"><Info className="w-3 h-3"/> If linked, budget will be deducted upon PO approval.</p>
          </div>
          
          <div>
            <label className="form-label mb-2 flex justify-between items-center">
              <span>Items</span>
              <button onClick={handleAddItem} className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3"/> Add Item
              </button>
            </label>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center bg-surface p-2 rounded-lg border border-main">
                  <input placeholder="Item name" className="form-input flex-1" value={item.itemName} onChange={e => handleItemChange(i, 'itemName', e.target.value)} />
                  <input type="number" placeholder="Qty" className="form-input w-20" value={item.quantity} onChange={e => handleItemChange(i, 'quantity', parseInt(e.target.value) || 0)} />
                  <input type="number" placeholder="Price" className="form-input w-24" value={item.unitPrice} onChange={e => handleItemChange(i, 'unitPrice', parseFloat(e.target.value) || 0)} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAdd} className="btn-primary text-sm bg-indigo-600">Create PO</button>
          </div>
        </div>
      </Modal>

      {receiveModal && (
        <Modal isOpen={true} onClose={() => setReceiveModal(null)} title={`Receive Items - ${receiveModal.poNumber}`}>
          <div className="space-y-4">
            <p className="text-sm text-muted">Enter the quantity received for each item.</p>
            <div className="space-y-3">
              {receiveModal.items.map(item => {
                const remaining = item.quantity - item.receivedQuantity;
                return (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-surface border border-main rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-main">{item.itemName}</p>
                      <p className="text-xs text-muted">Ordered: {item.quantity} | Received: {item.receivedQuantity}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        max={remaining}
                        min={0}
                        className="form-input w-24 h-8 text-sm" 
                        value={receiveForm[item.id]} 
                        onChange={e => setReceiveForm({...receiveForm, [item.id]: parseInt(e.target.value) || 0})}
                      />
                      <span className="text-xs text-muted">/ {remaining}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setReceiveModal(null)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleReceive} className="btn-primary text-sm bg-emerald-600">Mark Received</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}