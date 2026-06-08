import React, { useState, useEffect } from 'react';
import { Users, Shield, BarChart3, Plus, Edit, Trash2, Key, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import { api } from '../utils/api';

// ── Demo/fallback data shown when backend is unavailable ──────────────────────
const DEMO_STATS = {
  total_employees: 18,
  active_employees: 16,
  inactive_employees: 2,
  employees_by_department: {
    Finance: 4, 'Human Resources': 3, Operations: 5, 'Sales & Marketing': 3, 'IT / System': 2, Sustainability: 1
  },
  recent_users: [
    { id: 'u1', username: 'john.doe001', full_name: 'John Doe', role_name: 'finance_staff', is_active: true },
    { id: 'u2', username: 'jane.smith002', full_name: 'Jane Smith', role_name: 'hr_staff', is_active: true },
    { id: 'u3', username: 'bob.jones003', full_name: 'Bob Jones', role_name: 'operations_staff', is_active: false },
    { id: 'u4', username: 'alice.w004', full_name: 'Alice Wang', role_name: 'sales_staff', is_active: true },
    { id: 'u5', username: 'mike.it005', full_name: 'Mike IT', role_name: 'it_staff', is_active: true },
  ]
};

const DEMO_USERS = [
  { id: 'u1', username: 'john.doe001', full_name: 'John Doe', email: 'john.doe@company.com', role_name: 'finance_staff', department_name: 'Finance', is_active: true, is_ceo: false },
  { id: 'u2', username: 'jane.smith002', full_name: 'Jane Smith', email: 'jane.smith@company.com', role_name: 'hr_staff', department_name: 'Human Resources', is_active: true, is_ceo: false },
  { id: 'u3', username: 'bob.jones003', full_name: 'Bob Jones', email: 'bob.jones@company.com', role_name: 'operations_staff', department_name: 'Operations', is_active: false, is_ceo: false },
  { id: 'u4', username: 'alice.w004', full_name: 'Alice Wang', email: 'alice.w@company.com', role_name: 'sales_staff', department_name: 'Sales & Marketing', is_active: true, is_ceo: false },
  { id: 'u5', username: 'mike.it005', full_name: 'Mike IT', email: 'mike.it@company.com', role_name: 'it_staff', department_name: 'IT / System', is_active: true, is_ceo: false },
];

const DEMO_DEPARTMENTS = [
  { id: 'dept_finance', name: 'Finance' }, { id: 'dept_hr', name: 'Human Resources' },
  { id: 'dept_operations', name: 'Operations' }, { id: 'dept_sales', name: 'Sales & Marketing' },
  { id: 'dept_it', name: 'IT / System' }, { id: 'dept_sustainability', name: 'Sustainability' },
];

const DEMO_ROLES = [
  { id: 'role_finance_staff', name: 'finance_staff' }, { id: 'role_hr_staff', name: 'hr_staff' },
  { id: 'role_operations_staff', name: 'operations_staff' }, { id: 'role_sales_staff', name: 'sales_staff' },
  { id: 'role_it_staff', name: 'it_staff' }, { id: 'role_sustainability_staff', name: 'sustainability_staff' },
];

const ALL_MODULES = [
  'dashboard', 'finance', 'human_resources', 'inventory', 'manufacturing',
  'procurement', 'crm_pipeline', 'payroll', 'fixed_assets', 'projects',
  'supply_chain', 'ecommerce', 'analytics_hub', 'banking', 'healthcare',
  'education', 'sustainability', 'marketing', 'security', 'migration_hub', 'rpa_automation'
];

const ROLE_PERMS = {
  finance_staff:       ['dashboard','finance','banking','analytics_hub'],
  hr_staff:            ['dashboard','human_resources','payroll','healthcare','education'],
  operations_staff:    ['dashboard','inventory','manufacturing','supply_chain','procurement','fixed_assets','projects'],
  sales_staff:         ['dashboard','crm_pipeline','ecommerce','marketing','analytics_hub'],
  it_staff:            ['dashboard','security','migration_hub','rpa_automation','analytics_hub'],
  sustainability_staff:['dashboard','sustainability','analytics_hub'],
  superadmin:          ALL_MODULES,
};

const DEMO_PERMISSIONS = {
  modules: ALL_MODULES,
  roles: Object.fromEntries(
    DEMO_ROLES.map(r => [
      r.name,
      {
        role_id: r.id,
        department_id: 'dept_finance',
        modules: Object.fromEntries(
          ALL_MODULES.map(m => [m, {
            can_read:   (ROLE_PERMS[r.name] || []).includes(m),
            can_write:  (ROLE_PERMS[r.name] || []).includes(m),
            can_export: (ROLE_PERMS[r.name] || []).includes(m),
          }])
        )
      }
    ])
  )
};

export default function AdminPanel() {
  const { currentUser, addToast, demoMode } = useERPStore();
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, users, permissions
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showOfflineBanner, setShowOfflineBanner] = useState(true);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state for creating user
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    department_id: '',
    role_id: ''
  });

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardStats();
    } else if (activeTab === 'users') {
      fetchUsers();
      fetchDepartments();
      fetchRoles();
    } else if (activeTab === 'permissions') {
      fetchPermissions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, demoMode]);

  const fetchDashboardStats = async () => {
    // In demo/fallback mode, use local data to avoid hitting the real backend
    if (demoMode) {
      setStats(DEMO_STATS);
      return;
    }
    try {
      const data = await api.admin.getDashboard();
      setStats(data);
    } catch (err) {
      console.warn('Admin dashboard API failed, using demo data:', err.message);
      setStats(DEMO_STATS);
    }
  };

  const fetchUsers = async () => {
    if (demoMode) {
      setUsers(DEMO_USERS);
      return;
    }
    try {
      const data = await api.admin.getUsers();
      setUsers(data);
    } catch (err) {
      console.warn('Admin users API failed, using demo data:', err.message);
      setUsers(DEMO_USERS);
    }
  };

  const fetchDepartments = async () => {
    if (demoMode) {
      setDepartments(DEMO_DEPARTMENTS);
      return;
    }
    try {
      const data = await api.admin.getDepartments();
      setDepartments(data);
    } catch (err) {
      setDepartments(DEMO_DEPARTMENTS);
    }
  };

  const fetchRoles = async () => {
    if (demoMode) {
      setRoles(DEMO_ROLES);
      return;
    }
    try {
      const data = await api.admin.getRoles();
      setRoles(data);
    } catch (err) {
      setRoles(DEMO_ROLES);
    }
  };

  const fetchPermissions = async () => {
    if (demoMode) {
      setPermissions(DEMO_PERMISSIONS);
      return;
    }
    try {
      const data = await api.admin.getPermissions();
      setPermissions(data);
    } catch (err) {
      console.warn('Admin permissions API failed, using demo data:', err.message);
      setPermissions(DEMO_PERMISSIONS);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await api.admin.createUser(newUser);
      addToast(`User created successfully! Username: ${result.user.username}, Default Password: ${result.user.password}`, 'success');
      setShowCreateModal(false);
      setNewUser({ full_name: '', email: '', department_id: '', role_id: '' });
      fetchUsers();
    } catch (err) {
      addToast(err.message || 'Failed to create user', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.admin.updateUser(userId, { is_active: !currentStatus });
      addToast('User status updated', 'success');
      fetchUsers();
    } catch (err) {
      addToast('Failed to update user status', 'danger');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.admin.deleteUser(userId);
      addToast('User deleted successfully', 'success');
      fetchUsers();
    } catch (err) {
      addToast('Failed to delete user', 'danger');
    }
  };

  const handleResetPassword = async (userId, username) => {
    if (!confirm(`Reset password for ${username}? A new password will be generated.`)) return;
    try {
      const result = await api.admin.resetPassword(userId);
      addToast(`Password reset! New password: ${result.new_password}`, 'success');
    } catch (err) {
      addToast('Failed to reset password', 'danger');
    }
  };

  const handleTogglePermission = async (roleId, moduleKey, canAccess) => {
    try {
      const result = await api.admin.togglePermission({
        role_id: roleId,
        module_key: moduleKey,
        can_access: canAccess
      });
      setPermissions(result);
      addToast(`Permission updated: ${moduleKey} ${canAccess ? 'enabled' : 'disabled'}`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update permission', 'danger');
    }
  };

  if (!currentUser?.isCEO && !demoMode) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400">Admin panel is restricted to CEO only</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-950 min-h-screen">
      {/* Offline Mode Banner — dismissable */}
      {demoMode && showOfflineBanner && (
        <div className="mb-4 flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400/80 text-xs">
          <span><span className="font-semibold text-amber-400">⚠ Offline Demo Mode</span> — Backend unreachable. Showing local demo data only.</span>
          <button
            onClick={() => setShowOfflineBanner(false)}
            className="ml-2 text-amber-400/60 hover:text-amber-400 transition-colors flex-shrink-0"
            title="Dismiss"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Control Panel</h1>
        <p className="text-slate-400">Manage users, roles, and system permissions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Users
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'permissions'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Shield className="w-4 h-4 inline mr-2" />
          Permissions
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Total Employees</h3>
              <Users className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="text-4xl font-bold text-white">{stats.total_employees}</p>
            <div className="mt-4 flex gap-4 text-sm">
              <span className="text-emerald-400">{stats.active_employees} Active</span>
              <span className="text-rose-400">{stats.inactive_employees} Inactive</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Employees by Department</h3>
            <div className="space-y-2">
              {Object.entries(stats.employees_by_department).map(([dept, count]) => (
                <div key={dept} className="flex justify-between text-sm">
                  <span className="text-slate-300">{dept}</span>
                  <span className="text-white font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Users</h3>
            <div className="space-y-2">
              {stats.recent_users.map((user) => (
                <div key={user.id} className="flex items-center gap-2 text-sm">
                  <CheckCircle className={`w-4 h-4 ${user.is_active ? 'text-emerald-400' : 'text-rose-400'}`} />
                  <span className="text-slate-300">{user.full_name}</span>
                  <span className="text-slate-500 text-xs">({user.role_name})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-white/10 rounded-xl">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">User Management</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create User
            </button>
          </div>
          <div className="p-6">
            <table className="w-full">
              <thead>
                <tr className="text-left text-slate-400 text-sm border-b border-white/10">
                  <th className="pb-3">Username</th>
                  <th className="pb-3">Full Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-white/5">
                    <td className="py-3 text-white">{user.username}</td>
                    <td className="py-3 text-slate-300">{user.full_name}</td>
                    <td className="py-3 text-slate-300">{user.email}</td>
                    <td className="py-3 text-slate-300">{user.role_name}</td>
                    <td className="py-3 text-slate-300">{user.department_name}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                          className="p-2 hover:bg-white/10 rounded transition-colors"
                          title={user.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {user.is_active ? <XCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.id, user.username)}
                          className="p-2 hover:bg-white/10 rounded transition-colors"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4 text-yellow-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 hover:bg-white/10 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No users found. {demoMode ? 'Reload the page to refresh demo data.' : 'Create your first user.'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && permissions && (
        <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Permission Matrix</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-white/10">
                  <th className="pb-3 pr-4">Role</th>
                  {permissions.modules.map((module) => (
                    <th key={module} className="pb-3 px-2 whitespace-nowrap">{module.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(permissions.roles).map(([roleName, roleData]) => (
                  <tr key={roleName} className="border-b border-white/5">
                    <td className="py-3 pr-4 text-white font-medium">{roleName}</td>
                    {permissions.modules.map((module) => {
                      const hasAccess = roleData.modules[module]?.can_read;
                      const isCEO = roleData.role_id === 'role_superadmin';
                      const isDashboard = module === 'dashboard';
                      const isDisabled = isCEO || isDashboard;
                      
                      return (
                        <td key={module} className="py-3 px-2 text-center">
                          <button
                            onClick={() => handleTogglePermission(roleData.role_id, module, !hasAccess)}
                            disabled={isDisabled}
                            className={`p-1 rounded transition-colors ${
                              isDisabled 
                                ? 'cursor-not-allowed opacity-50' 
                                : 'hover:bg-white/10 cursor-pointer'
                            }`}
                            title={isDisabled ? (isCEO ? 'CEO has full access' : 'Dashboard is always ON') : 'Toggle access'}
                          >
                            {hasAccess ? (
                              <CheckCircle className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <XCircle className="w-5 h-5 text-slate-600" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-slate-400 text-xs mt-4">
            Click any toggle to enable/disable module access. Changes take effect on employee's next login.
            CEO row and Dashboard column are locked.
          </p>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Create New User</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-white/10 rounded transition-colors"
              >
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Department</label>
                <select
                  required
                  value={newUser.department_id}
                  onChange={(e) => setNewUser({ ...newUser, department_id: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                <select
                  required
                  value={newUser.role_id}
                  onChange={(e) => setNewUser({ ...newUser, role_id: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
