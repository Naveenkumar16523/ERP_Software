// Centralized API client interfacing with Node.js Express backend
// Implements transparent offline-first fallbacks using our Zustand store.
import { useERPStore } from '../store/useERPStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const BASE_URL = `${API_URL}/api/v1`;

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
  const url = `${BASE_URL}${path}`;
  const mergedOptions = {
    ...options,
    headers: { ...getHeaders(), ...options.headers }
  };

  try {
    const res = await fetch(url, mergedOptions);

    // Set database status to live since the network succeeded
    useERPStore.getState().setDbLive(true);

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
                            (res.status === 401 && !String(errorMessage).includes('Invalid credentials'));
        
        if (isAuthError) {
          const refreshToken = localStorage.getItem('erp_refresh_token');
          if (refreshToken && !options._retry) {
            try {
              const refreshRes = await fetch(`${BASE_URL}/auth/refresh?refreshToken=${refreshToken}`, {
                method: 'POST'
              });
              if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                useERPStore.getState().setToken(refreshData.token);
                if (refreshData.refreshToken) {
                  localStorage.setItem('erp_refresh_token', refreshData.refreshToken);
                }
                // Retry original request with new token
                return await request(path, { ...options, _retry: true });
              } else {
                useERPStore.getState().logout();
                throw new Error('Session expired. Please log in again.');
              }
            } catch (e) {
              if (e.message.includes('Session expired')) throw e;
              useERPStore.getState().logout();
              throw new Error('Session expired. Please log in again.');
            }
          } else {
            useERPStore.getState().logout();
            throw new Error('Session expired. Please log in again.');
          }
        }
      }

      throw new Error(errorMessage);
    }

    return await res.json();
  } catch (error) {
    console.warn(`[Network Fail] API path ${path} failed. Error:`, error.message);
    useERPStore.getState().setDbLive(false);
    throw error; // Let caller catch and choose whether to apply fallback
  }
}

