import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';

const WARDS = ['General', 'Cardiology', 'Orthopedics', 'Neurology', 'Pediatrics', 'ICU', 'Emergency'];

export default function HealthcareModule() {
  const { healthcarePatients, admitPatient, dischargePatient, addToast } = useERPStore();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', age: '', ward: '', doctor: '' });

  const admitted = healthcarePatients.filter(p => p.status === 'ADMITTED');
  const discharged = healthcarePatients.filter(p => p.status === 'DISCHARGED');

  const handleAdmit = () => {
    if (!form.name || !form.ward) return addToast('Name and ward required', 'error');
    admitPatient({ ...form, age: parseInt(form.age), vitals: { bp: 'Pending', temp: 'Pending', spo2: 'Pending' } });
    addToast(`Patient ${form.name} admitted`, 'success');
    setForm({ name: '', age: '', ward: '', doctor: '' });
    setModal(false);
  };

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

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Patients', value: healthcarePatients.length, color: 'text-indigo-400' },
          { label: 'Admitted', value: admitted.length, color: 'text-rose-400' },
          { label: 'Discharged', value: discharged.length, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="theme-card p-4">
            <p className="text-xs text-dimmed">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {healthcarePatients.map(p => (
          <div key={p.id} className="theme-card p-4 hover:border-rose-500/25 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-main">{p.name}</p>
                <p className="text-xs text-dimmed">ID: {p.patientId} · Age: {p.age}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                p.status === 'ADMITTED' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
              }`}>{p.status}</span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-dimmed">Ward</span>
                <span className="text-main font-medium">{p.ward}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dimmed">Doctor</span>
                <span className="text-main">{p.doctor}</span>
              </div>
              {p.vitals && (
                <div className="mt-2 p-2 bg-surface rounded-lg border border-main/20">
                  <p className="text-dimmed mb-1 font-medium">Vitals</p>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div>
                      <p className="text-main font-data font-semibold">{p.vitals.bp}</p>
                      <p className="text-dimmed text-[10px]">BP</p>
                    </div>
                    <div>
                      <p className="text-main font-data font-semibold">{p.vitals.temp}</p>
                      <p className="text-dimmed text-[10px]">Temp</p>
                    </div>
                    <div>
                      <p className="text-main font-data font-semibold">{p.vitals.spo2}</p>
                      <p className="text-dimmed text-[10px]">SpO₂</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {p.status === 'ADMITTED' && (
              <button
                onClick={() => { dischargePatient(p.id); addToast(`${p.name} discharged`, 'success'); }}
                className="mt-3 w-full text-xs text-emerald-400 hover:bg-emerald-500/10 py-1.5 rounded-lg transition-colors border border-emerald-500/20"
              >
                Discharge Patient
              </button>
            )}
          </div>
        ))}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Admit New Patient">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div><label className="form-label">Age</label>
              <input type="number" className="form-input" value={form.age} onChange={e => setForm({...form, age: e.target.value})} />
            </div>
          </div>
          <div><label className="form-label">Ward</label>
            <select className="form-input" value={form.ward} onChange={e => setForm({...form, ward: e.target.value})}>
              <option value="">Select ward...</option>
              {WARDS.map(w => <option key={w}>{w}</option>)}
            </select>
          </div>
          <div><label className="form-label">Assigned Doctor</label>
            <input className="form-input" value={form.doctor} onChange={e => setForm({...form, doctor: e.target.value})} placeholder="Dr. Name" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAdmit} className="btn-primary text-sm">Admit Patient</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}