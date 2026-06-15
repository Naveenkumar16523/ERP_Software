const mongoose = require('mongoose');

// ========================================
// FINANCE MODULE
// ========================================

const ChartOfAccountsSchema = new mongoose.Schema({
  account_code: { type: String, required: true, unique: true },
  account_name: { type: String, required: true },
  account_type: { type: String, enum: ['Asset', 'Liability', 'Equity', 'Income', 'Expense'], required: true },
  opening_balance: { type: Number, default: 0 },
  current_balance: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  created_at: { type: Date, default: Date.now }
});

const JournalEntriesSchema = new mongoose.Schema({
  reference_number: { type: String, required: true, unique: true },
  entry_date: { type: Date, required: true },
  description: { type: String },
  debit_account: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccounts' },
  credit_account: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccounts' },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Posted', 'Draft', 'Cancelled'], default: 'Posted' },
  created_at: { type: Date, default: Date.now }
});

const InvoicesSchema = new mongoose.Schema({
  invoice_number: { type: String, required: true, unique: true },
  client_name: { type: String, required: true },
  invoice_date: { type: Date, required: true },
  due_date: { type: Date, required: true },
  subtotal: { type: Number, required: true },
  tax_rate: { type: Number, default: 0 },
  tax_amount: { type: Number, default: 0 },
  total_amount: { type: Number, required: true },
  status: { type: String, enum: ['Paid', 'Pending', 'Overdue'], default: 'Pending' },
  created_at: { type: Date, default: Date.now }
});

const BudgetPlannerSchema = new mongoose.Schema({
  budget_name: { type: String, required: true },
  category: { type: String, required: true },
  month: { type: String, required: true },
  allocated_amount: { type: Number, required: true },
  spent_amount: { type: Number, default: 0 },
  remaining_amount: { type: Number },
  created_at: { type: Date, default: Date.now }
});

const ExpenseTrackerSchema = new mongoose.Schema({
  expense_date: { type: Date, required: true },
  category: { type: String, required: true },
  description: { type: String },
  amount: { type: Number, required: true },
  paid_by: { type: String },
  receipt_attached: { type: Boolean, default: false },
  status: { type: String, enum: ['Approved', 'Pending', 'Rejected'], default: 'Pending' },
  created_at: { type: Date, default: Date.now }
});

const ApprovalsSchema = new mongoose.Schema({
  request_number: { type: String, required: true, unique: true },
  request_type: { type: String, required: true },
  requested_by: { type: String, required: true },
  amount: { type: Number },
  request_date: { type: Date, required: true },
  reason: { type: String },
  document_url: { type: String },
  status: { type: String, enum: ['Approved', 'Pending', 'Rejected'], default: 'Pending' },
  created_at: { type: Date, default: Date.now }
});

const TaxComplianceSchema = new mongoose.Schema({
  tax_name: { type: String, required: true },
  tax_type: { type: String, required: true },
  rate: { type: Number, required: true },
  applicable_on: { type: String },
  effective_date: { type: Date, required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  created_at: { type: Date, default: Date.now }
});

const StatementsSchema = new mongoose.Schema({
  statement_type: { type: String, enum: ['Profit & Loss', 'Balance Sheet', 'Cash Flow', 'Trial Balance'], required: true },
  period: { type: String, required: true },
  total_income: { type: Number },
  total_expense: { type: Number },
  net_amount: { type: Number },
  date_range_start: { type: Date },
  date_range_end: { type: Date },
  status: { type: String, default: 'Generated' },
  created_at: { type: Date, default: Date.now }
});

// ========================================
// HUMAN RESOURCES MODULE
// ========================================

const EmployeeDirectorySchema = new mongoose.Schema({
  employee_id: { type: String, required: true, unique: true },
  full_name: { type: String, required: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  date_of_joining: { type: Date, required: true },
  phone: { type: String },
  email: { type: String, unique: true },
  address: { type: String },
  status: { type: String, enum: ['Active', 'Inactive', 'Terminated'], default: 'Active' },
  created_at: { type: Date, default: Date.now }
});

const LeaveManagementSchema = new mongoose.Schema({
  leave_id: { type: String, required: true, unique: true },
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'EmployeeDirectory', required: true },
  leave_type: { type: String, enum: ['Sick Leave', 'Casual Leave', 'Earned Leave'], required: true },
  from_date: { type: Date, required: true },
  to_date: { type: Date, required: true },
  days: { type: Number },
  reason: { type: String },
  status: { type: String, enum: ['Approved', 'Pending', 'Rejected'], default: 'Pending' },
  created_at: { type: Date, default: Date.now }
});

const RecruitmentSchema = new mongoose.Schema({
  job_id: { type: String, required: true, unique: true },
  job_title: { type: String, required: true },
  department: { type: String, required: true },
  posted_date: { type: Date, required: true },
  candidate_name: { type: String },
  interview_date: { type: Date },
  status: { type: String, enum: ['Selected', 'Under Review', 'Rejected'], default: 'Under Review' },
  created_at: { type: Date, default: Date.now }
});

const PerformanceSchema = new mongoose.Schema({
  review_id: { type: String, required: true, unique: true },
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'EmployeeDirectory', required: true },
  review_period: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 },
  kpi_score: { type: Number },
  comments: { type: String },
  status: { type: String, default: 'Completed' },
  created_at: { type: Date, default: Date.now }
});

