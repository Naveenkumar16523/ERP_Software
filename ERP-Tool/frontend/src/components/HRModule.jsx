import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, UserCheck, Calendar, Clock, Edit2, Check, X } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';

export default function HRModule() {
  const {
    employees, addEmployee, updateEmployee,
    leaveRequests, addLeaveRequest, updateLeaveStatus,
    addToast
  } = useERPStore();

  const [activeTab, setActiveTab] = useState('employees');
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [newEmp, setNewEmp] = useState({ firstName: '', lastName: '', email: '', department: '', jobTitle: '', baseSalary: 0 });
  const [newLeave, setNewLeave] = useState({ employeeId: '', leaveType: 'CASUAL', startDate: '', endDate: '', reason: '' });

  const handleAddEmployee = () => {
    if (!newEmp.firstName || !newEmp.email || !newEmp.department) return addToast('First name, email, and department required', 'error');
    addEmployee({ ...newEmp, baseSalary: parseFloat(newEmp.baseSalary) || 0, employeeCode: `EMP-${Date.now().toString().slice(-4)}` });
    addToast(`Employee ${newEmp.firstName} ${newEmp.lastName} added`, 'success');
    setNewEmp({ firstName: '', lastName: '', email: '', department: '', jobTitle: '', baseSalary: 0 });
    setEmpModalOpen(false);
  };

  const handleAddLeave = () => {
    if (!newLeave.employeeId || !newLeave.startDate || !newLeave.endDate) return addToast('All leave fields required', 'error');
    const emp = employees.find(e => e.id === newLeave.employeeId);
    addLeaveRequest({ ...newLeave, employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown' });
    addToast('Leave request submitted', 'success');
    setLeaveModalOpen(false);
  };

  const TABS = [
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'leaves', label: 'Leave Requests', icon: Calendar }
  ];

  const depts = [...new Set(employees.map(e => e.department))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Human Resources</h1>
          <p className="text-sm text-muted mt-1">Employee management, leaves, and attendance</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Employees', value: employees.length, color: 'text-indigo-400' },
          { label: 'Active', value: employees.filter(e => e.isActive).length, color: 'text-emerald-400' },
          { label: 'Pending Leaves', value: leaveRequests.filter(l => l.status === 'PENDING').length, color: 'text-amber-400' },
          { label: 'Departments', value: depts.length, color: 'text-violet-400' }
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

      {activeTab === 'employees' && (
        <div className="theme-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Employee Directory ({employees.length})</h3>
            <button onClick={() => setEmpModalOpen(true)} className="btn-primary text-xs flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Employee
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Employee</th>
                <th className="px-4 py-2.5">Department</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5 text-right">Salary</th>
                <th className="px-4 py-2.5">Status</th>
              </tr></thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-main">{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs text-dimmed">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">{emp.department}</td>
                    <td className="px-4 py-3 text-sm text-muted">{emp.jobTitle}</td>
                    <td className="px-4 py-3 text-right text-sm font-data text-main">₹{(emp.baseSalary || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${emp.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-surface text-dimmed'}`}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'leaves' && (
        <div className="theme-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Leave Requests ({leaveRequests.length})</h3>
            <button onClick={() => setLeaveModalOpen(true)} className="btn-primary text-xs flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> New Request
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Employee</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Period</th>
                <th className="px-4 py-2.5">Reason</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr></thead>
              <tbody>
                {leaveRequests.map(lr => (
                  <tr key={lr.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{lr.employeeName}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{lr.leaveType}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{lr.startDate} → {lr.endDate}</td>
                    <td className="px-4 py-2.5 text-xs text-muted max-w-xs truncate">{lr.reason}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        lr.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                        lr.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400' :
                        'bg-amber-500/10 text-amber-400'}`}>{lr.status}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      {lr.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button onClick={() => { updateLeaveStatus(lr.id, 'APPROVED'); addToast('Leave approved', 'success'); }}
                            className="text-xs text-emerald-400 hover:underline flex items-center gap-1"><Check className="w-3 h-3" /> Approve</button>
                          <button onClick={() => { updateLeaveStatus(lr.id, 'REJECTED'); addToast('Leave rejected', 'info'); }}
                            className="text-xs text-rose-400 hover:underline flex items-center gap-1"><X className="w-3 h-3" /> Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={empModalOpen} onClose={() => setEmpModalOpen(false)} title="Add New Employee">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">First Name</label><input className="form-input" value={newEmp.firstName} onChange={e => setNewEmp({...newEmp, firstName: e.target.value})} /></div>
            <div><label className="form-label">Last Name</label><input className="form-input" value={newEmp.lastName} onChange={e => setNewEmp({...newEmp, lastName: e.target.value})} /></div>
          </div>
          <div><label className="form-label">Email</label><input className="form-input" type="email" value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})} /></div>
          <div><label className="form-label">Department</label><input className="form-input" value={newEmp.department} onChange={e => setNewEmp({...newEmp, department: e.target.value})} /></div>
          <div><label className="form-label">Job Title</label><input className="form-input" value={newEmp.jobTitle} onChange={e => setNewEmp({...newEmp, jobTitle: e.target.value})} /></div>
          <div><label className="form-label">Base Salary (₹)</label><input type="number" className="form-input" value={newEmp.baseSalary} onChange={e => setNewEmp({...newEmp, baseSalary: e.target.value})} /></div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setEmpModalOpen(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAddEmployee} className="btn-primary text-sm">Add Employee</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={leaveModalOpen} onClose={() => setLeaveModalOpen(false)} title="New Leave Request">
        <div className="space-y-4">
          <div><label className="form-label">Employee</label>
            <select className="form-input" value={newLeave.employeeId} onChange={e => setNewLeave({...newLeave, employeeId: e.target.value})}>
              <option value="">Select employee...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
            </select>
          </div>
          <div><label className="form-label">Leave Type</label>
            <select className="form-input" value={newLeave.leaveType} onChange={e => setNewLeave({...newLeave, leaveType: e.target.value})}>
              {['CASUAL','SICK','ANNUAL','MATERNITY','PATERNITY'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Start Date</label><input type="date" className="form-input" value={newLeave.startDate} onChange={e => setNewLeave({...newLeave, startDate: e.target.value})} /></div>
            <div><label className="form-label">End Date</label><input type="date" className="form-input" value={newLeave.endDate} onChange={e => setNewLeave({...newLeave, endDate: e.target.value})} /></div>
          </div>
          <div><label className="form-label">Reason</label><textarea className="form-input" rows={2} value={newLeave.reason} onChange={e => setNewLeave({...newLeave, reason: e.target.value})} /></div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setLeaveModalOpen(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAddLeave} className="btn-primary text-sm">Submit Request</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}