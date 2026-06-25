import React, { useState, useEffect } from 'react';
import { Plus, Check, FileText, Clock, Settings } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';
import api from '../utils/api';

export default function PayrollModule() {
  const {
    employees, payrolls, addPayrollEntry, processPayroll,
    salaryStructures, addSalaryStructure,
    payslips, generatePayslip,
    attendanceLogs,
    addToast,
    setPayrolls,
    setEmployees
  } = useERPStore();

  const [activeTab, setActiveTab] = useState('payslips');
  const [modal, setModal] = useState(false);
  const [ruleModal, setRuleModal] = useState(false);
  const [form, setForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [newRule, setNewRule] = useState({ region: 'Default', minSalary: 0, maxSalary: '', taxPercent: 0 });
  const [taxRules, setTaxRules] = useState([]);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const [payrollData, employeeData, rulesData] = await Promise.all([
          api.payroll.getRecords(),
          api.hr.getEmployees(),
          api.payroll.getRules()
        ]);
        if (active) {
          setPayrolls(payrollData || []);
          setEmployees(employeeData || []);
          setTaxRules(rulesData || []);
        }
      } catch (err) {
        console.error("Failed to load payroll data", err);
      }
    }
    loadData();
    return () => { active = false; };
  }, []);

  const handleGenerateSlip = async () => {
    try {
      const result = await api.payroll.generate(form.month, form.year);
      addToast(result.message || 'Payslips generated', 'success');
      
      const payrollData = await api.payroll.getRecords();
      setPayrolls(payrollData || []);
    } catch (err) {
      addToast(err.message || 'Failed to generate payslips', 'error');
    }
    setModal(false);
  };

  const handleAddRule = async () => {
    try {
      const payload = { ...newRule, maxSalary: newRule.maxSalary ? parseFloat(newRule.maxSalary) : null };
      await api.payroll.createRule(payload);
      addToast('Tax rule added', 'success');
      const rules = await api.payroll.getRules();
      setTaxRules(rules || []);
      setRuleModal(false);
    } catch(e) {
      addToast('Failed to add tax rule', 'error');
    }
  };

  const handleProcessPayroll = async (id) => {
    try {
      await api.payroll.processPayroll(id);
      processPayroll(id);
      addToast('Payslip processed & paid', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to process payroll', 'error');
    }
  };

  const TABS = [
    { id: 'payslips', label: 'Payslips', icon: FileText },
    { id: 'rules', label: 'Tax Rules', icon: Settings },
    { id: 'attendance', label: 'Time Tracking', icon: Clock }
  ];

  const totalNetPay = payrolls.reduce((s, p) => s + (p.netPay || 0), 0);
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Payroll Management</h1>
          <p className="text-sm text-muted mt-1">Automated payslip generation with tax and leave deductions</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Run Payroll
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

      {activeTab === 'payslips' && (
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
                  <th className="px-4 py-2.5 text-right">Base Salary</th>
                  <th className="px-4 py-2.5 text-right">Leave Ded.</th>
                  <th className="px-4 py-2.5 text-right">Tax Ded.</th>
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
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{Number(p.baseSalary || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-right text-xs font-data text-rose-400">-₹{Number(p.unpaidLeaveDeductionAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-right text-xs font-data text-rose-400">-₹{Number(p.taxDeduction || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data font-bold text-emerald-400">₹{Number(p.netPay || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'Processed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {p.payslipPdf && (
                        <a href={p.payslipPdf} download={`Payslip_${p.employeeName}_${p.month}_${p.year}.pdf`} className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                          <FileText className="w-3 h-3" /> Download
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="theme-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Tax Rules ({taxRules.length})</h3>
            <button onClick={() => setRuleModal(true)} className="btn-primary text-xs flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Rule
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main bg-surface">
                <th className="px-4 py-2.5">Region</th>
                <th className="px-4 py-2.5 text-right">Min Salary</th>
                <th className="px-4 py-2.5 text-right">Max Salary</th>
                <th className="px-4 py-2.5 text-right">Tax Rate (%)</th>
              </tr></thead>
              <tbody>
                {taxRules.map(rule => (
                  <tr key={rule.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{rule.region}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{Number(rule.minSalary).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{rule.maxSalary ? `₹${Number(rule.maxSalary).toLocaleString('en-IN')}` : 'No Limit'}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-rose-400 font-bold">{rule.taxPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Time Tracking ({attendanceLogs.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Employee</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Clock In</th>
                <th className="px-4 py-2.5">Clock Out</th>
                <th className="px-4 py-2.5 text-right">Hours</th>
                <th className="px-4 py-2.5 text-right">Overtime</th>
                <th className="px-4 py-2.5">Status</th>
              </tr></thead>
              <tbody>
                {attendanceLogs.map(log => (
                  <tr key={log.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{log.employeeName}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{log.date}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{log.clockIn || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{log.clockOut || '—'}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{log.hours}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{log.overtime}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Run Payroll Generation">
        <div className="space-y-4">
          <p className="text-sm text-muted">Generate payslips for all active employees. This will automatically calculate base pay, deduct unpaid leave amount based on HR data, and apply matching tax rules.</p>
          <div className="grid grid-cols-2 gap-3 mt-4">
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
            <button onClick={handleGenerateSlip} className="btn-primary text-sm bg-indigo-600">Run Payroll</button>
          </div>
        </div>
      </Modal>
      
      <Modal isOpen={ruleModal} onClose={() => setRuleModal(false)} title="Add Tax Rule">
        <div className="space-y-4">
          <div><label className="form-label">Region Name</label>
            <input type="text" className="form-input" value={newRule.region} onChange={e => setNewRule({...newRule, region: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Min Salary (₹)</label>
              <input type="number" className="form-input" value={newRule.minSalary} onChange={e => setNewRule({...newRule, minSalary: e.target.value})} />
            </div>
            <div><label className="form-label">Max Salary (₹) (Optional)</label>
              <input type="number" className="form-input" value={newRule.maxSalary} placeholder="Leave blank for no limit" onChange={e => setNewRule({...newRule, maxSalary: e.target.value})} />
            </div>
          </div>
          <div><label className="form-label">Tax Deduction (%)</label>
            <input type="number" step="0.1" className="form-input" value={newRule.taxPercent} onChange={e => setNewRule({...newRule, taxPercent: e.target.value})} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setRuleModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAddRule} className="btn-primary text-sm">Add Rule</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}