const OnboardingSchema = new mongoose.Schema({
  onboarding_id: { type: String, required: true, unique: true },
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'EmployeeDirectory', required: true },
  start_date: { type: Date, required: true },
  tasks_assigned: { type: String },
  documents_submitted: { type: Boolean, default: false },
  training_status: { type: String, enum: ['Completed', 'In Progress', 'Pending'], default: 'Pending' },
  status: { type: String, enum: ['Completed', 'In Progress', 'Pending'], default: 'Pending' },
  created_at: { type: Date, default: Date.now }
});

const AttendanceSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'EmployeeDirectory', required: true },
  date: { type: Date, required: true },
  clock_in: { type: String },
  clock_out: { type: String },
  total_hours: { type: Number },
  status: { type: String, enum: ['Present', 'Absent', 'Half Day'], required: true },
  created_at: { type: Date, default: Date.now }
});

// ========================================
// INVENTORY MODULE
// ========================================

const ProductsSchema = new mongoose.Schema({
  product_id: { type: String, required: true, unique: true },
  product_name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  category: { type: String },
  unit: { type: String },
  opening_stock: { type: Number, default: 0 },
  current_stock: { type: Number, default: 0 },
  reorder_level: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  created_at: { type: Date, default: Date.now }
});

const BatchTrackingSchema = new mongoose.Schema({
  batch_number: { type: String, required: true, unique: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Products', required: true },
  manufacturing_date: { type: Date },
  expiry_date: { type: Date },
  quantity: { type: Number, required: true },
  warehouse: { type: String },
  status: { type: String, enum: ['Active', 'Expired', 'Consumed'], default: 'Active' },
  created_at: { type: Date, default: Date.now }
});

const WarehousesSchema = new mongoose.Schema({
  warehouse_id: { type: String, required: true, unique: true },
  warehouse_name: { type: String, required: true },
  location: { type: String, required: true },
  zone: { type: String },
  capacity: { type: String },
  current_stock: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  created_at: { type: Date, default: Date.now }
});

const StockMovementsSchema = new mongoose.Schema({
  movement_id: { type: String, required: true, unique: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Products', required: true },
  movement_type: { type: String, enum: ['IN', 'OUT', 'Transfer'], required: true },
  quantity: { type: Number, required: true },
  from_warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouses' },
  to_warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouses' },
  movement_date: { type: Date, required: true },
  status: { type: String, enum: ['Completed', 'Pending', 'Cancelled'], default: 'Completed' },
  created_at: { type: Date, default: Date.now }
});

const BarcodeScannerSchema = new mongoose.Schema({
  barcode_id: { type: String, required: true, unique: true },
  barcode_number: { type: String, required: true, unique: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Products', required: true },
  warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouses' },
  assigned_date: { type: Date },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  created_at: { type: Date, default: Date.now }
});

// ========================================
// MANUFACTURING MODULE
// ========================================

const ProductionBatchesSchema = new mongoose.Schema({
  batch_id: { type: String, required: true, unique: true },
  product_name: { type: String, required: true },
  planned_quantity: { type: Number, required: true },
  actual_quantity: { type: Number, default: 0 },
  start_date: { type: Date },
  end_date: { type: Date },
  status: { type: String, enum: ['Completed', 'In Progress', 'Planned'], default: 'Planned' },
  created_at: { type: Date, default: Date.now }
});

const ManufacturingWorkOrdersSchema = new mongoose.Schema({
  wo_number: { type: String, required: true, unique: true },
  product_name: { type: String, required: true },
  quantity: { type: Number, required: true },
  machine: { type: String },
  start_date: { type: Date },
  due_date: { type: Date },
  status: { type: String, enum: ['Completed', 'In Progress', 'Planned'], default: 'Planned' },
  created_at: { type: Date, default: Date.now }
});

const BillOfMaterialsSchema = new mongoose.Schema({
  bom_id: { type: String, required: true, unique: true },
  product_name: { type: String, required: true },
  raw_material: { type: String, required: true },
  quantity_required: { type: Number, required: true },
  unit: { type: String },
  unit_cost: { type: Number },
  total_cost: { type: Number },
  created_at: { type: Date, default: Date.now }
});

const MachinesSchema = new mongoose.Schema({
  machine_id: { type: String, required: true, unique: true },
  machine_name: { type: String, required: true },
  machine_type: { type: String },
  location: { type: String },
  purchase_date: { type: Date },
  status: { type: String, enum: ['Active', 'Maintenance', 'Inactive'], default: 'Active' },
  created_at: { type: Date, default: Date.now }
});

const DowntimeLogsSchema = new mongoose.Schema({
  log_id: { type: String, required: true, unique: true },
  machine_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Machines', required: true },
  start_time: { type: Date },
  end_time: { type: Date },
  duration_hours: { type: Number },
  reason: { type: String },
  impact: { type: String },
  status: { type: String, enum: ['Resolved', 'Under Repair', 'Pending'], default: 'Pending' },
  created_at: { type: Date, default: Date.now }
});

const ProductionReportsSchema = new mongoose.Schema({
  report_id: { type: String, required: true, unique: true },
  batch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionBatches' },
  period: { type: String },
  planned_quantity: { type: Number },
  actual_quantity: { type: Number },
  efficiency_percentage: { type: Number },
  downtime_hours: { type: Number },
  status: { type: String, default: 'Generated' },
  created_at: { type: Date, default: Date.now }
});

// ========================================
// PROCUREMENT MODULE
// ========================================

const SuppliersSchema = new mongoose.Schema({
  supplier_id: { type: String, required: true, unique: true },
  supplier_name: { type: String, required: true },
  contact_person: { type: String },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  city: { type: String },
  gst_number: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  created_at: { type: Date, default: Date.now }
});

const PurchaseOrdersSchema = new mongoose.Schema({
  po_number: { type: String, required: true, unique: true },
  supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Suppliers', required: true },
  item_name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit_price: { type: Number, required: true },
  total_amount: { type: Number },
  delivery_date: { type: Date },
  status: { type: String, enum: ['Delivered', 'Pending', 'Cancelled'], default: 'Pending' },
  created_at: { type: Date, default: Date.now }
});

const RFQsSchema = new mongoose.Schema({
  rfq_number: { type: String, required: true, unique: true },
  item_required: { type: String, required: true },
  quantity: { type: Number, required: true },
  last_date: { type: Date },
  sent_to: { type: String },
  quotes_received: { type: Number, default: 0 },
  status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
  created_at: { type: Date, default: Date.now }
});

const VendorEvaluationsSchema = new mongoose.Schema({
  eval_id: { type: String, required: true, unique: true },
  supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Suppliers', required: true },
  quality_rating: { type: Number, min: 1, max: 5 },
  delivery_rating: { type: Number, min: 1, max: 5 },
  price_rating: { type: Number, min: 1, max: 5 },
  service_rating: { type: Number, min: 1, max: 5 },
  overall_rating: { type: Number },
  evaluation_date: { type: Date },
  created_at: { type: Date, default: Date.now }
});

const ContractsSchema = new mongoose.Schema({
  contract_id: { type: String, required: true, unique: true },
  supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Suppliers', required: true },
  contract_name: { type: String, required: true },
  start_date: { type: Date },
  end_date: { type: Date },
  value: { type: Number },
  terms: { type: String },
  document_url: { type: String },
  status: { type: String, enum: ['Active', 'Expired', 'Terminated'], default: 'Active' },
  created_at: { type: Date, default: Date.now }
});

// ========================================
// CRM & PIPELINE MODULE
// ========================================

const CustomersSchema = new mongoose.Schema({
  customer_id: { type: String, required: true, unique: true },
  customer_name: { type: String, required: true },
  company: { type: String },
  phone: { type: String },
  email: { type: String },
  city: { type: String },
  assigned_rep: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  created_at: { type: Date, default: Date.now }
});

const LeadPipelineSchema = new mongoose.Schema({
  lead_id: { type: String, required: true, unique: true },
  lead_name: { type: String, required: true },
  company: { type: String },
  phone: { type: String },
  email: { type: String },
  source: { type: String },
  stage: { type: String, enum: ['New', 'Contacted', 'Proposal', 'Negotiation', 'Won', 'Lost'], default: 'New' },
  value: { type: Number },
  status: { type: String, enum: ['Active', 'Closed'], default: 'Active' },
  created_at: { type: Date, default: Date.now }
});

const SalesForecastSchema = new mongoose.Schema({
  forecast_id: { type: String, required: true, unique: true },
  month: { type: String, required: true },
  product_service: { type: String },
  expected_revenue: { type: Number },
  probability: { type: Number },
  forecasted_value: { type: Number },
  status: { type: String, enum: ['Achieved', 'In Progress', 'Planned'], default: 'Planned' },
  created_at: { type: Date, default: Date.now }
});

const OpportunitiesSchema = new mongoose.Schema({
  opportunity_id: { type: String, required: true, unique: true },
  opportunity_name: { type: String, required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customers' },
  value: { type: Number },
  expected_close_date: { type: Date },
  stage: { type: String },
  status: { type: String, enum: ['Active', 'Closed', 'Lost'], default: 'Active' },
  created_at: { type: Date, default: Date.now }
});

const ActivitiesSchema = new mongoose.Schema({
  activity_id: { type: String, required: true, unique: true },
  activity_type: { type: String, enum: ['Call', 'Email', 'Meeting'], required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customers' },
  activity_date: { type: Date },
  assigned_to: { type: String },
  notes: { type: String },
  status: { type: String, enum: ['Done', 'Pending'], default: 'Pending' },
  created_at: { type: Date, default: Date.now }
});

// ========================================
// PAYROLL MODULE
// ========================================

const SalaryStructuresSchema = new mongoose.Schema({
  structure_id: { type: String, required: true, unique: true },
  structure_name: { type: String, required: true },
  basic_salary: { type: Number, required: true },
  hra: { type: Number, default: 0 },
  transport_allowance: { type: Number, default: 0 },
  pf_deduction: { type: Number, default: 0 },
  tax_deduction: { type: Number, default: 0 },
  net_salary: { type: Number },
  created_at: { type: Date, default: Date.now }
});

const PayslipsSchema = new mongoose.Schema({
  payslip_number: { type: String, required: true, unique: true },
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'EmployeeDirectory', required: true },
  pay_period: { type: String, required: true },
  basic_salary: { type: Number },
  allowances: { type: Number },
  deductions: { type: Number },
  net_pay: { type: Number },
  status: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' },
  created_at: { type: Date, default: Date.now }
});

const TimeTrackingSchema = new mongoose.Schema({
  log_id: { type: String, required: true, unique: true },
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'EmployeeDirectory', required: true },
  log_date: { type: Date, required: true },
  clock_in: { type: String },
  clock_out: { type: String },
  total_hours: { type: Number },
  overtime_hours: { type: Number, default: 0 },
  status: { type: String, enum: ['Approved', 'Pending'], default: 'Pending' },
  created_at: { type: Date, default: Date.now }
});

// ========================================
// FIXED ASSETS MODULE
// ========================================

const FixedAssetsSchema = new mongoose.Schema({
  asset_id: { type: String, required: true, unique: true },
  asset_name: { type: String, required: true },
  category: { type: String, enum: ['Vehicle', 'Machinery', 'Equipment'], required: true },
  purchase_date: { type: Date },
  purchase_cost: { type: Number },
  depreciation_method: { type: String, enum: ['Straight Line', 'WDV'] },
  depreciation_rate: { type: Number },
  current_value: { type: Number },
  location: { type: String },
  status: { type: String, enum: ['Active', 'Disposed', 'Under Repair'], default: 'Active' },
  created_at: { type: Date, default: Date.now }
});

// ========================================
// PROJECTS MODULE
// ========================================

const ProjectsSchema = new mongoose.Schema({
  project_id: { type: String, required: true, unique: true },
  project_name: { type: String, required: true },
  project_manager: { type: String },
  start_date: { type: Date },
  end_date: { type: Date },
  budget: { type: Number },
  spent_amount: { type: Number, default: 0 },
  completion_percentage: { type: Number, default: 0 },
  status: { type: String, enum: ['Planning', 'In Progress', 'Completed'], default: 'Planning' },
  created_at: { type: Date, default: Date.now }
});

const ProjectTasksSchema = new mongoose.Schema({
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Projects', required: true },
  task_name: { type: String, required: true },
  assignee: { type: String },
  due_date: { type: Date },
  completion_percentage: { type: Number, default: 0 },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  created_at: { type: Date, default: Date.now }
});

// ========================================
// SUPPLY CHAIN MODULE
// ========================================

const CarriersSchema = new mongoose.Schema({
  carrier_id: { type: String, required: true, unique: true },
  carrier_name: { type: String, required: true },
  contact: { type: String },
  vehicle_type: { type: String },
  capacity: { type: String },
  city: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  created_at: { type: Date, default: Date.now }
});

const RoutesSchema = new mongoose.Schema({
  route_id: { type: String, required: true, unique: true },
  route_name: { type: String, required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  distance_km: { type: Number },
  estimated_time: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  created_at: { type: Date, default: Date.now }
});

const ShipmentsSchema = new mongoose.Schema({
  shipment_id: { type: String, required: true, unique: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customers' },
  items: { type: String },
  carrier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Carriers' },
  route_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Routes' },
  expected_delivery: { type: Date },
  actual_delivery: { type: Date },
  status: { type: String, enum: ['Pending', 'In Transit', 'Delivered'], default: 'Pending' },
  created_at: { type: Date, default: Date.now }
});

const SupplyChainWorkOrdersSchema = new mongoose.Schema({
  wo_number: { type: String, required: true, unique: true },
  shipment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipments' },
  assigned_driver: { type: String },
  vehicle: { type: String },
  route_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Routes' },
  order_date: { type: Date },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  created_at: { type: Date, default: Date.now }
});

// ========================================
// E-COMMERCE MODULE
// ========================================

const EcommerceProductsSchema = new mongoose.Schema({
  product_id: { type: String, required: true, unique: true },
  product_name: { type: String, required: true },
  category: { type: String },
  price: { type: Number, required: true },
  stock_quantity: { type: Number, default: 0 },
  description: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  created_at: { type: Date, default: Date.now }
});

const EcommerceCartSchema = new mongoose.Schema({
  cart_id: { type: String, required: true, unique: true },
  customer_name: { type: String, required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'EcommerceProducts' },
  quantity: { type: Number, required: true },
  unit_price: { type: Number },
  total_amount: { type: Number },
  cart_date: { type: Date },
  created_at: { type: Date, default: Date.now }
});

const EcommerceOrdersSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true },
  customer_name: { type: String, required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'EcommerceProducts' },
  quantity: { type: Number, required: true },
  total_amount: { type: Number, required: true },
  payment_method: { type: String, enum: ['UPI', 'Card', 'COD'] },
  delivery_address: { type: String },
  status: { type: String, enum: ['Pending', 'Shipped', 'Delivered'], default: 'Pending' },
  created_at: { type: Date, default: Date.now }
});

const EcommercePaymentsSchema = new mongoose.Schema({
  payment_id: { type: String, required: true, unique: true },
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'EcommerceOrders' },
  customer_name: { type: String },
  amount: { type: Number, required: true },
  payment_method: { type: String },
  payment_date: { type: Date },
  status: { type: String, enum: ['Paid', 'Pending', 'Failed'], default: 'Pending' },
  created_at: { type: Date, default: Date.now }
});

// ========================================
// ANALYTICS HUB MODULE
// ========================================

const AnalyticsReportsSchema = new mongoose.Schema({
  report_id: { type: String, required: true, unique: true },
  report_name: { type: String, required: true },
  module_source: { type: String, required: true },
  kpi_name: { type: String },
  kpi_value: { type: String },
  period: { type: String },
  chart_type: { type: String, enum: ['Bar Chart', 'Line Chart', 'Pie Chart'] },
  status: { type: String, default: 'Generated' },
  created_at: { type: Date, default: Date.now }
});

// ========================================
// BANKING MODULE
// ========================================

const BankAccountsSchema = new mongoose.Schema({
  account_id: { type: String, required: true, unique: true },
  account_name: { type: String, required: true },
  bank_name: { type: String, required: true },
  account_number: { type: String, required: true, unique: true },
  account_type: { type: String, enum: ['Current', 'Savings'], required: true },
  opening_balance: { type: Number, default: 0 },
  current_balance: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  created_at: { type: Date, default: Date.now }
});

const BankTransactionsSchema = new mongoose.Schema({
  transaction_id: { type: String, required: true, unique: true },
  account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccounts', required: true },
  transaction_date: { type: Date, required: true },
  transaction_type: { type: String, enum: ['Credit', 'Debit'], required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  balance_after: { type: Number },
  status: { type: String, default: 'Completed' },
  created_at: { type: Date, default: Date.now }
});

const LoansSchema = new mongoose.Schema({
  loan_id: { type: String, required: true, unique: true },
  loan_name: { type: String, required: true },
  bank_name: { type: String, required: true },
  loan_amount: { type: Number, required: true },
  interest_rate: { type: Number },
  emi_amount: { type: Number },
  start_date: { type: Date },
  end_date: { type: Date },
  status: { type: String, enum: ['Active', 'Closed', 'Defaulted'], default: 'Active' },
  created_at: { type: Date, default: Date.now }
});

// ========================================
// MARKETING MODULE
// ========================================

const CampaignsSchema = new mongoose.Schema({
  campaign_id: { type: String, required: true, unique: true },
  campaign_name: { type: String, required: true },
  campaign_type: { type: String, enum: ['Email', 'SMS', 'Social Media', 'Referral'] },
  target_audience: { type: String },
  budget: { type: Number },
  start_date: { type: Date },
  end_date: { type: Date },
  status: { type: String, enum: ['Active', 'Completed', 'Planned'], default: 'Planned' },
  created_at: { type: Date, default: Date.now }
});

const MarketingLeadsSchema = new mongoose.Schema({
  lead_id: { type: String, required: true, unique: true },
  lead_name: { type: String, required: true },
  source: { type: String },
  campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaigns' },
  phone: { type: String },
  email: { type: String },
  status: { type: String, enum: ['New', 'Contacted', 'Qualified', 'Converted'], default: 'New' },
  created_at: { type: Date, default: Date.now }
});

const MarketingAnalyticsSchema = new mongoose.Schema({
  report_id: { type: String, required: true, unique: true },
  campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaigns' },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  leads_generated: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  cost_per_lead: { type: Number },
  roi_percentage: { type: Number },
  created_at: { type: Date, default: Date.now }
});

const SocialMediaPostsSchema = new mongoose.Schema({
  post_id: { type: String, required: true, unique: true },
  platform: { type: String, enum: ['LinkedIn', 'Instagram', 'Facebook', 'Twitter'] },
  content: { type: String, required: true },
  scheduled_date: { type: Date },
  likes: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  status: { type: String, enum: ['Published', 'Scheduled', 'Draft'], default: 'Draft' },
  created_at: { type: Date, default: Date.now }
});

// ========================================
// SECURITY MODULE
// ========================================

const SecurityAlertsSchema = new mongoose.Schema({
  alert_id: { type: String, required: true, unique: true },
  alert_type: { type: String, required: true },
  alert_date: { type: Date, required: true },
  user_name: { type: String },
  ip_address: { type: String },
  risk_level: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
  description: { type: String },
  status: { type: String, enum: ['Resolved', 'Under Review', 'Reviewed'], default: 'Under Review' },
  created_at: { type: Date, default: Date.now }
});

const AccessLogsSchema = new mongoose.Schema({
  log_id: { type: String, required: true, unique: true },
  user_name: { type: String, required: true },
  user_role: { type: String },
  action: { type: String },
  module_accessed: { type: String },
  log_datetime: { type: Date },
  ip_address: { type: String },
  status: { type: String, enum: ['Success', 'Failed'], default: 'Success' },
  created_at: { type: Date, default: Date.now }
});

const UserActivitySchema = new mongoose.Schema({
  activity_id: { type: String, required: true, unique: true },
  user_name: { type: String, required: true },
  user_role: { type: String },
  action: { type: String, required: true },
  description: { type: String },
  activity_datetime: { type: Date },
  status: { type: String, default: 'Completed' },
  created_at: { type: Date, default: Date.now }
});

const ComplianceSchema = new mongoose.Schema({
  compliance_id: { type: String, required: true, unique: true },
  compliance_type: { type: String, required: true },
  standard: { type: String },
  check_date: { type: Date },
  next_review: { type: Date },
  score: { type: Number },
  notes: { type: String },
  status: { type: String, enum: ['Compliant', 'Non-Compliant', 'Under Review'], default: 'Under Review' },
  created_at: { type: Date, default: Date.now }
});

// ========================================
// MIGRATION HUB MODULE
// ========================================

const MigrationHubSchema = new mongoose.Schema({
  migration_id: { type: String, required: true, unique: true },
  migration_name: { type: String, required: true },
  source_system: { type: String, required: true },
  target_module: { type: String, required: true },
  file_format: { type: String, enum: ['CSV', 'XLSX', 'JSON'] },
  total_records: { type: Number, default: 0 },
  migrated_records: { type: Number, default: 0 },
  failed_records: { type: Number, default: 0 },
  migration_date: { type: Date },
  error_log: { type: String },
  status: { type: String, enum: ['Completed', 'In Progress', 'Failed'], default: 'In Progress' },
  created_at: { type: Date, default: Date.now }
});

// ========================================
// RPA AUTOMATION HUB MODULE
// ========================================

const RPAAutomationsSchema = new mongoose.Schema({
  automation_id: { type: String, required: true, unique: true },
  automation_name: { type: String, required: true },
  trigger_type: { type: String, enum: ['Scheduled', 'Event-based'], required: true },
  schedule: { type: String },
  module_connected: { type: String, required: true },
  action_performed: { type: String, required: true },
  last_run: { type: Date },
  success_count: { type: Number, default: 0 },
  failure_count: { type: Number, default: 0 },
  error_description: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  created_at: { type: Date, default: Date.now }
});

const models = {
  ChartOfAccounts: mongoose.model('ChartOfAccounts', ChartOfAccountsSchema),
  JournalEntries: mongoose.model('JournalEntries', JournalEntriesSchema),
  Invoices: mongoose.model('Invoices', InvoicesSchema),
  BudgetPlanner: mongoose.model('BudgetPlanner', BudgetPlannerSchema),
  ExpenseTracker: mongoose.model('ExpenseTracker', ExpenseTrackerSchema),
  Approvals: mongoose.model('Approvals', ApprovalsSchema),
  TaxCompliance: mongoose.model('TaxCompliance', TaxComplianceSchema),
  Statements: mongoose.model('Statements', StatementsSchema),
  EmployeeDirectory: mongoose.model('EmployeeDirectory', EmployeeDirectorySchema),
  LeaveManagement: mongoose.model('LeaveManagement', LeaveManagementSchema),
  Recruitment: mongoose.model('Recruitment', RecruitmentSchema),
  Performance: mongoose.model('Performance', PerformanceSchema),
  Onboarding: mongoose.model('Onboarding', OnboardingSchema),
  Attendance: mongoose.model('Attendance', AttendanceSchema),
  Products: mongoose.model('Products', ProductsSchema),
  BatchTracking: mongoose.model('BatchTracking', BatchTrackingSchema),
  Warehouses: mongoose.model('Warehouses', WarehousesSchema),
  StockMovements: mongoose.model('StockMovements', StockMovementsSchema),
  BarcodeScanner: mongoose.model('BarcodeScanner', BarcodeScannerSchema),
  ProductionBatches: mongoose.model('ProductionBatches', ProductionBatchesSchema),
  ManufacturingWorkOrders: mongoose.model('ManufacturingWorkOrders', ManufacturingWorkOrdersSchema),
  BillOfMaterials: mongoose.model('BillOfMaterials', BillOfMaterialsSchema),
  Machines: mongoose.model('Machines', MachinesSchema),
  DowntimeLogs: mongoose.model('DowntimeLogs', DowntimeLogsSchema),
  ProductionReports: mongoose.model('ProductionReports', ProductionReportsSchema),
  Suppliers: mongoose.model('Suppliers', SuppliersSchema),
  PurchaseOrders: mongoose.model('PurchaseOrders', PurchaseOrdersSchema),
  RFQs: mongoose.model('RFQs', RFQsSchema),
  VendorEvaluations: mongoose.model('VendorEvaluations', VendorEvaluationsSchema),
  Contracts: mongoose.model('Contracts', ContractsSchema),
  Customers: mongoose.model('Customers', CustomersSchema),
  LeadPipeline: mongoose.model('LeadPipeline', LeadPipelineSchema),
  SalesForecast: mongoose.model('SalesForecast', SalesForecastSchema),
  Opportunities: mongoose.model('Opportunities', OpportunitiesSchema),
  Activities: mongoose.model('Activities', ActivitiesSchema),
  SalaryStructures: mongoose.model('SalaryStructures', SalaryStructuresSchema),
  Payslips: mongoose.model('Payslips', PayslipsSchema),
  TimeTracking: mongoose.model('TimeTracking', TimeTrackingSchema),
  FixedAssets: mongoose.model('FixedAssets', FixedAssetsSchema),
  Projects: mongoose.model('Projects', ProjectsSchema),
  ProjectTasks: mongoose.model('ProjectTasks', ProjectTasksSchema),
  Carriers: mongoose.model('Carriers', CarriersSchema),
  Routes: mongoose.model('Routes', RoutesSchema),
  Shipments: mongoose.model('Shipments', ShipmentsSchema),
  SupplyChainWorkOrders: mongoose.model('SupplyChainWorkOrders', SupplyChainWorkOrdersSchema),
  EcommerceProducts: mongoose.model('EcommerceProducts', EcommerceProductsSchema),
  EcommerceCart: mongoose.model('EcommerceCart', EcommerceCartSchema),
  EcommerceOrders: mongoose.model('EcommerceOrders', EcommerceOrdersSchema),
  EcommercePayments: mongoose.model('EcommercePayments', EcommercePaymentsSchema),
  AnalyticsReports: mongoose.model('AnalyticsReports', AnalyticsReportsSchema),
  BankAccounts: mongoose.model('BankAccounts', BankAccountsSchema),
  BankTransactions: mongoose.model('BankTransactions', BankTransactionsSchema),
  Loans: mongoose.model('Loans', LoansSchema),
  Campaigns: mongoose.model('Campaigns', CampaignsSchema),
  MarketingLeads: mongoose.model('MarketingLeads', MarketingLeadsSchema),
  MarketingAnalytics: mongoose.model('MarketingAnalytics', MarketingAnalyticsSchema),
  SocialMediaPosts: mongoose.model('SocialMediaPosts', SocialMediaPostsSchema),
  SecurityAlerts: mongoose.model('SecurityAlerts', SecurityAlertsSchema),
  AccessLogs: mongoose.model('AccessLogs', AccessLogsSchema),
  UserActivity: mongoose.model('UserActivity', UserActivitySchema),
  Compliance: mongoose.model('Compliance', ComplianceSchema),
  MigrationHub: mongoose.model('MigrationHub', MigrationHubSchema),
  RPAAutomations: mongoose.model('RPAAutomations', RPAAutomationsSchema)
};

async function createCollections() {
  const uri = "mongodb+srv://erp_db:Naveen16523%40%23%24@cluster0.wu2gznn.mongodb.net/?appName=Cluster0";
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected successfully.');
  
  for (const modelName of Object.keys(models)) {
    const model = models[modelName];
    try {
      await model.createCollection();
      console.log('Created collection for', modelName, '(', model.collection.name, ')');
    } catch (e) {
      if (e.code === 48) {
        console.log('Collection already exists for', modelName);
      } else {
        console.error('Error creating collection for', modelName, e.message);
      }
    }
  }
  
  await mongoose.disconnect();
  console.log('Database collections initialized successfully.');
}

createCollections().catch(console.error);
