import React, { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';

export default function PayrollModule() {
  const { employees, payrolls, addPayrollEntry, processPayroll, addToast } = useERPStore();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const handleGenerateSlip = () => {
    const emp = employees.find(e => e.id === form.employeeId);
    if (!emp) return addToast('Select an employee', 'error');
    const base = emp.baseSalary || 0;
    const pf = Math.round(base * 0.12);
    const esi = Math.round(base * 0.0075);
    const tds = Math.round(base * 0.1);
    const net = base - pf - esi - tds;
    addPayrollEntry({
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      month: form.month,
      year: form.year,
      baseSalary: base,
      pfDeduction: pf,
      esiDeduction: esi,
      tdsDeduction: tds,
      netPay: net,
      status: 'PENDING',
    });
    addToast('Payslip generated successfully', 'success');
    setModal(false);
  };

  const totalNetPay = payrolls.reduce((s, p) => s + (p.netPay || 0), 0);
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Payroll Management</h1>
          <p className="text-sm text-muted mt-1">Automated payslip generation with PF, ESI & TDS deductions</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Generate Payslip
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Payslips', value: payrolls.length, color: 'text-indigo-400' },
          { label: 'Paid This Month', value: payrolls.filter(p => p.status === 'PAID').length, color: 'text-emerald-400' },
          { label: 'Total Net Pay', value: `₹${totalNetPay.toLocaleString('en-IN')}`, color: 'text-sky-400' },
        ].map(s => (
          <div key={s.label} className="theme-card p-4">
            <p className="text-xs text-dimmed">{s.label}</p>
            <p className={`text-xl font-bold mt-1 font-data ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="theme-card overflow-hidden">
        <div className="px-4 py-3 border-b border-main">
          <h3 className="text-sm font-semibold text-main">Payslips ({payrolls.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Employee</th>
                <th className="px-4 py-2.5">Period</th>
                <th className="px-4 py-2.5 text-right">Gross</th>
                <th className="px-4 py-2.5 text-right">PF</th>
                <th className="px-4 py-2.5 text-right">ESI</th>
                <th className="px-4 py-2.5 text-right">TDS</th>
                <th className="px-4 py-2.5 text-right">Net Pay</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.map(p => (
                <tr key={p.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                  <td className="px-4 py-2.5 text-sm text-main">{p.employeeName}</td>
                  <td className="px-4 py-2.5 text-xs text-muted">{MONTHS[(p.month || 1) - 1]} {p.year}</td>
                  <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{(p.baseSalary || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-2.5 text-right text-xs font-data text-rose-400">-₹{(p.pfDeduction || 0).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right text-xs font-data text-rose-400">-₹{(p.esiDeduction || 0).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right text-xs font-data text-rose-400">-₹{(p.tdsDeduction || 0).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right text-sm font-data font-bold text-emerald-400">₹{(p.netPay || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {p.status === 'PENDING' && (
                      <button
                        onClick={() => { processPayroll(p.id); addToast('Payslip processed & paid', 'success'); }}
                        className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Pay
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Generate Payslip">
        <div className="space-y-4">
          <div><label className="form-label">Employee</label>
            <select className="form-input" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})}>
              <option value="">Select employee...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} — ₹{(e.baseSalary||0).toLocaleString()}/mo</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Month</label>
              <select className="form-input" value={form.month} onChange={e => setForm({...form, month: parseInt(e.target.value)})}>
                {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div><label className="form-label">Year</label>
              <input type="number" className="form-input" value={form.year} onChange={e => setForm({...form, year: parseInt(e.target.value)})} />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleGenerateSlip} className="btn-primary text-sm">Generate</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}