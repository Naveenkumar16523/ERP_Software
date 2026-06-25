import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, UserCheck, Calendar, Clock, Edit2, Check, X, FileText } from 'lucide-react';
import { useEmployees, useAddEmployee, useUpdateEmployee, useLeaves, useAddLeave, useUpdateLeave } from '../hooks/useHR';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';

export default function HRModule() {
  const {
    jobPostings, addJobPosting,
    applicants, addApplicant, updateApplicantStatus,
    performanceReviews, addPerformanceReview, updateReviewStatus,
    onboardingChecklists, addOnboardingChecklist, updateOnboardingTask,
    attendanceLogs, addAttendanceLog,
    dbLive,
    addToast
  } = useERPStore();

  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const { mutateAsync: mutateAddEmployee } = useAddEmployee();
  
  const { data: leaveRequests = [], isLoading: loadingLeaves } = useLeaves();
  const { mutateAsync: mutateAddLeave } = useAddLeave();
  const { mutateAsync: mutateUpdateLeave } = useUpdateLeave();
  
  const [documents, setDocuments] = useState([]);
  const [selectedDocEmployee, setSelectedDocEmployee] = useState('');

  const [activeTab, setActiveTab] = useState('employees');
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveApprovalModal, setLeaveApprovalModal] = useState(null);
  const [newEmp, setNewEmp] = useState({ firstName: '', lastName: '', email: '', department: '', jobTitle: '', baseSalary: 0 });
  const [newLeave, setNewLeave] = useState({ employeeId: '', leaveType: 'CASUAL', startDate: '', endDate: '', reason: '' });

  const fetchDocs = async (empId) => {
    if (!empId) return;
    try {
      const { api } = await import('../utils/api');
      const docs = await api.hr.getDocuments(empId);
      setDocuments(docs || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchDocs(selectedDocEmployee);
  }, [selectedDocEmployee]);

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
      await mutateAddEmployee(payload);
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
        leave_type: newLeave.leaveType,
        start_date: new Date(newLeave.startDate).toISOString(),
        end_date: new Date(newLeave.endDate).toISOString(),
        reason: newLeave.reason || null,
        employee_id: newLeave.employeeId
      };
      
      await mutateAddLeave(leavePayload);
      addToast('Leave request submitted', 'success');
      setLeaveModalOpen(false);
    } catch (err) {
      addToast(err.message || 'Failed to submit leave request', 'error');
    }
  };

  const handleUpdateLeaveStatus = async (id, status, isUnpaid = false) => {
    try {
      await mutateUpdateLeave({ id, status, isUnpaid });
      addToast(`Leave request ${status.toLowerCase()}`, 'success');
      setLeaveApprovalModal(null);
    } catch (err) {
      addToast(err.message || 'Failed to update leave status', 'error');
    }
  };

  const handleBiometricScan = async (empId) => {
    if (!empId) return;
    try {
      const { api } = await import('../utils/api');
      await api.hr.markBiometricAttendance(empId, `mock_hash_${empId}`);
      addToast('Biometric attendance marked successfully!', 'success');
    } catch (e) {
      addToast('Failed to mark attendance', 'error');
    }
  };

  const handleUploadDoc = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedDocEmployee) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const { api } = await import('../utils/api');
        await api.hr.uploadDocument(selectedDocEmployee, {
          documentName: file.name,
          documentType: file.type || 'application/pdf',
          fileData: reader.result
        });
        addToast('Document uploaded securely to vault', 'success');
        fetchDocs(selectedDocEmployee);
      } catch (err) {
        addToast('Failed to upload document', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const TABS = [
    { id: 'employees', label: 'Employee Directory', icon: Users },
    { id: 'leaves', label: 'Leave Management', icon: Calendar },
    { id: 'recruitment', label: 'Recruitment', icon: UserCheck },
    { id: 'performance', label: 'Performance', icon: Edit2 },
    { id: 'onboarding', label: 'Onboarding', icon: Check },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'documents', label: 'Document Vault', icon: FileText }
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
            <button onClick={() => setEmpModalOpen(true)} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300">
              <Plus className="w-3.5 h-3.5" /> Add Employee
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main bg-surface">
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
            <div className="flex items-center gap-2">
              <select className="input-field bg-surface text-xs" onChange={e => handleBiometricScan(e.target.value)}>
                <option value="">Biometric Check-In (Mock)...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main bg-surface">
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
            <button onClick={() => setLeaveModalOpen(true)} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300">
              <Plus className="w-3.5 h-3.5" /> New Request
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main bg-surface">
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
                          <button onClick={() => setLeaveApprovalModal(lr)}
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

      {activeTab === 'documents' && (
        <div className="theme-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Secure Document Vault</h3>
            <div className="flex items-center gap-3">
              <select className="input-field bg-surface text-xs" value={selectedDocEmployee} onChange={e => setSelectedDocEmployee(e.target.value)}>
                <option value="">Select Employee...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
              {selectedDocEmployee && (
                <label className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Upload File
                  <input type="file" className="hidden" onChange={handleUploadDoc} />
                </label>
              )}
            </div>
          </div>
          <div className="p-4">
            {!selectedDocEmployee ? (
              <p className="text-sm text-muted text-center py-8">Select an employee to view or upload documents.</p>
            ) : documents.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">No documents found for this employee.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {documents.map(doc => (
                  <div key={doc.id} className="p-3 border border-main rounded-lg bg-surface/50">
                    <FileText className="w-6 h-6 text-indigo-400 mb-2" />
                    <p className="text-xs font-semibold text-main truncate">{doc.documentName}</p>
                    <p className="text-[10px] text-muted">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
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
            <button onClick={() => setEmpModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Cancel</button>
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
            <button onClick={() => setLeaveModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Cancel</button>
            <button onClick={handleAddLeave} className="btn-primary text-sm">Submit Request</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!leaveApprovalModal} onClose={() => setLeaveApprovalModal(null)} title="Approve Leave Request">
        {leaveApprovalModal && (
          <div className="space-y-4">
            <p className="text-sm text-main">Approve leave for <span className="font-semibold">{leaveApprovalModal.employeeName}</span> ({leaveApprovalModal.totalDays} days)?</p>
            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input type="checkbox" id="unpaidCheck" className="rounded border-main bg-surface" />
              <span className="text-sm text-main">Mark as <span className="text-rose-400 font-semibold">Unpaid Leave</span> (deduct from next payroll)</span>
            </label>
            <div className="flex gap-2 justify-end pt-4">
              <button onClick={() => setLeaveApprovalModal(null)} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Cancel</button>
              <button onClick={() => handleUpdateLeaveStatus(leaveApprovalModal.id, 'APPROVED', document.getElementById('unpaidCheck').checked)} className="btn-primary text-sm bg-emerald-600 hover:bg-emerald-500">Approve Request</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}