import React, { useState, useEffect } from 'react';
import { Shield, Users, Lock, Unlock, Edit2, Save, X, Check } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import { api } from '../utils/api';

export default function AdminPermissions() {
  const { currentUser, addToast } = useERPStore();
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  useEffect(() => {
    if (!currentUser?.isCEO) return;
    loadRBACData();
  }, [currentUser]);

  const loadRBACData = async () => {
    try {
      setLoading(true);
      const [rolesData, departmentsData, usersData] = await Promise.all([
        api.rbac?.roles ? api.rbac.roles() : Promise.resolve([]),
        api.rbac?.departments ? api.rbac.departments() : Promise.resolve([]),
        api.rbac?.users ? api.rbac.users() : Promise.resolve([])
      ]);
      
      setRoles(rolesData || []);
      setDepartments(departmentsData || []);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Failed to load RBAC data:', error);
      addToast('Failed to load permissions data', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = selectedDepartment === 'all' 
    ? users 
    : users.filter(user => user.departmentId === selectedDepartment);

  if (!currentUser?.isCEO) {
    return (
      <div className="p-8 text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-slate-400">Only CEO can access permission settings</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded"></div>
          <div className="h-64 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="w-6 h-6 text-indigo-400" />
            Permission Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage role-based access control for all departments
          </p>
        </div>
      </div>

      {/* Department Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-slate-400">Filter by Department:</label>
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Departments</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
      </div>

      {/* Roles and Permissions Matrix */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Module Access Matrix
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Modules</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Users</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {roles.map((role) => (
                <tr key={role.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{role.name}</span>
                      {role.name === 'ceo' && (
                        <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                          Superadmin
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {departments.find(d => d.id === role.departmentId)?.name || 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {/* This would show module permissions - simplified for now */}
                      <span className="text-xs text-slate-400">View details to see modules</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {users.filter(u => u.roleId === role.id).length} users
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            User Assignments
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-white font-medium">{user.fullName}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-300">
                      {roles.find(r => r.id === user.roleId)?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      user.isActive 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-indigo-300 mb-1">Admin Access</h3>
            <p className="text-xs text-indigo-400/80">
              As CEO, you have full access to modify permissions. Changes to role permissions will affect all users assigned to that role. Use caution when modifying access levels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
