import React, { useState } from 'react';
import { Plus, Users, Calendar, FileText, DollarSign } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';

const WARDS = ['General', 'Cardiology', 'Orthopedics', 'Neurology', 'Pediatrics', 'ICU', 'Emergency'];

export default function HealthcareModule() {
  const {
    patients, addPatient,
    appointments, addAppointment, updateAppointmentStatus,
    medicalHistory, addMedicalHistory,
    medicalBills, addMedicalBill,
    addToast
  } = useERPStore();
  const [activeTab, setActiveTab] = useState('patients');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', dob: '', gender: '', bloodType: '', contact: '', email: '', address: '', emergencyContact: '' });

  const handleAddPatient = () => {
    if (!form.name || !form.contact) return addToast('Name and contact required', 'error');
    addPatient(form);
    addToast('Patient added successfully', 'success');
    setModal(false);
    setForm({ name: '', dob: '', gender: '', bloodType: '', contact: '', email: '', address: '', emergencyContact: '' });
  };

  const TABS = [
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'history', label: 'Medical History', icon: FileText },
    { id: 'billing', label: 'Billing', icon: DollarSign }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Healthcare Management</h1>
          <p className="text-sm text-muted mt-1">Patient records, wards, and clinical operations</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Admit Patient
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Patients', value: patients.length, color: 'text-indigo-400' },
          { label: 'Appointments', value: appointments.length, color: 'text-sky-400' },
          { label: 'Medical Records', value: medicalHistory.length, color: 'text-emerald-400' },
          { label: 'Pending Bills', value: medicalBills.filter(b => b.status === 'PENDING').length, color: 'text-amber-400' },
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

      {activeTab === 'patients' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Patients ({patients.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">DOB</th>
                <th className="px-4 py-2.5">Gender</th>
                <th className="px-4 py-2.5">Blood Type</th>
                <th className="px-4 py-2.5">Contact</th>
                <th className="px-4 py-2.5">Emergency Contact</th>
              </tr></thead>
              <tbody>
                {patients.map(patient => (
                  <tr key={patient.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{patient.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{patient.dob}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{patient.gender}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{patient.bloodType}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{patient.contact}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{patient.emergencyContact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Appointments ({appointments.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Patient</th>
                <th className="px-4 py-2.5">Doctor</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Time</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr></thead>
              <tbody>
                {appointments.map(appt => (
                  <tr key={appt.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{appt.patientName}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{appt.doctor}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{appt.date}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{appt.time}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{appt.type}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${appt.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : appt.status === 'CONFIRMED' ? 'bg-sky-500/10 text-sky-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {appt.status === 'SCHEDULED' && (
                        <button onClick={() => { updateAppointmentStatus(appt.id, 'CONFIRMED'); addToast('Appointment confirmed', 'success'); }} className="text-xs text-emerald-400 hover:underline">Confirm</button>
                      )}
                      {appt.status === 'CONFIRMED' && (
                        <button onClick={() => { updateAppointmentStatus(appt.id, 'COMPLETED'); addToast('Appointment completed', 'success'); }} className="text-xs text-emerald-400 hover:underline">Complete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Medical History ({medicalHistory.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Patient</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Diagnosis</th>
                <th className="px-4 py-2.5">Treatment</th>
                <th className="px-4 py-2.5">Doctor</th>
              </tr></thead>
              <tbody>
                {medicalHistory.map(history => (
                  <tr key={history.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{history.patientName}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{history.date}</td>
                    <td className="px-4 py-2.5 text-sm text-main">{history.diagnosis}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{history.treatment}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{history.doctor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Medical Bills ({medicalBills.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Patient</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Services</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="px-4 py-2.5">Status</th>
              </tr></thead>
              <tbody>
                {medicalBills.map(bill => (
                  <tr key={bill.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{bill.patientName}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{bill.date}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{bill.services.join(', ')}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{bill.amount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bill.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {bill.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add New Patient">
        <div className="space-y-4">
          <div><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Date of Birth</label><input type="date" className="form-input" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} /></div>
            <div><label className="form-label">Gender</label>
              <select className="form-input" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Blood Type</label>
              <select className="form-input" value={form.bloodType} onChange={e => setForm({...form, bloodType: e.target.value})}>
                <option value="">Select...</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div><label className="form-label">Contact</label><input className="form-input" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} /></div>
          </div>
          <div><label className="form-label">Email</label><input className="form-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
          <div><label className="form-label">Address</label><input className="form-input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
          <div><label className="form-label">Emergency Contact</label><input className="form-input" value={form.emergencyContact} onChange={e => setForm({...form, emergencyContact: e.target.value})} placeholder="Name + Phone" /></div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAddPatient} className="btn-primary text-sm">Add Patient</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}