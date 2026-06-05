import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const AdminApprovalPanel = ({ token }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [approveForm, setApproveForm] = useState({
    roleId: '',
    username: '',
    password: ''
  });
  const [denyForm, setDenyForm] = useState({
    denialReason: ''
  });
  const [roles, setRoles] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchRequests();
    fetchRoles();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_URL}/api/v1/rbac/access-requests?status_filter=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_URL}/api/v1/rbac/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleApproveClick = (request) => {
    setSelectedRequest(request);
    setApproveForm({
      roleId: '',
      username: request.fullName.toLowerCase().replace(' ', '.'),
      password: ''
    });
    setShowApproveModal(true);
  };

  const handleDenyClick = (request) => {
    setSelectedRequest(request);
    setDenyForm({ denialReason: '' });
    setShowDenyModal(true);
  };

  const handleDenySubmit = async (e) => {
    e.preventDefault();

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_URL}/api/v1/rbac/access-requests/${selectedRequest.id}/deny`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(denyForm)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Request denied successfully' });
        setShowDenyModal(false);
        fetchRequests();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.detail || 'Failed to deny request' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_URL}/api/v1/rbac/access-requests/${selectedRequest.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...approveForm,
          reviewer_id: 'current-user-id' // This would come from token
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Request approved and user account created' });
        setShowApproveModal(false);
        fetchRequests();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.detail || 'Failed to approve request' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500';
      case 'approved': return 'bg-green-500/20 text-green-300 border-green-500';
      case 'denied': return 'bg-red-500/20 text-red-300 border-red-500';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500';
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Access Request Management</h1>
          
          <div className="flex gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
              <option value="">All</option>
            </select>
          </div>
        </div>

        {message.text && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-500/20 border border-green-500 text-green-200' 
                : 'bg-red-500/20 border border-red-500 text-red-200'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="text-center text-gray-400 py-12">No {filter} requests found</div>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-xl font-semibold text-white">{request.fullName}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(request.status)}`}>
                        {request.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Email:</span>
                        <span className="text-white ml-2">{request.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Department:</span>
                        <span className="text-white ml-2">{request.department}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Submitted:</span>
                        <span className="text-white ml-2">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {request.reviewedAt && (
                        <div>
                          <span className="text-gray-400">Reviewed:</span>
                          <span className="text-white ml-2">
                            {new Date(request.reviewedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <span className="text-gray-400 text-sm">Reason:</span>
                      <p className="text-white mt-1">{request.reason}</p>
                    </div>
                  </div>
                  
                  {request.status === 'pending' && (
                    <div className="flex gap-2 ml-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleApproveClick(request)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                      >
                        Approve
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDenyClick(request)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                      >
                        Deny
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Approve Modal */}
        {showApproveModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Approve Access Request</h2>
              
              <div className="mb-4 p-4 bg-slate-700/50 rounded-lg">
                <p className="text-white font-semibold">{selectedRequest.fullName}</p>
                <p className="text-gray-400 text-sm">{selectedRequest.email}</p>
                <p className="text-gray-400 text-sm">{selectedRequest.department}</p>
              </div>

              <form onSubmit={handleApproveSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Assign Role *
                  </label>
                  <select
                    value={approveForm.roleId}
                    onChange={(e) => setApproveForm({ ...approveForm, roleId: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id} className="bg-slate-800">
                        {role.name} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={approveForm.username}
                    onChange={(e) => setApproveForm({ ...approveForm, username: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={approveForm.password}
                    onChange={(e) => setApproveForm({ ...approveForm, password: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                  >
                    Approve & Create Account
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowApproveModal(false)}
                    className="flex-1 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Deny Modal */}
        {showDenyModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Deny Access Request</h2>

              <div className="mb-4 p-4 bg-slate-700/50 rounded-lg">
                <p className="text-white font-semibold">{selectedRequest.fullName}</p>
                <p className="text-gray-400 text-sm">{selectedRequest.email}</p>
                <p className="text-gray-400 text-sm">{selectedRequest.department}</p>
              </div>

              <form onSubmit={handleDenySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Denial Reason (Optional)
                  </label>
                  <textarea
                    value={denyForm.denialReason}
                    onChange={(e) => setDenyForm({ ...denyForm, denialReason: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Provide a reason for denying this request..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                  >
                    Deny Request
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowDenyModal(false)}
                    className="flex-1 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApprovalPanel;