export const api = {
  // ── Database Health ──
  async getHealth() {
    try {
      const res = await fetch(`${API_URL}/api/v1/health`);
      if (res.ok) {
        const data = await res.json();
        useERPStore.getState().setDbLive(data.status === 'UP');
        return data;
      }
    } catch {
      useERPStore.getState().setDbLive(false);
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
      try { return await request('/auth/logout', { method: 'POST' }); } catch { /* offline ok */ }
    },
    async changePassword(passwordData) {
      return request('/auth/change-password', { method: 'POST', body: JSON.stringify(passwordData) });
    }
  },

  // ── Finance ──
  finance: {
    async getAccounts() {
      try { return await request('/finance/accounts'); }
      catch { return useERPStore.getState().accounts; }
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
      try { return await request('/finance/journal-entries'); }
      catch { return useERPStore.getState().journalEntries; }
    },
    async createJournalEntry(entry) {
      const payload = {
        voucherType: 'JOURNAL',
        amount: entry.amount,
        debitAcc: entry.debitAcc,
        creditAcc: entry.creditAcc,
        narration: entry.narration || ''
      };
      try { 
        const res = await request('/finance/voucher', { method: 'POST', body: JSON.stringify(payload) }); 
        return res.entry || res;
      }
      catch { useERPStore.getState().addJournalEntry(entry); return entry; }
    },
    async getInvoices() {
      try { return await request('/finance/invoices'); }
      catch { return useERPStore.getState().invoices; }
    },
    async createInvoice(invoice) {
      try { return await request('/finance/invoices', { method: 'POST', body: JSON.stringify(invoice) }); }
      catch { useERPStore.getState().addInvoice(invoice); return invoice; }
    },
    async updateInvoiceStatus(id, status) {
      try { return await request(`/finance/invoices/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
      catch { useERPStore.getState().updateInvoiceStatus(id, status); }
    },
    async getBudgets() {
      try { return await request('/finance/budgets'); }
      catch { return useERPStore.getState().budgets; }
    },
    async createBudget(budget) {
      try { return await request('/finance/budgets', { method: 'POST', body: JSON.stringify(budget) }); }
      catch { useERPStore.getState().addBudget(budget); return budget; }
    },
    async getExpenses() {
      try { return await request('/finance/expenses'); }
      catch { return useERPStore.getState().expenses; }
    },
    async createExpense(expense) {
      try { return await request('/finance/expenses', { method: 'POST', body: JSON.stringify(expense) }); }
      catch { useERPStore.getState().addExpense(expense); return expense; }
    },
    async updateExpenseStatus(id, status) {
      try { return await request(`/finance/expenses/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
      catch { useERPStore.getState().updateExpenseStatus(id, status); }
    }
  },

  // ── HR ──
  hr: {
    async getEmployees() {
      try { return await request('/hr/employees'); }
      catch { return useERPStore.getState().employees; }
    },
    async addEmployee(employee) {
      try { return await request('/hr/employees', { method: 'POST', body: JSON.stringify(employee) }); }
      catch { useERPStore.getState().addEmployee(employee); return employee; }
    },
    async getLeaveRequests() {
      try { return await request('/hr/leaves'); }
      catch { return useERPStore.getState().leaveRequests; }
    },
    async createLeaveRequest(employeeId, leave) {
      try { return await request(`/hr/leaves?employeeId=${employeeId}`, { method: 'POST', body: JSON.stringify(leave) }); }
      catch { useERPStore.getState().addLeaveRequest(leave); return leave; }
    },
    async updateLeaveStatus(id, status) {
      try { return await request(`/hr/leaves/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
      catch { useERPStore.getState().updateLeaveStatus(id, status); }
    }
  },

  // ── Inventory ──
  inventory: {
    async getProducts() {
      try { return await request('/inventory/products'); }
      catch { return useERPStore.getState().products; }
    },
    async addProduct(product) {
      try { return await request('/inventory/products', { method: 'POST', body: JSON.stringify(product) }); }
      catch { useERPStore.getState().addProduct(product); return product; }
    },
    async updateStock(id, quantity) {
      try { return await request(`/inventory/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ quantity }) }); }
      catch { useERPStore.getState().updateProductStock(id, quantity); }
    },
    async getWarehouses() {
      try { return await request('/inventory/warehouses'); }
      catch { return useERPStore.getState().warehouses; }
    },
    async createWarehouse(warehouse) {
      try { return await request('/inventory/warehouses', { method: 'POST', body: JSON.stringify(warehouse) }); }
      catch { useERPStore.getState().addWarehouse(warehouse); return warehouse; }
    },
    async getBatches() {
      try { return await request('/inventory/batches'); }
      catch { return useERPStore.getState().inventoryBatches; }
    },
    async createBatch(batch) {
      try { return await request('/inventory/batches', { method: 'POST', body: JSON.stringify(batch) }); }
      catch { useERPStore.getState().addInventoryBatch(batch); return batch; }
    },
    async getStockMovements() {
      try { return await request('/inventory/transactions'); }
      catch { return useERPStore.getState().stockMovements; }
    },
    async createStockMovement(movement) {
      try { return await request('/inventory/transactions', { method: 'POST', body: JSON.stringify(movement) }); }
      catch { useERPStore.getState().addStockMovement(movement); return movement; }
    }
  },

  // ── CRM ──
  crm: {
    async getLeads() {
      try { return await request('/crm/leads'); }
      catch { return useERPStore.getState().leads; }
    },
    async addLead(lead) {
      try { return await request('/crm/leads', { method: 'POST', body: JSON.stringify(lead) }); }
      catch { useERPStore.getState().addLead(lead); return lead; }
    },
    async updateLeadStage(id, status) {
      try { return await request(`/crm/leads/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
      catch { useERPStore.getState().updateLeadStage(id, status); }
    },
    async getCustomers() {
      try { return await request('/crm/customers'); }
      catch { return useERPStore.getState().customers; }
    }
  },

  // ── Procurement ──
  procurement: {
    async getPurchaseOrders() {
      try { return await request('/procurement/purchase-orders'); }
      catch { return useERPStore.getState().purchaseOrders; }
    },
    async createPurchaseOrder(po) {
      try { return await request('/procurement/purchase-orders', { method: 'POST', body: JSON.stringify(po) }); }
      catch { useERPStore.getState().addPurchaseOrder(po); return po; }
    },
    async approvePurchaseOrder(id) {
      try { return await request(`/procurement/purchase-orders/${id}/approve`, { method: 'PATCH' }); }
      catch { useERPStore.getState().approvePurchaseOrder(id); }
    },
    async getSuppliers() {
      try { return await request('/procurement/suppliers'); }
      catch { return useERPStore.getState().suppliers; }
    }
  },

  // ── Payroll ──
  payroll: {
    async getPayrolls() {
      try { return await request('/payroll'); }
      catch { return useERPStore.getState().payrolls; }
    },
    async generatePayslip(data) {
      try { return await request('/payroll/generate', { method: 'POST', body: JSON.stringify(data) }); }
      catch { useERPStore.getState().addPayrollEntry(data); return data; }
    },
    async processPayroll(id) {
      try { return await request(`/payroll/${id}/process`, { method: 'PATCH' }); }
      catch { useERPStore.getState().processPayroll(id); }
    }
  },

  // ── Projects ──
  projects: {
    async getProjects() {
      try { return await request('/projects'); }
      catch { return useERPStore.getState().projects; }
    },
    async addProject(project) {
      try { return await request('/projects', { method: 'POST', body: JSON.stringify(project) }); }
      catch { useERPStore.getState().addProject(project); return project; }
    },
    async addTask(projectId, task) {
      try { return await request(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(task) }); }
      catch { useERPStore.getState().addProjectTask(projectId, task); return task; }
    }
  },

  // ── Manufacturing ──
  manufacturing: {
    async getBatches() {
      try { return await request('/manufacturing/batches'); }
      catch { return useERPStore.getState().productionBatches; }
    },
    async createBatch(batch) {
      try { return await request('/manufacturing/batches', { method: 'POST', body: JSON.stringify(batch) }); }
      catch { useERPStore.getState().addProductionBatch(batch); return batch; }
    },
    async updateBatchProgress(id, progress) {
      try { return await request(`/manufacturing/batches/${id}/progress`, { method: 'PATCH', body: JSON.stringify({ progress }) }); }
      catch { useERPStore.getState().updateBatchProgress(id, progress); }
    }
  },

  // ── Supply Chain ──
  supplyChain: {
    async getShipments() {
      try { return await request('/supply-chain/shipments'); }
      catch { return useERPStore.getState().shipments; }
    },
    async createShipment(shipment) {
      try { return await request('/supply-chain/shipments', { method: 'POST', body: JSON.stringify(shipment) }); }
      catch { useERPStore.getState().addShipment(shipment); return shipment; }
    },
    async updateShipmentStatus(id, status) {
      try { return await request(`/supply-chain/shipments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
      catch { useERPStore.getState().updateShipmentStatus(id, status); }
    }
  },

  // ── Assets ──
  assets: {
    async getAssets() {
      try { return await request('/assets'); }
      catch { return useERPStore.getState().assets; }
    },
    async addAsset(asset) {
      try { return await request('/assets', { method: 'POST', body: JSON.stringify(asset) }); }
      catch { useERPStore.getState().addAsset(asset); return asset; }
    },
    async scheduleMaintenace(assetId, date) {
      try { return await request(`/assets/${assetId}/maintenance`, { method: 'PATCH', body: JSON.stringify({ scheduledDate: date }) }); }
      catch { /* offline no-op */ }
    }
  },

  // ── Support ──
  support: {
    async getTickets() {
      try { return await request('/support/tickets'); }
      catch { return useERPStore.getState().supportTickets || []; }
    },
    async createTicket(ticket) {
      try { return await request('/support/tickets', { method: 'POST', body: JSON.stringify(ticket) }); }
      catch { useERPStore.getState().addSupportTicket?.(ticket); return ticket; }
    },
    async updateTicketStatus(id, status) {
      try { return await request(`/support/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
      catch { useERPStore.getState().updateTicketStatus?.(id, status); }
    }
  },

  // ── E-Commerce ──
  ecommerce: {
    async getProducts() {
      try { return await request('/ecommerce/products'); }
      catch { return useERPStore.getState().ecommerceProducts; }
    },
    async getOrders() {
      try { return await request('/ecommerce/orders'); }
      catch { return useERPStore.getState().ecommerceOrders; }
    },
    async checkout(payload) {
      return request('/ecommerce/checkout', { method: 'POST', body: JSON.stringify(payload) });
    },
    async updateOrderStatus(id, status) {
      try { return await request(`/ecommerce/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
      catch { useERPStore.getState().updateEcommerceOrderStatus(id, status); }
    }
  },

  // ── Banking ──
  banking: {
    async getAccounts() {
      try { return await request('/banking/accounts'); }
      catch { return useERPStore.getState().bankingAccounts; }
    },
    async createAccount(account) {
      try { return await request('/banking/accounts', { method: 'POST', body: JSON.stringify(account) }); }
      catch { useERPStore.getState().addBankingAccount(account); return account; }
    },
    async getTransactions() {
      try { return await request('/banking/transactions'); }
      catch { return useERPStore.getState().bankingTransactions; }
    },
    async createTransaction(tx) {
      try { return await request('/banking/transactions', { method: 'POST', body: JSON.stringify(tx) }); }
      catch { useERPStore.getState().addBankingTransaction(tx); return tx; }
    },
    async getLoans() {
      try { return await request('/banking/loans'); }
      catch { return useERPStore.getState().bankingLoans; }
    },
    async createLoan(loan) {
      try { return await request('/banking/loans', { method: 'POST', body: JSON.stringify(loan) }); }
      catch { useERPStore.getState().addBankingLoan(loan); return loan; }
    }
  },

  // ── Healthcare ──
  healthcare: {
    async getPatients() {
      try { return await request('/healthcare/patients'); }
      catch { return useERPStore.getState().patients || []; }
    },
    async createPatient(patient) {
      try { return await request('/healthcare/patients', { method: 'POST', body: JSON.stringify(patient) }); }
      catch { return patient; }
    },
    async getAppointments() {
      try { return await request('/healthcare/appointments'); }
      catch { return useERPStore.getState().appointments || []; }
    },
    async createAppointment(appt) {
      try { return await request('/healthcare/appointments', { method: 'POST', body: JSON.stringify(appt) }); }
      catch { return appt; }
    },
    async getPrescriptions() {
      try { return await request('/healthcare/prescriptions'); }
      catch { return useERPStore.getState().prescriptions || []; }
    },
    async createPrescription(rx) {
      try { return await request('/healthcare/prescriptions', { method: 'POST', body: JSON.stringify(rx) }); }
      catch { return rx; }
    }
  },

  // ── Education ──
  education: {
    async getCourses() {
      try { return await request('/education/courses'); }
      catch { return useERPStore.getState().courses || []; }
    },
    async createCourse(course) {
      try { return await request('/education/courses', { method: 'POST', body: JSON.stringify(course) }); }
      catch { return course; }
    },
    async getEnrollments() {
      try { return await request('/education/enrollments'); }
      catch { return useERPStore.getState().enrollments || []; }
    },
    async createEnrollment(enrollment) {
      try { return await request('/education/enrollments', { method: 'POST', body: JSON.stringify(enrollment) }); }
      catch { return enrollment; }
    },
    async getAssessments() {
      try { return await request('/education/assessments'); }
      catch { return useERPStore.getState().assessments || []; }
    }
  },

  // ── Sustainability ──
  sustainability: {
    async getCarbonEntries() {
      try { return await request('/sustainability/carbon'); }
      catch { return useERPStore.getState().carbonEntries || []; }
    },
    async createCarbonEntry(entry) {
      try { return await request('/sustainability/carbon', { method: 'POST', body: JSON.stringify(entry) }); }
      catch { return entry; }
    },
    async getESGReports() {
      try { return await request('/sustainability/esg-reports'); }
      catch { return useERPStore.getState().esgReports || []; }
    },
    async createESGReport(report) {
      try { return await request('/sustainability/esg-reports', { method: 'POST', body: JSON.stringify(report) }); }
      catch { return report; }
    },
    async getInitiatives() {
      try { return await request('/sustainability/initiatives'); }
      catch { return useERPStore.getState().greenInitiatives || []; }
    },
    async createInitiative(initiative) {
      try { return await request('/sustainability/initiatives', { method: 'POST', body: JSON.stringify(initiative) }); }
      catch { return initiative; }
    }
  },

  // ── Marketing ──
  marketing: {
    async getCampaigns() {
      try { return await request('/marketing/campaigns'); }
      catch { return useERPStore.getState().marketingCampaigns; }
    },
    async createCampaign(campaign) {
      try { return await request('/marketing/campaigns', { method: 'POST', body: JSON.stringify(campaign) }); }
      catch { useERPStore.getState().addMarketingCampaign(campaign); return campaign; }
    },
    async getLeads() {
      try { return await request('/marketing/leads'); }
      catch { return useERPStore.getState().marketingLeads; }
    },
    async createLead(lead) {
      try { return await request('/marketing/leads', { method: 'POST', body: JSON.stringify(lead) }); }
      catch { useERPStore.getState().addMarketingLead(lead); return lead; }
    },
    async getSocialPosts() {
      try { return await request('/marketing/social-posts'); }
      catch { return useERPStore.getState().socialMediaPosts; }
    },
    async createSocialPost(post) {
      try { return await request('/marketing/social-posts', { method: 'POST', body: JSON.stringify(post) }); }
      catch { useERPStore.getState().addSocialMediaPost(post); return post; }
    }
  },

  // ── Security ──
  security: {
    async getEvents() {
      try { return await request('/security/events'); }
      catch { return useERPStore.getState().securityEvents || []; }
    },
    async createEvent(event) {
      try { return await request('/security/events', { method: 'POST', body: JSON.stringify(event) }); }
      catch { return event; }
    },
    async getIncidents() {
      try { return await request('/security/incidents'); }
      catch { return useERPStore.getState().securityIncidents || []; }
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
      try { return await request('/analytics/reports'); }
      catch { return useERPStore.getState().analyticsReports || []; }
    },
    async createReport(report) {
      try { return await request('/analytics/reports', { method: 'POST', body: JSON.stringify(report) }); }
      catch { return report; }
    },
    async getKPIs() {
      try { return await request('/analytics/kpis'); }
      catch { return useERPStore.getState().kpiSnapshots || []; }
    },
    async createKPI(kpi) {
      try { return await request('/analytics/kpis', { method: 'POST', body: JSON.stringify(kpi) }); }
      catch { return kpi; }
    }
  },

  // ── Automation ──
  automation: {
    async getWorkflows() {
      try { return await request('/automation/workflows'); }
      catch { return useERPStore.getState().automationWorkflows || []; }
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
      try { return await request('/automation/run-logs'); }
      catch { return useERPStore.getState().botRunLogs || []; }
    },
    async createRunLog(log) {
      try { return await request('/automation/run-logs', { method: 'POST', body: JSON.stringify(log) }); }
      catch { return log; }
    }
  },

  // ── Notifications ──
  notifications: {
    async getAll() {
      try { return await request('/notifications'); }
      catch { return useERPStore.getState().notifications; }
    },
    async markRead(id) {
      try { return await request(`/notifications/${id}/read`, { method: 'PATCH' }); }
      catch { useERPStore.getState().markNotificationRead(id); }
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
      return request('/admin/users/create', { method: 'POST', body: JSON.stringify(userData) });
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
  }
};

export default api;