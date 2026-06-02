import { create } from 'zustand';
import seedData from '../data/seedData';

let toastIdCounter = 1;
let notifIdCounter = 100;

export const useERPStore = create((set, get) => ({
  // ── Navigation & UI ──────────────────────────────────────────────
  activeModule: 'dashboard',
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  theme: localStorage.getItem('erp-theme') || 'dark',
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  dbLive: true,
  currentUser: { id: 'emp-1', name: 'John Doe', role: 'Admin', avatar: null },

  // ── Notifications & Toasts ────────────────────────────────────────
  notifications: seedData.notifications || [],
  toasts: [],

  // ── Finance Module ────────────────────────────────────────────────
  accounts: seedData.accounts || [],
  journalEntries: seedData.journalEntries || [],
  invoices: seedData.invoices || [],

  // ── HR Module ─────────────────────────────────────────────────────
  employees: seedData.employees || [],
  leaveRequests: seedData.leaveRequests || [],
  payrolls: seedData.payrolls || [],

  // ── CRM Module ────────────────────────────────────────────────────
  leads: seedData.leads || [],
  customers: seedData.customers || [],

  // ── Inventory / Products ──────────────────────────────────────────
  products: seedData.products || [],
  cart: [],

  // ── Manufacturing ─────────────────────────────────────────────────
  productionBatches: seedData.productionBatches || [],
  qaInspections: seedData.qaInspections || [],

  // ── Procurement ───────────────────────────────────────────────────
  suppliers: seedData.suppliers || [],
  purchaseOrders: seedData.purchaseOrders || [],

  // ── Assets ───────────────────────────────────────────────────────
  assets: seedData.assets || [],

  // ── Orders & Shipments ────────────────────────────────────────────
  orders: seedData.orders || [],
  shipments: seedData.shipments || [],

  // ── Projects ──────────────────────────────────────────────────────
  projects: seedData.projects || [],

  // ── Migration / Audit ─────────────────────────────────────────────
  migrationHistory: seedData.migrationHistory || [],

  // ── Banking (extended) ────────────────────────────────────────────
  bankingAccounts: [
    { id: 'bank-1', name: 'Primary Current Account', bank: 'HDFC Bank', accountNo: '****4521', balance: 2450000, type: 'CURRENT' },
    { id: 'bank-2', name: 'Payroll Savings Account', bank: 'SBI', accountNo: '****7830', balance: 850000, type: 'SAVINGS' },
    { id: 'bank-3', name: 'Fixed Deposit', bank: 'ICICI Bank', accountNo: '****2210', balance: 5000000, type: 'FD' }
  ],
  bankingLoans: [
    { id: 'loan-1', loanNo: 'LN-2024-001', type: 'TERM_LOAN', lender: 'HDFC Bank', principal: 2000000, outstanding: 1450000, emi: 45000, nextDue: '2026-06-15', status: 'ACTIVE' },
    { id: 'loan-2', loanNo: 'LN-2025-002', type: 'WORKING_CAPITAL', lender: 'SBI', principal: 500000, outstanding: 320000, emi: 18000, nextDue: '2026-06-10', status: 'ACTIVE' }
  ],
  bankingTransactions: [
    { id: 'bt-1', date: '2026-05-28', description: 'Salary Disbursement May 2026', amount: -287000, type: 'DEBIT', accountId: 'bank-1' },
    { id: 'bt-2', date: '2026-05-25', description: 'Customer Payment - Nexus Retailers', amount: 52000, type: 'CREDIT', accountId: 'bank-1' },
    { id: 'bt-3', date: '2026-05-20', description: 'FD Interest Credit', amount: 25000, type: 'CREDIT', accountId: 'bank-3' }
  ],

  // ── Education Module ──────────────────────────────────────────────
  educationStudents: [
    { id: 'stu-1', studentId: 'STU-001', name: 'Arjun Patel', grade: '10-A', gpa: 9.2, attendance: 94, status: 'ENROLLED', fees: 'PAID' },
    { id: 'stu-2', studentId: 'STU-002', name: 'Meera Krishnan', grade: '10-A', gpa: 8.7, attendance: 88, status: 'ENROLLED', fees: 'PENDING' },
    { id: 'stu-3', studentId: 'STU-003', name: 'Rohan Mehta', grade: '11-B', gpa: 7.5, attendance: 76, status: 'ENROLLED', fees: 'PAID' }
  ],

  // ── Healthcare Module ─────────────────────────────────────────────
  healthcarePatients: [
    { id: 'pat-1', patientId: 'PAT-001', name: 'Ramesh Kumar', age: 45, ward: 'Cardiology', status: 'ADMITTED', admittedOn: '2026-05-28', doctor: 'Dr. Anil Mehta', vitals: { bp: '120/80', temp: '98.6°F', spo2: '98%' } },
    { id: 'pat-2', patientId: 'PAT-002', name: 'Sunita Devi', age: 62, ward: 'General', status: 'ADMITTED', admittedOn: '2026-05-30', doctor: 'Dr. Priya Nair', vitals: { bp: '135/90', temp: '99.1°F', spo2: '96%' } },
    { id: 'pat-3', patientId: 'PAT-003', name: 'Vijay Singh', age: 38, ward: 'Orthopedics', status: 'DISCHARGED', admittedOn: '2026-05-20', doctor: 'Dr. Suresh Rao', vitals: { bp: '118/76', temp: '98.4°F', spo2: '99%' } }
  ],

  // ── Sustainability Module ─────────────────────────────────────────
  sustainabilityMetrics: {
    carbonFootprint: 1240,
    renewableEnergy: 38,
    wasteRecycled: 72,
    waterUsage: 8500,
    target: { carbonFootprint: 1000, renewableEnergy: 60, wasteRecycled: 85 }
  },
  sustainabilityOffsets: [
    { id: 'offset-1', project: 'Rajasthan Solar Farm', credits: 200, cost: 120000, status: 'ACTIVE', date: '2026-01-15' },
    { id: 'offset-2', project: 'Western Ghats Reforestation', credits: 150, cost: 90000, status: 'ACTIVE', date: '2026-03-01' }
  ],

  // ── Agriculture Module ────────────────────────────────────────────
  agricultureFields: [
    { id: 'field-1', name: 'North Paddy Block', area: 12.5, crop: 'Rice', status: 'GROWING', irrigationOn: false, soilMoisture: 62, ndvi: 0.74 },
    { id: 'field-2', name: 'South Wheat Zone', area: 8.2, crop: 'Wheat', status: 'HARVESTED', irrigationOn: false, soilMoisture: 28, ndvi: 0.31 },
    { id: 'field-3', name: 'East Vegetable Plot', area: 3.0, crop: 'Tomatoes', status: 'GROWING', irrigationOn: true, soilMoisture: 78, ndvi: 0.82 }
  ],
  agricultureLivestock: [
    { id: 'ls-1', type: 'Dairy Cattle', count: 42, health: 'GOOD', lastVetCheck: '2026-05-15', avgMilkYield: 18.5 },
    { id: 'ls-2', type: 'Poultry', count: 520, health: 'GOOD', lastVetCheck: '2026-05-20', avgEggYield: 420 }
  ],

  // ── Marketing Module ──────────────────────────────────────────────
  marketingCampaigns: [
    { id: 'camp-1', name: 'Summer Product Launch', channel: 'Email', status: 'ACTIVE', budget: 150000, spent: 82000, leads: 342, conversions: 28, startDate: '2026-05-01', endDate: '2026-06-30' },
    { id: 'camp-2', name: 'B2B Referral Drive', channel: 'Social', status: 'ACTIVE', budget: 80000, spent: 45000, leads: 186, conversions: 15, startDate: '2026-04-15', endDate: '2026-06-15' },
    { id: 'camp-3', name: 'Q1 Brand Awareness', channel: 'Display', status: 'COMPLETED', budget: 200000, spent: 198000, leads: 850, conversions: 62, startDate: '2026-01-01', endDate: '2026-03-31' }
  ],

  // ── Security Module ───────────────────────────────────────────────
  securityThreats: [
    { id: 'threat-1', type: 'BRUTE_FORCE', severity: 'HIGH', source: '192.168.1.45', timestamp: '2026-05-31T22:14:00.000Z', status: 'MITIGATED', description: 'Multiple failed login attempts detected' },
    { id: 'threat-2', type: 'SQL_INJECTION', severity: 'CRITICAL', source: '10.0.0.23', timestamp: '2026-06-01T01:30:00.000Z', status: 'INVESTIGATING', description: 'Malicious SQL patterns detected in API request' }
  ],
  securityAuditLog: [
    { id: 'audit-1', action: 'LOGIN', userId: 'emp-1', ip: '192.168.0.10', timestamp: '2026-06-01T09:00:00.000Z', result: 'SUCCESS' },
    { id: 'audit-2', action: 'EXPORT_DATA', userId: 'emp-2', ip: '192.168.0.12', timestamp: '2026-06-01T09:45:00.000Z', result: 'SUCCESS' }
  ],

  // ── Supply Chain / Field Work ──────────────────────────────────────
  fieldWorkOrders: [
    { id: 'wo-1', woNo: 'WO-2026-001', type: 'MAINTENANCE', location: 'Site A - Mumbai', assignedTo: 'emp-3', status: 'IN_PROGRESS', priority: 'HIGH', scheduledDate: '2026-06-02', description: 'Quarterly maintenance check on CNC machines' },
    { id: 'wo-2', woNo: 'WO-2026-002', type: 'INSTALLATION', location: 'Site B - Pune', assignedTo: 'emp-1', status: 'PENDING', priority: 'MEDIUM', scheduledDate: '2026-06-05', description: 'New server rack installation' }
  ],

  // ── AI Chat ───────────────────────────────────────────────────────
  chatMessages: [
    { id: 'cm-1', role: 'assistant', content: 'Hello! I\'m your ERP AI assistant. How can I help you today?', timestamp: new Date().toISOString() }
  ],
  aiMessages: [
    { id: 'cm-1', role: 'assistant', content: 'Hello! I\'m your ERP AI assistant. How can I help you today?', timestamp: new Date().toISOString() }
  ],

  // ── Support Tickets ───────────────────────────────────────────────
  supportTickets: [
    { id: 'tkt-1', ticketNo: 'TKT-10245', title: 'Cannot connect to TiDB Cloud database', description: 'Getting connection timeout errors when trying to sync database migrations.', category: 'Technical', priority: 'CRITICAL', status: 'OPEN', createdAt: '2026-06-01T08:00:00.000Z' },
    { id: 'tkt-2', ticketNo: 'TKT-10246', title: 'Salary slip generation showing incorrect tax deduction', description: 'The tax deduction for May 2026 is showing higher than standard slab rates.', category: 'Finance', priority: 'HIGH', status: 'IN_PROGRESS', createdAt: '2026-06-01T09:30:00.000Z' },
    { id: 'tkt-3', ticketNo: 'TKT-10247', title: 'Request to update email address', description: 'Please change my email from john.d@company.com to john.doe@company.com.', category: 'HR', priority: 'LOW', status: 'RESOLVED', createdAt: '2026-05-31T14:00:00.000Z' }
  ],

  // ── Migration Jobs ────────────────────────────────────────────────
  migrationJobs: [],
  migrationValidationReport: null,

  // ═══════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════

  // ── Navigation ────────────────────────────────────────────────────
  setActiveModule: (m) => set({ activeModule: m }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileSidebar: (o) => set({ mobileSidebarOpen: o }),
  toggleTheme: () => set((s) => {
    const next = s.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('erp-theme', next);
    return { theme: next };
  }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSearchResults: (r) => set({ searchResults: r }),
  setIsSearching: (v) => set({ isSearching: v }),
  setDbLive: (v) => set({ dbLive: v }),
  logout: () => set({ currentUser: null, activeModule: 'dashboard' }),

  // ── Toasts ────────────────────────────────────────────────────────
  addToast: (message, type = 'info') => set((s) => ({
    toasts: [...s.toasts, { id: toastIdCounter++, message, type }]
  })),
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  // ── Notifications ────────────────────────────────────────────────
  addNotification: (message, type = 'info') => set((s) => ({
    notifications: [
      { id: `notif-${notifIdCounter++}`, message, type, createdAt: new Date().toISOString(), read: false },
      ...s.notifications
    ]
  })),
  clearNotifications: () => set({ notifications: [] }),
  markNotificationRead: (id) => set((s) => ({
    notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n)
  })),

  // ── Finance ───────────────────────────────────────────────────────
  setAccounts: (accounts) => set({ accounts }),
  addAccount: (account) => set((s) => ({ accounts: [...s.accounts, { ...account, id: `acc-${Date.now()}` }] })),
  addJournalEntry: (entry) => set((s) => ({
    journalEntries: [...s.journalEntries, { ...entry, id: `je-${Date.now()}`, blockIndex: s.journalEntries.length + 1 }]
  })),
  addInvoice: (invoice) => set((s) => ({
    invoices: [...s.invoices, { ...invoice, id: `inv-${Date.now()}`, status: 'PENDING', createdAt: new Date().toISOString() }]
  })),
  updateInvoiceStatus: (id, status) => set((s) => ({
    invoices: s.invoices.map((inv) => inv.id === id ? { ...inv, status } : inv)
  })),

  // ── HR ────────────────────────────────────────────────────────────
  addEmployee: (emp) => set((s) => ({
    employees: [...s.employees, { ...emp, id: `emp-${Date.now()}`, isActive: true, joinDate: new Date().toISOString() }]
  })),
  updateEmployee: (id, updates) => set((s) => ({
    employees: s.employees.map((e) => e.id === id ? { ...e, ...updates } : e)
  })),
  addLeaveRequest: (req) => set((s) => ({
    leaveRequests: [...s.leaveRequests, { ...req, id: `leave-${Date.now()}`, status: 'PENDING' }]
  })),
  updateLeaveStatus: (id, status) => set((s) => ({
    leaveRequests: s.leaveRequests.map((l) => l.id === id ? { ...l, status } : l)
  })),
  addPayrollEntry: (entry) => set((s) => ({ payrolls: [...s.payrolls, { ...entry, id: `slip-${Date.now()}` }] })),
  processPayroll: (id) => set((s) => ({
    payrolls: s.payrolls.map((p) => p.id === id ? { ...p, status: 'PAID' } : p)
  })),

  // ── CRM ───────────────────────────────────────────────────────────
  addLead: (lead) => set((s) => ({
    leads: [...s.leads, { ...lead, id: `lead-${Date.now()}`, status: 'NEW' }]
  })),
  updateLeadStage: (id, status) => set((s) => ({
    leads: s.leads.map((l) => l.id === id ? { ...l, status } : l)
  })),
  addCustomer: (customer) => set((s) => ({
    customers: [...s.customers, { ...customer, id: `cust-${Date.now()}`, createdAt: new Date().toISOString() }]
  })),

  // ── Inventory / Products ──────────────────────────────────────────
  addToCart: (product, qty = 1) => set((s) => {
    const existing = s.cart.find((c) => c.productId === product.id);
    if (existing) {
      return { cart: s.cart.map((c) => c.productId === product.id ? { ...c, qty: c.qty + qty } : c) };
    }
    return { cart: [...s.cart, { productId: product.id, product, qty }] };
  }),
  updateCartQty: (productId, qty) => set((s) => ({
    cart: qty <= 0
      ? s.cart.filter((c) => c.productId !== productId)
      : s.cart.map((c) => c.productId === productId ? { ...c, qty } : c)
  })),
  removeFromCart: (productId) => set((s) => ({ cart: s.cart.filter((c) => c.productId !== productId) })),

  // ── Orders ────────────────────────────────────────────────────────
  placeOrder: (order) => set((s) => ({
    orders: [...s.orders, { ...order, id: `ord-${Date.now()}`, orderNo: `ORD-${Date.now()}`, status: 'PENDING', createdAt: new Date().toISOString() }],
    cart: []
  })),
  fulfillOrder: (id) => set((s) => ({
    orders: s.orders.map((o) => o.id === id ? { ...o, status: 'FULFILLED' } : o)
  })),

  // ── Shipments ─────────────────────────────────────────────────────
  addShipment: (shipment) => set((s) => ({
    shipments: [...s.shipments, { ...shipment, id: `ship-${Date.now()}`, status: 'DISPATCHED' }]
  })),
  updateShipmentStatus: (id, status) => set((s) => ({
    shipments: s.shipments.map((sh) => sh.id === id ? { ...sh, status } : sh)
  })),

  // ── Manufacturing ─────────────────────────────────────────────────
  addProductionBatch: (batch) => set((s) => ({
    productionBatches: [...s.productionBatches, { ...batch, id: `batch-${Date.now()}`, status: 'PLANNED', progress: 0 }]
  })),
  updateBatchProgress: (id, progress, status) => set((s) => ({
    productionBatches: s.productionBatches.map((b) =>
      b.id === id ? { ...b, progress, status: status || (progress >= 100 ? 'COMPLETED' : b.status) } : b
    )
  })),
  addQaInspection: (insp) => set((s) => ({
    qaInspections: [...s.qaInspections, { ...insp, id: `qa-${Date.now()}`, inspectedAt: new Date().toISOString() }]
  })),

  // ── Procurement ───────────────────────────────────────────────────
  addPurchaseOrder: (po) => set((s) => ({
    purchaseOrders: [...s.purchaseOrders, { ...po, id: `po-${Date.now()}`, poNo: `PO-${Date.now()}`, status: 'PENDING', createdAt: new Date().toISOString() }]
  })),
  approvePurchaseOrder: (id) => set((s) => ({
    purchaseOrders: s.purchaseOrders.map((po) => po.id === id ? { ...po, status: 'APPROVED' } : po)
  })),

  // ── Assets ───────────────────────────────────────────────────────
  addAsset: (asset) => set((s) => ({
    assets: [...s.assets, { ...asset, id: `asset-${Date.now()}`, assetTag: `AST-${Date.now()}`, status: 'ACTIVE' }]
  })),
  updateAsset: (id, updates) => set((s) => ({
    assets: s.assets.map((a) => a.id === id ? { ...a, ...updates } : a)
  })),

  // ── Projects ─────────────────────────────────────────────────────
  addProject: (proj) => set((s) => ({
    projects: [...s.projects, { ...proj, id: `proj-${Date.now()}`, tasks: [], status: 'PLANNING' }]
  })),
  addTaskToProject: (projectId, task) => set((s) => ({
    projects: s.projects.map((p) =>
      p.id === projectId
        ? { ...p, tasks: [...(p.tasks || []), { ...task, id: `task-${Date.now()}`, status: 'TODO' }] }
        : p
    )
  })),
  updateProjectStatus: (id, status) => set((s) => ({
    projects: s.projects.map((p) => p.id === id ? { ...p, status } : p)
  })),

  // ── Banking ───────────────────────────────────────────────────────
  postBankingTransaction: (tx) => set((s) => ({
    bankingTransactions: [...s.bankingTransactions, { ...tx, id: `bt-${Date.now()}`, date: new Date().toISOString().split('T')[0] }],
    bankingAccounts: s.bankingAccounts.map((acc) =>
      acc.id === tx.accountId
        ? { ...acc, balance: tx.type === 'CREDIT' ? acc.balance + tx.amount : acc.balance - tx.amount }
        : acc
    )
  })),
  evaluateLoanApplication: (application) => {
    // Simulate loan evaluation
    const approved = application.creditScore > 650 && application.income > 50000;
    get().addToast(approved ? 'Loan application pre-approved!' : 'Loan application requires review.', approved ? 'success' : 'warning');
  },

  // ── Education ─────────────────────────────────────────────────────
  admitStudent: (student) => set((s) => ({
    educationStudents: [...s.educationStudents, { ...student, id: `stu-${Date.now()}`, studentId: `STU-${Date.now()}`, status: 'ENROLLED' }]
  })),
  updateStudentGrades: (id, gpa) => set((s) => ({
    educationStudents: s.educationStudents.map((st) => st.id === id ? { ...st, gpa } : st)
  })),
  updateAttendance: (id, attendance) => set((s) => ({
    educationStudents: s.educationStudents.map((st) => st.id === id ? { ...st, attendance } : st)
  })),

  // ── Healthcare ────────────────────────────────────────────────────
  admitPatient: (patient) => set((s) => ({
    healthcarePatients: [...s.healthcarePatients, { ...patient, id: `pat-${Date.now()}`, patientId: `PAT-${Date.now()}`, status: 'ADMITTED', admittedOn: new Date().toISOString().split('T')[0] }]
  })),
  recordPatientVitals: (id, vitals) => set((s) => ({
    healthcarePatients: s.healthcarePatients.map((p) => p.id === id ? { ...p, vitals } : p)
  })),
  dischargePatient: (id) => set((s) => ({
    healthcarePatients: s.healthcarePatients.map((p) => p.id === id ? { ...p, status: 'DISCHARGED' } : p)
  })),

  // ── Sustainability ────────────────────────────────────────────────
  purchaseCarbonOffset: (offset) => set((s) => ({
    sustainabilityOffsets: [...s.sustainabilityOffsets, { ...offset, id: `offset-${Date.now()}`, status: 'ACTIVE', date: new Date().toISOString().split('T')[0] }]
  })),

  // ── Agriculture ───────────────────────────────────────────────────
  toggleIrrigationZone: (id) => set((s) => ({
    agricultureFields: s.agricultureFields.map((f) => f.id === id ? { ...f, irrigationOn: !f.irrigationOn } : f)
  })),
  registerCropCycle: (fieldId, crop) => set((s) => ({
    agricultureFields: s.agricultureFields.map((f) => f.id === fieldId ? { ...f, crop, status: 'PLANTED' } : f)
  })),
  logLivestockActivity: (id, update) => set((s) => ({
    agricultureLivestock: s.agricultureLivestock.map((ls) => ls.id === id ? { ...ls, ...update } : ls)
  })),

  // ── Marketing ─────────────────────────────────────────────────────
  launchCampaign: (campaign) => set((s) => ({
    marketingCampaigns: [...s.marketingCampaigns, { ...campaign, id: `camp-${Date.now()}`, status: 'ACTIVE', leads: 0, conversions: 0 }]
  })),
  updateCampaignStatus: (id, status) => set((s) => ({
    marketingCampaigns: s.marketingCampaigns.map((c) => c.id === id ? { ...c, status } : c)
  })),

  // ── Security ──────────────────────────────────────────────────────
  logSecurityIncident: (incident) => set((s) => ({
    securityThreats: [...s.securityThreats, { ...incident, id: `threat-${Date.now()}`, timestamp: new Date().toISOString(), status: 'OPEN' }]
  })),
  mitigateThreat: (id) => set((s) => ({
    securityThreats: s.securityThreats.map((t) => t.id === id ? { ...t, status: 'MITIGATED' } : t)
  })),

  // ── Field Work Orders ─────────────────────────────────────────────
  dispatchWorkOrder: (wo) => set((s) => ({
    fieldWorkOrders: [...s.fieldWorkOrders, { ...wo, id: `wo-${Date.now()}`, woNo: `WO-${Date.now()}`, status: 'DISPATCHED' }]
  })),
  updateWorkOrderStatus: (id, status) => set((s) => ({
    fieldWorkOrders: s.fieldWorkOrders.map((w) => w.id === id ? { ...w, status } : w)
  })),

  // ── Migration ─────────────────────────────────────────────────────
  addMigrationEvent: (event) => set((s) => ({
    migrationHistory: [...s.migrationHistory, { ...event, id: `mig-${Date.now()}`, timestamp: new Date().toISOString() }]
  })),

  // ── AI Chat ───────────────────────────────────────────────────────
  addChatMessage: (msg) => set((s) => ({
    chatMessages: [...s.chatMessages, { ...msg, id: `cm-${Date.now()}`, timestamp: new Date().toISOString() }]
  })),
  clearChatMessages: () => set({ chatMessages: [] }),
  addAIMessage: (msg) => set((s) => ({
    aiMessages: [...s.aiMessages, { ...msg, id: `cm-${Date.now()}`, timestamp: new Date().toISOString() }]
  })),
  clearAIMessages: () => set({ aiMessages: [] }),

  // ── Support Tickets ───────────────────────────────────────────────
  addSupportTicket: (ticket) => set((s) => ({
    supportTickets: [...s.supportTickets, { ...ticket, id: `tkt-${Date.now()}`, status: 'OPEN' }]
  })),
  updateTicketStatus: (id, status) => set((s) => ({
    supportTickets: s.supportTickets.map((t) => t.id === id ? { ...t, status } : t)
  })),

  // ── Migration Jobs ────────────────────────────────────────────────
  startMigrationJob: (job) => {
    const jobId = `job-${Date.now()}`;
    const newJob = { ...job, id: jobId };
    set((s) => ({ migrationJobs: [...s.migrationJobs, newJob] }));
    
    // Simulate real-time progress for rich dynamic feedback
    const interval = setInterval(() => {
      set((s) => {
        const targetJob = s.migrationJobs.find(j => j.id === jobId);
        if (!targetJob) {
          clearInterval(interval);
          return {};
        }
        if (targetJob.progress >= 100) {
          clearInterval(interval);
          return {
            migrationJobs: s.migrationJobs.map(j => j.id === jobId ? { ...j, status: 'COMPLETED', progress: 100 } : j)
          };
        }
        return {
          migrationJobs: s.migrationJobs.map(j => j.id === jobId ? { ...j, progress: Math.min(100, targetJob.progress + 15) } : j)
        };
      });
    }, 1000);
  }
}));
