// Centralized API client interfacing with Node.js Express backend
// Implements transparent offline-first fallbacks using our Zustand store.
import { useERPStore } from '../store/useERPStore';

const API_URL = import.meta.env.VITE_API_URL || '';
const BASE_URL = API_URL ? `${API_URL}/api/v1` : '/api/v1';

// Modules that don't have backend SQL models yet.
// Intercepting them here prevents 404 errors in the browser console
// and seamlessly falls back to Zustand's rich dummy data.
const DISABLED_MODULES = [
  'analytics', 'assets', 'automation', 'banking', 'crm', 
  'ecommerce', 'education', 'healthcare', 'inventory', 'manufacturing', 
  'marketing', 'payroll', 'procurement', 'projects', 'security', 
  'supply-chain', 'support', 'sustainability'
];

// Helper to get authorization headers
const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = useERPStore.getState().token;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Generic fetch wrapper with offline resilience
async function request(path, options = {}) {
  const moduleName = path.split('/')[1];
  if (DISABLED_MODULES.includes(moduleName)) {
    throw new Error('Module disabled');
  }

  const { token, setDbLive, logout } = useERPStore.getState();

  const url = `${BASE_URL}${path}`;
  const mergedOptions = {
    ...options,
    headers: { ...getHeaders(), ...options.headers }
  };

  try {
    const res = await fetch(url, mergedOptions);

    // Set database status to live since the network succeeded
    setDbLive(true);

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      let errorMessage = errBody.detail || errBody.message || errBody.error || `API Error: ${res.status} ${res.statusText}`;
      if (typeof errorMessage === 'object' && errorMessage !== null) {
          errorMessage = errorMessage.message || errorMessage.error || JSON.stringify(errorMessage);
      }

      if (res.status === 403) {
        throw new Error('Access denied: you do not have permission to perform this action.');
      }

      if (res.status === 401) {
        const isAuthError = errorMessage === 'Invalid or expired token' || 
                            errorMessage === 'Session has expired or been revoked' || 
                            errorMessage === 'Access token is required' || 
                            errorMessage === 'User is not authenticated' ||
                            (res.status === 401 && !String(errorMessage).includes('Invalid credentials') && !String(errorMessage).includes('Invalid username or password'));
        
        if (isAuthError) {

          const refreshToken = localStorage.getItem('erp_refresh_token');
          if (refreshToken && !options._retry) {
            try {
              const refreshRes = await fetch(`${BASE_URL}/auth/refresh?refreshToken=${encodeURIComponent(refreshToken)}`, {
                method: 'POST'
              });
              if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                useERPStore.getState().setToken(refreshData.accessToken || refreshData.access_token || refreshData.token);
                if (refreshData.refreshToken) {
                  localStorage.setItem('erp_refresh_token', refreshData.refreshToken);
                }
                // Retry original request with new token
                return await request(path, { ...options, _retry: true });
              } else {
                logout();
                throw new Error('Session expired. Please log in again.');
              }
            } catch (e) {
              if (e.message.includes('Session expired')) throw e;
              logout();
              throw new Error('Session expired. Please log in again.');
            }
          } else {
            logout();
            throw new Error('Session expired. Please log in again.');
          }
        }
      }

      throw new Error(errorMessage);
    }

    return await res.json();
  } catch (error) {
    if (error.message !== 'Module disabled') {
      console.warn(`[Network Fail] API path ${path} failed. Error:`, error.message);
      setDbLive(false);
    }
    throw error; // Let caller catch and choose whether to apply fallback
  }
}

