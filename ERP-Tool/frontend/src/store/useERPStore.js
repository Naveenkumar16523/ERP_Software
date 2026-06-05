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
  dbLive: true,
  token: localStorage.getItem('erp_token') || null,
  demoMode: localStorage.getItem('erp_demo') === 'true',
  currentUser: (() => {
    try {
      const stored = localStorage.getItem('erp_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  userPermissions: (() => {
    try {
      const stored = localStorage.getItem('erp_permissions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })(),
  allowedModules: (() => {
    try {
      const stored = localStorage.getItem('erp_allowed_modules');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })(),

  // ── Notifications & Toasts ────────────────────────────────────────
  notifications: seedData.notifications || [],
  toasts: [],

  // ── Finance Module ────────────────────────────────────────────────
  accounts: seedData.accounts || [],
  journalEntries: seedData.journalEntries || [],
  invoices: seedData.invoices || [
    { id: 'inv-1', invoiceNo: 'INV-2026-001', customerName: 'Acme Corp', totalAmount: 150000, status: 'PENDING', dueDate: '2026-06-15', sent: false, createdAt: '2026-06-01T00:00:00.000Z' },
    { id: 'inv-2', invoiceNo: 'INV-2026-002', customerName: 'Tech Solutions', totalAmount: 75000, status: 'OVERDUE', dueDate: '2026-05-20', sent: true, createdAt: '2026-05-10T00:00:00.000Z' },
    { id: 'inv-3', invoiceNo: 'INV-2026-003', customerName: 'Global Industries', totalAmount: 220000, status: 'PAID', dueDate: '2026-05-30', sent: true, createdAt: '2026-05-15T00:00:00.000Z' }
  ],
  budgets: [
    { id: 'budget-1', costCenter: 'Marketing', period: 'monthly', amount: 500000, spent: 320000, year: 2026, month: 6 },
    { id: 'budget-2', costCenter: 'Operations', period: 'monthly', amount: 800000, spent: 750000, year: 2026, month: 6 },
    { id: 'budget-3', costCenter: 'IT', period: 'yearly', amount: 2000000, spent: 850000, year: 2026, month: null }
  ],
  expenses: [
    { id: 'exp-1', description: 'Office Supplies', category: 'Operations', amount: 15000, date: '2026-06-01', receipt: null, approvedBy: null, status: 'PENDING' },
    { id: 'exp-2', description: 'Software License', category: 'IT', amount: 45000, date: '2026-06-02', receipt: 'receipt-1.pdf', approvedBy: 'emp-1', status: 'APPROVED' },
    { id: 'exp-3', description: 'Travel Expenses', category: 'Marketing', amount: 25000, date: '2026-06-03', receipt: 'receipt-2.pdf', approvedBy: null, status: 'PENDING' }
  ],
  approvalWorkflows: [
    { id: 'workflow-1', type: 'PAYMENT', amount: 50000, requester: 'emp-2', currentLevel: 1, levels: [
      { level: 1, approver: 'emp-1', status: 'APPROVED', timestamp: '2026-06-01T10:00:00.000Z' },
      { level: 2, approver: 'ceo', status: 'PENDING', timestamp: null }
    ], createdAt: '2026-06-01T09:00:00.000Z', status: 'IN_PROGRESS' }
  ],
  taxCompliance: {
    gstRate: 18,
    vatRate: 20,
    filingDeadlines: [
      { id: 'deadline-1', taxType: 'GST', dueDate: '2026-06-30', status: 'PENDING', period: 'Q2 2026' },
      { id: 'deadline-2', taxType: 'TDS', dueDate: '2026-06-15', status: 'PENDING', period: 'June 2026' },
      { id: 'deadline-3', taxType: 'VAT', dueDate: '2026-06-25', status: 'COMPLETED', period: 'Q2 2026' }
    ],
    auditTrail: [
      { id: 'audit-1', action: 'INVOICE_CREATED', entityType: 'Invoice', entityId: 'inv-1', userId: 'emp-1', timestamp: '2026-06-01T10:00:00.000Z', details: 'Created invoice INV-2026-001' },
      { id: 'audit-2', action: 'PAYMENT_APPROVED', entityType: 'Workflow', entityId: 'workflow-1', userId: 'emp-1', timestamp: '2026-06-01T10:00:00.000Z', details: 'Approved payment workflow level 1' },
      { id: 'audit-3', action: 'EXPENSE_LOGGED', entityType: 'Expense', entityId: 'exp-1', userId: 'emp-2', timestamp: '2026-06-01T11:00:00.000Z', details: 'Logged expense for Office Supplies' }
    ]
  },

  // ── HR Module ─────────────────────────────────────────────────────
  employees: seedData.employees || [
    { id: 'emp-1', firstName: 'John', lastName: 'Doe', email: 'john.doe@company.com', phone: '+91 98765 43210', department: 'IT', jobTitle: 'Software Engineer', baseSalary: 800000, isActive: true, joinDate: '2024-01-15', documents: ['resume.pdf', 'id_proof.pdf'], skills: ['React', 'Node.js', 'Python'] },
    { id: 'emp-2', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@company.com', phone: '+91 98765 43211', department: 'Finance', jobTitle: 'Financial Analyst', baseSalary: 750000, isActive: true, joinDate: '2024-02-01', documents: ['resume.pdf', 'certificates.pdf'], skills: ['Excel', 'SAP', 'Financial Modeling'] },
    { id: 'emp-3', firstName: 'Bob', lastName: 'Johnson', email: 'bob.johnson@company.com', phone: '+91 98765 43212', department: 'Operations', jobTitle: 'Operations Manager', baseSalary: 900000, isActive: true, joinDate: '2023-11-20', documents: ['resume.pdf'], skills: ['Supply Chain', 'Lean Management', 'Six Sigma'] }
  ],
  leaveRequests: seedData.leaveRequests || [
    { id: 'leave-1', employeeId: 'emp-1', employeeName: 'John Doe', leaveType: 'CASUAL', startDate: '2026-06-10', endDate: '2026-06-12', reason: 'Personal work', status: 'PENDING', appliedOn: '2026-06-01' },
    { id: 'leave-2', employeeId: 'emp-2', employeeName: 'Jane Smith', leaveType: 'SICK', startDate: '2026-05-28', endDate: '2026-05-29', reason: 'Fever', status: 'APPROVED', appliedOn: '2026-05-28' }
  ],
  leaveBalances: [
    { employeeId: 'emp-1', employeeName: 'John Doe', casual: 8, sick: 5, earned: 10, total: 23 },
    { employeeId: 'emp-2', employeeName: 'Jane Smith', casual: 10, sick: 4, earned: 12, total: 26 },
    { employeeId: 'emp-3', employeeName: 'Bob Johnson', casual: 6, sick: 6, earned: 8, total: 20 }
  ],
  jobPostings: [
    { id: 'job-1', title: 'Senior Software Engineer', department: 'IT', location: 'Bangalore', type: 'Full-time', salary: '₹12-18 LPA', status: 'OPEN', postedDate: '2026-05-15', applicants: 15 },
    { id: 'job-2', title: 'Financial Analyst', department: 'Finance', location: 'Mumbai', type: 'Full-time', salary: '₹8-12 LPA', status: 'OPEN', postedDate: '2026-05-20', applicants: 8 }
  ],
  applicants: [
    { id: 'applicant-1', jobId: 'job-1', name: 'Rahul Sharma', email: 'rahul.sharma@gmail.com', phone: '+91 98765 43213', status: 'SCREENING', appliedDate: '2026-05-16', experience: '5 years', skills: ['Java', 'Spring Boot', 'Microservices'] },
    { id: 'applicant-2', jobId: 'job-1', name: 'Priya Patel', email: 'priya.patel@gmail.com', phone: '+91 98765 43214', status: 'INTERVIEW_SCHEDULED', appliedDate: '2026-05-17', experience: '4 years', skills: ['React', 'Node.js', 'AWS'] }
  ],
  performanceReviews: [
    { id: 'review-1', employeeId: 'emp-1', employeeName: 'John Doe', reviewPeriod: 'Q1 2026', rating: 4.2, goals: ['Complete project X', 'Learn new framework'], status: 'COMPLETED', reviewDate: '2026-04-15' },
    { id: 'review-2', employeeId: 'emp-2', employeeName: 'Jane Smith', reviewPeriod: 'Q1 2026', rating: 3.8, goals: ['Improve reporting accuracy', 'Cross-train team'], status: 'COMPLETED', reviewDate: '2026-04-18' }
  ],
  onboardingChecklists: [
    { id: 'onboard-1', employeeId: 'emp-1', employeeName: 'John Doe', role: 'Software Engineer', tasks: [
      { id: 'task-1', title: 'Submit documents', completed: true, dueDate: '2024-01-20' },
      { id: 'task-2', title: 'Setup email account', completed: true, dueDate: '2024-01-20' },
      { id: 'task-3', title: 'Complete IT induction', completed: true, dueDate: '2024-01-22' },
      { id: 'task-4', title: 'Team introduction', completed: false, dueDate: '2024-01-25' }
    ], status: 'IN_PROGRESS' }
  ],
  attendanceLogs: [
    { id: 'att-1', employeeId: 'emp-1', employeeName: 'John Doe', date: '2026-06-01', clockIn: '09:00', clockOut: '18:00', hours: 9, overtime: 1, status: 'PRESENT' },
    { id: 'att-2', employeeId: 'emp-1', employeeName: 'John Doe', date: '2026-06-02', clockIn: '09:15', clockOut: '18:30', hours: 9.25, overtime: 1.25, status: 'PRESENT' },
    { id: 'att-3', employeeId: 'emp-2', employeeName: 'Jane Smith', date: '2026-06-01', clockIn: null, clockOut: null, hours: 0, overtime: 0, status: 'ABSENT' }
  ],
  payrolls: [
    { id: 'pay-1', employeeId: 'emp-1', employeeName: 'John Doe', period: 'June 2024', basicSalary: 50000, hra: 15000, da: 5000, grossSalary: 70000, taxDeduction: 7000, pfDeduction: 6000, otherDeductions: 1000, netSalary: 56000, status: 'PROCESSED', payslipGenerated: true },
    { id: 'pay-2', employeeId: 'emp-2', employeeName: 'Jane Smith', period: 'June 2024', basicSalary: 45000, hra: 13500, da: 4500, grossSalary: 63000, taxDeduction: 6300, pfDeduction: 5400, otherDeductions: 800, netSalary: 50500, status: 'PROCESSED', payslipGenerated: true }
  ],
  salaryStructures: [
    { id: 'struct-1', name: 'Executive Level', basicSalary: 50000, hraPercentage: 30, daPercentage: 10, pfPercentage: 12, taxBracket: '20%' },
    { id: 'struct-2', name: 'Manager Level', basicSalary: 80000, hraPercentage: 30, daPercentage: 10, pfPercentage: 12, taxBracket: '30%' },
    { id: 'struct-3', name: 'Staff Level', basicSalary: 30000, hraPercentage: 30, daPercentage: 10, pfPercentage: 12, taxBracket: '10%' }
  ],
  payslips: [
    { id: 'slip-1', payrollId: 'pay-1', employeeId: 'emp-1', employeeName: 'John Doe', period: 'June 2024', generatedDate: '2024-06-25', downloadUrl: '/payslips/pay-1.pdf' }
  ],

  // ── CRM Module ────────────────────────────────────────────────────
  leads: seedData.leads || [
    { id: 'lead-1', name: 'Rajesh Kumar', company: 'Tech Solutions Inc', email: 'rajesh@techsol.com', phone: '+91 98765 43210', source: 'Website', value: 500000, status: 'PROPOSAL' },
    { id: 'lead-2', name: 'Priya Sharma', company: 'Global Enterprises', email: 'priya@globalent.com', phone: '+91 98765 43211', source: 'Referral', value: 750000, status: 'QUALIFIED' },
    { id: 'lead-3', name: 'Amit Patel', company: 'Innovate Corp', email: 'amit@innovate.com', phone: '+91 98765 43212', source: 'Cold Outreach', value: 300000, status: 'NEW' }
  ],
  customers: seedData.customers || [
    { id: 'cust-1', name: 'Acme Corporation', industry: 'Technology', totalSpend: 2500000, isReturning: true, createdAt: '2024-01-15' },
    { id: 'cust-2', name: 'Beta Industries', industry: 'Manufacturing', totalSpend: 1800000, isReturning: false, createdAt: '2024-03-20' },
    { id: 'cust-3', name: 'Gamma Services', industry: 'Services', totalSpend: 1200000, isReturning: true, createdAt: '2024-05-10' }
  ],
  salesForecast: [
    { id: 'forecast-1', period: 'Q3 2024', target: 5000000, projected: 4500000, confidence: 85, status: 'ON_TRACK' },
    { id: 'forecast-2', period: 'Q4 2024', target: 6000000, projected: 5200000, confidence: 75, status: 'AT_RISK' }
  ],
  opportunities: [
    { id: 'opp-1', name: 'Enterprise Software Deal', customerId: 'cust-1', customerName: 'Acme Corporation', value: 1500000, stage: 'NEGOTIATION', probability: 70, expectedClose: '2024-07-30' },
    { id: 'opp-2', name: 'Hardware Upgrade', customerId: 'cust-2', customerName: 'Beta Industries', value: 800000, stage: 'PROPOSAL', probability: 50, expectedClose: '2024-08-15' }
  ],
  activities: [
    { id: 'act-1', type: 'CALL', leadId: 'lead-1', leadName: 'Rajesh Kumar', description: 'Initial discovery call', date: '2024-06-05', duration: 30, outcome: 'POSITIVE' },
    { id: 'act-2', type: 'EMAIL', leadId: 'lead-2', leadName: 'Priya Sharma', description: 'Sent proposal document', date: '2024-06-04', duration: 0, outcome: 'PENDING' },
    { id: 'act-3', type: 'MEETING', customerId: 'cust-1', customerName: 'Acme Corporation', description: 'Quarterly business review', date: '2024-06-03', duration: 60, outcome: 'SUCCESSFUL' }
  ],

  // ── Inventory / Products ──────────────────────────────────────────
  products: seedData.products || [
    { id: 'prod-1', sku: 'SKU-001', name: 'Laptop Dell XPS 15', category: 'Electronics', currentStock: 45, reorderLevel: 10, unit: 'units', costPrice: 85000, sellingPrice: 120000, warehouse: 'WH-001', barcode: '8901234567890' },
    { id: 'prod-2', sku: 'SKU-002', name: 'Wireless Mouse', category: 'Electronics', currentStock: 150, reorderLevel: 50, unit: 'units', costPrice: 450, sellingPrice: 899, warehouse: 'WH-001', barcode: '8901234567891' },
    { id: 'prod-3', sku: 'SKU-003', name: 'USB-C Cable', category: 'Accessories', currentStock: 8, reorderLevel: 20, unit: 'units', costPrice: 150, sellingPrice: 350, warehouse: 'WH-002', barcode: '8901234567892' }
  ],
  ecommerceProducts: [
    { id: 'eprod-1', name: 'Laptop Dell XPS 15', sku: 'SKU-001', category: 'Electronics', price: 120000, stock: 45, description: 'High-performance laptop with 16GB RAM', image: '/images/laptop.jpg', status: 'ACTIVE' },
    { id: 'eprod-2', name: 'Wireless Mouse', sku: 'SKU-002', category: 'Electronics', price: 899, stock: 150, description: 'Ergonomic wireless mouse with USB receiver', image: '/images/mouse.jpg', status: 'ACTIVE' },
    { id: 'eprod-3', name: 'USB-C Cable', sku: 'SKU-003', category: 'Accessories', price: 350, stock: 8, description: 'High-speed USB-C data cable', image: '/images/cable.jpg', status: 'ACTIVE' }
  ],
  ecommerceOrders: [
    { id: 'eorder-1', orderNumber: 'ECO-2024-001', customerName: 'Rajesh Kumar', customerEmail: 'rajesh@example.com', items: [{ productId: 'eprod-1', qty: 1, price: 120000 }], total: 120000, status: 'PROCESSING', paymentMethod: 'CREDIT_CARD', paymentStatus: 'PAID', orderDate: '2024-06-01' },
    { id: 'eorder-2', orderNumber: 'ECO-2024-002', customerName: 'Priya Sharma', customerEmail: 'priya@example.com', items: [{ productId: 'eprod-2', qty: 2, price: 899 }], total: 1798, status: 'SHIPPED', paymentMethod: 'UPI', paymentStatus: 'PAID', orderDate: '2024-06-02' }
  ],
  payments: [
    { id: 'pay-1', orderId: 'eorder-1', orderNumber: 'ECO-2024-001', amount: 120000, method: 'CREDIT_CARD', transactionId: 'TXN-123456789', status: 'SUCCESS', processedAt: '2024-06-01T10:30:00Z' },
    { id: 'pay-2', orderId: 'eorder-2', orderNumber: 'ECO-2024-002', amount: 1798, method: 'UPI', transactionId: 'TXN-987654321', status: 'SUCCESS', processedAt: '2024-06-02T14:15:00Z' }
  ],
  inventoryBatches: [
    { id: 'batch-1', productId: 'prod-1', batchNumber: 'BATCH-2024-001', quantity: 30, expiryDate: null, manufactureDate: '2024-01-15', warehouse: 'WH-001', status: 'ACTIVE' },
    { id: 'batch-2', productId: 'prod-1', batchNumber: 'BATCH-2024-002', quantity: 15, expiryDate: null, manufactureDate: '2024-03-20', warehouse: 'WH-001', status: 'ACTIVE' },
    { id: 'batch-3', productId: 'prod-3', batchNumber: 'BATCH-2024-003', quantity: 8, expiryDate: '2025-12-31', manufactureDate: '2024-01-10', warehouse: 'WH-002', status: 'ACTIVE' }
  ],
  warehouses: [
    { id: 'WH-001', name: 'Main Warehouse', location: 'Bangalore', capacity: 10000, currentStock: 195, manager: 'John Doe' },
    { id: 'WH-002', name: 'Secondary Warehouse', location: 'Mumbai', capacity: 5000, currentStock: 8, manager: 'Jane Smith' }
  ],
  stockMovements: [
    { id: 'move-1', productId: 'prod-1', type: 'IN', quantity: 30, fromWarehouse: null, toWarehouse: 'WH-001', reason: 'Purchase Order PO-001', date: '2024-01-15' },
    { id: 'move-2', productId: 'prod-3', type: 'OUT', quantity: 5, fromWarehouse: 'WH-002', toWarehouse: null, reason: 'Sales Order SO-001', date: '2024-05-20' }
  ],
  cart: [],

  // ── Manufacturing ─────────────────────────────────────────────────
  productionBatches: seedData.productionBatches || [
    { id: 'batch-1', productId: 'prod-1', productName: 'Laptop Dell XPS 15', batchNo: 'BATCH-2024-001', quantity: 100, startDate: '2024-06-01', targetDate: '2024-06-15', progress: 75, status: 'IN_PROGRESS' },
    { id: 'batch-2', productId: 'prod-2', productName: 'Wireless Mouse', batchNo: 'BATCH-2024-002', quantity: 500, startDate: '2024-06-05', targetDate: '2024-06-20', progress: 30, status: 'IN_PROGRESS' }
  ],
  qaInspections: seedData.qaInspections || [
    { id: 'qa-1', batchId: 'batch-1', inspector: 'emp-1', date: '2024-06-10', status: 'PASSED', defects: 0, notes: 'Quality check passed' }
  ],
  workOrders: [
    { id: 'wo-1', orderNumber: 'WO-2024-001', productId: 'prod-1', productName: 'Laptop Dell XPS 15', quantity: 100, priority: 'HIGH', status: 'IN_PROGRESS', startDate: '2024-06-01', dueDate: '2024-06-15' },
    { id: 'wo-2', orderNumber: 'WO-2024-002', productId: 'prod-2', productName: 'Wireless Mouse', quantity: 500, priority: 'MEDIUM', status: 'PENDING', startDate: '2024-06-10', dueDate: '2024-06-25' }
  ],
  billOfMaterials: [
    { id: 'bom-1', productId: 'prod-1', productName: 'Laptop Dell XPS 15', components: [
      { componentId: 'comp-1', name: 'Intel i7 Processor', quantity: 1, unit: 'pcs' },
      { componentId: 'comp-2', name: '16GB RAM', quantity: 2, unit: 'pcs' },
      { componentId: 'comp-3', name: '512GB SSD', quantity: 1, unit: 'pcs' }
    ], version: 'v1.0' }
  ],
  machines: [
    { id: 'machine-1', name: 'Assembly Line A', type: 'ASSEMBLY', status: 'RUNNING', location: 'Floor 1', capacity: 50, currentLoad: 40, efficiency: 95 },
    { id: 'machine-2', name: 'CNC Machine 1', type: 'MACHINING', status: 'MAINTENANCE', location: 'Floor 2', capacity: 30, currentLoad: 0, efficiency: 0 },
    { id: 'machine-3', name: 'Packaging Unit B', type: 'PACKAGING', status: 'RUNNING', location: 'Floor 1', capacity: 100, currentLoad: 75, efficiency: 92 }
  ],
  machineSchedule: [
    { id: 'sched-1', machineId: 'machine-1', batchId: 'batch-1', startTime: '2024-06-01T08:00:00', endTime: '2024-06-15T18:00:00', status: 'SCHEDULED' },
    { id: 'sched-2', machineId: 'machine-3', batchId: 'batch-2', startTime: '2024-06-05T08:00:00', endTime: '2024-06-20T18:00:00', status: 'SCHEDULED' }
  ],
  downtimeLogs: [
    { id: 'downtime-1', machineId: 'machine-2', startTime: '2024-06-08T10:00:00', endTime: '2024-06-08T14:00:00', duration: 4, reason: 'Scheduled Maintenance', type: 'PLANNED' },
    { id: 'downtime-2', machineId: 'machine-1', startTime: '2024-06-07T14:00:00', endTime: '2024-06-07T15:30:00', duration: 1.5, reason: 'Material Shortage', type: 'UNPLANNED' }
  ],
  productionReports: [
    { id: 'report-1', period: 'May 2024', totalBatches: 15, completedBatches: 12, totalUnits: 2500, defectRate: 2.5, efficiency: 94 },
    { id: 'report-2', period: 'April 2024', totalBatches: 18, completedBatches: 16, totalUnits: 3200, defectRate: 3.1, efficiency: 91 }
  ],

  // ── Procurement ───────────────────────────────────────────────────
  suppliers: seedData.suppliers || [
    { id: 'sup-1', name: 'Tech Components Ltd', email: 'orders@techcomp.com', phone: '+91 98765 43215', qualityScore: 92, deliveryScore: 88, priceScore: 85, overallScore: 88, status: 'ACTIVE' },
    { id: 'sup-2', name: 'Global Electronics', email: 'sales@globalelec.com', phone: '+91 98765 43216', qualityScore: 88, deliveryScore: 90, priceScore: 82, overallScore: 87, status: 'ACTIVE' },
    { id: 'sup-3', name: 'Industrial Supplies Co', email: 'contact@indusup.com', phone: '+91 98765 43217', qualityScore: 85, deliveryScore: 85, priceScore: 90, overallScore: 87, status: 'ACTIVE' }
  ],
  purchaseOrders: seedData.purchaseOrders || [
    { id: 'po-1', poNo: 'PO-2024-001', supplierId: 'sup-1', supplierName: 'Tech Components Ltd', totalAmount: 150000, status: 'APPROVED', items: [{ desc: 'Processors', qty: 50, price: 3000 }], orderDate: '2024-06-01' },
    { id: 'po-2', poNo: 'PO-2024-002', supplierId: 'sup-2', supplierName: 'Global Electronics', totalAmount: 75000, status: 'PENDING', items: [{ desc: 'Memory Modules', qty: 100, price: 750 }], orderDate: '2024-06-05' }
  ],
  rfqs: [
    { id: 'rfq-1', rfqNumber: 'RFQ-2024-001', title: 'Laptop Components', description: 'Procurement of laptop components for Q3 production', status: 'OPEN', createdDate: '2024-06-01', dueDate: '2024-06-15', responses: 2 },
    { id: 'rfq-2', rfqNumber: 'RFQ-2024-002', title: 'Packaging Materials', description: 'Packaging supplies for product shipment', status: 'CLOSED', createdDate: '2024-05-15', dueDate: '2024-05-30', responses: 3 }
  ],
  rfqResponses: [
    { id: 'resp-1', rfqId: 'rfq-1', supplierId: 'sup-1', supplierName: 'Tech Components Ltd', price: 145000, deliveryDate: '2024-06-20', status: 'RECEIVED' },
    { id: 'resp-2', rfqId: 'rfq-1', supplierId: 'sup-2', supplierName: 'Global Electronics', price: 148000, deliveryDate: '2024-06-22', status: 'RECEIVED' }
  ],
  vendorEvaluations: [
    { id: 'eval-1', supplierId: 'sup-1', supplierName: 'Tech Components Ltd', period: 'Q2 2024', qualityScore: 92, deliveryScore: 88, priceScore: 85, overallScore: 88, evaluator: 'emp-1', evaluationDate: '2024-06-01' },
    { id: 'eval-2', supplierId: 'sup-2', supplierName: 'Global Electronics', period: 'Q2 2024', qualityScore: 88, deliveryScore: 90, priceScore: 82, overallScore: 87, evaluator: 'emp-1', evaluationDate: '2024-06-01' }
  ],
  contracts: [
    { id: 'contract-1', contractNumber: 'CTR-2024-001', supplierId: 'sup-1', supplierName: 'Tech Components Ltd', type: 'SUPPLY_AGREEMENT', startDate: '2024-01-01', endDate: '2024-12-31', value: 5000000, status: 'ACTIVE' },
    { id: 'contract-2', contractNumber: 'CTR-2024-002', supplierId: 'sup-2', supplierName: 'Global Electronics', type: 'SERVICE_AGREEMENT', startDate: '2024-03-01', endDate: '2025-02-28', value: 2500000, status: 'ACTIVE' }
  ],

  // ── Assets ───────────────────────────────────────────────────────
  assets: [
    { id: 'asset-1', name: 'Dell Latitude Laptop', category: 'IT Equipment', serialNumber: 'DL-2024-001', purchaseDate: '2024-01-15', purchasePrice: 85000, currentValue: 68000, depreciationRate: 20, location: 'Office Floor 1', status: 'ACTIVE' },
    { id: 'asset-2', name: 'Office Chair', category: 'Furniture', serialNumber: 'OC-2024-002', purchaseDate: '2024-02-20', purchasePrice: 15000, currentValue: 13500, depreciationRate: 10, location: 'Office Floor 2', status: 'ACTIVE' },
    { id: 'asset-3', name: 'HP Printer', category: 'IT Equipment', serialNumber: 'HP-2024-003', purchaseDate: '2024-03-10', purchasePrice: 25000, currentValue: 22500, depreciationRate: 10, location: 'Office Floor 1', status: 'ACTIVE' }
  ],
  depreciationRecords: [
    { id: 'dep-1', assetId: 'asset-1', assetName: 'Dell Latitude Laptop', period: 'Q2 2024', depreciationAmount: 4250, accumulatedDepreciation: 8500, bookValue: 76500, method: 'STRAIGHT_LINE' },
    { id: 'dep-2', assetId: 'asset-2', assetName: 'Office Chair', period: 'Q2 2024', depreciationAmount: 375, accumulatedDepreciation: 750, bookValue: 14250, method: 'STRAIGHT_LINE' }
  ],
  maintenanceSchedules: [
    { id: 'maint-1', assetId: 'asset-1', assetName: 'Dell Latitude Laptop', scheduledDate: '2024-07-15', type: 'PREVENTIVE', description: 'Annual maintenance check', status: 'SCHEDULED' },
    { id: 'maint-2', assetId: 'asset-3', assetName: 'HP Printer', scheduledDate: '2024-06-20', type: 'PREVENTIVE', description: 'Cartridge replacement', status: 'COMPLETED' }
  ],

  // ── Orders & Shipments ────────────────────────────────────────────
  orders: seedData.orders || [],
  shipments: [
    { id: 'ship-1', orderNumber: 'ORD-2024-001', carrier: 'DHL Express', trackingNumber: 'DH-123456789', origin: 'Mumbai', destination: 'Delhi', status: 'IN_TRANSIT', estimatedDelivery: '2024-06-10', actualDelivery: null, weight: 50, cost: 2500 },
    { id: 'ship-2', orderNumber: 'ORD-2024-002', carrier: 'FedEx', trackingNumber: 'FX-987654321', origin: 'Chennai', destination: 'Bangalore', status: 'DELIVERED', estimatedDelivery: '2024-06-05', actualDelivery: '2024-06-05', weight: 30, cost: 1800 }
  ],
  carriers: [
    { id: 'carrier-1', name: 'DHL Express', contact: '+91 98765 43210', email: 'dhl@example.com', rating: 4.5, activeShipments: 15, onTimeRate: 92 },
    { id: 'carrier-2', name: 'FedEx', contact: '+91 98765 43211', email: 'fedex@example.com', rating: 4.3, activeShipments: 20, onTimeRate: 88 },
    { id: 'carrier-3', name: 'BlueDart', contact: '+91 98765 43212', email: 'bluedart@example.com', rating: 4.2, activeShipments: 10, onTimeRate: 85 }
  ],
  routes: [
    { id: 'route-1', origin: 'Mumbai', destination: 'Delhi', distance: 1400, estimatedTime: 24, preferredCarrier: 'DHL Express', costPerKm: 15 },
    { id: 'route-2', origin: 'Chennai', destination: 'Bangalore', distance: 350, estimatedTime: 8, preferredCarrier: 'FedEx', costPerKm: 12 }
  ],

  // ── Projects ──────────────────────────────────────────────────────
  projects: [
    { id: 'proj-1', name: 'ERP System Upgrade', description: 'Complete system upgrade to latest version', status: 'IN_PROGRESS', priority: 'HIGH', startDate: '2024-05-01', endDate: '2024-08-31', budget: 5000000, spent: 2500000, progress: 50, manager: 'emp-1', managerName: 'John Doe' },
    { id: 'proj-2', name: 'Website Redesign', description: 'Redesign company website with new branding', status: 'PLANNING', priority: 'MEDIUM', startDate: '2024-07-01', endDate: '2024-09-30', budget: 1500000, spent: 0, progress: 0, manager: 'emp-2', managerName: 'Jane Smith' }
  ],
  tasks: [
    { id: 'task-1', projectId: 'proj-1', title: 'Requirements Analysis', description: 'Gather and document system requirements', status: 'COMPLETED', priority: 'HIGH', assignee: 'emp-1', assigneeName: 'John Doe', dueDate: '2024-05-15', estimatedHours: 40, actualHours: 38 },
    { id: 'task-2', projectId: 'proj-1', title: 'Database Migration', description: 'Migrate existing database to new system', status: 'IN_PROGRESS', priority: 'HIGH', assignee: 'emp-2', assigneeName: 'Jane Smith', dueDate: '2024-06-30', estimatedHours: 80, actualHours: 45 },
    { id: 'task-3', projectId: 'proj-2', title: 'Design Mockups', description: 'Create design mockups for new website', status: 'PENDING', priority: 'MEDIUM', assignee: 'emp-1', assigneeName: 'John Doe', dueDate: '2024-07-15', estimatedHours: 30, actualHours: 0 }
  ],
  milestones: [
    { id: 'mile-1', projectId: 'proj-1', title: 'Requirements Sign-off', description: 'Stakeholder approval of requirements', dueDate: '2024-05-20', status: 'COMPLETED' },
    { id: 'mile-2', projectId: 'proj-1', title: 'Development Complete', description: 'All development tasks completed', dueDate: '2024-07-31', status: 'PENDING' }
  ],
  resourceAllocations: [
    { id: 'res-1', projectId: 'proj-1', employeeId: 'emp-1', employeeName: 'John Doe', role: 'Project Manager', allocation: 100, startDate: '2024-05-01', endDate: '2024-08-31' },
    { id: 'res-2', projectId: 'proj-1', employeeId: 'emp-2', employeeName: 'Jane Smith', role: 'Developer', allocation: 75, startDate: '2024-05-15', endDate: '2024-08-15' }
  ],

  // ── Migration / Audit ─────────────────────────────────────────────
  migrationHistory: seedData.migrationHistory || [],

  // ── Banking (extended) ────────────────────────────────────────────
  bankingAccounts: [
    { id: 'bank-1', name: 'Primary Current Account', bank: 'HDFC Bank', accountNo: '****4521', balance: 2450000, type: 'CURRENT' },
    { id: 'bank-2', name: 'Payroll Savings Account', bank: 'SBI', accountNo: '****7830', balance: 850000, type: 'SAVINGS' },
    { id: 'bank-3', name: 'Fixed Deposit', bank: 'ICICI Bank', accountNo: '****2210', balance: 5000000, type: 'FD' }
  ],
  bankingTransactions: [
    { id: 'txn-1', accountId: 'bank-1', type: 'DEBIT', amount: 50000, description: 'Supplier Payment', date: '2024-06-01', category: 'PROCUREMENT' },
    { id: 'txn-2', accountId: 'bank-1', type: 'CREDIT', amount: 250000, description: 'Customer Payment', date: '2024-06-02', category: 'SALES' },
    { id: 'txn-3', accountId: 'bank-2', type: 'DEBIT', amount: 45000, description: 'Payroll Transfer', date: '2024-06-05', category: 'PAYROLL' }
  ],

  // ── Analytics Hub ─────────────────────────────────────────────────
  kpis: [
    { id: 'kpi-1', name: 'Total Revenue', value: 15000000, target: 20000000, unit: '₹', trend: 'UP', change: 15, department: 'Finance' },
    { id: 'kpi-2', name: 'Employee Satisfaction', value: 85, target: 90, unit: '%', trend: 'UP', change: 5, department: 'HR' },
    { id: 'kpi-3', name: 'Inventory Turnover', value: 4.5, target: 5, unit: 'x', trend: 'DOWN', change: -8, department: 'Inventory' },
    { id: 'kpi-4', name: 'On-Time Delivery', value: 92, target: 95, unit: '%', trend: 'UP', change: 3, department: 'Manufacturing' }
  ],
  reports: [
    { id: 'report-1', name: 'Monthly Financial Report', type: 'FINANCE', generatedDate: '2024-06-01', status: 'COMPLETED', generatedBy: 'emp-1' },
    { id: 'report-2', name: 'Q2 Sales Analysis', type: 'SALES', generatedDate: '2024-06-05', status: 'COMPLETED', generatedBy: 'emp-2' },
    { id: 'report-3', name: 'Employee Performance Summary', type: 'HR', generatedDate: '2024-06-10', status: 'SCHEDULED', generatedBy: null }
  ],
  dashboards: [
    { id: 'dash-1', name: 'Executive Dashboard', description: 'High-level overview for executives', widgets: ['revenue', 'profit', 'employees', 'orders'], createdBy: 'emp-1' },
    { id: 'dash-2', name: 'Operations Dashboard', description: 'Operational metrics and KPIs', widgets: ['production', 'inventory', 'quality', 'downtime'], createdBy: 'emp-2' }
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
  setDbLive: (v) => set({ dbLive: v }),
  setToken: (t) => {
    if (t) {
      localStorage.setItem('erp_token', t);
    } else {
      localStorage.removeItem('erp_token');
    }
    set({ token: t });
  },
  setCurrentUser: (u, permissions = [], allowedModules = []) => {
    if (u) {
      localStorage.setItem('erp_user', JSON.stringify(u));
    } else {
      localStorage.removeItem('erp_user');
    }
    set({ currentUser: u, userPermissions: permissions, allowedModules });
  },
  setUserPermissions: (permissions) => {
    localStorage.setItem('erp_permissions', JSON.stringify(permissions));
    set({ userPermissions: permissions });
  },
  setAllowedModules: (allowedModules) => {
    localStorage.setItem('erp_allowed_modules', JSON.stringify(allowedModules));
    set({ allowedModules });
  },
  setDemoMode: (d) => {
    localStorage.setItem('erp_demo', d ? 'true' : 'false');
    set({ demoMode: d });
  },
  logout: () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_refresh_token');
    localStorage.removeItem('erp_user');
    localStorage.removeItem('erp_permissions');
    localStorage.removeItem('erp_allowed_modules');
    localStorage.setItem('erp_demo', 'false');
    set({ token: null, currentUser: null, userPermissions: [], allowedModules: [], demoMode: false, activeModule: 'dashboard' });
  },

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
  addApprovalWorkflow: (workflow) => set((s) => ({
    approvalWorkflows: [...s.approvalWorkflows, { ...workflow, id: `workflow-${Date.now()}`, status: 'IN_PROGRESS' }]
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
  updateTaxDeadline: (deadlineId, status) => set((s) => ({
    taxCompliance: {
      ...s.taxCompliance,
      filingDeadlines: s.taxCompliance.filingDeadlines.map((d) => 
        d.id === deadlineId ? { ...d, status } : d
      )
    }
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

  // ── HR ────────────────────────────────────────────────────────────
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

  // ── Healthcare ─────────────────────────────────────────────────
  patients: [
    { id: 'patient-1', name: 'Rajesh Kumar', dob: '1985-03-15', gender: 'Male', bloodType: 'O+', contact: '+91 98765 43210', email: 'rajesh@example.com', address: '123 Main St, Bangalore', emergencyContact: 'Priya Kumar +91 98765 43211' },
    { id: 'patient-2', name: 'Sunita Sharma', dob: '1990-07-22', gender: 'Female', bloodType: 'A+', contact: '+91 98765 43212', email: 'sunita@example.com', address: '456 Oak Ave, Mumbai', emergencyContact: 'Amit Sharma +91 98765 43213' }
  ],
  appointments: [
    { id: 'appt-1', patientId: 'patient-1', patientName: 'Rajesh Kumar', doctor: 'Dr. Smith', date: '2024-06-15', time: '10:00', type: 'CHECKUP', status: 'SCHEDULED' },
    { id: 'appt-2', patientId: 'patient-2', patientName: 'Sunita Sharma', doctor: 'Dr. Johnson', date: '2024-06-16', time: '14:30', type: 'FOLLOWUP', status: 'CONFIRMED' }
  ],
  medicalHistory: [
    { id: 'history-1', patientId: 'patient-1', patientName: 'Rajesh Kumar', date: '2024-05-10', diagnosis: 'Hypertension', treatment: 'Medication prescribed', doctor: 'Dr. Smith' },
    { id: 'history-2', patientId: 'patient-2', patientName: 'Sunita Sharma', date: '2024-04-20', diagnosis: 'Diabetes Type 2', treatment: 'Diet and exercise plan', doctor: 'Dr. Johnson' }
  ],
  medicalBills: [
    { id: 'bill-1', patientId: 'patient-1', patientName: 'Rajesh Kumar', date: '2024-05-10', amount: 2500, status: 'PAID', services: ['Consultation', 'Lab Tests'] },
    { id: 'bill-2', patientId: 'patient-2', patientName: 'Sunita Sharma', date: '2024-04-20', amount: 1800, status: 'PENDING', services: ['Consultation', 'X-Ray'] }
  ],

  // ── Healthcare Actions ───────────────────────────────────────────
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
  students: [
    { id: 'student-1', name: 'Amit Patel', rollNo: 'STU-001', grade: '10th', section: 'A', dob: '2008-05-15', guardian: 'Raj Patel', contact: '+91 98765 43210', email: 'amit@example.com' },
    { id: 'student-2', name: 'Priya Singh', rollNo: 'STU-002', grade: '10th', section: 'B', dob: '2008-08-22', guardian: 'Vikram Singh', contact: '+91 98765 43211', email: 'priya@example.com' }
  ],
  courses: [
    { id: 'course-1', code: 'MATH-101', name: 'Mathematics', grade: '10th', credits: 5, teacher: 'Dr. Sharma', schedule: 'Mon, Wed, Fri 09:00-10:00' },
    { id: 'course-2', code: 'SCI-101', name: 'Science', grade: '10th', credits: 5, teacher: 'Dr. Gupta', schedule: 'Tue, Thu 10:00-11:30' }
  ],
  grades: [
    { id: 'grade-1', studentId: 'student-1', studentName: 'Amit Patel', courseId: 'course-1', courseName: 'Mathematics', midterm: 85, final: 90, grade: 'A', semester: '2024-1' },
    { id: 'grade-2', studentId: 'student-2', studentName: 'Priya Singh', courseId: 'course-1', courseName: 'Mathematics', midterm: 78, final: 82, grade: 'B+', semester: '2024-1' }
  ],
  studentAttendance: [
    { id: 'att-1', studentId: 'student-1', studentName: 'Amit Patel', date: '2024-06-01', status: 'PRESENT' },
    { id: 'att-2', studentId: 'student-1', studentName: 'Amit Patel', date: '2024-06-02', status: 'PRESENT' },
    { id: 'att-3', studentId: 'student-2', studentName: 'Priya Singh', date: '2024-06-01', status: 'ABSENT' }
  ],

  // ── Education Actions ─────────────────────────────────────────────
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
  carbonFootprints: [
    { id: 'cf-1', category: 'Manufacturing', scope: 'Scope 1', value: 1250, unit: 'tCO2e', period: '2024-05', baseline: 1300, target: 1000 },
    { id: 'cf-2', category: 'Transportation', scope: 'Scope 3', value: 450, unit: 'tCO2e', period: '2024-05', baseline: 500, target: 400 }
  ],
  esgReports: [
    { id: 'esg-1', reportType: 'Annual ESG Report', period: '2023', status: 'PUBLISHED', publishedDate: '2024-03-15', score: 85 },
    { id: 'esg-2', reportType: 'Quarterly Sustainability Update', period: 'Q1 2024', status: 'DRAFT', publishedDate: null, score: null }
  ],
  energyConsumption: [
    { id: 'energy-1', facility: 'Main Factory', type: 'Electricity', consumption: 45000, unit: 'kWh', period: '2024-05', cost: 450000, efficiency: 92 },
    { id: 'energy-2', facility: 'Warehouse', type: 'Gas', consumption: 12000, unit: 'm³', period: '2024-05', cost: 180000, efficiency: 88 }
  ],
  wasteManagement: [
    { id: 'waste-1', type: 'Recyclable', amount: 2500, unit: 'kg', period: '2024-05', recycled: 2200, disposalMethod: 'Recycling Center' },
    { id: 'waste-2', type: 'Hazardous', amount: 150, unit: 'kg', period: '2024-05', recycled: 0, disposalMethod: 'Licensed Disposal' }
  ],

  // ── Sustainability Actions ─────────────────────────────────────────
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
  marketingCampaigns: [
    { id: 'camp-1', name: 'Summer Sale 2024', type: 'EMAIL', status: 'ACTIVE', startDate: '2024-06-01', endDate: '2024-06-30', budget: 50000, spent: 25000, leads: 150, conversions: 45 },
    { id: 'camp-2', name: 'Social Media Boost', type: 'SOCIAL', status: 'SCHEDULED', startDate: '2024-07-01', endDate: '2024-07-15', budget: 30000, spent: 0, leads: 0, conversions: 0 }
  ],
  marketingLeads: [
    { id: 'lead-1', name: 'John Doe', email: 'john@example.com', source: 'Summer Sale 2024', status: 'NEW', score: 85, assignedTo: 'Sales Team A' },
    { id: 'lead-2', name: 'Jane Smith', email: 'jane@example.com', source: 'Website', status: 'CONTACTED', score: 72, assignedTo: 'Sales Team B' }
  ],
  marketingAnalytics: [
    { id: 'analytics-1', campaignId: 'camp-1', campaignName: 'Summer Sale 2024', metric: 'Open Rate', value: 24.5, unit: '%', date: '2024-06-10' },
    { id: 'analytics-2', campaignId: 'camp-1', campaignName: 'Summer Sale 2024', metric: 'Click Rate', value: 3.2, unit: '%', date: '2024-06-10' }
  ],
  socialMediaPosts: [
    { id: 'social-1', platform: 'LinkedIn', content: 'Exciting new product launch!', status: 'PUBLISHED', publishedDate: '2024-06-05', likes: 245, shares: 32, comments: 18 },
    { id: 'social-2', platform: 'Twitter', content: 'Join our webinar', status: 'SCHEDULED', publishedDate: '2024-06-15', likes: 0, shares: 0, comments: 0 }
  ],

  // ── Marketing Actions ─────────────────────────────────────────────
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
  accessLogs: [
    { id: 'access-1', userId: 'user-1', username: 'john.doe', action: 'LOGIN', timestamp: '2024-06-10 09:00:00', ipAddress: '192.168.1.100', device: 'Chrome / Windows', status: 'SUCCESS' },
    { id: 'access-2', userId: 'user-2', username: 'jane.smith', action: 'LOGOUT', timestamp: '2024-06-10 17:30:00', ipAddress: '192.168.1.101', device: 'Firefox / Mac', status: 'SUCCESS' }
  ],
  securityAlerts: [
    { id: 'alert-1', type: 'FAILED_LOGIN', severity: 'HIGH', description: 'Multiple failed login attempts from IP 192.168.1.200', timestamp: '2024-06-10 10:15:00', status: 'OPEN', assignedTo: 'Security Team' },
    { id: 'alert-2', type: 'SUSPICIOUS_ACTIVITY', severity: 'MEDIUM', description: 'Unusual access pattern detected for user john.doe', timestamp: '2024-06-10 14:20:00', status: 'INVESTIGATING', assignedTo: 'Security Team' }
  ],
  userActivity: [
    { id: 'activity-1', userId: 'user-1', username: 'john.doe', action: 'VIEW_FINANCE', module: 'Finance', timestamp: '2024-06-10 09:15:00', duration: 120 },
    { id: 'activity-2', userId: 'user-2', username: 'jane.smith', action: 'EXPORT_REPORT', module: 'Analytics', timestamp: '2024-06-10 11:30:00', duration: 45 }
  ],
  complianceTracking: [
    { id: 'compliance-1', regulation: 'GDPR', status: 'COMPLIANT', lastAudit: '2024-05-15', nextAudit: '2024-11-15', score: 95 },
    { id: 'compliance-2', regulation: 'SOX', status: 'COMPLIANT', lastAudit: '2024-04-10', nextAudit: '2024-10-10', score: 88 }
  ],

  // ── Security Actions ───────────────────────────────────────────────
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
  dataMigrations: [
    { id: 'migration-1', name: 'Legacy Customer Data Migration', source: 'Legacy SQL', target: 'ERP Database', status: 'COMPLETED', startDate: '2024-05-01', endDate: '2024-05-15', recordsProcessed: 15000, recordsFailed: 12 },
    { id: 'migration-2', name: 'Product Catalog Import', source: 'CSV File', target: 'Inventory Module', status: 'IN_PROGRESS', startDate: '2024-06-01', endDate: null, recordsProcessed: 8500, recordsFailed: 5 }
  ],
  importExports: [
    { id: 'import-1', type: 'IMPORT', source: 'customers.csv', module: 'CRM', status: 'COMPLETED', records: 2500, date: '2024-05-20' },
    { id: 'export-2', type: 'EXPORT', source: 'Finance Reports', module: 'Finance', status: 'COMPLETED', records: 150, date: '2024-06-05' }
  ],
  dataValidations: [
    { id: 'validation-1', dataset: 'Customer Data', rule: 'Email Format', status: 'PASSED', recordsChecked: 2500, errorsFound: 0, date: '2024-05-20' },
    { id: 'validation-2', dataset: 'Product Data', rule: 'Duplicate SKU', status: 'FAILED', recordsChecked: 8500, errorsFound: 15, date: '2024-06-01' }
  ],
  dataTransformations: [
    { id: 'transform-1', name: 'Currency Conversion', source: 'USD', target: 'INR', status: 'ACTIVE', lastRun: '2024-06-10', recordsProcessed: 5000 },
    { id: 'transform-2', name: 'Date Format Standardization', source: 'MM/DD/YYYY', target: 'YYYY-MM-DD', status: 'ACTIVE', lastRun: '2024-06-10', recordsProcessed: 12000 }
  ],

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
  rpaWorkflows: [
    { id: 'workflow-1', name: 'Invoice Processing Automation', type: 'FINANCE', status: 'ACTIVE', lastRun: '2024-06-10 14:00:00', successRate: 98.5, tasksCompleted: 1250 },
    { id: 'workflow-2', name: 'Employee Onboarding Bot', type: 'HR', status: 'ACTIVE', lastRun: '2024-06-10 10:30:00', successRate: 95.2, tasksCompleted: 85 }
  ],
  rpaBots: [
    { id: 'bot-1', name: 'FinanceBot-01', type: 'FINANCE', status: 'RUNNING', uptime: '45h 30m', tasksProcessed: 3200, errors: 12 },
    { id: 'bot-2', name: 'HRBot-01', type: 'HR', status: 'IDLE', uptime: '0h 0m', tasksProcessed: 0, errors: 0 }
  ],
  rpaTasks: [
    { id: 'task-1', workflowId: 'workflow-1', workflowName: 'Invoice Processing Automation', name: 'Extract Invoice Data', status: 'COMPLETED', scheduledTime: '2024-06-10 14:00:00', completedTime: '2024-06-10 14:00:15', duration: 15 },
    { id: 'task-2', workflowId: 'workflow-2', workflowName: 'Employee Onboarding Bot', name: 'Create User Account', status: 'PENDING', scheduledTime: '2024-06-11 09:00:00', completedTime: null, duration: 0 }
  ],
  rpaPerformance: [
    { id: 'perf-1', botId: 'bot-1', botName: 'FinanceBot-01', metric: 'Average Execution Time', value: 12.5, unit: 'seconds', date: '2024-06-10' },
    { id: 'perf-2', botId: 'bot-1', botName: 'FinanceBot-01', metric: 'Success Rate', value: 98.5, unit: '%', date: '2024-06-10' }
  ],

  // ── RPA Automation Actions ─────────────────────────────────────────
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
