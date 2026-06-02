import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';

export default function EducationModule() {
  const { educationStudents, admitStudent, addToast } = useERPStore();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', grade: '', fees: 'PENDING' });
  const [search, setSearch] = useState('');

  const handleAdmit = () => {
    if (!form.name || !form.grade) return addToast('Name and grade required', 'error');
    admitStudent({ ...form, gpa: 0, attendance: 0 });
    addToast(`${form.name} enrolled successfully`, 'success');
    setForm({ name: '', grade: '', fees: 'PENDING' });
    setModal(false);
  };

  const filtered = educationStudents.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.grade?.toLowerCase().includes(search.toLowerCase())
  );

  const avgGpa = educationStudents.length > 0
    ? (educationStudents.reduce((s, st) => s + (st.gpa || 0), 0) / educationStudents.length).toFixed(2)
    : 0;

  const avgAttendance = educationStudents.length > 0
    ? Math.round(educationStudents.reduce((s, st) => s + (st.attendance || 0), 0) / educationStudents.length)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Education Management</h1>
          <p className="text-sm text-muted mt-1">Student records, grades, attendance & fee management</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Enroll Student
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Students', value: educationStudents.length, color: 'text-indigo-400' },
          { label: 'Avg GPA', value: avgGpa, color: 'text-emerald-400' },
          { label: 'Avg Attendance', value: `${avgAttendance}%`, color: 'text-sky-400' },
          { label: 'Fees Pending', value: educationStudents.filter(s => s.fees === 'PENDING').length, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="theme-card p-4">
            <p className="text-xs text-dimmed">{s.label}</p>
            <p className={`text-xl font-bold mt-1 font-data ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="theme-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-main">
          <h3 className="text-sm font-semibold text-main">Student Directory ({filtered.length})</h3>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input text-xs w-40 py-1.5"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Student</th>
                <th className="px-4 py-2.5">ID</th>
                <th className="px-4 py-2.5">Grade</th>
                <th className="px-4 py-2.5 text-right">GPA</th>
                <th className="px-4 py-2.5 text-right">Attendance</th>
                <th className="px-4 py-2.5">Fees</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                  <td className="px-4 py-2.5 text-sm text-main font-medium">{s.name}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-dimmed">{s.studentId}</td>
                  <td className="px-4 py-2.5 text-sm text-muted">{s.grade}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`text-sm font-data font-bold ${
                      s.gpa >= 8 ? 'text-emerald-400' : s.gpa >= 6 ? 'text-amber-400' : 'text-rose-400'
                    }`}>{s.gpa}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`text-sm font-data ${
                      s.attendance >= 85 ? 'text-emerald-400' : s.attendance >= 70 ? 'text-amber-400' : 'text-rose-400'
                    }`}>{s.attendance}%</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      s.fees === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>{s.fees}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400">{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Enroll New Student">
        <div className="space-y-4">
          <div><label className="form-label">Full Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div><label className="form-label">Grade / Class</label>
            <input className="form-input" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} placeholder="e.g. 10-A" />
          </div>
          <div><label className="form-label">Fees Status</label>
            <select className="form-input" value={form.fees} onChange={e => setForm({...form, fees: e.target.value})}>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAdmit} className="btn-primary text-sm">Enroll</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}