export const api = {
  // ── Database Health ──
  async getHealth() {
    try {
      const res = await fetch(`${API_URL}/api/v1/health`);
      useERPStore.getState().setDbLive(true); // Network reachable
      if (res.ok) {
        const data = await res.json();
        useERPStore.getState().setDbLive(data.status === 'UP');
        return data;
      }
    } catch {
      useERPStore.getState().setDbLive(false); // Genuine network failure
    }
    return { status: 'DOWN' };
  },

  // ── Authentication ──
  auth: {
    async getRegistrationStatus() {
      try {
        return await request('/auth/registration-status');
      } catch {
        return { registrationEnabled: false };
      }
    },
    async login(credentials) {
      return request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
    },
    async logout() {
      return request('/auth/logout', { method: 'POST' });
    },
    async changePassword(passwordData) {
      return request('/auth/change-password', { method: 'POST', body: JSON.stringify(passwordData) });
    }
  },

  // ── Finance ──
  finance: {
    async getAccounts() {
      return request('/finance/accounts');
    },
    async createAccount(account) {
      try { return await request('/finance/accounts', { method: 'POST', body: JSON.stringify(account) }); }
      catch (e) {
        if (e.message !== 'Failed to fetch') throw e;
        useERPStore.getState().addAccount(account);
        return account;
      }
    },
    async getJournalEntries() {
      return request('/finance/journal-entries');
    },
    async createJournalEntry(entry) {
      const payload = {
        voucherType: 'JOURNAL',
        amount: entry.amount,
        debitAcc: entry.debitAcc,
        creditAcc: entry.creditAcc,
        narration: entry.narration || '',
        date: entry.date || null,
        referenceNo: entry.referenceNo || null
      };
      try { 
        const res = await request('/finance/voucher', { method: 'POST', body: JSON.stringify(payload) }); 
        return res.entry || res;
      }
      catch { useERPStore.getState().addJournalEntry(entry); return entry; }
    },
    async getInvoices() {
      return request('/finance/invoices');
    },
    async createInvoice(invoice) {
      return request('/finance/invoices', { method: 'POST', body: JSON.stringify(invoice) });
    },
    async updateInvoiceStatus(id, status) {
      return request(`/finance/invoices/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    },
    async getBudgets() {
      return request('/finance/budgets');
    },
    async createBudget(budget) {
      return request('/finance/budgets', { method: 'POST', body: JSON.stringify(budget) });
    },
    async getExpenses() {
      return request('/finance/expenses');
    },
    async createExpense(expense) {
      return request('/finance/expenses', { method: 'POST', body: JSON.stringify(expense) });
    },
    async updateExpenseStatus(id, status) {
      return request(`/finance/expenses/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    },
    async getApprovalWorkflows() {
      return request('/finance/approvals');
    },
    async createApprovalWorkflow(workflow) {
      return request('/finance/approvals', { method: 'POST', body: JSON.stringify(workflow) });
    },
    async approveApprovalWorkflow(id, level) {
      return request(`/finance/approvals/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ level }) });
    },
    async getTaxDeadlines() {
      return request('/finance/tax/deadlines');
    },
    async createTaxDeadline(tax) {
      try { return await request('/finance/tax/deadlines', { method: 'POST', body: JSON.stringify(tax) }); }
      catch {
        const withId = { ...tax, id: `tax-${Date.now()}` };
        const oldDeadlines = useERPStore.getState().taxCompliance.filingDeadlines;
        useERPStore.getState().setFilingDeadlines([...oldDeadlines, withId]);
        return withId;
      }
    },
    async updateTaxDeadlineStatus(id, status) {
      return request(`/finance/tax/deadlines/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    },
    async getStatements() {
      return request('/finance/statements');
    },
    async createStatement(statement) {
      return request('/finance/statements', { method: 'POST', body: JSON.stringify(statement) });
    },
    async updateStatementStatus(id, status) {
      return request(`/finance/statements/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    },
    async getAuditLogs() {
      return request('/finance/audit-logs');
    },
    async getExchangeRates() {
      try { return await request('/finance/exchange-rates'); }
      catch { return { "USD": 1, "EUR": 0.92, "GBP": 0.79, "INR": 83.2, "AED": 3.67 }; }
    }
  },

  // ── HR ──
  hr: {
    async getEmployees() {
      return request('/hr/employees');
    },
    async addEmployee(employee) {
      return request('/hr/employees', { method: 'POST', body: JSON.stringify(employee) });
    },
    async getLeaveRequests() {
      return request('/hr/leaves');
    },
    async createLeaveRequest(employeeId, leave) {
      return request(`/hr/leave/requests`, { method: 'POST', body: JSON.stringify(leave) });
    },
    async updateLeaveStatus(id, status, isUnpaid = false) {
      return request(`/hr/leave/requests/${id}/action`, { method: 'PATCH', body: JSON.stringify({ action: status === 'APPROVED' ? 'approve' : 'reject', isUnpaid }) });
    },
    async markBiometricAttendance(employeeId, thumbprintHash) {
      try { return await request('/hr/attendance/biometric', { method: 'POST', body: JSON.stringify({ employeeId, thumbprintHash, timestamp: new Date().toISOString() }) }); }
      catch { return null; }
    },
    async getDocuments(employeeId) {
      try { return await request(`/hr/documents/${employeeId}`); }
      catch { return []; }
    },
    async uploadDocument(employeeId, doc) {
      try { return await request(`/hr/documents/${employeeId}`, { method: 'POST', body: JSON.stringify(doc) }); }
      catch { return null; }
    }
  },

  // ── Payroll ──
  payroll: {
    async getRules() {
      try { return await request('/payroll/rules'); }
      catch { return []; }
    },
    async createRule(rule) {
      try { return await request('/payroll/rules', { method: 'POST', body: JSON.stringify(rule) }); }
      catch { return null; }
    },
    async getRecords(month, year) {
      let query = [];
      if (month) query.push(`month=${month}`);
      if (year) query.push(`year=${year}`);
      let qs = query.length > 0 ? `?${query.join('&')}` : '';
      try { return await request(`/payroll/records${qs}`); }
      catch { return []; }
    },
    async generate(month, year) {
      try { return await request('/payroll/generate', { method: 'POST', body: JSON.stringify({ month, year }) }); }
      catch (e) { throw e; }
    },
    async getPayrolls() {
      return request('/payroll');
    },
    async generatePayslip(data) {
      return request('/payroll/generate', { method: 'POST', body: JSON.stringify(data) });
    },
    async processPayroll(id) {
      return request(`/payroll/${id}/process`, { method: 'PATCH' });
    }
  },

  // ── Procurement ──
  procurement: {
    async getPurchaseOrders() {
      return request('/procurement/purchase-orders');
    },
    async createPurchaseOrder(po) {
      return request('/procurement/purchase-orders', { method: 'POST', body: JSON.stringify(po) });
    },
    async approvePurchaseOrder(id) {
      return request(`/procurement/purchase-orders/${id}/approve`, { method: 'PATCH' });
    },
    async receivePOItem(itemId, receivedQuantity) {
      try { return await request(`/procurement/purchase-orders/items/${itemId}/receive`, { method: 'PATCH', body: JSON.stringify({ receivedQuantity }) }); }
      catch { return null; }
    },
    async getSuppliers() {
      return request('/procurement/suppliers');
    }
  },

  // ── Inventory ──
  inventory: {
    async getProducts() {
      return request('/inventory/products');
    },
    async addProduct(product) {
      return request('/inventory/products', { method: 'POST', body: JSON.stringify(product) });
    },
    async updateStock(id, quantity) {
      return request(`/inventory/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ quantity }) });
    },
    async getWarehouses() {
      return request('/inventory/warehouses');
    },
    async createWarehouse(warehouse) {
      return request('/inventory/warehouses', { method: 'POST', body: JSON.stringify(warehouse) });
    },
    async getBatches() {
      return request('/inventory/batches');
    },
    async createBatch(batch) {
      return request('/inventory/batches', { method: 'POST', body: JSON.stringify(batch) });
    },
    async getStockMovements() {
      return request('/inventory/transactions');
    },
    async createStockMovement(movement) {
      return request('/inventory/transactions', { method: 'POST', body: JSON.stringify(movement) });
    }
  },

  // ── CRM ──
  crm: {
    async getLeads() {
      return request('/crm/leads');
    },
    async createLead(lead) {
      return request('/crm/leads', { method: 'POST', body: JSON.stringify(lead) });
    },
    async updateLeadStatus(id, status) {
      return request(`/crm/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    },
    async getTickets() {
      return request('/crm/tickets');
    },
    async createTicket(ticket) {
      try { return await request('/crm/tickets', { method: 'POST', body: JSON.stringify(ticket) }); }
      catch { return ticket; }
    },
    async updateTicketStatus(id, status) {
      try { return await request(`/crm/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
      catch { return { id, status }; }
    }
  },



  // ── Projects ──
  projects: {
    async getProjects() {
      return request('/projects');
    },
    async addProject(project) {
      return request('/projects', { method: 'POST', body: JSON.stringify(project) });
    },
    async addTask(projectId, task) {
      return request(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(task) });
    }
  },

  // ── Manufacturing ──
  manufacturing: {
    async getBatches() {
      return request('/manufacturing/batches');
    },
    async createBatch(batch) {
      return request('/manufacturing/batches', { method: 'POST', body: JSON.stringify(batch) });
    },
    async updateBatchProgress(id, progress) {
      return request(`/manufacturing/batches/${id}/progress`, { method: 'PATCH', body: JSON.stringify({ progress }) });
    }
  },

  // ── Supply Chain ──
  supplyChain: {
    async getShipments() {
      return request('/supply-chain/shipments');
    },
    async createShipment(shipment) {
      return request('/supply-chain/shipments', { method: 'POST', body: JSON.stringify(shipment) });
    },
    async updateShipmentStatus(id, status) {
      return request(`/supply-chain/shipments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    },
    async getVehicles() {
      try { return await request('/supply-chain/vehicles'); }
      catch { return []; }
    },
    async createVehicle(vehicle) {
      try { return await request('/supply-chain/vehicles', { method: 'POST', body: JSON.stringify(vehicle) }); }
      catch { return vehicle; }
    },
    async updateVehicleGps(id, loc) {
      try { return await request(`/supply-chain/vehicles/${id}/gps`, { method: 'POST', body: JSON.stringify(loc) }); }
      catch { return { id, loc }; }
    },
    async updateShipmentPod(id, podSignature) {
      try { return await request(`/supply-chain/shipments/${id}/pod`, { method: 'POST', body: JSON.stringify({ podSignature }) }); }
      catch { return { id, podSignature }; }
    }
  },

  // ── Assets ──
  assets: {
    async getAssets() {
      return request('/assets');
    },
    async addAsset(asset) {
      return request('/assets', { method: 'POST', body: JSON.stringify(asset) });
    },
    async scheduleMaintenace(assetId, date) {
      try { return await request(`/assets/${assetId}/maintenance`, { method: 'PATCH', body: JSON.stringify({ scheduledDate: date }) }); }
      catch { /* offline no-op */ }
    }
  },

  // ── Support ──
  support: {
    async getTickets() {
      return request('/support/tickets');
    },
    async createTicket(ticket) {
      return request('/support/tickets', { method: 'POST', body: JSON.stringify(ticket) });
    },
    async updateTicketStatus(id, status) {
      return request(`/support/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    }
  },

  // ── E-Commerce ──
  ecommerce: {
    async getProducts() {
      return request('/ecommerce/products');
    },
    async getOrders() {
      return request('/ecommerce/orders');
    },
    async checkout(payload) {
      return request('/ecommerce/checkout', { method: 'POST', body: JSON.stringify(payload) });
    },
    async updateOrderStatus(id, status) {
      return request(`/ecommerce/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    }
  },

  // ── Banking ──
  banking: {
    async getAccounts() {
      return request('/banking/accounts');
    },
    async createAccount(account) {
      return request('/banking/accounts', { method: 'POST', body: JSON.stringify(account) });
    },
    async getTransactions() {
      return request('/banking/transactions');
    },
    async createTransaction(tx) {
      return request('/banking/transactions', { method: 'POST', body: JSON.stringify(tx) });
    },
    async getLoans() {
      return request('/banking/loans');
    },
    async createLoan(loan) {
      return request('/banking/loans', { method: 'POST', body: JSON.stringify(loan) });
    },
    async autoReconcile() {
      try { return await request('/banking/reconcile', { method: 'POST' }); }
      catch { return { message: "Reconciliation failed (offline)", matches: 0 }; }
    }
  },

  // ── Healthcare ──
  healthcare: {
    async getPatients() {
      return request('/healthcare/patients');
    },
    async createPatient(patient) {
      try { return await request('/healthcare/patients', { method: 'POST', body: JSON.stringify(patient) }); }
      catch { return patient; }
    },
    async getAppointments() {
      return request('/healthcare/appointments');
    },
    async createAppointment(appt) {
      try { return await request('/healthcare/appointments', { method: 'POST', body: JSON.stringify(appt) }); }
      catch { return appt; }
    },
    async getPrescriptions() {
      return request('/healthcare/prescriptions');
    },
    async createPrescription(rx) {
      try { return await request('/healthcare/prescriptions', { method: 'POST', body: JSON.stringify(rx) }); }
      catch { return rx; }
    }
  },

  // ── Education ──
  education: {
    async getCourses() {
      return request('/education/courses');
    },
    async createCourse(course) {
      try { return await request('/education/courses', { method: 'POST', body: JSON.stringify(course) }); }
      catch { return course; }
    },
    async getEnrollments() {
      return request('/education/enrollments');
    },
    async createEnrollment(enrollment) {
      try { return await request('/education/enrollments', { method: 'POST', body: JSON.stringify(enrollment) }); }
      catch { return enrollment; }
    },
    async getAssessments() {
      return request('/education/assessments');
    }
  },

  // ── Sustainability ──
  sustainability: {
    async getCarbonEntries() {
      return request('/sustainability/carbon');
    },
    async createCarbonEntry(entry) {
      try { return await request('/sustainability/carbon', { method: 'POST', body: JSON.stringify(entry) }); }
      catch { return entry; }
    },
    async getESGReports() {
      return request('/sustainability/esg-reports');
    },
    async createESGReport(report) {
      try { return await request('/sustainability/esg-reports', { method: 'POST', body: JSON.stringify(report) }); }
      catch { return report; }
    },
    async getInitiatives() {
      return request('/sustainability/initiatives');
    },
    async createInitiative(initiative) {
      try { return await request('/sustainability/initiatives', { method: 'POST', body: JSON.stringify(initiative) }); }
      catch { return initiative; }
    }
  },

  // ── Marketing ──
  marketing: {
    async getCampaigns() {
      return request('/marketing/campaigns');
    },
    async createCampaign(campaign) {
      return request('/marketing/campaigns', { method: 'POST', body: JSON.stringify(campaign) });
    },
    async getLeads() {
      return request('/marketing/leads');
    },
    async createLead(lead) {
      return request('/marketing/leads', { method: 'POST', body: JSON.stringify(lead) });
    },
    async getSocialPosts() {
      return request('/marketing/social-posts');
    },
    async createSocialPost(post) {
      return request('/marketing/social-posts', { method: 'POST', body: JSON.stringify(post) });
    }
  },

  // ── Security ──
  security: {
    async getEvents() {
      return request('/security/events');
    },
    async createEvent(event) {
      try { return await request('/security/events', { method: 'POST', body: JSON.stringify(event) }); }
      catch { return event; }
    },
    async getIncidents() {
      return request('/security/incidents');
    },
    async createIncident(incident) {
      try { return await request('/security/incidents', { method: 'POST', body: JSON.stringify(incident) }); }
      catch { return incident; }
    },
    async updateIncidentStatus(id, status) {
      try { return await request(`/security/incidents/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
      catch { /* offline no-op */ }
    }
  },

  // ── Analytics ──
  analytics: {
    async getReports() {
      return request('/analytics/reports');
    },
    async createReport(report) {
      try { return await request('/analytics/reports', { method: 'POST', body: JSON.stringify(report) }); }
      catch { return report; }
    },
    async getKPIs() {
      return request('/analytics/kpis');
    },
    async createKPI(kpi) {
      try { return await request('/analytics/kpis', { method: 'POST', body: JSON.stringify(kpi) }); }
      catch { return kpi; }
    },
    async getLogisticsKpis() {
      try { return await request('/analytics/logistics-kpis'); }
      catch { return null; }
    }
  },

  // ── Automation ──
  automation: {
    async getWorkflows() {
      return request('/automation/workflows');
    },
    async createWorkflow(workflow) {
      try { return await request('/automation/workflows', { method: 'POST', body: JSON.stringify(workflow) }); }
      catch { return workflow; }
    },
    async updateWorkflowStatus(id, status) {
      try { return await request(`/automation/workflows/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
      catch { /* offline no-op */ }
    },
    async getRunLogs() {
      return request('/automation/run-logs');
    },
    async createRunLog(log) {
      try { return await request('/automation/run-logs', { method: 'POST', body: JSON.stringify(log) }); }
      catch { return log; }
    }
  },

  // ── Notifications ──
  notifications: {
    async getAll() {
      return request('/notifications');
    },
    async markRead(id) {
      return request(`/notifications/${id}/read`, { method: 'PATCH' });
    }
  },

  // ── Admin Panel (CEO only) ──
  admin: {
    async getDashboard() {
      return request('/admin/dashboard');
    },
    async getUsers() {
      return request('/admin/users');
    },
    async createUser(userData) {
      return request('/admin/users', { method: 'POST', body: JSON.stringify(userData) });
    },
    async updateUser(userId, userData) {
      return request(`/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify(userData) });
    },
    async deleteUser(userId) {
      return request(`/admin/users/${userId}`, { method: 'DELETE' });
    },
    async resetPassword(userId) {
      return request(`/admin/users/${userId}/reset-password`, { method: 'POST' });
    },
    async getPermissions() {
      return request('/admin/permissions');
    },
    async togglePermission(permissionData) {
      return request('/admin/permissions', { method: 'PATCH', body: JSON.stringify(permissionData) });
    },
    async getDepartments() {
      return request('/admin/departments');
    },
    async getRoles() {
      return request('/admin/roles');
    }
  },


  // ── Global Search ──
  search: {
    async query(q, options = {}) {
      try { return await request(`/search?q=${encodeURIComponent(q)}`); }
      catch { return { results: [] }; }
    }
  }
};

export default api;
