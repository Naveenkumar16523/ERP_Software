import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, UserCheck, Calendar, Clock, Edit2, Check, X } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import { api } from '../utils/api';
import Modal from './ui/Modal';

export default function HRModule() {
  const {
    employees, setEmployees, addEmployee, updateEmployee,
    leaveRequests, setLeaveRequests, addLeaveRequest, updateLeaveStatus, leaveBalances,
    jobPostings, addJobPosting,
    applicants, addApplicant, updateApplicantStatus,
    performanceReviews, addPerformanceReview, updateReviewStatus,
    onboardingChecklists, addOnboardingChecklist, updateOnboardingTask,
    attendanceLogs, addAttendanceLog,
    dbLive,
    addToast
  } = useERPStore();

  useEffect(() => {
    let active = true;
    const loadHRData = async () => {
      try {
        const [empData, leaveData] = await Promise.all([
          api.hr.getEmployees(),
          api.hr.getLeaveRequests()
        ]);
        if (active) {
          if (Array.isArray(empData)) {
            const formatted = empData.map(emp => ({
              ...emp,
              department: emp.department?.name || emp.departmentId || emp.department || 'Unknown'
            }));
            setEmployees(formatted);
          }
          if (Array.isArray(leaveData)) {
            const formattedLeaves = leaveData.map(lr => ({
              ...lr,
              employeeName: lr.employee ? `${lr.employee.firstName} ${lr.employee.lastName}` : lr.employeeName || 'Unknown',
              startDate: typeof lr.startDate === 'string' ? lr.startDate.split('T')[0] : lr.startDate,
              endDate: typeof lr.endDate === 'string' ? lr.endDate.split('T')[0] : lr.endDate
            }));
            setLeaveRequests(formattedLeaves);
          }
        }
      } catch (err) {
        console.error('Failed to load HR data:', err);
      }
    };
    loadHRData();
    return () => {
      active = false;
    };
  }, [setEmployees, setLeaveRequests]);

  const [activeTab, setActiveTab] = useState('employees');
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [newEmp, setNewEmp] = useState({ firstName: '', lastName: '', email: '', department: '', jobTitle: '', baseSalary: 0 });
  const [newLeave, setNewLeave] = useState({ employeeId: '', leaveType: 'CASUAL', startDate: '', endDate: '', reason: '' });

  const handleAddEmployee = async () => {
    if (!newEmp.firstName || !newEmp.email || !newEmp.department) return addToast('First name, email, and department required', 'error');
    
    const payload = {
      employeeCode: `EMP-${Date.now().toString().slice(-4)}`,
      firstName: newEmp.firstName,
      lastName: newEmp.lastName || '',
      email: newEmp.email,
      phone: newEmp.phone || '',
      departmentId: newEmp.department,
      jobTitle: newEmp.jobTitle || 'Staff',
      baseSalary: parseFloat(newEmp.baseSalary) || 50000,
    };

    try {
      const savedEmp = await api.hr.addEmployee(payload);
      const formattedSavedEmp = {
        ...savedEmp,
        department: savedEmp.department?.name || savedEmp.departmentId || savedEmp.department || payload.departmentId
      };
      
      const exists = employees.some(e => e.email === formattedSavedEmp.email || e.employeeCode === formattedSavedEmp.employeeCode);
      if (!exists) {
        addEmployee(formattedSavedEmp);
      }
      addToast(`Employee ${newEmp.firstName} ${newEmp.lastName} added successfully`, 'success');
    } catch (err) {
      addToast(`Error adding employee: ${err.message}`, 'error');
    }
    
    setNewEmp({ firstName: '', lastName: '', email: '', department: '', jobTitle: '', baseSalary: 0 });
    setEmpModalOpen(false);
  };

  const handleAddLeave = async () => {
    if (!newLeave.employeeId || !newLeave.startDate || !newLeave.endDate) return addToast('All leave fields required', 'error');
    const emp = employees.find(e => e.id === newLeave.employeeId);
    
    try {
      const leavePayload = {
        leaveType: newLeave.leaveType,
        startDate: new Date(newLeave.startDate).toISOString(),
        endDate: new Date(newLeave.endDate).toISOString(),
        reason: newLeave.reason || null
      };
      
      const created = await api.hr.createLeaveRequest(newLeave.employeeId, leavePayload);
      if (created && created.id) {
        const formattedCreated = {
          ...created,
          employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
          startDate: newLeave.startDate,
          endDate: newLeave.endDate
        };
        addLeaveRequest(formattedCreated);
      }
      addToast('Leave request submitted', 'success');
      setLeaveModalOpen(false);
    } catch (err) {
      addToast(err.message || 'Failed to submit leave request', 'error');
    }
  };

  const handleUpdateLeaveStatus = async (id, status) => {
    try {
      await api.hr.updateLeaveStatus(id, status);
      updateLeaveStatus(id, status);
      addToast(`Leave request ${status.toLowerCase()}`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update leave status', 'error');
    }
  };

  const TABS = [
    { id: 'employees', label: 'Employee Directory', icon: Users },
    { id: 'leaves', label: 'Leave Management', icon: Calendar },
    { id: 'recruitment', label: 'Recruitment', icon: UserCheck },
    { id: 'performance', label: 'Performance', icon: Edit2 },
    { id: 'onboarding', label: 'Onboarding', icon: Check },
    { id: 'attendance', label: 'Attendance', icon: Clock }
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
                <th className="px-4 py-2.5">Contact</th>
                <th className="px-4 py-2.5">Department</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Skills</th>
                <th className="px-4 py-2.5">Documents</th>
                <th className="px-4 py-2.5">Status</th>
              </tr></thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm text-main font-medium">{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs text-muted">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{emp.phone || '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted">{emp.department}</td>
                    <td className="px-4 py-3 text-xs text-main">{emp.jobTitle}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(emp.skills || []).slice(0, 2).map((skill, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-surface rounded text-muted">{skill}</span>
                        ))}
                        {(emp.skills || []).length > 2 && <span className="text-xs text-muted">+{emp.skills.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{(emp.documents || []).length} files</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${emp.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
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

      {activeTab === 'recruitment' && (
        <div className="theme-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Job Postings ({jobPostings.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Title</th>
                <th className="px-4 py-2.5">Department</th>
                <th className="px-4 py-2.5">Location</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Salary</th>
                <th className="px-4 py-2.5">Applicants</th>
                <th className="px-4 py-2.5">Status</th>
              </tr></thead>
              <tbody>
                {jobPostings.map(job => (
                  <tr key={job.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main font-medium">{job.title}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{job.department}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{job.location}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{job.type}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{job.salary}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{job.applicants}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${job.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="theme-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Performance Reviews ({performanceReviews.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Employee</th>
                <th className="px-4 py-2.5">Period</th>
                <th className="px-4 py-2.5">Rating</th>
                <th className="px-4 py-2.5">Goals</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Review Date</th>
              </tr></thead>
              <tbody>
                {performanceReviews.map(review => (
                  <tr key={review.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{review.employeeName}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{review.reviewPeriod}</td>
                    <td className="px-4 py-2.5 text-sm font-data font-semibold text-main">{review.rating}/5</td>
                    <td className="px-4 py-2.5 text-xs text-muted max-w-xs truncate">{(review.goals || []).join(', ')}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${review.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {review.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{review.reviewDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'onboarding' && (
        <div className="theme-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Onboarding Checklists ({onboardingChecklists.length})</h3>
          </div>
          <div className="p-4 space-y-4">
            {onboardingChecklists.map(checklist => (
              <div key={checklist.id} className="bg-surface p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-main font-medium">{checklist.employeeName}</p>
                    <p className="text-xs text-muted">{checklist.role}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${checklist.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {checklist.status}
                  </span>
                </div>
                <div className="space-y-2">
                  {(checklist.tasks || []).map(task => (
                    <div key={task.id} className="flex items-center gap-2 text-xs">
                      <div onClick={() => updateOnboardingTask(checklist.id, task.id)} className={`w-4 h-4 rounded border ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-muted'} cursor-pointer flex items-center justify-center`}>
                        {task.completed && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={task.completed ? 'text-muted line-through' : 'text-main'}>{task.title}</span>
                      <span className="text-muted ml-auto">{task.dueDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="theme-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Attendance Logs ({attendanceLogs.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Employee</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Clock In</th>
                <th className="px-4 py-2.5">Clock Out</th>
                <th className="px-4 py-2.5">Hours</th>
                <th className="px-4 py-2.5">Overtime</th>
                <th className="px-4 py-2.5">Status</th>
              </tr></thead>
              <tbody>
                {attendanceLogs.map(log => (
                  <tr key={log.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{log.employeeName}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{log.date}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{log.clockIn || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{log.clockOut || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{log.hours}h</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{log.overtime}h</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400' : log.status === 'ABSENT' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
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
                          <button onClick={() => handleUpdateLeaveStatus(lr.id, 'APPROVED')}
                            className="text-xs text-emerald-400 hover:underline flex items-center gap-1"><Check className="w-3 h-3" /> Approve</button>
                          <button onClick={() => handleUpdateLeaveStatus(lr.id, 'REJECTED')}
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
          {!dbLive && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-xs flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px]">Offline Mode</span>
              <span>Backend database is offline. Changes are saved locally and will reset on page reload.</span>
            </div>
          )}
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