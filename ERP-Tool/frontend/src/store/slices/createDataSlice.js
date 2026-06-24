export const createDataSlice = (set, get) => ({
  // ── Finance Module ────────────────────────────────────────────────
  accounts: [],
  journalEntries: [],
  invoices: [],
  budgets: [],
  expenses: [],
  approvalWorkflows: [],
  statements: [],
  taxCompliance: {
    gstRate: 18,
    vatRate: 20,
    filingDeadlines: [],
    auditTrail: []
  },

  // ── HR Module ─────────────────────────────────────────────────────
  employees: [],
  leaveRequests: [],
  leaveBalances: [],
  jobPostings: [],
  applicants: [],
  performanceReviews: [],
  onboardingChecklists: [],
  attendanceLogs: [],
  payrolls: [],
  salaryStructures: [],
  payslips: [],

  // ── CRM Module ────────────────────────────────────────────────────
  leads: [],
  customers: [],
  salesForecast: [],
  opportunities: [],
  activities: [],

  // ── Inventory / Products ──────────────────────────────────────────
  products: [],
  ecommerceProducts: [],
  ecommerceOrders: [],
  payments: [],
  inventoryBatches: [],
  warehouses: [],
  stockMovements: [],
  cart: [],

  // ── Manufacturing ─────────────────────────────────────────────────
  productionBatches: [],
  qaInspections: [],
  workOrders: [],
  billOfMaterials: [],
  machines: [],
  machineSchedule: [],
  downtimeLogs: [],
  productionReports: [],

  // ── Procurement ───────────────────────────────────────────────────
  suppliers: [],
  purchaseOrders: [],
  rfqs: [],
  rfqResponses: [],
  vendorEvaluations: [],
  contracts: [],

  // ── Assets ───────────────────────────────────────────────────────
  assets: [],
  depreciationRecords: [],
  maintenanceSchedules: [],

  // ── Orders & Shipments ────────────────────────────────────────────
  orders: [],
  shipments: [],
  carriers: [],
  routes: [],

  // ── Projects ──────────────────────────────────────────────────────
  projects: [],
  tasks: [],
  milestones: [],
  resourceAllocations: [],

  // ── Migration / Audit ─────────────────────────────────────────────
  migrationHistory: [],

  // ── Banking (extended) ────────────────────────────────────────────
  bankingAccounts: [],
  bankingTransactions: [],

  // ── Analytics Hub ─────────────────────────────────────────────────
  kpis: [],
  reports: [],
  dashboards: [],
  bankingLoans: [],

  // ── Education Module ──────────────────────────────────────────────
  educationStudents: [],

  // ── Healthcare Module ─────────────────────────────────────────────
  healthcarePatients: [],

  // ── Sustainability Module ─────────────────────────────────────────
  sustainabilityMetrics: { carbonFootprint: 0, renewableEnergy: 0, wasteRecycled: 0, waterUsage: 0, target: { carbonFootprint: 0, renewableEnergy: 0, wasteRecycled: 0 } },
  sustainabilityOffsets: [],

  // ── Agriculture Module ────────────────────────────────────────────
  agricultureFields: [],
  agricultureLivestock: [],

  // ── Marketing Module ──────────────────────────────────────────────
  marketingCampaigns: [],

  // ── Security Module ───────────────────────────────────────────────
  securityThreats: [],
  securityAuditLog: [],

  // ── Supply Chain / Field Work ──────────────────────────────────────
  fieldWorkOrders: [],

  // ── AI Chat ───────────────────────────────────────────────────────
  chatMessages: [
    { id: 'cm-1', role: 'assistant', content: 'Hello! I\'m your ERP AI assistant. How can I help you today?', timestamp: new Date().toISOString() }
  ],
  aiMessages: [
    { id: 'cm-1', role: 'assistant', content: 'Hello! I\'m your ERP AI assistant. How can I help you today?', timestamp: new Date().toISOString() }
  ],

  // ── Support Tickets ───────────────────────────────────────────────
  supportTickets: [],

  // ── Migration Jobs ────────────────────────────────────────────────
  migrationJobs: [],
  migrationValidationReport: null,

  // ── Finance ───────────────────────────────────────────────────────
  setAccounts: (accounts) => set({ accounts }),
  addAccount: (account) => set((s) => ({ accounts: [...s.accounts, { id: `acc-${Date.now()}`, ...account }] })),
  addJournalEntry: (entry) => set((s) => ({
    journalEntries: [...s.journalEntries, { ...entry, id: `je-${Date.now()}`, blockIndex: s.journalEntries.length + 1 }]
  })),
  addInvoice: (invoice) => set((s) => ({
    invoices: [...s.invoices, { ...invoice, id: `inv-${Date.now()}`, status: 'PENDING', sent: false, createdAt: new Date().toISOString() }]
  })),
  updateInvoiceStatus: (id, status) => set((s) => ({
    invoices: s.invoices.map((inv) => inv.id === id ? { ...inv, status } : inv)
  })),
  sendInvoice: (id) => set((s) => ({
    invoices: s.invoices.map((inv) => inv.id === id ? { ...inv, sent: true } : inv)
  })),
  checkOverdueInvoices: () => set((s) => {
    const today = new Date();
    const updatedInvoices = s.invoices.map((inv) => {
      if (inv.dueDate && new Date(inv.dueDate) < today && inv.status !== 'PAID' && inv.status !== 'OVERDUE') {
        return { ...inv, status: 'OVERDUE' };
      }
      return inv;
    });
    return { invoices: updatedInvoices };
  }),
  addBudget: (budget) => set((s) => ({
    budgets: [...s.budgets, { ...budget, id: `budget-${Date.now()}` }]
  })),
  updateBudget: (id, updates) => set((s) => ({
    budgets: s.budgets.map((b) => b.id === id ? { ...b, ...updates } : b)
  })),
  addExpense: (expense) => set((s) => ({
    expenses: [...s.expenses, { ...expense, id: `exp-${Date.now()}`, status: 'PENDING' }]
  })),
  updateExpenseStatus: (id, status, approvedBy) => set((s) => ({
    expenses: s.expenses.map((e) => e.id === id ? { ...e, status, approvedBy } : e)
  })),
  setApprovalWorkflows: (approvalWorkflows) => set({ approvalWorkflows }),
  addApprovalWorkflow: (workflow) => set((s) => ({
    approvalWorkflows: [workflow, ...s.approvalWorkflows]
  })),
  approveWorkflowLevel: (workflowId, level) => set((s) => ({
    approvalWorkflows: s.approvalWorkflows.map((w) => {
      if (w.id === workflowId) {
        const updatedLevels = w.levels.map((l) => 
          l.level === level ? { ...l, status: 'APPROVED', timestamp: new Date().toISOString() } : l
        );
        const nextLevel = updatedLevels.find((l) => l.status === 'PENDING');
        const newStatus = !nextLevel ? 'APPROVED' : 'IN_PROGRESS';
        return { ...w, levels: updatedLevels, currentLevel: nextLevel ? nextLevel.level : w.currentLevel, status: newStatus };
      }
      return w;
    })
  })),
  setFilingDeadlines: (filingDeadlines) => set((s) => ({
    taxCompliance: { ...s.taxCompliance, filingDeadlines }
  })),
  updateTaxDeadline: (deadlineId, status) => set((s) => ({
    taxCompliance: {
      ...s.taxCompliance,
      filingDeadlines: s.taxCompliance.filingDeadlines.map((d) => 
        d.id === deadlineId ? { ...d, status } : d
      )
    }
  })),
  setStatements: (statements) => set({ statements }),
  addStatement: (statement) => set((s) => ({
    statements: [statement, ...s.statements]
  })),
  updateStatementStatus: (id, status) => set((s) => ({
    statements: s.statements.map((stmt) => stmt.id === id ? { ...stmt, status } : stmt)
  })),
  addAuditEntry: (entry) => set((s) => ({
    taxCompliance: {
      ...s.taxCompliance,
      auditTrail: [{ ...entry, id: `audit-${Date.now()}`, timestamp: new Date().toISOString() }, ...s.taxCompliance.auditTrail]
    }
  })),
  exportAuditTrail: () => {
    const { taxCompliance } = get();
    const csv = [
      ['Action', 'Entity Type', 'Entity ID', 'User ID', 'Timestamp', 'Details'],
      ...taxCompliance.auditTrail.map((entry) => [
        entry.action, entry.entityType, entry.entityId, entry.userId, entry.timestamp, entry.details
      ])
    ].map((row) => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  setAccounts: (accounts) => set({ accounts }),
  setJournalEntries: (journalEntries) => set({ journalEntries }),
  setInvoices: (invoices) => set({ invoices }),
  setBudgets: (budgets) => set({ budgets }),
  setExpenses: (expenses) => set({ expenses }),
  setProjects: (projects) => set({ projects }),
  setSupportTickets: (supportTickets) => set({ supportTickets }),
  setShipments: (shipments) => set({ shipments }),
  setProducts: (products) => set({ products }),
  setWarehouses: (warehouses) => set({ warehouses }),
  setInventoryBatches: (inventoryBatches) => set({ inventoryBatches }),
  setStockMovements: (stockMovements) => set({ stockMovements }),
  setLeads: (leads) => set({ leads }),
  setCustomers: (customers) => set({ customers }),
  setPurchaseOrders: (purchaseOrders) => set({ purchaseOrders }),
  setSuppliers: (suppliers) => set({ suppliers }),
  setPayrolls: (payrolls) => set({ payrolls }),
  setTasks: (tasks) => set({ tasks }),

  // ── HR ────────────────────────────────────────────────────────────
  setEmployees: (employees) => set({ employees }),
  setLeaveRequests: (leaveRequests) => set({ leaveRequests }),
  addEmployee: (emp) => set((s) => ({
    employees: [...s.employees, { ...emp, id: `emp-${Date.now()}`, isActive: true, joinDate: new Date().toISOString(), documents: [], skills: [] }]
  })),
  updateEmployee: (id, updates) => set((s) => ({
    employees: s.employees.map((e) => e.id === id ? { ...e, ...updates } : e)
  })),
  addLeaveRequest: (req) => set((s) => ({
    leaveRequests: [...s.leaveRequests, { ...req, id: `leave-${Date.now()}`, status: 'PENDING', appliedOn: new Date().toISOString().split('T')[0] }]
  })),
  updateLeaveStatus: (id, status) => set((s) => ({
    leaveRequests: s.leaveRequests.map((l) => l.id === id ? { ...l, status } : l)
  })),
  addJobPosting: (job) => set((s) => ({
    jobPostings: [...s.jobPostings, { ...job, id: `job-${Date.now()}`, status: 'OPEN', postedDate: new Date().toISOString().split('T')[0], applicants: 0 }]
  })),
  addApplicant: (applicant) => set((s) => ({
    applicants: [...s.applicants, { ...applicant, id: `applicant-${Date.now()}`, status: 'SCREENING', appliedDate: new Date().toISOString().split('T')[0] }]
  })),
  updateApplicantStatus: (id, status) => set((s) => ({
    applicants: s.applicants.map((a) => a.id === id ? { ...a, status } : a)
  })),
  addPerformanceReview: (review) => set((s) => ({
    performanceReviews: [...s.performanceReviews, { ...review, id: `review-${Date.now()}`, status: 'IN_PROGRESS' }]
  })),
  updateReviewStatus: (id, status) => set((s) => ({
    performanceReviews: s.performanceReviews.map((r) => r.id === id ? { ...r, status } : r)
  })),
  addOnboardingChecklist: (checklist) => set((s) => ({
    onboardingChecklists: [...s.onboardingChecklists, { ...checklist, id: `onboard-${Date.now()}`, status: 'IN_PROGRESS' }]
  })),
  updateOnboardingTask: (checklistId, taskId) => set((s) => ({
    onboardingChecklists: s.onboardingChecklists.map((c) => 
      c.id === checklistId ? {
        ...c,
        tasks: c.tasks.map((t) => t.id === taskId ? { ...t, completed: !t.completed } : t),
        status: c.tasks.every((t) => t.id === taskId ? !t.completed : t.completed) ? 'COMPLETED' : c.status
      } : c
    )
  })),
  addAttendanceLog: (log) => set((s) => ({
    attendanceLogs: [...s.attendanceLogs, { ...log, id: `att-${Date.now()}` }]
  })),
  addPayrollEntry: (entry) => set((s) => ({ payrolls: [...s.payrolls, { ...entry, id: `slip-${Date.now()}` }] })),
  processPayroll: (id) => set((s) => ({
    payrolls: s.payrolls.map((p) => p.id === id ? { ...p, status: 'PAID' } : p)
  })),
  generatePayslip: (payrollId, employeeId, employeeName, period) => set((s) => ({
    payslips: [...s.payslips, { id: `slip-${Date.now()}`, payrollId, employeeId, employeeName, period, generatedDate: new Date().toISOString().split('T')[0], downloadUrl: `/payslips/${payrollId}.pdf` }],
    payrolls: s.payrolls.map((p) => p.id === payrollId ? { ...p, payslipGenerated: true } : p)
  })),
  addSalaryStructure: (structure) => set((s) => ({
    salaryStructures: [...s.salaryStructures, { ...structure, id: `struct-${Date.now()}` }]
  })),

  // ── Inventory ─────────────────────────────────────────────────────
  addProduct: (product) => set((s) => ({
    products: [...s.products, { ...product, id: `prod-${Date.now()}` }]
  })),
  updateProductStock: (id, quantity) => set((s) => ({
    products: s.products.map((p) => p.id === id ? { ...p, currentStock: p.currentStock + quantity } : p)
  })),
  addInventoryBatch: (batch) => set((s) => ({
    inventoryBatches: [...s.inventoryBatches, { ...batch, id: `batch-${Date.now()}`, status: 'ACTIVE' }]
  })),
  addWarehouse: (warehouse) => set((s) => ({
    warehouses: [...s.warehouses, { ...warehouse, id: `WH-${Date.now().toString().slice(-4)}`, currentStock: 0 }]
  })),
  addStockMovement: (movement) => set((s) => ({
    stockMovements: [...s.stockMovements, { ...movement, id: `move-${Date.now()}`, date: new Date().toISOString().split('T')[0] }]
  })),

  // ── Manufacturing ─────────────────────────────────────────────────
  addWorkOrder: (order) => set((s) => ({
    workOrders: [...s.workOrders, { ...order, id: `wo-${Date.now()}`, status: 'PENDING' }]
  })),
  updateWorkOrderStatus: (id, status) => set((s) => ({
    workOrders: s.workOrders.map((wo) => wo.id === id ? { ...wo, status } : wo)
  })),
  addBillOfMaterials: (bom) => set((s) => ({
    billOfMaterials: [...s.billOfMaterials, { ...bom, id: `bom-${Date.now()}` }]
  })),
  addMachine: (machine) => set((s) => ({
    machines: [...s.machines, { ...machine, id: `machine-${Date.now()}`, currentLoad: 0, efficiency: 100 }]
  })),
  updateMachineStatus: (id, status) => set((s) => ({
    machines: s.machines.map((m) => m.id === id ? { ...m, status } : m)
  })),
  addMachineSchedule: (schedule) => set((s) => ({
    machineSchedule: [...s.machineSchedule, { ...schedule, id: `sched-${Date.now()}`, status: 'SCHEDULED' }]
  })),
  addDowntimeLog: (log) => set((s) => ({
    downtimeLogs: [...s.downtimeLogs, { ...log, id: `downtime-${Date.now()}` }]
  })),
  addProductionReport: (report) => set((s) => ({
    productionReports: [...s.productionReports, { ...report, id: `report-${Date.now()}` }]
  })),

  // ── Procurement ─────────────────────────────────────────────────
  addSupplier: (supplier) => set((s) => ({
    suppliers: [...s.suppliers, { ...supplier, id: `sup-${Date.now()}`, qualityScore: 0, deliveryScore: 0, priceScore: 0, overallScore: 0, status: 'ACTIVE' }]
  })),
  addRFQ: (rfq) => set((s) => ({
    rfqs: [...s.rfqs, { ...rfq, id: `rfq-${Date.now()}`, status: 'OPEN', responses: 0 }]
  })),
  addRFQResponse: (response) => set((s) => ({
    rfqResponses: [...s.rfqResponses, { ...response, id: `resp-${Date.now()}`, status: 'RECEIVED' }],
    rfqs: s.rfqs.map((r) => r.id === response.rfqId ? { ...r, responses: r.responses + 1 } : r)
  })),
  addVendorEvaluation: (evaluation) => set((s) => ({
    vendorEvaluations: [...s.vendorEvaluations, { ...evaluation, id: `eval-${Date.now()}`, evaluationDate: new Date().toISOString().split('T')[0] }]
  })),
  addContract: (contract) => set((s) => ({
    contracts: [...s.contracts, { ...contract, id: `contract-${Date.now()}`, status: 'ACTIVE' }]
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
  addSalesForecast: (forecast) => set((s) => ({
    salesForecast: [...s.salesForecast, { ...forecast, id: `forecast-${Date.now()}`, status: 'ON_TRACK' }]
  })),
  addOpportunity: (opportunity) => set((s) => ({
    opportunities: [...s.opportunities, { ...opportunity, id: `opp-${Date.now()}`, stage: 'LEAD' }]
  })),
  updateOpportunityStage: (id, stage) => set((s) => ({
    opportunities: s.opportunities.map((o) => o.id === id ? { ...o, stage } : o)
  })),
  addActivity: (activity) => set((s) => ({
    activities: [...s.activities, { ...activity, id: `act-${Date.now()}`, date: new Date().toISOString().split('T')[0] }]
  })),

  // ── Fixed Assets ─────────────────────────────────────────────────
  setAssets: (assets) => set({ assets }),
  addAsset: (asset) => set((s) => ({
    assets: [...s.assets, { ...asset, id: `asset-${Date.now()}`, status: 'ACTIVE' }]
  })),
  updateAssetStatus: (id, status) => set((s) => ({
    assets: s.assets.map((a) => a.id === id ? { ...a, status } : a)
  })),
  addDepreciationRecord: (record) => set((s) => ({
    depreciationRecords: [...s.depreciationRecords, { ...record, id: `dep-${Date.now()}` }]
  })),
  addMaintenanceSchedule: (schedule) => set((s) => ({
    maintenanceSchedules: [...s.maintenanceSchedules, { ...schedule, id: `maint-${Date.now()}`, status: 'SCHEDULED' }]
  })),
  updateMaintenanceStatus: (id, status) => set((s) => ({
    maintenanceSchedules: s.maintenanceSchedules.map((m) => m.id === id ? { ...m, status } : m)
  })),

  // ── Projects ─────────────────────────────────────────────────────
  addProject: (project) => set((s) => ({
    projects: [...s.projects, { ...project, id: `proj-${Date.now()}`, progress: 0, spent: 0, status: 'PLANNING' }]
  })),
  updateProjectStatus: (id, status) => set((s) => ({
    projects: s.projects.map((p) => p.id === id ? { ...p, status } : p)
  })),
  addTask: (task) => set((s) => ({
    tasks: [...s.tasks, { ...task, id: `task-${Date.now()}`, status: 'PENDING', actualHours: 0 }]
  })),
  updateTaskStatus: (id, status) => set((s) => ({
    tasks: s.tasks.map((t) => t.id === id ? { ...t, status } : t)
  })),
  addMilestone: (milestone) => set((s) => ({
    milestones: [...s.milestones, { ...milestone, id: `mile-${Date.now()}`, status: 'PENDING' }]
  })),
  updateMilestoneStatus: (id, status) => set((s) => ({
    milestones: s.milestones.map((m) => m.id === id ? { ...m, status } : m)
  })),
  addResourceAllocation: (allocation) => set((s) => ({
    resourceAllocations: [...s.resourceAllocations, { ...allocation, id: `res-${Date.now()}` }]
  })),

  // ── Supply Chain ─────────────────────────────────────────────────
  addShipment: (shipment) => set((s) => ({
    shipments: [...s.shipments, { ...shipment, id: `ship-${Date.now()}`, status: 'PENDING' }]
  })),
  updateShipmentStatus: (id, status) => set((s) => ({
    shipments: s.shipments.map((s) => s.id === id ? { ...s, status } : s)
  })),
  addCarrier: (carrier) => set((s) => ({
    carriers: [...s.carriers, { ...carrier, id: `carrier-${Date.now()}`, activeShipments: 0, onTimeRate: 0 }]
  })),
  addRoute: (route) => set((s) => ({
    routes: [...s.routes, { ...route, id: `route-${Date.now()}` }]
  })),

  // ── E-Commerce ───────────────────────────────────────────────────
  addEcommerceProduct: (product) => set((s) => ({
    ecommerceProducts: [...s.ecommerceProducts, { ...product, id: `eprod-${Date.now()}`, status: 'ACTIVE' }]
  })),
  addEcommerceOrder: (order) => set((s) => ({
    ecommerceOrders: [...s.ecommerceOrders, { ...order, id: `eorder-${Date.now()}`, status: 'PROCESSING', paymentStatus: 'PENDING' }]
  })),
  updateEcommerceOrderStatus: (id, status) => set((s) => ({
    ecommerceOrders: s.ecommerceOrders.map((o) => o.id === id ? { ...o, status } : o)
  })),
  addPayment: (payment) => set((s) => ({
    payments: [...s.payments, { ...payment, id: `pay-${Date.now()}`, status: 'SUCCESS' }],
    ecommerceOrders: s.ecommerceOrders.map((o) => o.id === payment.orderId ? { ...o, paymentStatus: 'PAID' } : o)
  })),

  // ── Analytics Hub ─────────────────────────────────────────────────
  addKPI: (kpi) => set((s) => ({
    kpis: [...s.kpis, { ...kpi, id: `kpi-${Date.now()}` }]
  })),
  updateKPI: (id, value) => set((s) => ({
    kpis: s.kpis.map((k) => k.id === id ? { ...k, value } : k)
  })),
  addReport: (report) => set((s) => ({
    reports: [...s.reports, { ...report, id: `report-${Date.now()}`, status: 'SCHEDULED' }]
  })),
  generateReport: (id) => set((s) => ({
    reports: s.reports.map((r) => r.id === id ? { ...r, status: 'COMPLETED', generatedDate: new Date().toISOString().split('T')[0] } : r)
  })),
  addDashboard: (dashboard) => set((s) => ({
    dashboards: [...s.dashboards, { ...dashboard, id: `dash-${Date.now()}` }]
  })),

  // ── Banking ─────────────────────────────────────────────────────
  addBankingAccount: (account) => set((s) => ({
    bankingAccounts: [...s.bankingAccounts, { ...account, id: `bank-${Date.now()}` }]
  })),
  addBankingTransaction: (transaction) => set((s) => ({
    bankingTransactions: [...s.bankingTransactions, { ...transaction, id: `txn-${Date.now()}` }]
  })),
  addBankingLoan: (loan) => set((s) => ({
    bankingLoans: [...s.bankingLoans, { ...loan, id: `loan-${Date.now()}`, status: 'ACTIVE' }]
  })),

  // ── Banking Set Actions ───────────────────────────────────────────
  setBankingAccounts: (bankingAccounts) => set({ bankingAccounts }),
  setBankingTransactions: (bankingTransactions) => set({ bankingTransactions }),
  setBankingLoans: (bankingLoans) => set({ bankingLoans }),

  // ── Healthcare ─────────────────────────────────────────────────
  patients: [],
  appointments: [],
  medicalHistory: [],
  medicalBills: [],

  // ── Healthcare Set & Add Actions ─────────────────────────────────
  setPatients: (patients) => set({ patients }),
  setAppointments: (appointments) => set({ appointments }),
  addPatient: (patient) => set((s) => ({
    patients: [...s.patients, { ...patient, id: `patient-${Date.now()}` }]
  })),
  addAppointment: (appointment) => set((s) => ({
    appointments: [...s.appointments, { ...appointment, id: `appt-${Date.now()}`, status: 'SCHEDULED' }]
  })),
  updateAppointmentStatus: (id, status) => set((s) => ({
    appointments: s.appointments.map((a) => a.id === id ? { ...a, status } : a)
  })),
  addMedicalHistory: (history) => set((s) => ({
    medicalHistory: [...s.medicalHistory, { ...history, id: `history-${Date.now()}` }]
  })),
  addMedicalBill: (bill) => set((s) => ({
    medicalBills: [...s.medicalBills, { ...bill, id: `bill-${Date.now()}`, status: 'PENDING' }]
  })),

  // ── Education ───────────────────────────────────────────────────
  students: [],
  courses: [],
  grades: [],
  studentAttendance: [],

  // ── Education Set & Add Actions ──────────────────────────────────
  setStudents: (students) => set({ students }),
  setCourses: (courses) => set({ courses }),
  addStudent: (student) => set((s) => ({
    students: [...s.students, { ...student, id: `student-${Date.now()}` }]
  })),
  addCourse: (course) => set((s) => ({
    courses: [...s.courses, { ...course, id: `course-${Date.now()}` }]
  })),
  addGrade: (grade) => set((s) => ({
    grades: [...s.grades, { ...grade, id: `grade-${Date.now()}` }]
  })),
  addStudentAttendance: (attendance) => set((s) => ({
    studentAttendance: [...s.studentAttendance, { ...attendance, id: `att-${Date.now()}` }]
  })),

  // ── Sustainability ───────────────────────────────────────────────
  carbonFootprints: [],
  esgReports: [],
  energyConsumption: [],
  wasteManagement: [],

  // ── Sustainability Set & Add Actions ──────────────────────────────
  setCarbonFootprints: (carbonFootprints) => set({ carbonFootprints }),
  setESGReports: (esgReports) => set({ esgReports }),
  addCarbonFootprint: (footprint) => set((s) => ({
    carbonFootprints: [...s.carbonFootprints, { ...footprint, id: `cf-${Date.now()}` }]
  })),
  addESGReport: (report) => set((s) => ({
    esgReports: [...s.esgReports, { ...report, id: `esg-${Date.now()}`, status: 'DRAFT' }]
  })),
  addEnergyConsumption: (energy) => set((s) => ({
    energyConsumption: [...s.energyConsumption, { ...energy, id: `energy-${Date.now()}` }]
  })),
  addWasteManagement: (waste) => set((s) => ({
    wasteManagement: [...s.wasteManagement, { ...waste, id: `waste-${Date.now()}` }]
  })),

  // ── Marketing ─────────────────────────────────────────────────────
  marketingCampaigns: [],
  marketingLeads: [],
  marketingAnalytics: [],
  socialMediaPosts: [],

  // ── Marketing Set & Add Actions ──────────────────────────────────
  setMarketingCampaigns: (marketingCampaigns) => set({ marketingCampaigns }),
  setMarketingLeads: (marketingLeads) => set({ marketingLeads }),
  setSocialMediaPosts: (socialMediaPosts) => set({ socialMediaPosts }),
  addMarketingCampaign: (campaign) => set((s) => ({
    marketingCampaigns: [...s.marketingCampaigns, { ...campaign, id: `camp-${Date.now()}`, status: 'SCHEDULED' }]
  })),
  addMarketingLead: (lead) => set((s) => ({
    marketingLeads: [...s.marketingLeads, { ...lead, id: `lead-${Date.now()}`, status: 'NEW' }]
  })),
  addMarketingAnalytics: (analytics) => set((s) => ({
    marketingAnalytics: [...s.marketingAnalytics, { ...analytics, id: `analytics-${Date.now()}` }]
  })),
  addSocialMediaPost: (post) => set((s) => ({
    socialMediaPosts: [...s.socialMediaPosts, { ...post, id: `social-${Date.now()}`, status: 'SCHEDULED', likes: 0, shares: 0, comments: 0 }]
  })),

  // ── Security ───────────────────────────────────────────────────────
  accessLogs: [],
  securityAlerts: [],
  userActivity: [],
  complianceTracking: [],

  // ── Security Set & Add Actions ───────────────────────────────────
  setAccessLogs: (accessLogs) => set({ accessLogs }),
  setSecurityAlerts: (securityAlerts) => set({ securityAlerts }),
  addAccessLog: (log) => set((s) => ({
    accessLogs: [...s.accessLogs, { ...log, id: `access-${Date.now()}` }]
  })),
  addSecurityAlert: (alert) => set((s) => ({
    securityAlerts: [...s.securityAlerts, { ...alert, id: `alert-${Date.now()}`, status: 'OPEN' }]
  })),
  addUserActivity: (activity) => set((s) => ({
    userActivity: [...s.userActivity, { ...activity, id: `activity-${Date.now()}` }]
  })),
  addComplianceTracking: (compliance) => set((s) => ({
    complianceTracking: [...s.complianceTracking, { ...compliance, id: `compliance-${Date.now()}` }]
  })),

  // ── Migration Hub ─────────────────────────────────────────────────
  dataMigrations: [],
  importExports: [],
  dataValidations: [],
  dataTransformations: [],

  // ── Migration Hub Actions ─────────────────────────────────────────
  addDataMigration: (migration) => set((s) => ({
    dataMigrations: [...s.dataMigrations, { ...migration, id: `migration-${Date.now()}`, status: 'PENDING' }]
  })),
  addImportExport: (impexp) => set((s) => ({
    importExports: [...s.importExports, { ...impexp, id: `impexp-${Date.now()}`, status: 'PENDING' }]
  })),
  addDataValidation: (validation) => set((s) => ({
    dataValidations: [...s.dataValidations, { ...validation, id: `validation-${Date.now()}` }]
  })),
  addDataTransformation: (transform) => set((s) => ({
    dataTransformations: [...s.dataTransformations, { ...transform, id: `transform-${Date.now()}`, status: 'ACTIVE' }]
  })),

  // ── RPA Automation ─────────────────────────────────────────────────
  rpaWorkflows: [],
  rpaBots: [],
  rpaTasks: [],
  rpaPerformance: [],

  // ── RPA Automation Set & Add Actions ──────────────────────────────
  setRPAWorkflows: (rpaWorkflows) => set({ rpaWorkflows }),
  addRPAWorkflow: (workflow) => set((s) => ({
    rpaWorkflows: [...s.rpaWorkflows, { ...workflow, id: `workflow-${Date.now()}`, status: 'ACTIVE' }]
  })),
  addRPABot: (bot) => set((s) => ({
    rpaBots: [...s.rpaBots, { ...bot, id: `bot-${Date.now()}`, status: 'IDLE', uptime: '0h 0m', tasksProcessed: 0, errors: 0 }]
  })),
  addRPATask: (task) => set((s) => ({
    rpaTasks: [...s.rpaTasks, { ...task, id: `task-${Date.now()}`, status: 'PENDING' }]
  })),
  addRPAPerformance: (performance) => set((s) => ({
    rpaPerformance: [...s.rpaPerformance, { ...performance, id: `perf-${Date.now()}` }]
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

  // ── Fleet & Operations (Manufacturing) ─────────────────────────────────
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
  addWorkOrder: (wo) => set((s) => ({
    workOrders: [...s.workOrders, { ...wo, id: `wo-${Date.now()}` }]
  })),
  updateWorkOrderStatus: (id, status) => set((s) => ({
    workOrders: s.workOrders.map((wo) => wo.id === id ? { ...wo, status } : wo)
  })),
  addMachine: (m) => set((s) => ({
    machines: [...s.machines, { ...m, id: `machine-${Date.now()}` }]
  })),
  updateMachineStatus: (id, status) => set((s) => ({
    machines: s.machines.map((m) => m.id === id ? { ...m, status } : m)
  })),
  addDowntimeLog: (log) => set((s) => ({
    downtimeLogs: [...s.downtimeLogs, { ...log, id: `downtime-${Date.now()}` }]
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
});
