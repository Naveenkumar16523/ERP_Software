// Centralized API client interfacing with Node.js Express backend
// Implements transparent offline-first fallbacks using our Zustand store.
import { useERPStore } from '../store/useERPStore';

const API_URL = import.meta.env.VITE_API_URL || 'https://erp-software-hmfd.onrender.com';
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
      throw new Error(errBody.message || `API Error: ${res.status} ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.warn(`[Network Fail] API path ${path} failed. Reverting to local store. Error:`, error.message);
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
    }
  },

  // ── Finance ──
  finance: {
    async getAccounts() {
      try { return await request('/finance/accounts'); }
      catch { return useERPStore.getState().accounts; }
    },
    async getJournalEntries() {
      try { return await request('/finance/journal-entries'); }
      catch { return useERPStore.getState().journalEntries; }
    },
    async createJournalEntry(entry) {
      try { return await request('/finance/journal-entries', { method: 'POST', body: JSON.stringify(entry) }); }
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
      try { return await request('/hr/leave-requests'); }
      catch { return useERPStore.getState().leaveRequests; }
    },
    async updateLeaveStatus(id, status) {
      try { return await request(`/hr/leave-requests/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
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
  }
};

export default api;