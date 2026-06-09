import React, { useState, useEffect } from 'react';
import { Plus, Users, BookOpen, FileCheck, Calendar } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import { api } from '../utils/api';
import Modal from './ui/Modal';

export default function EducationModule() {
  const {
    students, setStudents, addStudent,
    courses, setCourses, addCourse,
    grades, addGrade,
    studentAttendance, addStudentAttendance,
    addToast
  } = useERPStore();
  const [activeTab, setActiveTab] = useState('students');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', rollNo: '', grade: '', section: '', dob: '', guardian: '', contact: '', email: '' });

  // Fetch education data from DB on mount
  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const [cs] = await Promise.all([api.education.getCourses()]);
        if (active) {
          if (Array.isArray(cs)) setCourses(cs);
        }
      } catch (err) {
        console.error('Error fetching education data:', err);
      }
    };
    fetchData();
    return () => { active = false; };
  }, [setCourses]);

  const handleAddStudent = async () => {
    if (!form.name || !form.rollNo) return addToast('Name and roll number required', 'error');
    try {
      const payload = { ...form, studentName: form.name, studentEmail: form.email || 'student@school.com', enrollDate: new Date().toISOString().split('T')[0], courseId: courses[0]?.id };
      const saved = await api.education.createEnrollment(payload);
      addStudent(saved || form);
      addToast('Student enrolled successfully', 'success');
    } catch {
      addStudent(form);
      addToast('Student saved locally', 'info');
    }
    setModal(false);
    setForm({ name: '', rollNo: '', grade: '', section: '', dob: '', guardian: '', contact: '', email: '' });
  };

  const TABS = [
    { id: 'students', label: 'Students', icon: Users },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'grades', label: 'Grades', icon: FileCheck },
    { id: 'attendance', label: 'Attendance', icon: Calendar }
  ];

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

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Students', value: students.length, color: 'text-indigo-400' },
          { label: 'Courses', value: courses.length, color: 'text-sky-400' },
          { label: 'Grades Recorded', value: grades.length, color: 'text-emerald-400' },
          { label: 'Attendance Records', value: studentAttendance.length, color: 'text-amber-400' },
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

      {activeTab === 'students' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Students ({students.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Roll No</th>
                <th className="px-4 py-2.5">Grade</th>
                <th className="px-4 py-2.5">Section</th>
                <th className="px-4 py-2.5">Guardian</th>
                <th className="px-4 py-2.5">Contact</th>
              </tr></thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{student.name}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-indigo-400">{student.rollNo}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{student.grade}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{student.section}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{student.guardian}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{student.contact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Courses ({courses.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Grade</th>
                <th className="px-4 py-2.5 text-right">Credits</th>
                <th className="px-4 py-2.5">Teacher</th>
                <th className="px-4 py-2.5">Schedule</th>
              </tr></thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-indigo-400">{course.code}</td>
                    <td className="px-4 py-2.5 text-sm text-main">{course.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{course.grade}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{course.credits}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{course.teacher}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{course.schedule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'grades' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Grades ({grades.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Student</th>
                <th className="px-4 py-2.5">Course</th>
                <th className="px-4 py-2.5 text-right">Midterm</th>
                <th className="px-4 py-2.5 text-right">Final</th>
                <th className="px-4 py-2.5">Grade</th>
                <th className="px-4 py-2.5">Semester</th>
              </tr></thead>
              <tbody>
                {grades.map(grade => (
                  <tr key={grade.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{grade.studentName}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{grade.courseName}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{grade.midterm}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{grade.final}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${grade.grade.startsWith('A') ? 'bg-emerald-500/10 text-emerald-400' : grade.grade.startsWith('B') ? 'bg-sky-500/10 text-sky-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {grade.grade}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{grade.semester}</td>
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
            <h3 className="text-sm font-semibold text-main">Attendance ({studentAttendance.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Student</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Status</th>
              </tr></thead>
              <tbody>
                {studentAttendance.map(att => (
                  <tr key={att.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{att.studentName}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{att.date}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${att.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {att.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Enroll New Student">
        <div className="space-y-4">
          <div><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Roll Number</label><input className="form-input" value={form.rollNo} onChange={e => setForm({...form, rollNo: e.target.value})} /></div>
            <div><label className="form-label">Grade</label><input className="form-input" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} placeholder="e.g. 10th" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Section</label><input className="form-input" value={form.section} onChange={e => setForm({...form, section: e.target.value})} placeholder="e.g. A" /></div>
            <div><label className="form-label">Date of Birth</label><input type="date" className="form-input" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} /></div>
          </div>
          <div><label className="form-label">Guardian Name</label><input className="form-input" value={form.guardian} onChange={e => setForm({...form, guardian: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Contact</label><input className="form-input" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} /></div>
            <div><label className="form-label">Email</label><input className="form-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAddStudent} className="btn-primary text-sm">Enroll</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}