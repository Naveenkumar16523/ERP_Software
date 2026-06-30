import React, { useState, useMemo } from 'react';
import { Package, CreditCard, FileText, Send, Truck, ArrowRight, CheckCircle2, User, MapPin } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import { useEcommerceProducts, useEcommerceOrders, useCreateEcommerceOrder, useUpdateEcommerceOrderStatus } from '../hooks/useEcommerce';
import { api } from '../utils/api';

export default function CustomerPortalModule() {
  const addToast = useERPStore(s => s.addToast);
  const payments = useERPStore(s => s.payments || []);
  const addPayment = useERPStore(s => s.addPayment);
  const { data: ecommerceProducts = [] } = useEcommerceProducts();
  const { data: ecommerceOrders = [] } = useEcommerceOrders();
  const createEcommerceOrder = useCreateEcommerceOrder();
  const updateEcommerceOrderStatus = useUpdateEcommerceOrderStatus();


  const [activeTab, setActiveTab] = useState('book');
  
  // Shipment booking form state
  const [bookingForm, setBookingForm] = useState({
    senderName: '',
    senderEmail: '',
    receiverName: '',
    receiverAddress: '',
    origin: 'Mumbai',
    destination: 'Delhi',
    weight: '',
    cargoType: 'Electronic Goods',
    shippingSpeed: 'STANDARD'
  });

  const fareCalculation = useMemo(() => {
    const w = parseFloat(bookingForm.weight) || 0;
    if (w <= 0) return 0;
    let base = 500 + (w * 100);
    if (bookingForm.shippingSpeed === 'EXPRESS') base *= 1.5;
    if (bookingForm.shippingSpeed === 'OVERNIGHT') base *= 2.5;
    return Math.round(base);
  }, [bookingForm.weight, bookingForm.shippingSpeed]);

  const handleBookShipment = async (e) => {
    e.preventDefault();
    if (!bookingForm.senderName || !bookingForm.senderEmail || !bookingForm.receiverName || !bookingForm.receiverAddress || !bookingForm.weight) {
      return addToast('Please fill in all booking details', 'error');
    }

    const orderId = `eorder-${Date.now()}`;
    const orderNo = `SHIP-${Date.now().toString().slice(-6)}`;
    const weightNum = parseFloat(bookingForm.weight);

    const payload = {
      id: orderId,
      orderNumber: orderNo,
      customerName: bookingForm.senderName,
      customerEmail: bookingForm.senderEmail,
      total: fareCalculation,
      paymentMethod: 'CREDIT_CARD',
      paymentStatus: 'PAID',
      status: 'PROCESSING',
      orderDate: new Date().toISOString().split('T')[0],
      origin: bookingForm.origin,
      destination: bookingForm.destination,
      weight: weightNum,
      cargoType: bookingForm.cargoType,
      receiverName: bookingForm.receiverName,
      receiverAddress: bookingForm.receiverAddress
    };

    try {
      await createEcommerceOrder.mutateAsync(payload);
    } catch (err) {
      addToast(err.message || 'Failed to book shipment', 'error');
      return;
    }
    
    // Record successful payment for this shipment booking
    addPayment({
      orderId: orderId,
      orderNumber: orderNo,
      amount: fareCalculation,
      method: 'CREDIT_CARD',
      transactionId: `TXN-PORTAL-${Date.now().toString().slice(-4)}`
    });

    addToast(`Shipment ${orderNo} booked successfully & paid!`, 'success');
    
    // Clear booking form and switch to tracking list
    setBookingForm({
      senderName: '',
      senderEmail: '',
      receiverName: '',
      receiverAddress: '',
      origin: 'Mumbai',
      destination: 'Delhi',
      weight: '',
      cargoType: 'Electronic Goods',
      shippingSpeed: 'STANDARD'
    });
    setActiveTab('orders');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Customer Shipment Portal</h1>
          <p className="text-sm text-muted mt-1">Book B2B cargo shipments, track transit status, and view freight bills</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Shipments Booked', value: ecommerceOrders.length, color: 'text-indigo-400', icon: Package },
          { label: 'In Transit / Processing', value: ecommerceOrders.filter(o => o.status !== 'DELIVERED').length, color: 'text-amber-400', icon: Truck },
          { label: 'Billing Payments Cleared', value: `₹${payments.reduce((s, p) => s + p.amount, 0).toLocaleString('en-IN')}`, color: 'text-emerald-400', icon: CreditCard },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="theme-card p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-dimmed">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 font-data ${s.color}`}>{s.value}</p>
              </div>
              <div className="p-3 bg-surface rounded-xl border border-main/20">
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface p-1 rounded-xl w-fit border border-main">
        {[
          { id: 'book', label: 'Book New Shipment', icon: Send },
          { id: 'orders', label: 'Track Shipments', icon: FileText },
          { id: 'payments', label: 'Freight Billing', icon: CreditCard }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-primary text-white' : 'text-muted hover:text-main'}`}>
              <Icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. Book Shipment Form */}
      {activeTab === 'book' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleBookShipment} className="lg:col-span-2 theme-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-main mb-4 flex items-center gap-1.5"><Package className="w-4 h-4 text-primary" /> Freight Shipment Details</h3>
            
            {/* Sender / Corporate Account Details */}
            <div className="bg-surface/50 p-4 rounded-xl border border-main/30 space-y-3">
              <span className="text-xs font-bold text-primary flex items-center gap-1"><User className="w-3 h-3" /> Consignor (Sender)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Company / Sender Name</label>
                  <input required className="form-input" value={bookingForm.senderName} onChange={e => setBookingForm({...bookingForm, senderName: e.target.value})} placeholder="e.g., Acme Corp India" />
                </div>
                <div>
                  <label className="form-label">Corporate Email</label>
                  <input required type="email" className="form-input" value={bookingForm.senderEmail} onChange={e => setBookingForm({...bookingForm, senderEmail: e.target.value})} placeholder="e.g., logistics@acme.com" />
                </div>
              </div>
            </div>

            {/* Receiver / Consignee Details */}
            <div className="bg-surface/50 p-4 rounded-xl border border-main/30 space-y-3">
              <span className="text-xs font-bold text-primary flex items-center gap-1"><MapPin className="w-3 h-3" /> Consignee (Receiver)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Receiver Name / Company</label>
                  <input required className="form-input" value={bookingForm.receiverName} onChange={e => setBookingForm({...bookingForm, receiverName: e.target.value})} placeholder="e.g., Nexus Retailers Hub" />
                </div>
                <div>
                  <label className="form-label">Destination Address</label>
                  <input required className="form-input" value={bookingForm.receiverAddress} onChange={e => setBookingForm({...bookingForm, receiverAddress: e.target.value})} placeholder="e.g., Block B, Tech Park Sector 18" />
                </div>
              </div>
            </div>

            {/* Cargo / Dimensions */}
            <div className="bg-surface/50 p-4 rounded-xl border border-main/30 space-y-3">
              <span className="text-xs font-bold text-primary flex items-center gap-1"><Truck className="w-3 h-3" /> Cargo & Logistics Specifications</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="form-label">Origin City</label>
                  <select className="form-input" value={bookingForm.origin} onChange={e => setBookingForm({...bookingForm, origin: e.target.value})}>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Kolkata">Kolkata</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Destination City</label>
                  <select className="form-input" value={bookingForm.destination} onChange={e => setBookingForm({...bookingForm, destination: e.target.value})}>
                    <option value="Delhi">Delhi</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Kolkata">Kolkata</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Package Weight (kg)</label>
                  <input required type="number" min="0.1" step="0.1" className="form-input" value={bookingForm.weight} onChange={e => setBookingForm({...bookingForm, weight: e.target.value})} placeholder="e.g., 25.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="form-label">Cargo Material Type</label>
                  <select className="form-input" value={bookingForm.cargoType} onChange={e => setBookingForm({...bookingForm, cargoType: e.target.value})}>
                    <option value="Electronic Goods">Electronic Goods</option>
                    <option value="Industrial Machinery">Industrial Machinery</option>
                    <option value="Apparel & Textiles">Apparel & Textiles</option>
                    <option value="Chemicals & Fluids">Chemicals & Fluids</option>
                    <option value="Perishable Products">Perishable Products</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Shipment Speed / SLA</label>
                  <select className="form-input" value={bookingForm.shippingSpeed} onChange={e => setBookingForm({...bookingForm, shippingSpeed: e.target.value})}>
                    <option value="STANDARD">Standard Road (4-5 days)</option>
                    <option value="EXPRESS">Express Cargo (2-3 days)</option>
                    <option value="OVERNIGHT">Overnight Air Priority (Next Day)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Send className="w-4 h-4" /> Book Cargo Shipment
              </button>
            </div>
          </form>

          {/* Pricing Estimation Card */}
          <div className="theme-card p-6 h-fit space-y-4">
            <h3 className="text-sm font-semibold text-main">Freight Fare Estimate</h3>
            <div className="bg-surface p-4 rounded-xl border border-main/30 text-center">
              <p className="text-xs text-dimmed">Estimated Charges</p>
              <p className="text-3xl font-extrabold text-emerald-400 mt-2 font-data">₹{fareCalculation.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-muted mt-1.5">Includes base shipping fee, weight load, and speed tier routing</p>
            </div>
            
            <div className="space-y-2.5 text-xs">
              <h4 className="font-semibold text-main">Logistics SLA Info:</h4>
              <div className="flex justify-between text-muted"><span>Priority Tier:</span><span className="text-main font-bold">{bookingForm.shippingSpeed}</span></div>
              <div className="flex justify-between text-muted"><span>Estimated Transit:</span><span className="text-main">
                {bookingForm.shippingSpeed === 'STANDARD' ? '4-5 Days' : bookingForm.shippingSpeed === 'EXPRESS' ? '2-3 Days' : 'Next Day Air'}
              </span></div>
              <div className="flex justify-between text-muted"><span>Cargo Routing:</span><span className="text-main flex items-center gap-1">
                {bookingForm.origin} <ArrowRight className="w-3 h-3 inline" /> {bookingForm.destination}
              </span></div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Track Shipments List */}
      {activeTab === 'orders' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Shipment Tracking & Status ({ecommerceOrders.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-dimmed border-b border-main bg-surface/50">
                  <th className="px-4 py-3">Tracking / Shipment No</th>
                  <th className="px-4 py-3">Consignor (Sender)</th>
                  <th className="px-4 py-3">Route (Origin → Destination)</th>
                  <th className="px-4 py-3">Cargo Weight / Type</th>
                  <th className="px-4 py-3 text-right">Freight Charges</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Operations</th>
                </tr>
              </thead>
              <tbody>
                {ecommerceOrders.map(o => (
                  <tr key={o.id} className="border-b border-main hover:bg-surface/40 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-primary font-bold">{o.orderNumber}</td>
                    <td className="px-4 py-3 text-sm text-main font-semibold">
                      <div>{o.customerName}</div>
                      <div className="text-[10px] text-muted font-normal">{o.customerEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-main">
                      <div className="flex items-center gap-1">
                        <span className="font-bold">{o.origin || 'Mumbai'}</span>
                        <ArrowRight className="w-3 h-3 text-dimmed" />
                        <span className="font-bold">{o.destination || 'Delhi'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      <div>{o.cargoType || 'General Freight'}</div>
                      <div className="font-data font-bold mt-0.5 text-main">{o.weight || '120'} kg</div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-data text-main font-bold">₹{o.total?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5 w-fit ${
                        o.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" /> {o.paymentStatus || 'PAID'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        o.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400' :
                        o.status === 'SHIPPED' ? 'bg-sky-500/10 text-sky-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {o.status === 'PROCESSING' && (
                        <button onClick={() => { updateEcommerceOrderStatus.mutate({ id: o.id, status: 'SHIPPED' }); addToast('Cargo dispatched and in transit', 'info'); }}
                          className="text-primary hover:underline">Dispatch Cargo</button>
                      )}
                      {o.status === 'SHIPPED' && (
                        <button onClick={() => { updateEcommerceOrderStatus.mutate({ id: o.id, status: 'DELIVERED' }); addToast('Cargo delivered successfully', 'success'); }}
                          className="text-emerald-400 hover:underline">Mark Delivered</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Freight Billing & Payments Tab */}
      {activeTab === 'payments' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Freight Invoice & Billing History ({payments.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-dimmed border-b border-main bg-surface/50">
                  <th className="px-4 py-3">Shipment Booking ID</th>
                  <th className="px-4 py-3 text-right">Freight Charges Paid</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3">Transaction Reference</th>
                  <th className="px-4 py-3">Billing Status</th>
                  <th className="px-4 py-3">Processed Time</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id} className="border-b border-main hover:bg-surface/40 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-primary font-bold">{payment.orderNumber}</td>
                    <td className="px-4 py-3 text-right text-sm font-data text-emerald-400 font-bold">₹{payment.amount?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-xs text-muted font-semibold">{payment.method}</td>
                    <td className="px-4 py-3 text-xs font-mono text-primary">{payment.transactionId}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400">
                        CLEARED
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{new Date(payment.processedAt || Date.now()).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}