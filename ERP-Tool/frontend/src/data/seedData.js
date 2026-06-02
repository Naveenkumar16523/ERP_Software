// Rich mock data matching TiDB database models for offline fallbacks and simulator capabilities.

const seedData = {
  // ── Finance Module (12 Accounts) ──────────────────────────────────
  accounts: [
    { id: 'acc-1', code: '1010', name: 'Operating Cash Account', type: 'ASSET', balance: 145200.0 },
    { id: 'acc-2', code: '1020', name: 'Petty Cash', type: 'ASSET', balance: 1250.0 },
    { id: 'acc-3', code: '1200', name: 'Accounts Receivable', type: 'ASSET', balance: 48900.0 },
    { id: 'acc-4', code: '1400', name: 'Inventory Asset', type: 'ASSET', balance: 85430.0 },
    { id: 'acc-5', code: '1500', name: 'Prepaid Expenses', type: 'ASSET', balance: 6200.0 },
    { id: 'acc-6', code: '2010', name: 'Accounts Payable', type: 'LIABILITY', balance: 32400.0 },
    { id: 'acc-7', code: '2200', name: 'Accrued Payroll', type: 'LIABILITY', balance: 15800.0 },
    { id: 'acc-8', code: '3000', name: 'Retained Earnings', type: 'EQUITY', balance: 180000.0 },
    { id: 'acc-9', code: '4010', name: 'Product Sales Revenue', type: 'REVENUE', balance: 224100.0 },
    { id: 'acc-10', code: '4020', name: 'Service Fee Income', type: 'REVENUE', balance: 48200.0 },
    { id: 'acc-11', code: '5010', name: 'Cost of Goods Sold (COGS)', type: 'EXPENSE', balance: 112000.0 },
    { id: 'acc-12', code: '5020', name: 'Office Rent & Utilities', type: 'EXPENSE', balance: 24000.0 }
  ],

  journalEntries: [
    {
      id: 'je-1',
      blockIndex: 1,
      voucherType: 'RECEIPT',
      voucherNo: 'VCH-2026-001',
      date: '2026-05-10T10:00:00.000Z',
      amount: 5200.0,
      debitAcc: 'Operating Cash Account',
      creditAcc: 'Accounts Receivable',
      narration: 'Invoice payment received from Nexus Retailers Ltd.',
      prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
      blockHash: '000001a4e58b1d9c7f6b64f3e2d1c0b9a8a7a6b5c4d3e2f1a0b1c2d3e4f5a6b7'
    },
    {
      id: 'je-2',
      blockIndex: 2,
      voucherType: 'PAYMENT',
      voucherNo: 'VCH-2026-002',
      date: '2026-05-12T14:30:00.000Z',
      amount: 18000.0,
      debitAcc: 'Office Rent & Utilities',
      creditAcc: 'Operating Cash Account',
      narration: 'Monthly office rent payment for May 2026',
      prevHash: '000001a4e58b1d9c7f6b64f3e2d1c0b9a8a7a6b5c4d3e2f1a0b1c2d3e4f5a6b7',
      blockHash: '000002c8d2f94b3e5a7c89d1e0f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0'
    },
    {
      id: 'je-3',
      blockIndex: 3,
      voucherType: 'JOURNAL',
      voucherNo: 'VCH-2026-003',
      date: '2026-05-15T09:00:00.000Z',
      amount: 12000.0,
      debitAcc: 'Cost of Goods Sold (COGS)',
      creditAcc: 'Inventory Asset',
      narration: 'COGS adjustment for April inventory consumed',
      prevHash: '000002c8d2f94b3e5a7c89d1e0f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0',
      blockHash: '000003a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9'
    }
  ],

  invoices: [
    {
      id: 'inv-1',
      invoiceNo: 'INV-2026-001',
      customerName: 'Nexus Retailers Ltd.',
      totalAmount: 52000.0,
      status: 'PAID',
      dueDate: '2026-05-20T00:00:00.000Z',
      createdAt: '2026-05-01T10:00:00.000Z'
    },
    {
      id: 'inv-2',
      invoiceNo: 'INV-2026-002',
      customerName: 'Apex Corp Solutions',
      totalAmount: 28500.0,
      status: 'PENDING',
      dueDate: '2026-06-10T00:00:00.000Z',
      createdAt: '2026-05-10T10:00:00.000Z'
    },
    {
      id: 'inv-3',
      invoiceNo: 'INV-2026-003',
      customerName: 'TechNova Industries',
      totalAmount: 76200.0,
      status: 'OVERDUE',
      dueDate: '2026-05-25T00:00:00.000Z',
      createdAt: '2026-04-25T10:00:00.000Z'
    }
  ],

  // ── HR Module ──────────────────────────────────────────────────────
  employees: [
    {
      id: 'emp-1',
      employeeCode: 'EMP-001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@company.com',
      phone: '123-456-7890',
      department: 'Engineering',
      jobTitle: 'Principal Architect',
      baseSalary: 150000.0,
      isActive: true,
      joinDate: '2022-01-15T00:00:00.000Z',
      avatar: null
    },
    {
      id: 'emp-2',
      employeeCode: 'EMP-002',
      firstName: 'Sarah',
      lastName: 'Connor',
      email: 'sarah.c@company.com',
      phone: '234-567-8901',
      department: 'Human Resources',
      jobTitle: 'HR Director',
      baseSalary: 95000.0,
      isActive: true,
      joinDate: '2021-08-01T00:00:00.000Z',
      avatar: null
    },
    {
      id: 'emp-3',
      employeeCode: 'EMP-003',
      firstName: 'Mike',
      lastName: 'Ross',
      email: 'mike.ross@company.com',
      phone: '345-678-9012',
      department: 'Sales & Marketing',
      jobTitle: 'Sales Account Manager',
      baseSalary: 60000.0,
      isActive: true,
      joinDate: '2023-03-10T00:00:00.000Z',
      avatar: null
    },
    {
      id: 'emp-4',
      employeeCode: 'EMP-004',
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya.sharma@company.com',
      phone: '456-789-0123',
      department: 'Finance',
      jobTitle: 'Financial Analyst',
      baseSalary: 72000.0,
      isActive: true,
      joinDate: '2023-07-20T00:00:00.000Z',
      avatar: null
    }
  ],

  leaveRequests: [
    {
      id: 'leave-1',
      employeeId: 'emp-1',
      employeeName: 'John Doe',
      leaveType: 'SICK',
      startDate: '2026-06-01',
      endDate: '2026-06-03',
      reason: 'Flu recovery',
      status: 'APPROVED',
      approvedBy: 'Sarah Connor'
    },
    {
      id: 'leave-2',
      employeeId: 'emp-3',
      employeeName: 'Mike Ross',
      leaveType: 'CASUAL',
      startDate: '2026-06-15',
      endDate: '2026-06-16',
      reason: 'Personal errands',
      status: 'PENDING',
      approvedBy: null
    }
  ],

  payrolls: [
    {
      id: 'slip-1',
      employeeId: 'emp-1',
      employeeName: 'John Doe',
      month: 5,
      year: 2026,
      baseSalary: 150000,
      pfDeduction: 18000,
      esiDeduction: 1125,
      tdsDeduction: 16250,
      netPay: 114625,
      status: 'PAID'
    },
    {
      id: 'slip-2',
      employeeId: 'emp-2',
      employeeName: 'Sarah Connor',
      month: 5,
      year: 2026,
      baseSalary: 95000,
      pfDeduction: 11400,
      esiDeduction: 712,
      tdsDeduction: 9500,
      netPay: 73388,
      status: 'PAID'
    }
  ],

  // ── CRM Module ──────────────────────────────────────────────────────
  leads: [
    {
      id: 'lead-1',
      name: 'Alice Johnson',
      company: 'TechNova Solutions',
      email: 'alice@technova.com',
      phone: '111-222-3333',
      status: 'NEW',
      source: 'Website Ref',
      value: 85000
    },
    {
      id: 'lead-2',
      name: 'Harvey Specter',
      company: 'Pearson Specter Litt',
      email: 'harvey@psl.com',
      phone: '444-555-6666',
      status: 'QUALIFIED',
      source: 'Referral',
      value: 250000
    },
    {
      id: 'lead-3',
      name: 'Bruce Wayne',
      company: 'Wayne Enterprises',
      email: 'bruce@wayne.com',
      phone: '777-888-9999',
      status: 'PROPOSAL',
      source: 'Cold Outreach',
      value: 500000
    }
  ],

  customers: [
    {
      id: 'cust-1',
      name: 'Pearson Specter Litt',
      industry: 'Legal Services',
      phone: '444-555-6666',
      billingAddress: '60 Wall St, NYC',
      isReturning: true,
      totalOrders: 5,
      totalSpend: 425000,
      createdAt: '2025-01-10T12:00:00.000Z'
    },
    {
      id: 'cust-2',
      name: 'Stark Industries',
      industry: 'Defense & Technology',
      phone: '777-888-9999',
      billingAddress: 'Stark Tower, NYC',
      isReturning: false,
      totalOrders: 2,
      totalSpend: 180000,
      createdAt: '2026-02-15T12:00:00.000Z'
    }
  ],

  // ── Inventory/Products ──────────────────────────────────────────────
  products: [
    {
      id: 'prod-1',
      sku: 'SKU-1001',
      name: 'Industrial Steel Rods',
      category: 'Raw Materials',
      currentStock: 450,
      reorderLevel: 100,
      costPrice: 180,
      sellingPrice: 240,
      unit: 'kg'
    },
    {
      id: 'prod-2',
      sku: 'SKU-1002',
      name: 'Electronic Control Board v2',
      category: 'Electronics',
      currentStock: 85,
      reorderLevel: 20,
      costPrice: 1200,
      sellingPrice: 1800,
      unit: 'pcs'
    },
    {
      id: 'prod-3',
      sku: 'SKU-1003',
      name: 'Hydraulic Pump Assembly',
      category: 'Machinery',
      currentStock: 12,
      reorderLevel: 5,
      costPrice: 8500,
      sellingPrice: 12000,
      unit: 'pcs'
    },
    {
      id: 'prod-4',
      sku: 'SKU-1004',
      name: 'Safety Gloves (Industrial)',
      category: 'Safety Equipment',
      currentStock: 800,
      reorderLevel: 200,
      costPrice: 45,
      sellingPrice: 75,
      unit: 'pairs'
    }
  ],

  // ── Procurement ──────────────────────────────────────────────────────
  suppliers: [
    {
      id: 'sup-1',
      name: 'Global Trade Inc',
      email: 'global@trade.com',
      phone: '1234567890',
      address: '123 Global Way, Mumbai',
      deliveryScore: 95.0,
      qualityScore: 98.0,
      priceScore: 90.0,
      overallScore: 94.3
    },
    {
      id: 'sup-2',
      name: 'Acme Industrial Supplies',
      email: 'sales@acme.com',
      phone: '2345678901',
      address: '456 Industrial Pkwy, Pune',
      deliveryScore: 88.0,
      qualityScore: 90.0,
      priceScore: 95.0,
      overallScore: 91.0
    },
    {
      id: 'sup-3',
      name: 'Apex Logistics & Goods',
      email: 'info@apexlogistics.com',
      phone: '3456789012',
      address: '789 Logistics Blvd, Delhi',
      deliveryScore: 72.0,
      qualityScore: 85.0,
      priceScore: 98.0,
      overallScore: 85.0
    }
  ],

  purchaseOrders: [
    {
      id: 'po-1',
      poNo: 'PO-2026-001',
      supplierId: 'sup-1',
      supplierName: 'Global Trade Inc',
      status: 'COMPLETED',
      items: [{ itemId: 'item-101', desc: 'Steel Rods', qty: 100, price: 100 }],
      totalAmount: 10000.0,
      createdAt: '2026-05-21T10:00:00.000Z'
    }
  ],

  // ── Projects ──────────────────────────────────────────────────────
  projects: [
    {
      id: 'proj-1',
      name: 'ERP System V2 Rollout',
      description: 'Full deployment of ERP v2 across all departments',
      status: 'IN_PROGRESS',
      startDate: '2026-04-01',
      endDate: '2026-09-30',
      budget: 500000,
      spent: 180000,
      managerId: 'emp-1',
      tasks: [
        { id: 'task-1', title: 'Requirements Gathering', status: 'DONE', assigneeId: 'emp-1' },
        { id: 'task-2', title: 'Database Schema Design', status: 'DONE', assigneeId: 'emp-1' },
        { id: 'task-3', title: 'Frontend Development', status: 'IN_PROGRESS', assigneeId: 'emp-3' },
        { id: 'task-4', title: 'User Testing', status: 'TODO', assigneeId: 'emp-2' }
      ]
    },
    {
      id: 'proj-2',
      name: 'Office Renovation',
      description: 'Renovation of 3rd floor office space',
      status: 'PLANNING',
      startDate: '2026-07-01',
      endDate: '2026-10-31',
      budget: 250000,
      spent: 0,
      managerId: 'emp-2',
      tasks: []
    }
  ],

  // ── Assets ──────────────────────────────────────────────────────────
  assets: [
    {
      id: 'asset-1',
      assetTag: 'AST-001',
      name: 'Industrial CNC Machine',
      category: 'Machinery',
      purchaseDate: '2023-06-15',
      purchaseCost: 850000,
      currentValue: 680000,
      depreciationRate: 10,
      location: 'Factory Floor A',
      status: 'ACTIVE',
      assignedTo: 'emp-1'
    },
    {
      id: 'asset-2',
      assetTag: 'AST-002',
      name: 'Dell Server Rack - PowerEdge',
      category: 'IT Equipment',
      purchaseDate: '2024-01-10',
      purchaseCost: 320000,
      currentValue: 256000,
      depreciationRate: 20,
      location: 'Server Room',
      status: 'ACTIVE',
      assignedTo: 'emp-1'
    },
    {
      id: 'asset-3',
      assetTag: 'AST-003',
      name: 'Company Vehicle - Toyota Hiace',
      category: 'Vehicles',
      purchaseDate: '2022-11-20',
      purchaseCost: 1200000,
      currentValue: 840000,
      depreciationRate: 15,
      location: 'Parking Bay 3',
      status: 'ACTIVE',
      assignedTo: 'emp-3'
    }
  ],

  // ── Orders ──────────────────────────────────────────────────────────
  orders: [
    {
      id: 'ord-1',
      orderNo: 'ORD-2026-001',
      customerId: 'cust-1',
      customerName: 'Pearson Specter Litt',
      items: [{ productId: 'prod-1', qty: 50, price: 240 }],
      totalAmount: 12000,
      status: 'DELIVERED',
      createdAt: '2026-05-15T10:00:00.000Z'
    }
  ],

  // ── Shipments ──────────────────────────────────────────────────────
  shipments: [
    {
      id: 'ship-1',
      trackingNo: 'TRK-2026-001',
      orderId: 'ord-1',
      carrier: 'BlueDart Logistics',
      origin: 'Mumbai Warehouse',
      destination: '60 Wall St, NYC',
      status: 'DELIVERED',
      dispatchedAt: '2026-05-16T08:00:00.000Z',
      estimatedArrival: '2026-05-20T00:00:00.000Z'
    }
  ],

  // ── Notifications ──────────────────────────────────────────────────
  notifications: [
    {
      id: 'notif-1',
      type: 'warning',
      message: 'Hydraulic Pump Assembly stock is below reorder level (12 units remaining)',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      read: false
    },
    {
      id: 'notif-2',
      type: 'info',
      message: 'Invoice INV-2026-003 is overdue. Follow up with TechNova Industries.',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      read: false
    },
    {
      id: 'notif-3',
      type: 'success',
      message: 'Payroll processing for May 2026 completed successfully.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      read: true
    }
  ],

  // ── Manufacturing ──────────────────────────────────────────────────
  productionBatches: [
    {
      id: 'batch-1',
      batchNo: 'BATCH-2026-001',
      productId: 'prod-3',
      productName: 'Hydraulic Pump Assembly',
      quantity: 20,
      status: 'IN_PROGRESS',
      startDate: '2026-05-20',
      targetDate: '2026-06-10',
      progress: 65
    }
  ],

  qaInspections: [
    {
      id: 'qa-1',
      batchId: 'batch-1',
      inspectedBy: 'emp-1',
      result: 'PASS',
      defectsFound: 0,
      notes: 'All units within tolerance specifications',
      inspectedAt: '2026-05-25T14:00:00.000Z'
    }
  ],

  // ── Migration / Audit ──────────────────────────────────────────────
  migrationHistory: [
    {
      id: 'mig-1',
      event: 'Database schema v1 → v2 migration',
      status: 'SUCCESS',
      recordsMigrated: 1240,
      duration: '4m 32s',
      performedBy: 'System',
      timestamp: '2026-04-01T02:00:00.000Z'
    }
  ]
};

export default seedData;
