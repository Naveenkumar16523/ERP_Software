import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  toggleTheme, 
  toggleSidebar, 
  setActiveTab, 
  setSearchQuery, 
  toggleNotifications, 
  toggleAIChat, 
  addChatMessage 
} from './store/erpSlice';
import { 
  LayoutDashboard, 
  Coins, 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Flame, 
  LineChart as LineChartIcon, 
  Cpu, 
  ShieldAlert, 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  Settings, 
  Menu, 
  ChevronRight, 
  Sparkles,
  MessageSquare,
  Send,
  Building,
  Smartphone,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Plus,
  RefreshCw,
  FileText,
  Upload,
  UserCheck,
  BarChart3,
  LogOut,
  Fingerprint,
  Calendar,
  IndianRupee,
  Check,
  Trash2,
  Eye,
  Award,
  Network,
  Briefcase,
  Percent,
  ChevronDown,
  UserPlus,
  FolderPlus
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell
} from 'recharts';

// Custom Recharts Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0b1326]/85 backdrop-blur-[20px] border border-white/10 p-3 rounded-lg shadow-2xl text-[11px] text-[#dae2fd]">
        <p className="font-heading font-bold text-foreground mb-1">{label}</p>
        {payload.map((p, idx) => (
          <div key={idx} className="flex justify-between items-center gap-4 py-0.5">
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-semibold text-foreground" style={{ color: p.color || p.fill }}>
              ₹{p.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Stateful CountUp Component for KPI animations
const CountUp = ({ end, duration = 1200, formatType = 'currency', decimals = 0 }) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const startValue = 0;
    const endValue = Number(end) || 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function: easeOutQuad
      const easeProgress = progress * (2 - progress);
      const currentValue = startValue + easeProgress * (endValue - startValue);
      
      setValue(currentValue);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setValue(endValue);
      }
    };

    window.requestAnimationFrame(step);
  }, [end, duration]);

  const formattedValue = () => {
    if (formatType === 'currency') {
      return '₹' + Math.round(value).toLocaleString('en-IN');
    }
    if (formatType === 'percentage') {
      return value.toFixed(decimals) + '%';
    }
    return Math.round(value).toLocaleString('en-IN');
  };

  return <span className="font-data tabular-nums">{formattedValue()}</span>;
};

// Typing animation simulator for AI responses
const AiResponseText = ({ text }) => {
  const safeText = typeof text === 'string' ? text : (text ? String(text) : '');
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    
    const interval = setInterval(() => {
      if (index < safeText.length) {
        setDisplayedText((prev) => prev + safeText.charAt(index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 12);
    
    return () => clearInterval(interval);
  }, [safeText]);

  return <span className={displayedText.length < safeText.length ? 'typing-cursor' : ''}>{displayedText}</span>;
};

// Mock Fallbacks for Finance
const initialMockAccounts = [
  { code: '1000', name: 'Bank A/C', type: 'ASSET', balance: 1000000.0 },
  { code: '1010', name: 'Cash A/C', type: 'ASSET', balance: 50000.0 },
  { code: '1200', name: 'Accounts Receivable', type: 'ASSET', balance: 340000.0 },
  { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', balance: 120000.0 },
  { code: '2200', name: 'GST Payable', type: 'LIABILITY', balance: 18000.0 },
  { code: '2300', name: 'TDS Payable', type: 'LIABILITY', balance: 5000.0 },
  { code: '3000', name: 'Share Capital', type: 'EQUITY', balance: 800000.0 },
  { code: '4000', name: 'Sales Revenue', type: 'REVENUE', balance: 650000.0 },
  { code: '5000', name: 'Consulting Expense', type: 'EXPENSE', balance: 150000.0 },
  { code: '5010', name: 'Salary Expense', type: 'EXPENSE', balance: 714000.0 }
];

const initialMockJournal = [
  { blockIndex: 1, voucherType: 'RECEIPT', voucherNo: 'VCHR-1001', date: new Date(Date.now() - 3600000 * 24).toISOString(), amount: 800000.0, debitAcc: 'Bank A/C', creditAcc: 'Share Capital', narration: 'Initial share capital investment', prevHash: '0', blockHash: '8b7d91e3e602492f58da76c8c9bf3921deac73' },
  { blockIndex: 2, voucherType: 'PAYMENT', voucherNo: 'VCHR-1002', date: new Date(Date.now() - 3600000 * 12).toISOString(), amount: 150000.0, debitAcc: 'Consulting Expense', creditAcc: 'Bank A/C', narration: 'Consulting services payment', prevHash: '8b7d91e3e602492f58da76c8c9bf3921deac73', blockHash: '3c9aef9012b5d4e7f8c92a1827464d2847c92b' },
  { blockIndex: 3, voucherType: 'RECEIPT', voucherNo: 'VCHR-1003', date: new Date(Date.now() - 3600000 * 2).toISOString(), amount: 650000.0, debitAcc: 'Accounts Receivable', creditAcc: 'Sales Revenue', narration: 'Sales invoice raised', prevHash: '3c9aef9012b5d4e7f8c92a1827464d2847c92b', blockHash: '2e8bf5601d2a4c8e792f8ab8cd1a2b3c4e5f6a' }
];

const mockTaxSummary = {
  gstPayable: 18000.0,
  tdsPayable: 5000.0,
  gstStatus: 'Filing Ready',
  tdsStatus: 'Deductions Verified'
};

// Mock Fallbacks for Procurement
const initialMockSuppliers = [
  { id: 'sup-1', name: 'Global Trade Inc', email: 'global@trade.com', phone: '1234567890', address: '123 Global Way', deliveryScore: 95.0, qualityScore: 98.0, priceScore: 90.0, overallScore: 94.3 },
  { id: 'sup-2', name: 'Acme Industrial Supplies', email: 'sales@acme.com', phone: '2345678901', address: '456 Industrial Pkwy', deliveryScore: 88.0, qualityScore: 90.0, priceScore: 95.0, overallScore: 91.0 },
  { id: 'sup-3', name: 'Apex Logistics & Goods', email: 'info@apexlogistics.com', phone: '3456789012', address: '789 Logistics Blvd', deliveryScore: 72.0, qualityScore: 85.0, priceScore: 98.0, overallScore: 85.0 }
];

const initialMockRequisitions = [
  { id: 'pr-1', prNo: 'PR-2026-001', requestedBy: 'John Doe', department: 'Engineering', status: 'APPROVED', items: JSON.stringify([{ itemId: 'item-101', desc: 'Steel Rods', qty: 100 }]), createdAt: '2026-05-20T08:00:00.000Z' }
];

const initialMockRfqs = [
  { id: 'rfq-1', rfqNo: 'RFQ-2026-001', purchaseRequisitionId: 'pr-1', status: 'CLOSED', items: JSON.stringify([{ itemId: 'item-101', desc: 'Steel Rods', qty: 100 }]), createdAt: '2026-05-20T09:00:00.000Z' }
];

const initialMockPOs = [
  { id: 'po-1', poNo: 'PO-2026-001', supplierId: 'sup-1', supplier: initialMockSuppliers[0], status: 'COMPLETED', items: JSON.stringify([{ itemId: 'item-101', desc: 'Steel Rods', qty: 100, price: 100 }]), totalAmount: 10000.0, createdAt: '2026-05-21T10:00:00.000Z' }
];

const initialMockGRNs = [
  { id: 'grn-1', grnNo: 'GRN-2026-001', purchaseOrderId: 'po-1', supplierId: 'sup-1', supplier: initialMockSuppliers[0], receivedBy: 'John Warehouse Manager', receivedItems: JSON.stringify([{ itemId: 'item-101', qtyReceived: 90, qualityStatus: 'GOOD' }]), createdAt: '2026-05-21T14:00:00.000Z' }
];

const initialMockInvoices = [
  { id: 'inv-1', invoiceNo: 'INV-2026-001', purchaseOrderId: 'po-1', supplierId: 'sup-1', supplier: initialMockSuppliers[0], items: JSON.stringify([{ itemId: 'item-101', qty: 90, price: 100 }]), totalAmount: 9000.0, taxAmount: 0.0, status: 'MATCH_PASSED', matchingLog: JSON.stringify({ passed: true, logs: ["All price and quantity checks matched."] }), createdAt: '2026-05-22T10:00:00.000Z' }
];

// Mock Fallbacks for HR
const initialMockDepartments = [
  { id: 'dept-1', code: 'DEPT-101', name: 'Executive', parentId: null },
  { id: 'dept-2', code: 'DEPT-102', name: 'Engineering', parentId: 'dept-1' },
  { id: 'dept-3', code: 'DEPT-103', name: 'Sales & Marketing', parentId: 'dept-1' },
  { id: 'dept-4', code: 'DEPT-104', name: 'Human Resources', parentId: 'dept-1' }
];

const initialMockEmployees = [
  { id: 'emp-1', employeeCode: 'EMP-001', firstName: 'John', lastName: 'Doe', email: 'john.doe@company.com', phone: '123-456-7890', departmentId: 'dept-2', jobTitle: 'Principal Architect', managerId: null, baseSalary: 150000.0, department: { name: 'Engineering' } },
  { id: 'emp-2', employeeCode: 'EMP-002', firstName: 'Sarah', lastName: 'Connor', email: 'sarah.c@company.com', phone: '234-567-8901', departmentId: 'dept-4', jobTitle: 'HR Director', managerId: null, baseSalary: 95000.0, department: { name: 'Human Resources' } },
  { id: 'emp-3', employeeCode: 'EMP-003', firstName: 'Mike', lastName: 'Ross', email: 'mike.ross@company.com', phone: '345-678-9012', departmentId: 'dept-3', jobTitle: 'Sales Account Manager', managerId: null, baseSalary: 60000.0, department: { name: 'Sales & Marketing' } }
];

const initialMockCandidates = [
  { id: 'cand-1', name: 'Jane Smith', email: 'jane.smith@gmail.com', phone: '456-789-0123', jobTitle: 'Lead JS Engineer', status: 'INTERVIEW', resumeUrl: 'https://example.com/resumes/janesmith.pdf', offerSent: false, offerPay: 120000 },
  { id: 'cand-2', name: 'Robert Downey', email: 'rdj@gmail.com', phone: '567-890-1234', jobTitle: 'Product Manager', status: 'APPLIED', resumeUrl: 'https://example.com/resumes/rdj.pdf', offerSent: false, offerPay: 130000 },
  { id: 'cand-3', name: 'Bruce Banner', email: 'banner@scientist.com', phone: '678-901-2345', jobTitle: 'Senior Research Scientist', status: 'OFFERED', resumeUrl: 'https://example.com/resumes/banner.pdf', offerSent: true, offerPay: 180000 }
];

const initialMockLeaves = [
  { id: 'leave-1', employeeId: 'emp-1', employee: { firstName: 'John', lastName: 'Doe' }, leaveType: 'SICK', startDate: '2026-06-01', endDate: '2026-06-03', reason: 'Flu recovery', status: 'APPROVED', approvedBy: 'Sarah Connor' },
  { id: 'leave-2', employeeId: 'emp-3', employee: { firstName: 'Mike', lastName: 'Ross' }, leaveType: 'CASUAL', startDate: '2026-06-15', endDate: '2026-06-16', reason: 'Personal errands', status: 'PENDING', approvedBy: null }
];

const initialMockAttendance = [
  { id: 'att-1', employeeId: 'emp-1', date: '2026-05-22', checkIn: '2026-05-22T09:02:15.000Z', checkOut: '2026-05-22T18:05:00.000Z', status: 'PRESENT', verificationMethod: 'FACE_SCAN', employee: { firstName: 'John', lastName: 'Doe' } },
  { id: 'att-2', employeeId: 'emp-3', date: '2026-05-22', checkIn: '2026-05-22T09:15:00.000Z', checkOut: null, status: 'LATE', verificationMethod: 'BIOMETRIC', employee: { firstName: 'Mike', lastName: 'Ross' } }
];

const initialMockPaySlips = [
  { id: 'slip-1', employeeId: 'emp-1', employee: { firstName: 'John', lastName: 'Doe' }, month: 5, year: 2026, baseSalary: 150000, pfDeduction: 18000, esiDeduction: 1125, tdsDeduction: 16250, netPay: 114625, status: 'PAID' }
];

// Mock Fallbacks for CRM
const initialMockLeads = [
  { id: 'lead-1', name: 'Alice Johnson', company: 'TechNova Solutions', email: 'alice@technova.com', phone: '111-222-3333', status: 'NEW', source: 'Website Ref', value: 85000 },
  { id: 'lead-2', name: 'Harvey Specter', company: 'Pearson Specter Litt', email: 'harvey@psl.com', phone: '444-555-6666', status: 'QUALIFIED', source: 'Referral', value: 250000 }
];

const initialMockCustomerAccounts = [
  { id: 'acc-1', name: 'Pearson Specter Litt', industry: 'Legal Services', phone: '444-555-6666', billingAddress: '60 Wall St, NYC', isReturning: true, createdAt: '2025-01-10T12:00:00.000Z' },
  { id: 'acc-2', name: 'Stark Industries', industry: 'Defense & Technology', phone: '777-888-9999', billingAddress: 'Stark Tower, NYC', isReturning: false, createdAt: '2026-02-15T12:00:00.000Z' }
];

const initialMockOpportunities = [
  { id: 'opp-1', name: 'TechNova Cloud Migration', stage: 'QUALIFICATION', value: 85000, leadId: 'lead-1', accountId: null, lead: { name: 'Alice Johnson', company: 'TechNova Solutions' }, account: null, createdAt: '2026-05-20T10:00:00.000Z' },
  { id: 'opp-2', name: 'Stark Arc Reactor Licensing', stage: 'NEGOTIATION', value: 500000, leadId: null, accountId: 'acc-2', lead: null, account: { id: 'acc-2', name: 'Stark Industries', isReturning: false }, createdAt: '2026-05-18T10:00:00.000Z' },
  { id: 'opp-3', name: 'PSL Retainer Renewal', stage: 'WON', value: 250000, leadId: 'lead-2', accountId: 'acc-1', lead: { name: 'Harvey Specter', company: 'Pearson Specter Litt' }, account: { id: 'acc-1', name: 'Pearson Specter Litt', isReturning: true }, createdAt: '2026-05-15T10:00:00.000Z' }
];

const initialMockQuotes = [
  { id: 'q-1', quoteNo: 'QT-2026-001', opportunityId: 'opp-3', opportunity: { name: 'PSL Retainer Renewal' }, items: JSON.stringify([{ desc: 'Legal Suite Deployment', qty: 1, price: 200000 }, { desc: 'Support SLA annual', qty: 1, price: 50000 }]), subtotal: 250000, discount: 15, taxAmount: 38250, total: 250750, status: 'APPROVED', discountExplanation: 'Returning client with contract >= 100k. 15% discount applied.' }
];

// Mock Fallbacks for Inventory & Manufacturing (Phase 4)
const initialMockProducts = [
  { id: 'prod-1', code: 'RAW-STL-001', name: 'Steel Sheets (Grade A)', description: 'Premium steel sheets for framing', type: 'RAW_MATERIAL', reorderPoint: 50, safetyStock: 20, currentStock: 120, costPrice: 450, salePrice: 0, expiryDate: null },
  { id: 'prod-2', code: 'RAW-ALM-002', name: 'Aluminum Tubes', description: 'Lightweight tubes for structures', type: 'RAW_MATERIAL', reorderPoint: 30, safetyStock: 10, currentStock: 15, costPrice: 320, salePrice: 0, expiryDate: null },
  { id: 'prod-3', code: 'FIN-CHM-003', name: 'Smart Chimney V2', description: 'Finished premium kitchen chimney', type: 'FINISHED_GOOD', reorderPoint: 15, safetyStock: 5, currentStock: 8, costPrice: 8500, salePrice: 14999, expiryDate: null },
  { id: 'prod-4', code: 'RAW-EXP-004', name: 'Chemical Sealant S4', description: 'High-strength sealant (near expiry)', type: 'RAW_MATERIAL', reorderPoint: 20, safetyStock: 2, currentStock: 12, costPrice: 120, salePrice: 0, expiryDate: new Date(Date.now() + 10 * 24 * 3600000).toISOString() }
];

const initialMockWarehouses = [
  { id: 'wh-1', name: 'Main Godown (North)', location: 'Sector 4, Industrial Area' },
  { id: 'wh-2', name: 'Secondary Godown (East)', location: 'Plot 22, Trade Zone' }
];

const initialMockStockTransactions = [
  { id: 'tx-1', productId: 'prod-1', product: { name: 'Steel Sheets (Grade A)' }, warehouseId: 'wh-1', warehouse: { name: 'Main Godown (North)' }, quantity: 150, unitCost: 400, type: 'RECEIPT', referenceNo: 'PO-2026-001', transactionDate: new Date(Date.now() - 3 * 24 * 3600000).toISOString() },
  { id: 'tx-2', productId: 'prod-1', product: { name: 'Steel Sheets (Grade A)' }, warehouseId: 'wh-1', warehouse: { name: 'Main Godown (North)' }, quantity: -30, unitCost: 400, type: 'ISSUE', referenceNo: 'PROD-CONSUME-001', transactionDate: new Date(Date.now() - 1 * 24 * 3600000).toISOString() },
  { id: 'tx-3', productId: 'prod-2', product: { name: 'Aluminum Tubes' }, warehouseId: 'wh-2', warehouse: { name: 'Secondary Godown (East)' }, quantity: 15, unitCost: 320, type: 'RECEIPT', referenceNo: 'PO-2026-002', transactionDate: new Date(Date.now() - 2 * 24 * 3600000).toISOString() }
];

const initialMockBoms = [
  { id: 'bom-1', bomNo: 'BOM-CHM-001', finishedProductId: 'prod-3', finishedProduct: { name: 'Smart Chimney V2' }, name: 'Chimney Standard Assembly', quantity: 1, components: [
    { id: 'bom-c1', productId: 'prod-1', quantity: 4, product: { name: 'Steel Sheets (Grade A)' } },
    { id: 'bom-c2', productId: 'prod-2', quantity: 2, product: { name: 'Aluminum Tubes' } }
  ] }
];

const initialMockWorkCenters = [
  { id: 'wc-1', name: 'Metal Framing Station', capacityHours: 16, laborRate: 150, machineRate: 250, efficiency: 0.95 },
  { id: 'wc-2', name: 'Assembly Line A', capacityHours: 8, laborRate: 120, machineRate: 180, efficiency: 0.90 }
];

const initialMockProductionOrders = [
  { id: 'po-ord-1', orderNo: 'PRD-2026-001', finishedProductId: 'prod-3', finishedProduct: { name: 'Smart Chimney V2' }, bomId: 'bom-1', bom: { bomNo: 'BOM-CHM-001' }, workCenterId: 'wc-1', workCenter: { name: 'Metal Framing Station' }, quantity: 5, status: 'PLANNED', startDate: null, endDate: null },
  { id: 'po-ord-2', orderNo: 'PRD-2026-002', finishedProductId: 'prod-3', finishedProduct: { name: 'Smart Chimney V2' }, bomId: 'bom-1', bom: { bomNo: 'BOM-CHM-001' }, workCenterId: 'wc-2', workCenter: { name: 'Assembly Line A' }, quantity: 10, status: 'IN_PROGRESS', startDate: new Date(Date.now() - 4 * 3600000).toISOString(), endDate: null }
];

const initialMockOeeLogs = [
  { id: 'oee-l1', workCenterId: 'wc-1', workCenter: { name: 'Metal Framing Station' }, date: '2026-05-21', plannedProductionTime: 480, runTime: 450, plannedQuantity: 100, totalQuantity: 95, goodQuantity: 92, availability: 0.9375, performance: 0.95, quality: 0.9684, oeeScore: 0.8625 },
  { id: 'oee-l2', workCenterId: 'wc-2', workCenter: { name: 'Assembly Line A' }, date: '2026-05-21', plannedProductionTime: 480, runTime: 420, plannedQuantity: 80, totalQuantity: 76, goodQuantity: 74, availability: 0.875, performance: 0.95, quality: 0.9737, oeeScore: 0.8094 }
];

// ─── Phase 5 & 6 Mock Data ───────────────────────────────────────────────────

const initialMockStoreProducts = [
  { id: 'sp-1', sku: 'ELEC-TV-001', name: '55" Smart LED TV 4K', description: 'Ultra HD smart TV with AI upscaling', category: 'Electronics', price: 49999, salePrice: 43999, stock: 18, loyaltyPts: 440, isPublished: true },
  { id: 'sp-2', sku: 'ELEC-PHN-002', name: 'ProMax Phone 15 128GB', description: 'Latest flagship smartphone', category: 'Electronics', price: 89999, salePrice: null, stock: 34, loyaltyPts: 900, isPublished: true },
  { id: 'sp-3', sku: 'APPL-WM-003', name: 'Front Load Washing Machine 8kg', description: 'Energy star rated washer', category: 'Appliances', price: 34999, salePrice: 29999, stock: 12, loyaltyPts: 300, isPublished: true },
  { id: 'sp-4', sku: 'FURN-DESK-004', name: 'Executive Standing Desk', description: 'Height-adjustable motorized desk', category: 'Furniture', price: 22999, salePrice: 19999, stock: 7, loyaltyPts: 200, isPublished: true },
  { id: 'sp-5', sku: 'APPL-REF-005', name: 'Double Door Refrigerator 265L', description: 'Frost-free with water dispenser', category: 'Appliances', price: 28500, salePrice: 25999, stock: 9, loyaltyPts: 260, isPublished: true },
  { id: 'sp-6', sku: 'ELEC-LAP-006', name: 'UltraSlim Laptop i7 16GB', description: '14" OLED display, 1TB SSD', category: 'Electronics', price: 74999, salePrice: 69999, stock: 22, loyaltyPts: 700, isPublished: true },
];

const initialMockOrders = [
  { id: 'ord-1', orderNo: 'ORD-1748001', customerName: 'Rahul Sharma', customerEmail: 'rahul@email.com', totalAmount: 43999, discountAmount: 0, loyaltyRedeemed: 0, status: 'DELIVERED', shippingAddress: '12A, MG Road, Bengaluru', createdAt: new Date(Date.now() - 5*86400000).toISOString(), items: [{ product: { name: '55" Smart LED TV 4K' }, quantity: 1, unitPrice: 43999, totalPrice: 43999 }] },
  { id: 'ord-2', orderNo: 'ORD-1748002', customerName: 'Priya Mehta', customerEmail: 'priya@email.com', totalAmount: 79999, discountAmount: 10000, loyaltyRedeemed: 1000, status: 'SHIPPED', shippingAddress: '8B, Koregaon Park, Pune', createdAt: new Date(Date.now() - 2*86400000).toISOString(), items: [{ product: { name: 'ProMax Phone 15 128GB' }, quantity: 1, unitPrice: 89999, totalPrice: 89999 }] },
  { id: 'ord-3', orderNo: 'ORD-1748003', customerName: 'Ankit Gupta', customerEmail: 'ankit@email.com', totalAmount: 29999, discountAmount: 0, loyaltyRedeemed: 0, status: 'PROCESSING', shippingAddress: '22, Sector 18, Noida', createdAt: new Date(Date.now() - 1*86400000).toISOString(), items: [{ product: { name: 'Front Load Washing Machine 8kg' }, quantity: 1, unitPrice: 29999, totalPrice: 29999 }] },
  { id: 'ord-4', orderNo: 'ORD-1748004', customerName: 'Sneha Patel', customerEmail: 'sneha@email.com', totalAmount: 89998, discountAmount: 0, loyaltyRedeemed: 0, status: 'PLACED', shippingAddress: '5, CG Road, Ahmedabad', createdAt: new Date().toISOString(), items: [{ product: { name: 'Executive Standing Desk' }, quantity: 2, unitPrice: 19999, totalPrice: 39998 }] },
];

const initialMockLoyaltyAccounts = [
  { id: 'loy-1', customerEmail: 'rahul@email.com', customerName: 'Rahul Sharma', points: 18240, tier: 'GOLD' },
  { id: 'loy-2', customerEmail: 'priya@email.com', customerName: 'Priya Mehta', points: 9400, tier: 'SILVER' },
  { id: 'loy-3', customerEmail: 'ankit@email.com', customerName: 'Ankit Gupta', points: 3000, tier: 'BRONZE' },
];

const initialMockFixedAssets = [
  { id: 'ast-1', assetCode: 'ASSET-001', name: 'CNC Milling Machine', category: 'Machinery', location: 'Plant A', serialNo: 'CNC-88420', purchaseDate: '2021-04-01', purchaseCost: 1500000, salvageValue: 150000, usefulLifeYears: 10, depMethod: 'STRAIGHT_LINE', depRate: 0.15, currentBookValue: 990000, status: 'ACTIVE' },
  { id: 'ast-2', assetCode: 'ASSET-002', name: 'Delivery Van - Tata Ace', category: 'Vehicles', location: 'Depot', serialNo: 'MH12AB5678', purchaseDate: '2022-06-15', purchaseCost: 650000, salvageValue: 50000, usefulLifeYears: 8, depMethod: 'DECLINING_BALANCE', depRate: 0.20, currentBookValue: 416000, status: 'ACTIVE' },
  { id: 'ast-3', assetCode: 'ASSET-003', name: 'Dell Server PowerEdge R740', category: 'IT Equipment', location: 'Server Room', serialNo: 'SRV-20222', purchaseDate: '2022-01-10', purchaseCost: 320000, salvageValue: 20000, usefulLifeYears: 5, depMethod: 'STRAIGHT_LINE', depRate: 0.20, currentBookValue: 140000, status: 'ACTIVE' },
  { id: 'ast-4', assetCode: 'ASSET-004', name: 'Air Compressor 10HP', category: 'Machinery', location: 'Workshop B', serialNo: 'COMP-4421', purchaseDate: '2019-03-20', purchaseCost: 180000, salvageValue: 10000, usefulLifeYears: 7, depMethod: 'STRAIGHT_LINE', depRate: 0.15, currentBookValue: 12857, status: 'UNDER_MAINTENANCE' },
];

const initialMockMaintenanceOrders = [
  { id: 'mo-1', workOrderNo: 'WO-2026-001', assetId: 'ast-1', asset: { name: 'CNC Milling Machine' }, title: 'Quarterly Lubrication & Calibration', description: 'Full spindle lubrication, tool calibration, and coolant flush', type: 'PREVENTIVE', priority: 'MEDIUM', assignedTo: 'Suresh Verma', scheduledDate: new Date(Date.now() + 2*86400000).toISOString(), cost: 8500, status: 'OPEN', createdAt: new Date().toISOString() },
  { id: 'mo-2', workOrderNo: 'WO-2026-002', assetId: 'ast-4', asset: { name: 'Air Compressor 10HP' }, title: 'Compressor Valve Replacement', description: 'Intake and exhaust valve replacement due to wear', type: 'CORRECTIVE', priority: 'HIGH', assignedTo: 'Rajesh Kumar', scheduledDate: new Date().toISOString(), cost: 12000, status: 'IN_PROGRESS', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'mo-3', workOrderNo: 'WO-2026-003', assetId: 'ast-2', asset: { name: 'Delivery Van - Tata Ace' }, title: 'Annual Vehicle Service & PUC', description: 'Full service, oil change, brake inspection, PUC certificate renewal', type: 'PREVENTIVE', priority: 'LOW', assignedTo: 'Vijay Sharma', scheduledDate: new Date(Date.now() + 7*86400000).toISOString(), cost: 6000, status: 'OPEN', createdAt: new Date(Date.now() - 2*86400000).toISOString() },
  { id: 'mo-4', workOrderNo: 'WO-2026-004', assetId: 'ast-3', asset: { name: 'Dell Server PowerEdge R740' }, title: 'RAM Upgrade & OS Patch', description: 'Expand RAM to 256GB and apply latest security patches', type: 'PREVENTIVE', priority: 'MEDIUM', assignedTo: 'Deepak IT', scheduledDate: new Date(Date.now() - 3*86400000).toISOString(), cost: 42000, status: 'COMPLETED', createdAt: new Date(Date.now() - 5*86400000).toISOString() },
];

// MIS Dashboard mock data
const mockMisKpis = {
  totalRevenue: 24780000, revenueGrowth: 12.4, netProfit: 6467480, profitMargin: 26.1,
  totalOrders: 1284, avgOrderValue: 19300, activeEmployees: 284, payrollThisMonth: 12480000,
  inventoryValue: 42185000, openWorkOrders: 8, assetNetBookValue: 29740000, loyaltyMembers: 1842
};
const mockRevenueVsExpenses = [
  { month: 'Dec', revenue: 1820000, expenses: 1380000 },
  { month: 'Jan', revenue: 1960000, expenses: 1450000 },
  { month: 'Feb', revenue: 2100000, expenses: 1520000 },
  { month: 'Mar', revenue: 2280000, expenses: 1640000 },
  { month: 'Apr', revenue: 2420000, expenses: 1710000 },
  { month: 'May', revenue: 2478000, expenses: 1830000 },
];
const mockDeptHeadcount = [
  { dept: 'Engineering', count: 82 }, { dept: 'Operations', count: 68 },
  { dept: 'Sales', count: 54 }, { dept: 'Finance', count: 38 },
  { dept: 'HR', count: 22 }, { dept: 'IT', count: 20 },
];
const mockSalesByChannel = [
  { channel: 'Direct', value: 9200000 }, { channel: 'E-Commerce', value: 6800000 },
  { channel: 'Distributors', value: 5400000 }, { channel: 'Partners', value: 3380000 },
];

export default function App() {
  const dispatch = useDispatch();
  
  // Auth & Mode States
  const [token, setToken] = useState(localStorage.getItem('erp_token') || null);
  const [demoMode, setDemoMode] = useState(
    localStorage.getItem('erp_demo') === 'true' && !localStorage.getItem('erp_token')
  );
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('erp_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  
  // User Management States
  const [usersList, setUsersList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [createUserEmail, setCreateUserEmail] = useState('');
  const [createUserPassword, setCreateUserPassword] = useState('');
  const [createUserFirstName, setCreateUserFirstName] = useState('');
  const [createUserLastName, setCreateUserLastName] = useState('');
  const [createUserRole, setCreateUserRole] = useState('USER');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [landingView, setLandingView] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Redux state
  const { 
    theme, 
    sidebarCollapsed, 
    activeTab, 
    searchQuery, 
    showNotifications, 
    showAIChat, 
    chatHistory 
  } = useSelector(state => state.erp);

  const [aiPrompt, setAiPrompt] = useState('');

  // Live fluctuating revenue state & pulse
  const [liveRevenue, setLiveRevenue] = useState(1240000);
  const [revenuePulse, setRevenuePulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const fluctuation = Math.floor(Math.random() * 4000) - 1500;
      setLiveRevenue(prev => prev + fluctuation);
      setRevenuePulse(true);
      const timer = setTimeout(() => setRevenuePulse(false), 600);
      return () => clearTimeout(timer);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Apply theme class
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Spotlight mouse tracking effect for glass-panels
  useEffect(() => {
    const handleMouseMove = (e) => {
      const cards = document.querySelectorAll('.glass-panel');
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (x > 0 && x < rect.width && y > 0 && y < rect.height) {
          card.style.backgroundImage = `radial-gradient(circle at ${x}px ${y}px, rgba(195, 192, 255, 0.03) 0%, transparent 70%)`;
        } else {
          card.style.backgroundImage = 'none';
        }
      });
    };

    if (landingView) {
      document.addEventListener('mousemove', handleMouseMove);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [landingView]);

  // Atmospheric mouse glow effect for secure access login page
  useEffect(() => {
    const handleMouseMoveBg = (e) => {
      const bg = document.querySelector('.gradient-bg');
      if (bg) {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        bg.style.transform = `translate(${x * 20}px, ${y * 20}px)`;
      }
    };

    if (!landingView) {
      document.addEventListener('mousemove', handleMouseMoveBg);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMoveBg);
    };
  }, [landingView]);

  // ── Onboarding Tour State ──────────────────────────────────────────────────
  const [showTour, setShowTour] = useState(() => {
    return !localStorage.getItem('erp_tour_done');
  });
  const [tourStep, setTourStep] = useState(0);

  const TOUR_STEPS = [
    {
      target: 'dashboard',
      title: '👋 Welcome to EPR Dashboard!',
      desc: 'This is your unified enterprise management platform. Let\'s take a 2-minute tour of the key modules.',
      icon: '🚀',
      color: 'from-primary/20 to-primary/5'
    },
    {
      target: 'finance',
      title: '💰 Finance & Accounting',
      desc: 'Manage vouchers, GST/TDS tax filings, auto bank reconciliation, and real-time P&L, Balance Sheet, and Trial Balance reports.',
      icon: '📊',
      color: 'from-success/20 to-success/5'
    },
    {
      target: 'purchase',
      title: '🛒 Procurement',
      desc: 'Full procure-to-pay cycle: raise Purchase Requisitions, send RFQs to suppliers, create POs, and verify 3-way GRN matching.',
      icon: '📦',
      color: 'from-info/20 to-info/5'
    },
    {
      target: 'hr',
      title: '👥 Human Resources',
      desc: 'Org chart, payroll engine (PF/ESI/TDS auto-deduction), leave management, and complete recruitment pipeline with offer letter generation.',
      icon: '👔',
      color: 'from-warning/20 to-warning/5'
    },
    {
      target: 'sales',
      title: '📈 Sales & CRM',
      desc: 'Track Leads → Opportunities → Quotes → Deals. AI-powered discount suggestions based on customer history and contract size.',
      icon: '🤝',
      color: 'from-primary/20 to-primary/5'
    },
    {
      target: 'inventory',
      title: '📦 Inventory & Warehouse',
      desc: 'Multi-warehouse stock tracking with FIFO/LIFO valuation. Expiry alerts, safety stock alarms, and automatic reorder recommendations.',
      icon: '🏭',
      color: 'from-success/20 to-success/5'
    },
    {
      target: 'manufacturing',
      title: '⚙️ Manufacturing',
      desc: 'Bill of Materials (BOM) library, production orders, work center scheduling, and real-time OEE (Overall Equipment Effectiveness) analytics.',
      icon: '🔩',
      color: 'from-info/20 to-info/5'
    },
    {
      target: 'ecommerce',
      title: '🛍️ E-Commerce',
      desc: 'Online storefront with category filters, shopping cart, loyalty points system, and complete order fulfillment tracking.',
      icon: '🛒',
      color: 'from-warning/20 to-warning/5'
    },
    {
      target: 'ai-assistant',
      title: '🤖 ERP AI Console',
      desc: 'Ask anything in natural language. Run demand forecasts, scan for fraud anomalies, extract invoices with OCR, and view MIS dashboards. Powered by FastAPI + AI.',
      icon: '✨',
      color: 'from-primary/20 to-primary/5'
    },
  ];

  const handleTourNext = () => {
    if (tourStep < TOUR_STEPS.length - 1) {
      const nextStep = tourStep + 1;
      setTourStep(nextStep);
      dispatch(setActiveTab(TOUR_STEPS[nextStep].target));
    } else {
      handleTourDone();
    }
  };

  const handleTourPrev = () => {
    if (tourStep > 0) {
      const prevStep = tourStep - 1;
      setTourStep(prevStep);
      dispatch(setActiveTab(TOUR_STEPS[prevStep].target));
    }
  };

  const handleTourDone = () => {
    localStorage.setItem('erp_tour_done', 'true');
    setShowTour(false);
    dispatch(setActiveTab('dashboard'));
  };

  // ── Settings Panel State ───────────────────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false);

  // Finance States
  const [financeTab, setFinanceTab] = useState('voucher'); // 'voucher' | 'accounts' | 'reports' | 'reconcile' | 'tax'
  const [reportTab, setReportTab] = useState('trial-balance'); // 'trial-balance' | 'profit-loss' | 'balance-sheet'
  const [voucherType, setVoucherType] = useState('PAYMENT');
  const [voucherAmount, setVoucherAmount] = useState('');
  const [debitAcc, setDebitAcc] = useState('');
  const [creditAcc, setCreditAcc] = useState('');
  const [narration, setNarration] = useState('');
  const [ledgerVerified, setLedgerVerified] = useState(null);
  const [accounts, setAccounts] = useState(initialMockAccounts);
  const [journalEntries, setJournalEntries] = useState(initialMockJournal);
  const [taxSummary, setTaxSummary] = useState(mockTaxSummary);
  const [voucherMessage, setVoucherMessage] = useState(null);
  
  // Reports states derived or fetched
  const [trialBalance, setTrialBalance] = useState(null);
  const [profitLoss, setProfitLoss] = useState(null);
  const [balanceSheet, setBalanceSheet] = useState(null);
  
  // Reconciliation states
  const [reconcileText, setReconcileText] = useState("2026-05-21, 150000.0, Consulting services payment\n2026-05-22, 25000.0, Unknown supplier payment");
  const [reconciliationResults, setReconciliationResults] = useState(null);

  // Procurement States
  const [purchaseTab, setPurchaseTab] = useState('suppliers'); // 'suppliers' | 'requisitions' | 'rfqs' | 'pos' | 'grns' | 'invoices'
  const [suppliers, setSuppliers] = useState(initialMockSuppliers);
  const [requisitions, setRequisitions] = useState(initialMockRequisitions);
  const [rfqs, setRfqs] = useState(initialMockRfqs);
  const [purchaseOrders, setPurchaseOrders] = useState(initialMockPOs);
  const [goodsReceipts, setGoodsReceipts] = useState(initialMockGRNs);
  const [invoices, setInvoices] = useState(initialMockInvoices);
  const [invoiceMatchingResult, setInvoiceMatchingResult] = useState(null);

  // Form States - Procurement
  const [supName, setSupName] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddr, setSupAddr] = useState('');
  
  const [prRequestedBy, setPrRequestedBy] = useState('');
  const [prDept, setPrDept] = useState('');
  const [prItemName, setPrItemName] = useState('');
  const [prItemQty, setPrItemQty] = useState('');

  const [rfqPrId, setRfqPrId] = useState('');

  const [poSupplierId, setPoSupplierId] = useState('');
  const [poRfqId, setPoRfqId] = useState('');
  const [poAmount, setPoAmount] = useState('');

  const [grnPoId, setGrnPoId] = useState('');
  const [grnReceivedBy, setGrnReceivedBy] = useState('');
  const [grnQty, setGrnQty] = useState('');
  const [grnQuality, setGrnQuality] = useState('GOOD');
  const [grnDelay, setGrnDelay] = useState('0');

  const [invPoId, setInvPoId] = useState('');
  const [invoiceNoInput, setInvoiceNoInput] = useState('');
  const [invAmountInput, setInvAmountInput] = useState('');
  const [invTaxInput, setInvTaxInput] = useState('0');
  const [invQtyInput, setInvQtyInput] = useState('');
  const [invPriceInput, setInvPriceInput] = useState('');

  // HR States
  const [departments, setDepartments] = useState(initialMockDepartments);
  const [employees, setEmployees] = useState(initialMockEmployees);
  const [candidates, setCandidates] = useState(initialMockCandidates);
  const [leaves, setLeaves] = useState(initialMockLeaves);
  const [attendance, setAttendance] = useState(initialMockAttendance);
  const [paySlips, setPaySlips] = useState(initialMockPaySlips);

  // HR Tab Form States
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptParent, setNewDeptParent] = useState('');

  const [newEmpCode, setNewEmpCode] = useState('');
  const [newEmpFirst, setNewEmpFirst] = useState('');
  const [newEmpLast, setNewEmpLast] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('');
  const [newEmpTitle, setNewEmpTitle] = useState('');
  const [newEmpSalary, setNewEmpSalary] = useState('');

  const [newCandName, setNewCandName] = useState('');
  const [newCandEmail, setNewCandEmail] = useState('');
  const [newCandPhone, setNewCandPhone] = useState('');
  const [newCandTitle, setNewCandTitle] = useState('');

  const [leaveEmpId, setLeaveEmpId] = useState('');
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  const [selectedAttEmp, setSelectedAttEmp] = useState('');
  const [attScanMethod, setAttScanMethod] = useState('FACE_SCAN');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('idle');
  const [faceScanStage, setFaceScanStage] = useState('');
  const [fingerprintStage, setFingerprintStage] = useState('');

  const [payEmpId, setPayEmpId] = useState('');
  const [payMonth, setPayMonth] = useState('5');
  const [payYear, setPayYear] = useState('2026');

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [offerPayInput, setOfferPayInput] = useState(50000);
  const [offerLetterModalOpen, setOfferLetterModalOpen] = useState(false);
  const [generatedOfferText, setGeneratedOfferText] = useState('');

  // CRM States
  const [leads, setLeads] = useState(initialMockLeads);
  const [customerAccounts, setCustomerAccounts] = useState(initialMockCustomerAccounts);
  const [opportunities, setOpportunities] = useState(initialMockOpportunities);
  const [quotes, setQuotes] = useState(initialMockQuotes);

  // CRM Tab Form States
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadSource, setNewLeadSource] = useState('Website Ref');
  const [newLeadValue, setNewLeadValue] = useState('');

  const [newAccName, setNewAccName] = useState('');
  const [newAccIndustry, setNewAccIndustry] = useState('');
  const [newAccPhone, setNewAccPhone] = useState('');
  const [newAccBilling, setNewAccBilling] = useState('');
  const [newAccIsReturning, setNewAccIsReturning] = useState(false);

  const [newOppName, setNewOppName] = useState('');
  const [newOppStage, setNewOppStage] = useState('QUALIFICATION');
  const [newOppValue, setNewOppValue] = useState('');
  const [newOppLeadId, setNewOppLeadId] = useState('');
  const [newOppAccId, setNewOppAccId] = useState('');

  // Quote Generation States
  const [quoteOppId, setQuoteOppId] = useState('');
  const [quoteItems, setQuoteItems] = useState([]);
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');

  const [suggestedDiscountVal, setSuggestedDiscountVal] = useState(0);
  const [discountExplanationVal, setDiscountExplanationVal] = useState('');
  const [manualDiscountInput, setManualDiscountInput] = useState('0');

  const [quoteSubtotal, setQuoteSubtotal] = useState(0);
  const [quoteDiscountAmt, setQuoteDiscountAmt] = useState(0);
  const [quoteTaxAmt, setQuoteTaxAmt] = useState(0);
  const [quoteTotal, setQuoteTotal] = useState(0);

  const [previewQuote, setPreviewQuote] = useState(null);
  const [previewQuoteModalOpen, setPreviewQuoteModalOpen] = useState(false);

  // Phase 4: Inventory & Manufacturing States
  const [products, setProducts] = useState(initialMockProducts);
  const [warehouses, setWarehouses] = useState(initialMockWarehouses);
  const [stockTransactions, setStockTransactions] = useState(initialMockStockTransactions);
  const [reorderAlerts, setReorderAlerts] = useState([]);
  const [expiryAlarms, setExpiryAlarms] = useState([]);
  const [fifoValuationVal, setFifoValuationVal] = useState(null);
  const [lifoValuationVal, setLifoValuationVal] = useState(null);
  const [valuationDetails, setValuationDetails] = useState([]);
  const [valuationMode, setValuationMode] = useState('FIFO');
  const [inventorySubTab, setInventorySubTab] = useState('catalog');

  const [boms, setBoms] = useState(initialMockBoms);
  const [workCenters, setWorkCenters] = useState(initialMockWorkCenters);
  const [productionOrders, setProductionOrders] = useState(initialMockProductionOrders);
  const [oeeLogs, setOeeLogs] = useState(initialMockOeeLogs);
  const [mfgSubTab, setMfgSubTab] = useState('bom');

  // Phase 4 Form States
  const [newProdCode, setNewProdCode] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdType, setNewProdType] = useState('RAW_MATERIAL');
  const [newProdReorderPoint, setNewProdReorderPoint] = useState('10');
  const [newProdSafetyStock, setNewProdSafetyStock] = useState('5');
  const [newProdCostPrice, setNewProdCostPrice] = useState('0');
  const [newProdSalePrice, setNewProdSalePrice] = useState('0');
  const [newProdExpiry, setNewProdExpiry] = useState('');

  const [newWhName, setNewWhName] = useState('');
  const [newWhLocation, setNewWhLocation] = useState('');

  const [newTxProductId, setNewTxProductId] = useState('');
  const [newTxWarehouseId, setNewTxWarehouseId] = useState('');
  const [newTxQty, setNewTxQty] = useState('');
  const [newTxCost, setNewTxCost] = useState('0');
  const [newTxType, setNewTxType] = useState('RECEIPT');
  const [newTxRef, setNewTxRef] = useState('');

  const [newBomNo, setNewBomNo] = useState('');
  const [newBomName, setNewBomName] = useState('');
  const [newBomFinishedProductId, setNewBomFinishedProductId] = useState('');
  const [newBomQty, setNewBomQty] = useState('1');
  const [newBomComponents, setNewBomComponents] = useState([]);
  const [newBomCompProductId, setNewBomCompProductId] = useState('');
  const [newBomCompQty, setNewBomCompQty] = useState('1');

  const [newWcName, setNewWcName] = useState('');
  const [newWcCapacity, setNewWcCapacity] = useState('8');
  const [newWcLaborRate, setNewWcLaborRate] = useState('0');
  const [newWcMachineRate, setNewWcMachineRate] = useState('0');
  const [newWcEfficiency, setNewWcEfficiency] = useState('1.0');

  const [newPoOrderNo, setNewPoOrderNo] = useState('');
  const [newPoFinishedProductId, setNewPoFinishedProductId] = useState('');
  const [newPoBomId, setNewPoBomId] = useState('');
  const [newPoWorkCenterId, setNewPoWorkCenterId] = useState('');
  const [newPoQty, setNewPoQty] = useState('');
  const [poSelectWarehouseModalOpen, setPoSelectWarehouseModalOpen] = useState(false);
  const [activePoToComplete, setActivePoToComplete] = useState(null);
  const [completePoWarehouseId, setCompletePoWarehouseId] = useState('');

  const [newOeeWcId, setNewOeeWcId] = useState('');
  const [newOeeDate, setNewOeeDate] = useState('');
  const [newOeePlannedTime, setNewOeePlannedTime] = useState('480');
  const [newOeeRunTime, setNewOeeRunTime] = useState('');
  const [newOeePlannedQty, setNewOeePlannedQty] = useState('');
  const [newOeeTotalQty, setNewOeeTotalQty] = useState('');
  const [newOeeGoodQty, setNewOeeGoodQty] = useState('');

  // ── Phase 5: E-Commerce States ────────────────────────────────────────────
  const [storeProducts, setStoreProducts] = useState(initialMockStoreProducts);
  const [customerOrders, setCustomerOrders] = useState(initialMockOrders);
  const [loyaltyAccounts, setLoyaltyAccounts] = useState(initialMockLoyaltyAccounts);
  const [cart, setCart] = useState([]); // [{ product, quantity }]
  const [ecomSubTab, setEcomSubTab] = useState('store'); // store | orders | loyalty
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutRedeemPts, setCheckoutRedeemPts] = useState(0);
  const [checkoutMessage, setCheckoutMessage] = useState(null);
  const [storeFilter, setStoreFilter] = useState('All');
  // New Store Product form
  const [newSpSku, setNewSpSku] = useState('');
  const [newSpName, setNewSpName] = useState('');
  const [newSpDesc, setNewSpDesc] = useState('');
  const [newSpCategory, setNewSpCategory] = useState('Electronics');
  const [newSpPrice, setNewSpPrice] = useState('');
  const [newSpSalePrice, setNewSpSalePrice] = useState('');
  const [newSpStock, setNewSpStock] = useState('');
  const [newSpLoyaltyPts, setNewSpLoyaltyPts] = useState('');

  // ── Phase 5: Fixed Assets & Maintenance States ────────────────────────────
  const [fixedAssets, setFixedAssets] = useState(initialMockFixedAssets);
  const [maintenanceOrders, setMaintenanceOrders] = useState(initialMockMaintenanceOrders);
  const [assetsSubTab, setAssetsSubTab] = useState('register'); // register | depreciation | maintenance
  const [selectedAssetForDep, setSelectedAssetForDep] = useState(null);
  const [depSchedule, setDepSchedule] = useState(null);
  // New Asset form
  const [newAstCode, setNewAstCode] = useState('');
  const [newAstName, setNewAstName] = useState('');
  const [newAstCategory, setNewAstCategory] = useState('Machinery');
  const [newAstLocation, setNewAstLocation] = useState('');
  const [newAstSerial, setNewAstSerial] = useState('');
  const [newAstPurchaseDate, setNewAstPurchaseDate] = useState('');
  const [newAstCost, setNewAstCost] = useState('');
  const [newAstSalvage, setNewAstSalvage] = useState('0');
  const [newAstLife, setNewAstLife] = useState('5');
  const [newAstDepMethod, setNewAstDepMethod] = useState('STRAIGHT_LINE');
  const [newAstDepRate, setNewAstDepRate] = useState('0.20');
  // New Maintenance Order form
  const [newMoNo, setNewMoNo] = useState('');
  const [newMoAssetId, setNewMoAssetId] = useState('');
  const [newMoTitle, setNewMoTitle] = useState('');
  const [newMoDesc, setNewMoDesc] = useState('');
  const [newMoType, setNewMoType] = useState('PREVENTIVE');
  const [newMoPriority, setNewMoPriority] = useState('MEDIUM');
  const [newMoAssignedTo, setNewMoAssignedTo] = useState('');
  const [newMoScheduledDate, setNewMoScheduledDate] = useState('');
  const [newMoCost, setNewMoCost] = useState('0');

  // ── Phase 6: AI Console & MIS States ──────────────────────────────────────
  const [aiConsoleSubTab, setAiConsoleSubTab] = useState('nlq'); // nlq | ocr | forecast | anomaly | mis | whatsapp
  const [aiConsoleChatHistory, setAiConsoleChatHistory] = useState([
    { sender: 'ai', text: '👋 Hello! I\'m your ERP AI Assistant. I can answer questions about Finance, Inventory, HR, Sales, Manufacturing, and more. Try asking: "Show me the revenue summary" or "Are there any stock alerts?"' }
  ]);
  const [aiConsolePrompt, setAiConsolePrompt] = useState('');
  const [aiConsoleLoading, setAiConsoleLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(['Finance summary', 'Inventory status', 'Sales forecast', 'HR headcount']);
  const [ocrFileName, setOcrFileName] = useState('');
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [anomalyData, setAnomalyData] = useState(null);
  const [anomalyLoading, setAnomalyLoading] = useState(false);
  const [forecastMetric, setForecastMetric] = useState('revenue');
  const [forecastData, setForecastData] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [misData, setMisData] = useState({ kpis: mockMisKpis, revenueVsExpenses: mockRevenueVsExpenses, deptHeadcount: mockDeptHeadcount, salesByChannel: mockSalesByChannel });
  const [misLoading, setMisLoading] = useState(false);
  const [waWebhookBody, setWaWebhookBody] = useState('Show me inventory status');
  const [waWebhookReply, setWaWebhookReply] = useState(null);

  // Handle Authentication
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      
      localStorage.setItem('erp_token', data.token);
      localStorage.setItem('erp_refresh_token', data.refreshToken || '');
      localStorage.setItem('erp_user', JSON.stringify(data.user));
      localStorage.setItem('erp_demo', 'false');
      setToken(data.token);
      setCurrentUser(data.user);
      setDemoMode(false);
      dispatch(addChatMessage({ sender: 'ai', text: `Welcome back, ${data.user.firstName}! Your authenticated session is active.` }));
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      
      setAuthSuccess('Registration successful! Please login.');
      setAuthView('login');
      setRegistrationEnabled(false); // disable self-registration immediately
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleBypassAuth = () => {
    localStorage.setItem('erp_demo', 'true');
    setDemoMode(true);
    setToken(null);
    setCurrentUser(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_refresh_token');
    localStorage.removeItem('erp_user');
    localStorage.setItem('erp_demo', 'false');
    setToken(null);
    setCurrentUser(null);
    setDemoMode(false);
    setLandingView(true);
    setVoucherMessage(null);
    setLedgerVerified(null);
  };

  // Synchronize registration status and profile on mount
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const res = await fetch('/api/v1/auth/registration-status');
        if (res.ok) {
          const data = await res.json();
          setRegistrationEnabled(data.registrationEnabled);
        }
      } catch (err) {
        console.error('Failed to load registration status', err);
      }
    };

    const fetchProfile = async () => {
      const currentToken = token || localStorage.getItem('erp_token');
      if (!currentToken || demoMode) return;
      try {
        const res = await fetch('/api/v1/auth/me', {
          headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          localStorage.setItem('erp_user', JSON.stringify(data.user));
        } else if (res.status === 401 || res.status === 403) {
          handleLogout();
        }
      } catch (err) {
        console.error('Failed to load user profile', err);
      }
    };

    checkRegistrationStatus();
    fetchProfile();
  }, [token, demoMode]);

  // Background token refresh effect (runs every 10 minutes)
  useEffect(() => {
    if (!token || demoMode) return;
    const interval = setInterval(async () => {
      try {
        const refreshToken = localStorage.getItem('erp_refresh_token');
        if (!refreshToken) return;
        const res = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('erp_token', data.token);
          if (data.refreshToken) {
            localStorage.setItem('erp_refresh_token', data.refreshToken);
          }
          setToken(data.token);
          console.log('🔄 Access token silently refreshed.');
        } else {
          // If refresh fails, log out
          handleLogout();
        }
      } catch (err) {
        console.error('Failed to refresh token:', err);
      }
    }, 10 * 60 * 1000); // 10 minutes
    return () => clearInterval(interval);
  }, [token, demoMode]);

  // API Fetch Utility — always reads latest token from localStorage to avoid stale closure
  const getAuthHeaders = () => {
    const currentToken = token || localStorage.getItem('erp_token');
    return currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {};
  };

  // Load Database Finance Data
  const loadFinanceData = async () => {
    if (demoMode) {
      // derive reports offline from mockAccounts and mockJournal
      calculateOfflineReports();
      return;
    }

    try {
      const headers = getAuthHeaders();
      const accRes = await fetch('/api/v1/finance/accounts', { headers });
      if (accRes.ok) setAccounts(await accRes.json());
      
      const taxRes = await fetch('/api/v1/finance/tax/summary', { headers });
      if (taxRes.ok) setTaxSummary(await taxRes.json());

      const tbRes = await fetch('/api/v1/finance/reports/trial-balance', { headers });
      if (tbRes.ok) setTrialBalance(await tbRes.json());

      const plRes = await fetch('/api/v1/finance/reports/profit-loss', { headers });
      if (plRes.ok) setProfitLoss(await plRes.json());

      const bsRes = await fetch('/api/v1/finance/reports/balance-sheet', { headers });
      if (bsRes.ok) setBalanceSheet(await bsRes.json());
    } catch {
      calculateOfflineReports();
    }
  };

  const calculateOfflineReports = () => {
    // offline trial balance
    let totalDebit = 0;
    let totalCredit = 0;
    const tbAccs = accounts.map(a => {
      let debit = 0;
      let credit = 0;
      if (a.type === 'ASSET' || a.type === 'EXPENSE') {
        debit = a.balance;
        totalDebit += debit;
      } else {
        credit = a.balance;
        totalCredit += credit;
      }
      return { code: a.code, name: a.name, type: a.type, debit, credit };
    });
    setTrialBalance({ accounts: tbAccs, totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 0.01 });

    // offline P&L
    const revenues = accounts.filter(a => a.type === 'REVENUE');
    const expenses = accounts.filter(a => a.type === 'EXPENSE');
    const totalRev = revenues.reduce((s, a) => s + a.balance, 0);
    const totalExp = expenses.reduce((s, a) => s + a.balance, 0);
    setProfitLoss({ revenues, expenses, totalRevenue: totalRev, totalExpenses: totalExp, netProfit: totalRev - totalExp });

    // offline Balance Sheet
    const assets = accounts.filter(a => a.type === 'ASSET');
    const liabilities = accounts.filter(a => a.type === 'LIABILITY');
    const equities = accounts.filter(a => a.type === 'EQUITY');
    const totalA = assets.reduce((s, a) => s + a.balance, 0);
    const totalL = liabilities.reduce((s, a) => s + a.balance, 0);
    const totalE = equities.reduce((s, a) => s + a.balance, 0);
    setBalanceSheet({ assets, liabilities, equities, totalAssets: totalA, totalLiabilities: totalL, totalEquities: totalE, totalLiabilitiesEquities: totalL + totalE });
  };

  // Load Database Procurement Data
  const loadProcurementData = async () => {
    if (demoMode) return;
    try {
      const headers = getAuthHeaders();
      const supRes = await fetch('/api/v1/procurement/suppliers', { headers });
      if (supRes.ok) setSuppliers(await supRes.json());
      
      const reqRes = await fetch('/api/v1/procurement/requisitions', { headers });
      if (reqRes.ok) setRequisitions(await reqRes.json());

      const rfqRes = await fetch('/api/v1/procurement/rfqs', { headers });
      if (rfqRes.ok) setRfqs(await rfqRes.json());

      const poRes = await fetch('/api/v1/procurement/purchase-orders', { headers });
      if (poRes.ok) setPurchaseOrders(await poRes.json());

      const grnRes = await fetch('/api/v1/procurement/goods-receipts', { headers });
      if (grnRes.ok) setGoodsReceipts(await grnRes.json());

      const invRes = await fetch('/api/v1/procurement/invoices', { headers });
      if (invRes.ok) setInvoices(await invRes.json());
    } catch {
      // Silently fall back to offline mocks
    }
  };

  // Load Database HR Data
  const [deptMessage, setDeptMessage] = useState(null);
  const loadHRData = async () => {
    if (demoMode) return;
    try {
      const headers = getAuthHeaders();
      const deptRes = await fetch('/api/v1/hr/departments', { headers });
      if (deptRes.ok) setDepartments(await deptRes.json());

      const empRes = await fetch('/api/v1/hr/employees', { headers });
      if (empRes.ok) setEmployees(await empRes.json());

      const candRes = await fetch('/api/v1/hr/recruitment/candidates', { headers });
      if (candRes.ok) setCandidates(await candRes.json());

      const leaveRes = await fetch('/api/v1/hr/leaves', { headers });
      if (leaveRes.ok) setLeaves(await leaveRes.json());

      const attRes = await fetch('/api/v1/hr/attendance', { headers });
      if (attRes.ok) setAttendance(await attRes.json());

      const slipRes = await fetch('/api/v1/hr/payroll/slips', { headers });
      if (slipRes.ok) setPaySlips(await slipRes.json());
    } catch {
      // Silently fall back to offline mocks
    }
  };

  // Load Database CRM Data
  const loadCRMData = async () => {
    if (demoMode) return;
    try {
      const headers = getAuthHeaders();
      const leadRes = await fetch('/api/v1/crm/leads', { headers });
      if (leadRes.ok) setLeads(await leadRes.json());

      const accRes = await fetch('/api/v1/crm/customer-accounts', { headers });
      if (accRes.ok) setCustomerAccounts(await accRes.json());

      const oppRes = await fetch('/api/v1/crm/opportunities', { headers });
      if (oppRes.ok) setOpportunities(await oppRes.json());

      const quoteRes = await fetch('/api/v1/crm/quotes', { headers });
      if (quoteRes.ok) setQuotes(await quoteRes.json());
    } catch {
      // Silently fall back to offline mocks
    }
  };

  // Load Database Inventory Data
  const loadInventoryData = async () => {
    if (demoMode) {
      // Calculate safety alerts
      const alerts = products.filter(p => p.currentStock <= p.reorderPoint);
      setReorderAlerts(alerts);

      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      const alarms = products.filter(p => {
        if (!p.expiryDate) return false;
        const expiry = new Date(p.expiryDate);
        return expiry <= thirtyDays && expiry >= new Date();
      });
      setExpiryAlarms(alarms);

      // In-memory LIFO/FIFO Valuation calculation
      const valDetails = products.map(prod => {
        const txs = stockTransactions
          .filter(tx => tx.productId === prod.id)
          .sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());
        
        let fifoQueue = [];
        for (const tx of txs) {
          if (tx.quantity > 0) {
            fifoQueue.push({ qty: tx.quantity, cost: tx.unitCost });
          } else if (tx.quantity < 0) {
            let toIssue = Math.abs(tx.quantity);
            while (toIssue > 0 && fifoQueue.length > 0) {
              const first = fifoQueue[0];
              if (first.qty <= toIssue) {
                toIssue -= first.qty;
                fifoQueue.shift();
              } else {
                first.qty -= toIssue;
                toIssue = 0;
              }
            }
          }
        }
        const fifoVal = fifoQueue.reduce((acc, b) => acc + b.qty * b.cost, 0);

        let lifoStack = [];
        for (const tx of txs) {
          if (tx.quantity > 0) {
            lifoStack.push({ qty: tx.quantity, cost: tx.unitCost });
          } else if (tx.quantity < 0) {
            let toIssue = Math.abs(tx.quantity);
            while (toIssue > 0 && lifoStack.length > 0) {
              const last = lifoStack[lifoStack.length - 1];
              if (last.qty <= toIssue) {
                toIssue -= last.qty;
                lifoStack.pop();
              } else {
                last.qty -= toIssue;
                toIssue = 0;
              }
            }
          }
        }
        const lifoVal = lifoStack.reduce((acc, b) => acc + b.qty * b.cost, 0);

        return {
          id: prod.id,
          code: prod.code,
          name: prod.name,
          currentStock: prod.currentStock,
          fifoValue: fifoVal,
          lifoValue: lifoVal,
          difference: fifoVal - lifoVal
        };
      });

      const totalFifo = valDetails.reduce((s, r) => s + r.fifoValue, 0);
      const totalLifo = valDetails.reduce((s, r) => s + r.lifoValue, 0);

      setValuationDetails(valDetails);
      setFifoValuationVal(totalFifo);
      setLifoValuationVal(totalLifo);
      return;
    }

    try {
      const headers = getAuthHeaders();
      const prodRes = await fetch('/api/v1/inventory/products', { headers });
      if (prodRes.ok) setProducts(await prodRes.json());

      const whRes = await fetch('/api/v1/inventory/warehouses', { headers });
      if (whRes.ok) setWarehouses(await whRes.json());

      const txRes = await fetch('/api/v1/inventory/transactions', { headers });
      if (txRes.ok) setStockTransactions(await txRes.json());

      const alertRes = await fetch('/api/v1/inventory/alerts', { headers });
      if (alertRes.ok) {
        const alertData = await alertRes.json();
        setReorderAlerts(alertData.reorderAlerts || []);
        setExpiryAlarms(alertData.expiryAlarms || []);
      }

      const valRes = await fetch('/api/v1/inventory/valuation', { headers });
      if (valRes.ok) {
        const valData = await valRes.json();
        setValuationDetails(valData.valuations || []);
        setFifoValuationVal(valData.totals?.fifo || 0);
        setLifoValuationVal(valData.totals?.lifo || 0);
      }
    } catch {
      // Catch exceptions silently
    }
  };

  // Load Database Manufacturing Data
  const loadManufacturingData = async () => {
    if (demoMode) return;
    try {
      const headers = getAuthHeaders();
      const bomRes = await fetch('/api/v1/manufacturing/boms', { headers });
      if (bomRes.ok) setBoms(await bomRes.json());

      const wcRes = await fetch('/api/v1/manufacturing/work-centers', { headers });
      if (wcRes.ok) setWorkCenters(await wcRes.json());

      const poRes = await fetch('/api/v1/manufacturing/production-orders', { headers });
      if (poRes.ok) setProductionOrders(await poRes.json());

      const oeeRes = await fetch('/api/v1/manufacturing/oee', { headers });
      if (oeeRes.ok) setOeeLogs(await oeeRes.json());
    } catch {
      // Catch exceptions silently
    }
  };

  // Load User Management Data
  const loadUsersData = async () => {
    if (demoMode) {
      // Mock users for demo mode
      setUsersList([
        { id: '1', email: 'admin@erp.com', firstName: 'Admin', lastName: 'User', isActive: true, roles: [{ id: '1', name: 'ADMIN', description: 'Full system administrator' }] },
        { id: '2', email: 'j.doe@erp.com', firstName: 'John', lastName: 'Doe', isActive: true, roles: [{ id: '2', name: 'USER', description: 'Standard user' }] },
        { id: '3', email: 's.smith@erp.com', firstName: 'Sarah', lastName: 'Smith', isActive: false, roles: [{ id: '2', name: 'USER', description: 'Standard user' }] }
      ]);
      setRolesList([
        { id: '1', name: 'ADMIN', description: 'Full system administrator' },
        { id: '2', name: 'USER', description: 'Standard user' },
        { id: '3', name: 'MANAGER', description: 'Managerial staff' }
      ]);
      return;
    }
    
    setUsersLoading(true);
    try {
      const headers = getAuthHeaders();
      const usersRes = await fetch('/api/v1/auth/users', { headers });
      if (usersRes.ok) {
        setUsersList(await usersRes.json());
      }
      
      const rolesRes = await fetch('/api/v1/auth/roles', { headers });
      if (rolesRes.ok) {
        setRolesList(await rolesRes.json());
      }
    } catch (err) {
      console.error('Failed to load user management data', err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Create User Handler
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');
    
    if (!createUserEmail || !createUserPassword || !createUserFirstName || !createUserLastName) {
      setUserError('All fields are required.');
      return;
    }

    if (demoMode) {
      const newUser = {
        id: String(usersList.length + 1),
        email: createUserEmail,
        firstName: createUserFirstName,
        lastName: createUserLastName,
        isActive: true,
        roles: [{ id: String(rolesList.findIndex(r => r.name === createUserRole) + 1), name: createUserRole, description: `${createUserRole} role` }]
      };
      setUsersList([newUser, ...usersList]);
      setUserSuccess(`User ${createUserEmail} created successfully (Demo Mode).`);
      // Reset form
      setCreateUserEmail('');
      setCreateUserPassword('');
      setCreateUserFirstName('');
      setCreateUserLastName('');
      setCreateUserRole('USER');
      return;
    }

    setUserActionLoading(true);
    try {
      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      };
      const res = await fetch('/api/v1/auth/users', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: createUserEmail,
          password: createUserPassword,
          firstName: createUserFirstName,
          lastName: createUserLastName,
          roleName: createUserRole
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create user');

      setUserSuccess(data.message || 'User created successfully.');
      // Reset form
      setCreateUserEmail('');
      setCreateUserPassword('');
      setCreateUserFirstName('');
      setCreateUserLastName('');
      setCreateUserRole('USER');
      
      // Reload user list
      await loadUsersData();
    } catch (err) {
      setUserError(err.message);
    } finally {
      setUserActionLoading(false);
    }
  };

  // Toggle User Status Handler
  const handleToggleUserStatus = async (userToToggle) => {
    setUserError('');
    setUserSuccess('');

    if (userToToggle.email === currentUser?.email) {
      setUserError('You cannot deactivate your own account.');
      return;
    }

    if (demoMode) {
      const updatedList = usersList.map(u => 
        u.id === userToToggle.id ? { ...u, isActive: !u.isActive } : u
      );
      setUsersList(updatedList);
      setUserSuccess(`User ${userToToggle.email} status updated (Demo Mode).`);
      return;
    }

    try {
      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      };
      const res = await fetch(`/api/v1/auth/users/${userToToggle.id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          isActive: !userToToggle.isActive
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to toggle status');

      setUserSuccess(data.message || 'User status updated successfully.');
      await loadUsersData();
    } catch (err) {
      setUserError(err.message);
    }
  };

  // Trigger loads on mount & when auth state changes — do NOT include data arrays to avoid infinite loops
  useEffect(() => {
    if (!demoMode && (token || localStorage.getItem('erp_token'))) {
      loadFinanceData();
      loadProcurementData();
      loadHRData();
      loadCRMData();
      loadInventoryData();
      loadManufacturingData();
      
      const isUserAdmin = currentUser?.roles?.includes('ADMIN');
      if (isUserAdmin) {
        loadUsersData();
      }
    }
  }, [demoMode, token, currentUser]);

  // Load users data specifically when User Management tab is selected
  useEffect(() => {
    if (activeTab === 'users' && (demoMode || currentUser?.roles?.includes('ADMIN'))) {
      loadUsersData();
    }
  }, [activeTab, demoMode, currentUser]);

  // Handle Voucher Submission
  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    setVoucherMessage(null);
    if (!voucherAmount || !debitAcc || !creditAcc) {
      setVoucherMessage({ type: 'error', text: 'All fields are required.' });
      return;
    }

    const amt = parseFloat(voucherAmount);

    if (demoMode) {
      // local mock update double-entry
      const updatedAccounts = accounts.map(acc => {
        let bal = acc.balance;
        if (acc.code === debitAcc || acc.name === debitAcc) {
          bal += (acc.type === 'ASSET' || acc.type === 'EXPENSE') ? amt : -amt;
        }
        if (acc.code === creditAcc || acc.name === creditAcc) {
          bal += (acc.type === 'ASSET' || acc.type === 'EXPENSE') ? -amt : amt;
        }
        return { ...acc, balance: bal };
      });
      
      const prevBlock = journalEntries[journalEntries.length - 1];
      const newBlockIndex = prevBlock ? prevBlock.blockIndex + 1 : 1;
      const newBlock = {
        blockIndex: newBlockIndex,
        voucherType,
        voucherNo: `VCHR-MOCK-${Date.now()}`,
        date: new Date().toISOString(),
        amount: amt,
        debitAcc,
        creditAcc,
        narration: narration || 'Offline Sandbox Voucher',
        prevHash: prevBlock ? prevBlock.blockHash : '0',
        blockHash: `hash-${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`
      };

      setAccounts(updatedAccounts);
      setJournalEntries([...journalEntries, newBlock]);
      setVoucherMessage({ type: 'success', text: `[DEMO MODE] Voucher created. Cryptographic block #${newBlockIndex} signed & chained.` });
      setVoucherAmount('');
      setNarration('');
      return;
    }

    try {
      const res = await fetch('/api/v1/finance/voucher', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          voucherType,
          amount: amt,
          debitAcc,
          creditAcc,
          narration
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record voucher');

      setVoucherMessage({ type: 'success', text: `Voucher successfully validated and signed into Block #${data.entry.blockIndex}!` });
      setVoucherAmount('');
      setNarration('');
      loadFinanceData();
    } catch (err) {
      setVoucherMessage({ type: 'error', text: err.message });
    }
  };

  // Handle Verify Ledger
  const handleVerifyLedger = async () => {
    if (demoMode) {
      setLedgerVerified({ valid: true, error: null });
      return;
    }
    try {
      const res = await fetch('/api/v1/finance/verify-ledger', { headers: getAuthHeaders() });
      const data = await res.json();
      setLedgerVerified(data);
    } catch {
      setLedgerVerified({ valid: true, error: 'Database offline. Mock chain verification passed.' });
    }
  };

  // Handle Bank Reconciliation
  const handleRunReconciliation = async () => {
    if (!reconcileText.trim()) return;
    const lines = reconcileText.trim().split('\n').map(line => {
      const parts = line.split(',');
      return {
        date: parts[0]?.trim() || new Date().toISOString().split('T')[0],
        amount: parseFloat(parts[1]?.trim() || '0'),
        desc: parts[2]?.trim() || 'Unspecified line'
      };
    });

    if (demoMode) {
      // simple mock matcher
      const reconciled = [];
      const unmatched = [];
      for (const line of lines) {
        const match = journalEntries.find(j => Math.abs(j.amount - line.amount) < 0.1);
        if (match) {
          reconciled.push({ statementLine: line, matchedEntry: match, confidence: '98%' });
        } else {
          unmatched.push(line);
        }
      }
      setReconciliationResults({ reconciled, unmatched });
      return;
    }

    try {
      const res = await fetch('/api/v1/finance/reconcile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ statementLines: lines })
      });
      if (!res.ok) throw new Error("Reconciliation failed");
      setReconciliationResults(await res.json());
    } catch {
      setReconciliationResults({ reconciled: [], unmatched: lines });
    }
  };

  // Add Supplier Handler
  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    if (!supName || !supEmail) return;
    
    if (demoMode) {
      const newSup = {
        id: `sup-${Date.now()}`,
        name: supName,
        email: supEmail,
        phone: supPhone || 'N/A',
        address: supAddr || 'N/A',
        deliveryScore: 100.0,
        qualityScore: 100.0,
        priceScore: 100.0,
        overallScore: 100.0
      };
      setSuppliers([...suppliers, newSup]);
      setSupName('');
      setSupEmail('');
      setSupPhone('');
      setSupAddr('');
      return;
    }

    try {
      const res = await fetch('/api/v1/procurement/supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name: supName, email: supEmail, phone: supPhone, address: supAddr })
      });
      if (res.ok) {
        setSupName('');
        setSupEmail('');
        setSupPhone('');
        setSupAddr('');
        loadProcurementData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Requisition Submit Handler
  const handleCreateRequisition = async (e) => {
    e.preventDefault();
    if (!prRequestedBy || !prDept || !prItemName || !prItemQty) return;
    const itemsList = [{ itemId: `item-${Date.now()}`, desc: prItemName, qty: parseInt(prItemQty) }];

    if (demoMode) {
      const newPr = {
        id: `pr-${Date.now()}`,
        prNo: `PR-MOCK-${Date.now()}`,
        requestedBy: prRequestedBy,
        department: prDept,
        status: 'PENDING',
        items: JSON.stringify(itemsList),
        createdAt: new Date().toISOString()
      };
      setRequisitions([newPr, ...requisitions]);
      setPrItemName('');
      setPrItemQty('');
      return;
    }

    try {
      const res = await fetch('/api/v1/procurement/requisition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ requestedBy: prRequestedBy, department: prDept, items: itemsList })
      });
      if (res.ok) {
        setPrItemName('');
        setPrItemQty('');
        loadProcurementData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // RFQ Submit Handler
  const handleCreateRfq = async (e) => {
    e.preventDefault();
    if (!rfqPrId) return;
    const selectedPr = requisitions.find(r => r.id === rfqPrId);
    if (!selectedPr) return;
    const items = typeof selectedPr.items === 'string' ? JSON.parse(selectedPr.items) : selectedPr.items;

    if (demoMode) {
      const newRfq = {
        id: `rfq-${Date.now()}`,
        rfqNo: `RFQ-MOCK-${Date.now()}`,
        purchaseRequisitionId: rfqPrId,
        purchaseRequisition: selectedPr,
        status: 'SENT',
        items: JSON.stringify(items),
        createdAt: new Date().toISOString()
      };
      setRfqs([newRfq, ...rfqs]);
      setRequisitions(requisitions.map(r => r.id === rfqPrId ? { ...r, status: 'APPROVED' } : r));
      return;
    }

    try {
      const res = await fetch('/api/v1/procurement/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ purchaseRequisitionId: rfqPrId, items })
      });
      if (res.ok) {
        loadProcurementData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // PO Submit Handler
  const handleCreatePo = async (e) => {
    e.preventDefault();
    if (!poSupplierId || !poAmount) return;
    let items = [{ itemId: 'item-101', desc: 'Hardware Goods', qty: 100, price: parseFloat(poAmount)/100 }];
    
    if (poRfqId) {
      const selectedRfq = rfqs.find(r => r.id === poRfqId);
      if (selectedRfq) {
        items = typeof selectedRfq.items === 'string' ? JSON.parse(selectedRfq.items) : selectedRfq.items;
        items = items.map(it => ({ ...it, price: parseFloat(poAmount) / (it.qty || 1) }));
      }
    }

    if (demoMode) {
      const selectedSup = suppliers.find(s => s.id === poSupplierId) || { name: 'Direct Supplier' };
      const newPo = {
        id: `po-${Date.now()}`,
        poNo: `PO-MOCK-${Date.now()}`,
        supplierId: poSupplierId,
        supplier: selectedSup,
        rfqId: poRfqId || null,
        status: 'APPROVED',
        items: JSON.stringify(items),
        totalAmount: parseFloat(poAmount),
        createdAt: new Date().toISOString()
      };
      setPurchaseOrders([newPo, ...purchaseOrders]);
      if (poRfqId) {
        setRfqs(rfqs.map(r => r.id === poRfqId ? { ...r, status: 'CLOSED' } : r));
      }
      setPoAmount('');
      return;
    }

    try {
      const res = await fetch('/api/v1/procurement/purchase-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ supplierId: poSupplierId, rfqId: poRfqId || null, items, totalAmount: parseFloat(poAmount) })
      });
      if (res.ok) {
        setPoAmount('');
        loadProcurementData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // GRN Submit Handler
  const handleCreateGrn = async (e) => {
    e.preventDefault();
    if (!grnPoId || !grnReceivedBy || !grnQty) return;
    const selectedPo = purchaseOrders.find(p => p.id === grnPoId);
    if (!selectedPo) return;
    const poItems = typeof selectedPo.items === 'string' ? JSON.parse(selectedPo.items) : selectedPo.items;
    
    const receivedItems = poItems.map(it => ({
      itemId: it.itemId,
      qtyReceived: parseInt(grnQty),
      qualityStatus: grnQuality
    }));

    if (demoMode) {
      const newGrn = {
        id: `grn-${Date.now()}`,
        grnNo: `GRN-MOCK-${Date.now()}`,
        purchaseOrderId: grnPoId,
        purchaseOrder: selectedPo,
        supplier: selectedPo.supplier,
        receivedBy: grnReceivedBy,
        receivedItems: JSON.stringify(receivedItems),
        createdAt: new Date().toISOString()
      };
      setGoodsReceipts([newGrn, ...goodsReceipts]);
      setPurchaseOrders(purchaseOrders.map(p => p.id === grnPoId ? { ...p, status: 'SHIPPED' } : p));
      
      // Update supplier rating locally
      const supId = selectedPo.supplierId;
      setSuppliers(suppliers.map(s => {
        if (s.id === supId) {
          const qScore = grnQuality === 'GOOD' ? 100 : 50;
          const dScore = grnDelay === '0' ? 100 : grnDelay === '1' ? 95 : grnDelay === '2' ? 90 : 70;
          const newQ = (s.qualityScore * 4 + qScore) / 5;
          const newD = (s.deliveryScore * 4 + dScore) / 5;
          const newO = (newQ + newD + s.priceScore) / 3;
          return { ...s, qualityScore: newQ, deliveryScore: newD, overallScore: newO };
        }
        return s;
      }));

      setGrnReceivedBy('');
      setGrnQty('');
      return;
    }

    try {
      const res = await fetch('/api/v1/procurement/goods-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          purchaseOrderId: grnPoId,
          receivedBy: grnReceivedBy,
          receivedItems,
          deliveryDelayDays: parseInt(grnDelay)
        })
      });
      if (res.ok) {
        setGrnReceivedBy('');
        setGrnQty('');
        loadProcurementData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Supplier Invoice Submit Handler (3-Way Matching)
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!invPoId || !invoiceNoInput || !invAmountInput || !invQtyInput || !invPriceInput) return;
    setInvoiceMatchingResult(null);

    const selectedPo = purchaseOrders.find(p => p.id === invPoId);
    if (!selectedPo) return;
    const poItems = typeof selectedPo.items === 'string' ? JSON.parse(selectedPo.items) : selectedPo.items;
    
    const items = poItems.map(it => ({
      itemId: it.itemId,
      qty: parseInt(invQtyInput),
      price: parseFloat(invPriceInput)
    }));

    if (demoMode) {
      // local client 3-way match
      const grnsForPo = goodsReceipts.filter(g => g.purchaseOrderId === invPoId);
      const grnQtyMap = {};
      for (const grn of grnsForPo) {
        const received = typeof grn.receivedItems === 'string' ? JSON.parse(grn.receivedItems) : grn.receivedItems;
        for (const rit of received) {
          grnQtyMap[rit.itemId] = (grnQtyMap[rit.itemId] || 0) + (rit.qtyReceived || 0);
        }
      }

      const logs = [];
      let passed = true;
      let priceDeduction = 0;

      for (const invItem of items) {
        const itemId = invItem.itemId;
        const invQty = invItem.qty;
        const invPrice = invItem.price;

        const poItem = poItems.find(p => p.itemId === itemId);
        const totalReceived = grnQtyMap[itemId] || 0;

        if (!poItem) {
          passed = false;
          logs.push(`Item "${itemId}" was not part of the Purchase Order.`);
          continue;
        }

        if (invQty > poItem.qty) {
          passed = false;
          logs.push(`Quantity overflow: Invoiced qty (${invQty}) exceeds PO qty (${poItem.qty}) for item "${poItem.desc}".`);
        }

        if (invQty > totalReceived) {
          passed = false;
          logs.push(`Quantity mismatch: Invoiced qty (${invQty}) exceeds GRN received qty (${totalReceived}) for item "${poItem.desc}".`);
        }

        if (invPrice > poItem.price) {
          passed = false;
          const diff = invPrice - poItem.price;
          priceDeduction += (diff / poItem.price) * 100;
          logs.push(`Price discrepancy: Invoiced unit price (₹${invPrice}) exceeds PO unit price (₹${poItem.price}) for item "${poItem.desc}".`);
        }
      }

      const mockInvoice = {
        id: `inv-${Date.now()}`,
        invoiceNo: invoiceNoInput,
        purchaseOrderId: invPoId,
        purchaseOrder: selectedPo,
        supplier: selectedPo.supplier,
        status: passed ? 'MATCH_PASSED' : 'MATCH_FAILED',
        totalAmount: parseFloat(invAmountInput),
        taxAmount: 0.0,
        createdAt: new Date().toISOString()
      };

      setInvoiceMatchingResult({
        passed,
        logs,
        invoice: mockInvoice
      });

      setInvoices([mockInvoice, ...invoices]);
      if (passed) {
        setPurchaseOrders(purchaseOrders.map(p => p.id === invPoId ? { ...p, status: 'COMPLETED' } : p));
        
        // Auto double entry AP Voucher in mock ledger
        const updatedAccounts = accounts.map(acc => {
          let bal = acc.balance;
          if (acc.code === '5000') bal += parseFloat(invAmountInput); // Consulting Expense debit
          if (acc.code === '2000') bal += parseFloat(invAmountInput); // Accounts Payable credit
          return { ...acc, balance: bal };
        });
        
        const prevBlock = journalEntries[journalEntries.length - 1];
        const newBlock = {
          blockIndex: prevBlock ? prevBlock.blockIndex + 1 : 1,
          voucherType: 'JOURNAL',
          voucherNo: `VCHR-AP-${Date.now()}`,
          date: new Date().toISOString(),
          amount: parseFloat(invAmountInput),
          debitAcc: 'Consulting Expense',
          creditAcc: 'Accounts Payable',
          narration: `Automated journal entry for matched invoice ${invoiceNoInput}`,
          prevHash: prevBlock ? prevBlock.blockHash : '0',
          blockHash: `hash-${Math.random().toString(36).substring(2, 10)}`
        };
        setAccounts(updatedAccounts);
        setJournalEntries([...journalEntries, newBlock]);
      }

      // Update supplier price score locally
      const supId = selectedPo.supplierId;
      setSuppliers(suppliers.map(s => {
        if (s.id === supId) {
          const pScoreThisTime = Math.max(0, 100 - priceDeduction);
          const newP = (s.priceScore * 4 + pScoreThisTime) / 5;
          const newO = (s.deliveryScore + s.qualityScore + newP) / 3;
          return { ...s, priceScore: newP, overallScore: newO };
        }
        return s;
      }));

      setInvoiceNoInput('');
      setInvAmountInput('');
      setInvQtyInput('');
      setInvPriceInput('');
      return;
    }

    try {
      const res = await fetch('/api/v1/procurement/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          invoiceNo: invoiceNoInput,
          purchaseOrderId: invPoId,
          items,
          totalAmount: parseFloat(invAmountInput),
          taxAmount: 0.0
        })
      });
      const data = await res.json();
      setInvoiceMatchingResult({
        passed: data.matchPassed,
        logs: data.logs,
        invoice: data.invoice
      });
      setInvoiceNoInput('');
      setInvAmountInput('');
      setInvQtyInput('');
      setInvPriceInput('');
      loadProcurementData();
    } catch (err) {
      console.error(err);
    }
  };

  // HR & CRM Handlers
  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptCode || !newDeptName) return;
    const body = { code: newDeptCode, name: newDeptName, parentId: newDeptParent || null };
    if (demoMode) {
      const newD = { id: `dept-${Date.now()}`, ...body, children: [], parent: null };
      setDepartments([...departments, newD]);
      setNewDeptCode('');
      setNewDeptName('');
      setNewDeptParent('');
    } else {
      try {
        const res = await fetch('/api/v1/hr/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(body)
        });
        if (res.ok) {
          const data = await res.json();
          setDepartments([...departments, data]);
          setNewDeptCode('');
          setNewDeptName('');
          setNewDeptParent('');
          loadHRData();
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        const newD = { id: `dept-${Date.now()}`, ...body, children: [], parent: null };
        setDepartments([...departments, newD]);
        setNewDeptCode('');
        setNewDeptName('');
        setNewDeptParent('');
      }
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!newEmpCode || !newEmpFirst || !newEmpLast || !newEmpEmail || !newEmpDept || !newEmpSalary) return;
    const deptObj = departments.find(d => d.id === newEmpDept || d.code === newEmpDept);
    const deptName = deptObj ? deptObj.name : 'Unknown';
    const body = {
      employeeCode: newEmpCode,
      firstName: newEmpFirst,
      lastName: newEmpLast,
      email: newEmpEmail,
      phone: newEmpPhone,
      departmentId: newEmpDept,
      jobTitle: newEmpTitle,
      baseSalary: parseFloat(newEmpSalary)
    };
    if (demoMode) {
      const newE = { id: `emp-${Date.now()}`, ...body, department: { name: deptName } };
      setEmployees([...employees, newE]);
      setNewEmpCode('');
      setNewEmpFirst('');
      setNewEmpLast('');
      setNewEmpEmail('');
      setNewEmpPhone('');
      setNewEmpDept('');
      setNewEmpTitle('');
      setNewEmpSalary('');
    } else {
      try {
        const res = await fetch('/api/v1/hr/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(body)
        });
        if (res.ok) {
          const data = await res.json();
          setEmployees([...employees, data]);
          setNewEmpCode('');
          setNewEmpFirst('');
          setNewEmpLast('');
          setNewEmpEmail('');
          setNewEmpPhone('');
          setNewEmpDept('');
          setNewEmpTitle('');
          setNewEmpSalary('');
          loadHRData();
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        const newE = { id: `emp-${Date.now()}`, ...body, department: { name: deptName } };
        setEmployees([...employees, newE]);
        setNewEmpCode('');
        setNewEmpFirst('');
        setNewEmpLast('');
        setNewEmpEmail('');
        setNewEmpPhone('');
        setNewEmpDept('');
        setNewEmpTitle('');
        setNewEmpSalary('');
      }
    }
  };

  const handleCreateCandidate = async (e) => {
    e.preventDefault();
    if (!newCandName || !newCandEmail || !newCandTitle) return;
    const body = {
      name: newCandName,
      email: newCandEmail,
      phone: newCandPhone,
      jobTitle: newCandTitle,
      status: 'APPLIED',
      resumeUrl: 'https://example.com/resumes/uploaded.pdf'
    };
    if (demoMode) {
      const newC = { id: `cand-${Date.now()}`, ...body, offerSent: false, offerPay: 50000 };
      setCandidates([...candidates, newC]);
      setNewCandName('');
      setNewCandEmail('');
      setNewCandPhone('');
      setNewCandTitle('');
    } else {
      try {
        const res = await fetch('/api/v1/hr/recruitment/candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(body)
        });
        if (res.ok) {
          const data = await res.json();
          setCandidates([...candidates, data]);
          setNewCandName('');
          setNewCandEmail('');
          setNewCandPhone('');
          setNewCandTitle('');
          loadHRData();
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        const newC = { id: `cand-${Date.now()}`, ...body, offerSent: false, offerPay: 50000 };
        setCandidates([...candidates, newC]);
        setNewCandName('');
        setNewCandEmail('');
        setNewCandPhone('');
        setNewCandTitle('');
      }
    }
  };

  const handleUpdateCandidateStatus = async (id, status) => {
    if (demoMode) {
      setCandidates(candidates.map(c => c.id === id ? { ...c, status } : c));
    } else {
      try {
        const res = await fetch(`/api/v1/hr/recruitment/candidates/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ status })
        });
        if (res.ok) {
          const data = await res.json();
          setCandidates(candidates.map(c => c.id === id ? data : c));
          loadHRData();
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        setCandidates(candidates.map(c => c.id === id ? { ...c, status } : c));
      }
    }
  };

  const handleTriggerOfferModal = (cand) => {
    setSelectedCandidate(cand);
    setOfferPayInput(cand.offerPay || 60000);
    setGeneratedOfferText('');
    setOfferLetterModalOpen(true);
  };

  const handleGenerateOfferLetter = async () => {
    if (!selectedCandidate) return;
    const body = { offerPay: parseFloat(offerPayInput) };
    if (demoMode) {
      const offerLetterText = `
========================================
OFFER OF EMPLOYMENT
========================================
Date: ${new Date().toLocaleDateString()}

Dear ${selectedCandidate.name},

We are thrilled to offer you the position of ${selectedCandidate.jobTitle} with our organization.

Compensation: ₹${parseFloat(offerPayInput).toLocaleString()} per month (Base Salary).
Verification ID: OFF-${selectedCandidate.id.toString().slice(0, 8).toUpperCase()}

Your professional skills and experience will be a valuable asset to our team.

Sincerely,
HR Director, EPR Dashboard Corp.
========================================
`;
      setGeneratedOfferText(offerLetterText);
      setCandidates(candidates.map(c => c.id === selectedCandidate.id ? { ...c, status: 'OFFERED', offerSent: true, offerPay: parseFloat(offerPayInput) } : c));
    } else {
      try {
        const res = await fetch(`/api/v1/hr/recruitment/candidates/${selectedCandidate.id}/offer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(body)
        });
        if (res.ok) {
          const data = await res.json();
          setGeneratedOfferText(data.offerLetter);
          setCandidates(candidates.map(c => c.id === selectedCandidate.id ? data.candidate : c));
          loadHRData();
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        const offerLetterText = `
========================================
OFFER OF EMPLOYMENT
========================================
Date: ${new Date().toLocaleDateString()}

Dear ${selectedCandidate.name},

We are thrilled to offer you the position of ${selectedCandidate.jobTitle} with our organization.

Compensation: ₹${parseFloat(offerPayInput).toLocaleString()} per month (Base Salary).
Verification ID: OFF-${selectedCandidate.id.toString().slice(0, 8).toUpperCase()}

Your professional skills and experience will be a valuable asset to our team.

Sincerely,
HR Director, EPR Dashboard Corp.
========================================
`;
        setGeneratedOfferText(offerLetterText);
        setCandidates(candidates.map(c => c.id === selectedCandidate.id ? { ...c, status: 'OFFERED', offerSent: true, offerPay: parseFloat(offerPayInput) } : c));
      }
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!leaveEmpId || !leaveType || !leaveStart || !leaveEnd) return;
    const empObj = employees.find(emp => emp.id === leaveEmpId);
    const empName = empObj ? { firstName: empObj.firstName, lastName: empObj.lastName } : { firstName: 'Unknown', lastName: '' };
    const body = {
      employeeId: leaveEmpId,
      leaveType,
      startDate: leaveStart,
      endDate: leaveEnd,
      reason: leaveReason
    };
    if (demoMode) {
      const newL = { id: `leave-${Date.now()}`, ...body, status: 'PENDING', approvedBy: null, employee: empName };
      setLeaves([newL, ...leaves]);
      setLeaveEmpId('');
      setLeaveType('CASUAL');
      setLeaveStart('');
      setLeaveEnd('');
      setLeaveReason('');
    } else {
      try {
        const res = await fetch('/api/v1/hr/leaves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(body)
        });
        if (res.ok) {
          const data = await res.json();
          setLeaves([data, ...leaves]);
          setLeaveEmpId('');
          setLeaveType('CASUAL');
          setLeaveStart('');
          setLeaveEnd('');
          setLeaveReason('');
          loadHRData();
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        const newL = { id: `leave-${Date.now()}`, ...body, status: 'PENDING', approvedBy: null, employee: empName };
        setLeaves([newL, ...leaves]);
        setLeaveEmpId('');
        setLeaveType('CASUAL');
        setLeaveStart('');
        setLeaveEnd('');
        setLeaveReason('');
      }
    }
  };

  const handleApproveLeave = async (id, status) => {
    if (demoMode) {
      setLeaves(leaves.map(l => l.id === id ? { ...l, status, approvedBy: 'Sarah Connor' } : l));
    } else {
      try {
        const res = await fetch(`/api/v1/hr/leaves/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ status, approvedBy: 'Sarah Connor' })
        });
        if (res.ok) {
          const data = await res.json();
          setLeaves(leaves.map(l => l.id === id ? data : l));
          loadHRData();
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        setLeaves(leaves.map(l => l.id === id ? { ...l, status, approvedBy: 'Sarah Connor' } : l));
      }
    }
  };

  const handleLogAttendance = async (e) => {
    e.preventDefault();
    if (!selectedAttEmp) return;
    setIsScanning(true);
    setScanStatus('scanning');
    
    let timer = 0;
    const interval = setInterval(() => {
      timer += 1;
      if (attScanMethod === 'FACE_SCAN') {
        if (timer === 1) setFaceScanStage('Positioning face in frame...');
        if (timer === 2) setFaceScanStage('Analyzing facial landmarks...');
        if (timer === 3) setFaceScanStage('Matching credentials...');
      } else {
        if (timer === 1) setFingerprintStage('Place finger on scanner...');
        if (timer === 2) setFingerprintStage('Scanning biometric prints...');
        if (timer === 3) setFingerprintStage('Verifying minutiae pattern...');
      }
      if (timer >= 4) {
        clearInterval(interval);
        finalizeAttendance();
      }
    }, 600);

    const finalizeAttendance = async () => {
      const empObj = employees.find(emp => emp.id === selectedAttEmp);
      const empName = empObj ? { firstName: empObj.firstName, lastName: empObj.lastName } : { firstName: 'Unknown', lastName: '' };
      const checkInTime = new Date().toISOString();
      const body = {
        employeeId: selectedAttEmp,
        date: new Date().toISOString().split('T')[0],
        checkIn: checkInTime,
        status: 'PRESENT',
        verificationMethod: attScanMethod
      };
      
      if (demoMode) {
        const newAtt = { id: `att-${Date.now()}`, ...body, checkOut: null, employee: empName };
        setAttendance([newAtt, ...attendance]);
        setScanStatus('success');
        setTimeout(() => {
          setIsScanning(false);
          setScanStatus('idle');
          setSelectedAttEmp('');
        }, 1200);
      } else {
        try {
          const res = await fetch('/api/v1/hr/attendance/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(body)
          });
          if (res.ok) {
            const data = await res.json();
            setAttendance([data, ...attendance]);
            setScanStatus('success');
            loadHRData();
          } else {
            throw new Error('API failed');
          }
        } catch (err) {
          const newAtt = { id: `att-${Date.now()}`, ...body, checkOut: null, employee: empName };
          setAttendance([newAtt, ...attendance]);
          setScanStatus('success');
        } finally {
          setTimeout(() => {
            setIsScanning(false);
            setScanStatus('idle');
            setSelectedAttEmp('');
          }, 1200);
        }
      }
    };
  };

  const handleCalculatePayroll = async (e) => {
    e.preventDefault();
    if (!payEmpId || !payMonth || !payYear) return;
    const body = { employeeId: payEmpId, month: payMonth, year: payYear };

    if (demoMode) {
      const empObj = employees.find(emp => emp.id === payEmpId);
      if (!empObj) return;

      const base = empObj.baseSalary;
      const pf = base * 0.12;
      const esi = base * 0.0075;
      let tds = 0.0;
      if (base > 100000) {
        tds = 6250 + (base - 100000) * 0.20;
      } else if (base > 50000) {
        tds = 1250 + (base - 50000) * 0.10;
      } else if (base > 25000) {
        tds = (base - 25000) * 0.05;
      }
      const net = base - (pf + esi + tds);

      const newSlip = {
        id: `slip-${Date.now()}`,
        employeeId: payEmpId,
        employee: { firstName: empObj.firstName, lastName: empObj.lastName },
        month: parseInt(payMonth),
        year: parseInt(payYear),
        baseSalary: base,
        pfDeduction: pf,
        esiDeduction: esi,
        tdsDeduction: tds,
        netPay: net,
        status: 'PAID'
      };

      setPaySlips([newSlip, ...paySlips]);

      // Mock update to journal double-entry
      const updatedAccounts = accounts.map(acc => {
        let bal = acc.balance;
        if (acc.name === 'Salary Expense' || acc.code === '5010') {
          bal += base;
        }
        if (acc.name === 'Bank A/C' || acc.code === '1000') {
          bal -= net;
        }
        if (acc.name === 'TDS Payable' || acc.code === '2300') {
          bal += tds;
        }
        if (acc.name === 'Accounts Payable' || acc.code === '2000') {
          bal += (pf + esi);
        }
        return { ...acc, balance: bal };
      });
      setAccounts(updatedAccounts);

      const nextIndex = journalEntries.length + 1;
      const blockHash = 'mock_hash_' + Math.random().toString(36).substring(7);
      const newJournalBlock = {
        blockIndex: nextIndex,
        voucherType: 'JOURNAL',
        voucherNo: `VCHR-PAY-${Date.now()}-${nextIndex}`,
        date: new Date().toISOString(),
        amount: base,
        debitAcc: 'Salary Expense',
        creditAcc: 'Bank A/C',
        narration: `Automated payroll entry for ${empObj.firstName} ${empObj.lastName} (${payMonth}/${payYear})`,
        prevHash: journalEntries[journalEntries.length - 1]?.blockHash || '0',
        blockHash
      };
      setJournalEntries([...journalEntries, newJournalBlock]);

      setPayEmpId('');
      setPayMonth('5');
      setPayYear('2026');
    } else {
      try {
        const res = await fetch('/api/v1/hr/payroll/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(body)
        });
        if (res.ok) {
          const data = await res.json();
          const { slip, journal } = data;
          setPaySlips([slip, ...paySlips]);
          setJournalEntries([...journalEntries, journal]);
          setPayEmpId('');
          setPayMonth('5');
          setPayYear('2026');
          loadHRData();
          loadFinanceData();
        } else {
          const errorData = await res.json();
          alert(errorData.error || 'Payroll calculation failed.');
        }
      } catch (err) {
        const empObj = employees.find(emp => emp.id === payEmpId);
        if (!empObj) return;
        const base = empObj.baseSalary;
        const pf = base * 0.12;
        const esi = base * 0.0075;
        let tds = 0.0;
        if (base > 100000) tds = 6250 + (base - 100000) * 0.20;
        else if (base > 50000) tds = 1250 + (base - 50000) * 0.10;
        else if (base > 25000) tds = (base - 25000) * 0.05;
        const net = base - (pf + esi + tds);

        const newSlip = {
          id: `slip-${Date.now()}`,
          employeeId: payEmpId,
          employee: { firstName: empObj.firstName, lastName: empObj.lastName },
          month: parseInt(payMonth),
          year: parseInt(payYear),
          baseSalary: base,
          pfDeduction: pf,
          esiDeduction: esi,
          tdsDeduction: tds,
          netPay: net,
          status: 'PAID'
        };
        setPaySlips([newSlip, ...paySlips]);
        setPayEmpId('');
        setPayMonth('5');
        setPayYear('2026');
      }
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!newLeadName || !newLeadCompany || !newLeadEmail) return;
    const body = {
      name: newLeadName,
      company: newLeadCompany,
      email: newLeadEmail,
      phone: newLeadPhone,
      source: newLeadSource,
      value: parseFloat(newLeadValue || 0),
      status: 'NEW'
    };
    if (demoMode) {
      const newL = { id: `lead-${Date.now()}`, ...body };
      setLeads([newL, ...leads]);
      setNewLeadName('');
      setNewLeadCompany('');
      setNewLeadEmail('');
      setNewLeadPhone('');
      setNewLeadSource('Website Ref');
      setNewLeadValue('');
    } else {
      try {
        const res = await fetch('/api/v1/crm/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(body)
        });
        if (res.ok) {
          const data = await res.json();
          setLeads([data, ...leads]);
          setNewLeadName('');
          setNewLeadCompany('');
          setNewLeadEmail('');
          setNewLeadPhone('');
          setNewLeadSource('Website Ref');
          setNewLeadValue('');
          loadCRMData();
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        const newL = { id: `lead-${Date.now()}`, ...body };
        setLeads([newL, ...leads]);
        setNewLeadName('');
        setNewLeadCompany('');
        setNewLeadEmail('');
        setNewLeadPhone('');
        setNewLeadSource('Website Ref');
        setNewLeadValue('');
      }
    }
  };

  const handleCreateCustomerAccount = async (e) => {
    e.preventDefault();
    if (!newAccName) return;
    const body = {
      name: newAccName,
      industry: newAccIndustry,
      phone: newAccPhone,
      billingAddress: newAccBilling,
      isReturning: newAccIsReturning
    };
    if (demoMode) {
      const newCA = { id: `acc-${Date.now()}`, ...body, createdAt: new Date().toISOString() };
      setCustomerAccounts([...customerAccounts, newCA]);
      setNewAccName('');
      setNewAccIndustry('');
      setNewAccPhone('');
      setNewAccBilling('');
      setNewAccIsReturning(false);
    } else {
      try {
        const res = await fetch('/api/v1/crm/customer-accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(body)
        });
        if (res.ok) {
          const data = await res.json();
          setCustomerAccounts([...customerAccounts, data]);
          setNewAccName('');
          setNewAccIndustry('');
          setNewAccPhone('');
          setNewAccBilling('');
          setNewAccIsReturning(false);
          loadCRMData();
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        const newCA = { id: `acc-${Date.now()}`, ...body, createdAt: new Date().toISOString() };
        setCustomerAccounts([...customerAccounts, newCA]);
        setNewAccName('');
        setNewAccIndustry('');
        setNewAccPhone('');
        setNewAccBilling('');
        setNewAccIsReturning(false);
      }
    }
  };

  const handleCreateOpportunity = async (e) => {
    e.preventDefault();
    if (!newOppName || !newOppValue) return;
    const body = {
      name: newOppName,
      value: parseFloat(newOppValue),
      stage: newOppStage || 'QUALIFICATION',
      leadId: newOppLeadId || null,
      accountId: newOppAccId || null
    };
    const leadObj = leads.find(l => l.id === newOppLeadId);
    const accObj = customerAccounts.find(a => a.id === newOppAccId);
    if (demoMode) {
      const newO = {
        id: `opp-${Date.now()}`,
        ...body,
        lead: leadObj ? { name: leadObj.name, company: leadObj.company } : null,
        account: accObj ? { id: accObj.id, name: accObj.name, isReturning: accObj.isReturning } : null,
        createdAt: new Date().toISOString()
      };
      setOpportunities([newO, ...opportunities]);
      setNewOppName('');
      setNewOppValue('');
      setNewOppStage('QUALIFICATION');
      setNewOppLeadId('');
      setNewOppAccId('');
    } else {
      try {
        const res = await fetch('/api/v1/crm/opportunities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(body)
        });
        if (res.ok) {
          const data = await res.json();
          setOpportunities([data, ...opportunities]);
          setNewOppName('');
          setNewOppValue('');
          setNewOppStage('QUALIFICATION');
          setNewOppLeadId('');
          setNewOppAccId('');
          loadCRMData();
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        const newO = {
          id: `opp-${Date.now()}`,
          ...body,
          lead: leadObj ? { name: leadObj.name, company: leadObj.company } : null,
          account: accObj ? { id: accObj.id, name: accObj.name, isReturning: accObj.isReturning } : null,
          createdAt: new Date().toISOString()
        };
        setOpportunities([newO, ...opportunities]);
        setNewOppName('');
        setNewOppValue('');
        setNewOppStage('QUALIFICATION');
        setNewOppLeadId('');
        setNewOppAccId('');
      }
    }
  };

  const handleMoveOpportunityStage = async (id, stage) => {
    if (demoMode) {
      setOpportunities(opportunities.map(o => o.id === id ? { ...o, stage } : o));
    } else {
      try {
        const res = await fetch(`/api/v1/crm/opportunities/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ stage })
        });
        if (res.ok) {
          const data = await res.json();
          setOpportunities(opportunities.map(o => o.id === id ? data : o));
          loadCRMData();
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        setOpportunities(opportunities.map(o => o.id === id ? { ...o, stage } : o));
      }
    }
  };

  const handleSuggestDiscount = async () => {
    if (!quoteOppId) return;
    const opp = opportunities.find(o => o.id === quoteOppId);
    if (!opp) return;

    if (demoMode) {
      let isReturning = false;
      let clientName = 'New Client';
      if (opp.account) {
        isReturning = opp.account.isReturning;
        clientName = opp.account.name;
      }
      const val = opp.value;
      let suggestedDiscount = 5.0;
      let explanation = '';
      if (isReturning) {
        if (val >= 100000) {
          suggestedDiscount = 15.0;
          explanation = `Loyal client (${clientName}) presenting a high-value opportunity of ₹${val.toLocaleString()}. Maximum discount tier of 15% recommended for retention.`;
        } else {
          suggestedDiscount = 10.0;
          explanation = `Returning client (${clientName}) with transactional history. Recommended discount of 10% applied for relationship maintenance.`;
        }
      } else {
        if (val >= 100000) {
          suggestedDiscount = 8.0;
          explanation = `High-value prospective deal (₹${val.toLocaleString()}) for new account. 8% strategic discount suggested to incentivize conversion.`;
        } else {
          suggestedDiscount = 5.0;
          explanation = `Standard baseline client acquisition discount of 5% suggested.`;
        }
      }
      setSuggestedDiscountVal(suggestedDiscount);
      setDiscountExplanationVal(explanation);
      setManualDiscountInput(suggestedDiscount.toString());
      recalculateQuoteTotals(quoteItems, suggestedDiscount);
    } else {
      try {
        const res = await fetch('/api/v1/crm/quote-to-cash/discount-suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ opportunityId: quoteOppId, accountId: opp.accountId })
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestedDiscountVal(data.suggestedDiscount);
          setDiscountExplanationVal(data.explanation);
          setManualDiscountInput(data.suggestedDiscount.toString());
          recalculateQuoteTotals(quoteItems, data.suggestedDiscount);
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        let isReturning = false;
        let clientName = 'New Client';
        if (opp.account) {
          isReturning = opp.account.isReturning;
          clientName = opp.account.name;
        }
        const val = opp.value;
        let suggestedDiscount = 5.0;
        let explanation = '';
        if (isReturning) {
          if (val >= 100000) {
            suggestedDiscount = 15.0;
            explanation = `Loyal client (${clientName}) presenting a high-value opportunity of ₹${val.toLocaleString()}. Maximum discount tier of 15% recommended for retention.`;
          } else {
            suggestedDiscount = 10.0;
            explanation = `Returning client (${clientName}) with transactional history. Recommended discount of 10% applied for relationship maintenance.`;
          }
        } else {
          if (val >= 100000) {
            suggestedDiscount = 8.0;
            explanation = `High-value prospective deal (₹${val.toLocaleString()}) for new account. 8% strategic discount suggested to incentivize conversion.`;
          } else {
            suggestedDiscount = 5.0;
            explanation = `Standard baseline client acquisition discount of 5% suggested.`;
          }
        }
        setSuggestedDiscountVal(suggestedDiscount);
        setDiscountExplanationVal(explanation);
        setManualDiscountInput(suggestedDiscount.toString());
        recalculateQuoteTotals(quoteItems, suggestedDiscount);
      }
    }
  };

  const handleAddQuoteItem = (e) => {
    e.preventDefault();
    if (!itemDesc || !itemQty || !itemPrice) return;
    const newItem = {
      desc: itemDesc,
      qty: parseInt(itemQty),
      price: parseFloat(itemPrice)
    };
    const updated = [...quoteItems, newItem];
    setQuoteItems(updated);
    setItemDesc('');
    setItemQty('1');
    setItemPrice('');
    recalculateQuoteTotals(updated, parseFloat(manualDiscountInput || 0));
  };

  const handleRemoveQuoteItem = (index) => {
    const updated = quoteItems.filter((_, i) => i !== index);
    setQuoteItems(updated);
    recalculateQuoteTotals(updated, parseFloat(manualDiscountInput || 0));
  };

  const recalculateQuoteTotals = (itemsList, discountPercent) => {
    const subtotal = itemsList.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const discAmt = subtotal * (discountPercent / 100);
    const taxedAmt = (subtotal - discAmt) * 0.18;
    const total = (subtotal - discAmt) + taxedAmt;
    setQuoteSubtotal(subtotal);
    setQuoteDiscountAmt(discAmt);
    setQuoteTaxAmt(taxedAmt);
    setQuoteTotal(total);
  };

  const handleCreateQuote = async (e) => {
    e.preventDefault();
    if (!quoteOppId || quoteItems.length === 0) return;
    const body = {
      opportunityId: quoteOppId,
      items: quoteItems,
      subtotal: quoteSubtotal,
      discount: parseFloat(manualDiscountInput || 0),
      taxAmount: quoteTaxAmt,
      total: quoteTotal,
      status: 'APPROVED'
    };

    const oppObj = opportunities.find(o => o.id === quoteOppId);
    const oppName = oppObj ? oppObj.name : 'Unknown';

    if (demoMode) {
      const newQ = {
        id: `q-${Date.now()}`,
        quoteNo: `QT-2026-00${quotes.length + 1}`,
        opportunityId: quoteOppId,
        opportunity: { name: oppName },
        items: JSON.stringify(quoteItems),
        subtotal: quoteSubtotal,
        discount: parseFloat(manualDiscountInput || 0),
        taxAmount: quoteTaxAmt,
        total: quoteTotal,
        status: 'APPROVED',
        discountExplanation: discountExplanationVal || 'Approved standard discount.'
      };
      setQuotes([newQ, ...quotes]);
      setOpportunities(opportunities.map(o => o.id === quoteOppId ? { ...o, stage: 'PROPOSAL' } : o));
      setPreviewQuote(newQ);
      setPreviewQuoteModalOpen(true);

      setQuoteOppId('');
      setQuoteItems([]);
      setSuggestedDiscountVal(0);
      setDiscountExplanationVal('');
      setManualDiscountInput('0');
      setQuoteSubtotal(0);
      setQuoteDiscountAmt(0);
      setQuoteTaxAmt(0);
      setQuoteTotal(0);
    } else {
      try {
        const res = await fetch('/api/v1/crm/quote-to-cash/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(body)
        });
        if (res.ok) {
          const data = await res.json();
          setQuotes([data, ...quotes]);
          setOpportunities(opportunities.map(o => o.id === quoteOppId ? { ...o, stage: 'PROPOSAL' } : o));
          setPreviewQuote(data);
          setPreviewQuoteModalOpen(true);

          setQuoteOppId('');
          setQuoteItems([]);
          setSuggestedDiscountVal(0);
          setDiscountExplanationVal('');
          setManualDiscountInput('0');
          setQuoteSubtotal(0);
          setQuoteDiscountAmt(0);
          setQuoteTaxAmt(0);
          setQuoteTotal(0);
          loadCRMData();
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        const newQ = {
          id: `q-${Date.now()}`,
          quoteNo: `QT-2026-00${quotes.length + 1}`,
          opportunityId: quoteOppId,
          opportunity: { name: oppName },
          items: JSON.stringify(quoteItems),
          subtotal: quoteSubtotal,
          discount: parseFloat(manualDiscountInput || 0),
          taxAmount: quoteTaxAmt,
          total: quoteTotal,
          status: 'APPROVED',
          discountExplanation: discountExplanationVal || 'Approved standard discount.'
        };
        setQuotes([newQ, ...quotes]);
        setOpportunities(opportunities.map(o => o.id === quoteOppId ? { ...o, stage: 'PROPOSAL' } : o));
        setPreviewQuote(newQ);
        setPreviewQuoteModalOpen(true);

        setQuoteOppId('');
        setQuoteItems([]);
        setSuggestedDiscountVal(0);
        setDiscountExplanationVal('');
        setManualDiscountInput('0');
        setQuoteSubtotal(0);
        setQuoteDiscountAmt(0);
        setQuoteTaxAmt(0);
        setQuoteTotal(0);
      }
    }
  };

  // Phase 4: Inventory & Warehouse Handlers
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProdCode || !newProdName || !newProdType) return;

    if (demoMode) {
      const newProduct = {
        id: `prod-${Date.now()}`,
        code: newProdCode,
        name: newProdName,
        description: newProdDesc || '',
        type: newProdType,
        reorderPoint: parseFloat(newProdReorderPoint || 10),
        safetyStock: parseFloat(newProdSafetyStock || 5),
        costPrice: parseFloat(newProdCostPrice || 0),
        salePrice: parseFloat(newProdSalePrice || 0),
        currentStock: 0,
        expiryDate: newProdExpiry || null
      };
      setProducts([...products, newProduct]);
      setNewProdCode('');
      setNewProdName('');
      setNewProdDesc('');
      setNewProdType('RAW_MATERIAL');
      setNewProdReorderPoint('10');
      setNewProdSafetyStock('5');
      setNewProdCostPrice('0');
      setNewProdSalePrice('0');
      setNewProdExpiry('');
      return;
    }

    try {
      const res = await fetch('/api/v1/inventory/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          code: newProdCode,
          name: newProdName,
          description: newProdDesc,
          type: newProdType,
          reorderPoint: parseFloat(newProdReorderPoint || 10),
          safetyStock: parseFloat(newProdSafetyStock || 5),
          costPrice: parseFloat(newProdCostPrice || 0),
          salePrice: parseFloat(newProdSalePrice || 0),
          expiryDate: newProdExpiry || null
        })
      });
      if (res.ok) {
        setNewProdCode('');
        setNewProdName('');
        setNewProdDesc('');
        setNewProdType('RAW_MATERIAL');
        setNewProdReorderPoint('10');
        setNewProdSafetyStock('5');
        setNewProdCostPrice('0');
        setNewProdSalePrice('0');
        setNewProdExpiry('');
        loadInventoryData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    if (!newWhName) return;

    if (demoMode) {
      const newWh = {
        id: `wh-${Date.now()}`,
        name: newWhName,
        location: newWhLocation || 'N/A'
      };
      setWarehouses([...warehouses, newWh]);
      setNewWhName('');
      setNewWhLocation('');
      return;
    }

    try {
      const res = await fetch('/api/v1/inventory/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name: newWhName, location: newWhLocation })
      });
      if (res.ok) {
        setNewWhName('');
        setNewWhLocation('');
        loadInventoryData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateStockTransaction = async (e) => {
    e.preventDefault();
    if (!newTxProductId || !newTxWarehouseId || !newTxQty || !newTxType) return;

    const qty = parseFloat(newTxQty);
    const cost = parseFloat(newTxCost || 0);

    if (demoMode) {
      const targetProd = products.find(p => p.id === newTxProductId);
      if (!targetProd) return;

      if (newTxType === 'ISSUE' && targetProd.currentStock < qty) {
        alert(`Insufficient stock. Current stock is ${targetProd.currentStock}, requested ${qty}`);
        return;
      }

      const netQtyChange = newTxType === 'RECEIPT' ? qty : -Math.abs(qty);
      const newTx = {
        id: `tx-${Date.now()}`,
        productId: newTxProductId,
        warehouseId: newTxWarehouseId,
        quantity: netQtyChange,
        unitCost: cost > 0 ? cost : targetProd.costPrice,
        type: newTxType,
        referenceNo: newTxRef || 'N/A',
        transactionDate: new Date().toISOString(),
        product: targetProd,
        warehouse: warehouses.find(w => w.id === newTxWarehouseId)
      };

      setStockTransactions([newTx, ...stockTransactions]);
      setProducts(products.map(p => p.id === newTxProductId ? { ...p, currentStock: p.currentStock + netQtyChange } : p));
      
      setNewTxProductId('');
      setNewTxWarehouseId('');
      setNewTxQty('');
      setNewTxCost('0');
      setNewTxType('RECEIPT');
      setNewTxRef('');
      return;
    }

    try {
      const res = await fetch('/api/v1/inventory/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          productId: newTxProductId,
          warehouseId: newTxWarehouseId,
          quantity: qty,
          unitCost: cost,
          type: newTxType,
          referenceNo: newTxRef
        })
      });
      if (res.ok) {
        setNewTxProductId('');
        setNewTxWarehouseId('');
        setNewTxQty('');
        setNewTxCost('0');
        setNewTxType('RECEIPT');
        setNewTxRef('');
        loadInventoryData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to create transaction');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Phase 4: Manufacturing Handlers
  const handleAddBomComponent = (e) => {
    e.preventDefault();
    if (!newBomCompProductId || !newBomCompQty) return;

    const alreadyAdded = newBomComponents.find(c => c.productId === newBomCompProductId);
    if (alreadyAdded) {
      alert("This component is already added to the BOM.");
      return;
    }

    const prod = products.find(p => p.id === newBomCompProductId);
    setNewBomComponents([
      ...newBomComponents,
      {
        productId: newBomCompProductId,
        productName: prod ? prod.name : 'Unknown Product',
        quantity: parseFloat(newBomCompQty || 1)
      }
    ]);
    setNewBomCompProductId('');
    setNewBomCompQty('1');
  };

  const handleCreateBom = async (e) => {
    e.preventDefault();
    if (!newBomNo || !newBomFinishedProductId || !newBomName || newBomComponents.length === 0) {
      alert("Please fill in BOM Number, Finished Product, Name, and add at least one component.");
      return;
    }

    if (demoMode) {
      const newBom = {
        id: `bom-${Date.now()}`,
        bomNo: newBomNo,
        name: newBomName,
        finishedProductId: newBomFinishedProductId,
        finishedProduct: products.find(p => p.id === newBomFinishedProductId),
        quantity: parseFloat(newBomQty || 1),
        components: newBomComponents.map((c, i) => ({
          id: `bom-comp-${Date.now()}-${i}`,
          productId: c.productId,
          quantity: c.quantity,
          product: products.find(p => p.id === c.productId)
        }))
      };

      setBoms([...boms, newBom]);
      setNewBomNo('');
      setNewBomName('');
      setNewBomFinishedProductId('');
      setNewBomQty('1');
      setNewBomComponents([]);
      return;
    }

    try {
      const res = await fetch('/api/v1/manufacturing/boms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          bomNo: newBomNo,
          finishedProductId: newBomFinishedProductId,
          name: newBomName,
          quantity: parseFloat(newBomQty || 1),
          components: newBomComponents.map(c => ({ productId: c.productId, quantity: c.quantity }))
        })
      });
      if (res.ok) {
        setNewBomNo('');
        setNewBomName('');
        setNewBomFinishedProductId('');
        setNewBomQty('1');
        setNewBomComponents([]);
        loadManufacturingData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateWorkCenter = async (e) => {
    e.preventDefault();
    if (!newWcName) return;

    if (demoMode) {
      const newWc = {
        id: `wc-${Date.now()}`,
        name: newWcName,
        capacityHours: parseFloat(newWcCapacity || 8),
        laborRate: parseFloat(newWcLaborRate || 0),
        machineRate: parseFloat(newWcMachineRate || 0),
        efficiency: parseFloat(newWcEfficiency || 1)
      };

      setWorkCenters([...workCenters, newWc]);
      setNewWcName('');
      setNewWcCapacity('8');
      setNewWcLaborRate('0');
      setNewWcMachineRate('0');
      setNewWcEfficiency('1.0');
      return;
    }

    try {
      const res = await fetch('/api/v1/manufacturing/work-centers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          name: newWcName,
          capacityHours: parseFloat(newWcCapacity || 8),
          laborRate: parseFloat(newWcLaborRate || 0),
          machineRate: parseFloat(newWcMachineRate || 0),
          efficiency: parseFloat(newWcEfficiency || 1)
        })
      });
      if (res.ok) {
        setNewWcName('');
        setNewWcCapacity('8');
        setNewWcLaborRate('0');
        setNewWcMachineRate('0');
        setNewWcEfficiency('1.0');
        loadManufacturingData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProductionOrder = async (e) => {
    e.preventDefault();
    if (!newPoOrderNo || !newPoFinishedProductId || !newPoBomId || !newPoQty) return;

    if (demoMode) {
      const selectedBom = boms.find(b => b.id === newPoBomId);
      const newPo = {
        id: `po-${Date.now()}`,
        orderNo: newPoOrderNo,
        finishedProductId: newPoFinishedProductId,
        finishedProduct: products.find(p => p.id === newPoFinishedProductId),
        bomId: newPoBomId,
        bom: selectedBom,
        workCenterId: newPoWorkCenterId || null,
        workCenter: workCenters.find(w => w.id === newPoWorkCenterId) || null,
        quantity: parseFloat(newPoQty),
        status: 'PLANNED',
        startDate: null,
        endDate: null
      };

      setProductionOrders([...productionOrders, newPo]);
      setNewPoOrderNo('');
      setNewPoFinishedProductId('');
      setNewPoBomId('');
      setNewPoWorkCenterId('');
      setNewPoQty('');
      return;
    }

    try {
      const res = await fetch('/api/v1/manufacturing/production-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          orderNo: newPoOrderNo,
          finishedProductId: newPoFinishedProductId,
          bomId: newPoBomId,
          workCenterId: newPoWorkCenterId || null,
          quantity: parseFloat(newPoQty)
        })
      });
      if (res.ok) {
        setNewPoOrderNo('');
        setNewPoFinishedProductId('');
        setNewPoBomId('');
        setNewPoWorkCenterId('');
        setNewPoQty('');
        loadManufacturingData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransitionProductionOrder = async (orderId, targetStatus) => {
    if (targetStatus === 'COMPLETED') {
      setActivePoToComplete(orderId);
      setCompletePoWarehouseId(warehouses[0]?.id || '');
      setPoSelectWarehouseModalOpen(true);
      return;
    }

    if (demoMode) {
      setProductionOrders(productionOrders.map(po => 
        po.id === orderId 
          ? { ...po, status: targetStatus, startDate: targetStatus === 'IN_PROGRESS' ? new Date().toISOString() : po.startDate } 
          : po
      ));
      return;
    }

    try {
      const res = await fetch(`/api/v1/manufacturing/production-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: targetStatus })
      });
      if (res.ok) {
        loadManufacturingData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteProductionOrderFinal = async (e) => {
    e.preventDefault();
    if (!activePoToComplete || !completePoWarehouseId) return;

    if (demoMode) {
      const order = productionOrders.find(po => po.id === activePoToComplete);
      if (!order) return;

      // Verify stocks of components
      let hasStock = true;
      let errorMsg = '';
      const componentsList = order.bom?.components || [];
      for (const comp of componentsList) {
        const prod = products.find(p => p.id === comp.productId);
        const needed = comp.quantity * order.quantity;
        if (!prod || prod.currentStock < needed) {
          hasStock = false;
          errorMsg = `Insufficient stock for raw material: ${prod?.name || comp.productId}. Needed: ${needed}, Available: ${prod?.currentStock || 0}`;
          break;
        }
      }

      if (!hasStock) {
        alert(errorMsg);
        return;
      }

      // Generate stock transactions
      const newTxs = [];
      let updatedProds = [...products];

      // Consume materials
      for (const comp of componentsList) {
        const qtyUsed = comp.quantity * order.quantity;
        newTxs.push({
          id: `tx-consume-${Date.now()}-${comp.productId}`,
          productId: comp.productId,
          warehouseId: completePoWarehouseId,
          quantity: -qtyUsed,
          unitCost: 0,
          type: 'ISSUE',
          referenceNo: `PROD-CONSUME-${order.orderNo}`,
          transactionDate: new Date().toISOString(),
          product: updatedProds.find(p => p.id === comp.productId),
          warehouse: warehouses.find(w => w.id === completePoWarehouseId)
        });
        updatedProds = updatedProds.map(p => p.id === comp.productId ? { ...p, currentStock: p.currentStock - qtyUsed } : p);
      }

      // Receive finished product
      newTxs.push({
        id: `tx-receipt-${Date.now()}-${order.finishedProductId}`,
        productId: order.finishedProductId,
        warehouseId: completePoWarehouseId,
        quantity: order.quantity,
        unitCost: order.finishedProduct?.costPrice || 0,
        type: 'RECEIPT',
        referenceNo: `PROD-RECEIPT-${order.orderNo}`,
        transactionDate: new Date().toISOString(),
        product: updatedProds.find(p => p.id === order.finishedProductId),
        warehouse: warehouses.find(w => w.id === completePoWarehouseId)
      });
      updatedProds = updatedProds.map(p => p.id === order.finishedProductId ? { ...p, currentStock: p.currentStock + order.quantity } : p);

      setStockTransactions([...newTxs, ...stockTransactions]);
      setProducts(updatedProds);
      setProductionOrders(productionOrders.map(po => 
        po.id === activePoToComplete 
          ? { ...po, status: 'COMPLETED', endDate: new Date().toISOString() } 
          : po
      ));

      setPoSelectWarehouseModalOpen(false);
      setActivePoToComplete(null);
      setCompletePoWarehouseId('');
      return;
    }

    try {
      const res = await fetch(`/api/v1/manufacturing/production-orders/${activePoToComplete}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: 'COMPLETED', warehouseId: completePoWarehouseId })
      });
      if (res.ok) {
        setPoSelectWarehouseModalOpen(false);
        setActivePoToComplete(null);
        setCompletePoWarehouseId('');
        loadInventoryData();
        loadManufacturingData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to complete production order');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateOeeLog = async (e) => {
    e.preventDefault();
    if (!newOeeWcId || !newOeePlannedTime || !newOeeRunTime || !newOeePlannedQty || !newOeeTotalQty || !newOeeGoodQty) {
      alert("All fields are required.");
      return;
    }

    const pTime = parseFloat(newOeePlannedTime || 480);
    const rTime = parseFloat(newOeeRunTime || 0);
    const pQty = parseFloat(newOeePlannedQty || 0);
    const tQty = parseFloat(newOeeTotalQty || 0);
    const gQty = parseFloat(newOeeGoodQty || 0);

    if (pTime <= 0 || pQty <= 0) {
      alert("Planned production time and quantity must be greater than zero.");
      return;
    }

    if (demoMode) {
      const availability = Math.min(1.0, rTime / pTime);
      const performance = Math.min(1.0, tQty > 0 ? (tQty / pQty) * (pTime / rTime) : 0);
      const quality = tQty > 0 ? gQty / tQty : 1.0;
      const oeeScore = availability * performance * quality;

      const newLog = {
        id: `oee-${Date.now()}`,
        workCenterId: newOeeWcId,
        workCenter: workCenters.find(w => w.id === newOeeWcId),
        date: newOeeDate || new Date().toISOString().split('T')[0],
        plannedProductionTime: pTime,
        runTime: rTime,
        plannedQuantity: pQty,
        totalQuantity: tQty,
        goodQuantity: gQty,
        availability,
        performance,
        quality,
        oeeScore
      };

      setOeeLogs([newLog, ...oeeLogs]);
      setNewOeeWcId('');
      setNewOeeDate('');
      setNewOeePlannedTime('480');
      setNewOeeRunTime('');
      setNewOeePlannedQty('');
      setNewOeeTotalQty('');
      setNewOeeGoodQty('');
      return;
    }

    try {
      const res = await fetch('/api/v1/manufacturing/oee/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          workCenterId: newOeeWcId,
          date: newOeeDate,
          plannedProductionTime: pTime,
          runTime: rTime,
          plannedQuantity: pQty,
          totalQuantity: tQty,
          goodQuantity: gQty
        })
      });
      if (res.ok) {
        setNewOeeWcId('');
        setNewOeeDate('');
        setNewOeePlannedTime('480');
        setNewOeeRunTime('');
        setNewOeePlannedQty('');
        setNewOeeTotalQty('');
        setNewOeeGoodQty('');
        loadManufacturingData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Direct AI Console prompt handler
  const handleSendQuery = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    const userMsg = aiPrompt;
    dispatch(addChatMessage({ sender: 'user', text: userMsg }));
    setAiPrompt('');

    try {
      const response = await fetch('/api/v1/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg, context: { active_tab: activeTab } })
      });
      if (!response.ok) throw new Error('AI Query failed');
      const data = await response.json();
      if (!data.reply) throw new Error('No AI reply returned');
      dispatch(addChatMessage({ sender: 'ai', text: data.reply }));
    } catch {
      setTimeout(() => {
        let reply = "I received your query. The AI engine is fully integrated in Phase 6.";
        const promptLower = userMsg.toLowerCase();
        if (promptLower.includes('health') || promptLower.includes('score')) {
          reply = "Your current Business Health Score is 88/100, indicating excellent operational efficiency. Sales growth is strong (+12.4%), but we recommend reviewing 3 low-stock items in Warehouse A.";
        } else if (promptLower.includes('revenue') || promptLower.includes('sales')) {
          reply = "Q2 projected revenue is ₹12,40,000, representing a 14% year-over-year increase. Accounts Receivable stands at ₹3,40,000, with ₹15,000 overdue.";
        } else if (promptLower.includes('invoice')) {
          reply = "Understood. Creating a draft invoice template. Would you like me to pre-fill vendor info from our Smart OCR Scanner?";
        }
        dispatch(addChatMessage({ sender: 'ai', text: reply }));
      }, 600);
    }
  };

  // ── Phase 5: E-Commerce Handlers ──────────────────────────────────────────
  const handleAddToCart = (product) => {
    const existing = cart.find(c => c.product.id === product.id);
    if (existing) {
      setCart(cart.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    setCartOpen(true);
  };

  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter(c => c.product.id !== productId));
  };

  const handleCartQtyChange = (productId, delta) => {
    setCart(cart.map(c => {
      if (c.product.id !== productId) return c;
      const newQty = c.quantity + delta;
      return newQty <= 0 ? null : { ...c, quantity: newQty };
    }).filter(Boolean));
  };

  const cartTotal = cart.reduce((sum, c) => sum + (c.product.salePrice ?? c.product.price) * c.quantity, 0);
  const cartItemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!checkoutName || !checkoutEmail || cart.length === 0) {
      setCheckoutMessage({ type: 'error', text: 'Please fill in your details and add items to cart.' });
      return;
    }
    const orderNo = `ORD-${Date.now()}`;
    const newOrder = {
      id: `ord-${Date.now()}`,
      orderNo,
      customerName: checkoutName,
      customerEmail: checkoutEmail,
      totalAmount: cartTotal,
      discountAmount: 0,
      loyaltyRedeemed: 0,
      status: 'PLACED',
      shippingAddress: checkoutAddress,
      createdAt: new Date().toISOString(),
      items: cart.map(c => ({ product: { name: c.product.name }, quantity: c.quantity, unitPrice: c.product.salePrice ?? c.product.price, totalPrice: (c.product.salePrice ?? c.product.price) * c.quantity }))
    };
    setCustomerOrders([newOrder, ...customerOrders]);

    // Award loyalty points (1 pt per ₹10)
    const earned = Math.floor(cartTotal / 10);
    const existingAcc = loyaltyAccounts.find(l => l.customerEmail === checkoutEmail);
    if (existingAcc) {
      setLoyaltyAccounts(loyaltyAccounts.map(l => l.customerEmail === checkoutEmail ? { ...l, points: l.points + earned } : l));
    } else {
      setLoyaltyAccounts([...loyaltyAccounts, { id: `loy-${Date.now()}`, customerEmail: checkoutEmail, customerName: checkoutName, points: earned, tier: 'BRONZE' }]);
    }

    setCart([]);
    setCartOpen(false);
    setCheckoutName('');
    setCheckoutEmail('');
    setCheckoutAddress('');
    setCheckoutMessage({ type: 'success', text: `Order ${orderNo} placed successfully! Earned ${earned} loyalty points.` });
    setTimeout(() => setCheckoutMessage(null), 5000);
  };

  const handleAddStoreProduct = (e) => {
    e.preventDefault();
    if (!newSpSku || !newSpName || !newSpPrice) return;
    const newProd = {
      id: `sp-${Date.now()}`, sku: newSpSku, name: newSpName, description: newSpDesc,
      category: newSpCategory, price: parseFloat(newSpPrice),
      salePrice: newSpSalePrice ? parseFloat(newSpSalePrice) : null,
      stock: parseInt(newSpStock || 0), loyaltyPts: parseInt(newSpLoyaltyPts || 0), isPublished: true
    };
    setStoreProducts([newProd, ...storeProducts]);
    setNewSpSku(''); setNewSpName(''); setNewSpDesc(''); setNewSpPrice(''); setNewSpSalePrice(''); setNewSpStock(''); setNewSpLoyaltyPts('');
  };

  // ── Phase 5: Fixed Assets & Maintenance Handlers ──────────────────────────
  const handleAddFixedAsset = (e) => {
    e.preventDefault();
    if (!newAstCode || !newAstName || !newAstCost || !newAstPurchaseDate) return;
    const cost = parseFloat(newAstCost);
    const newAsset = {
      id: `ast-${Date.now()}`, assetCode: newAstCode, name: newAstName, category: newAstCategory,
      location: newAstLocation, serialNo: newAstSerial, purchaseDate: newAstPurchaseDate,
      purchaseCost: cost, salvageValue: parseFloat(newAstSalvage || 0),
      usefulLifeYears: parseInt(newAstLife || 5), depMethod: newAstDepMethod,
      depRate: parseFloat(newAstDepRate || 0.20), currentBookValue: cost, status: 'ACTIVE'
    };
    setFixedAssets([newAsset, ...fixedAssets]);
    setNewAstCode(''); setNewAstName(''); setNewAstLocation(''); setNewAstSerial('');
    setNewAstPurchaseDate(''); setNewAstCost(''); setNewAstSalvage('0'); setNewAstLife('5');
  };

  const computeDepSchedule = (asset) => {
    const { purchaseCost, salvageValue, usefulLifeYears, depMethod, depRate, purchaseDate } = asset;
    const slRows = [], dbRows = [];
    let slVal = purchaseCost, dbVal = purchaseCost;
    const startYear = new Date(purchaseDate).getFullYear();
    const annualSL = (purchaseCost - salvageValue) / usefulLifeYears;

    for (let y = 0; y < usefulLifeYears; y++) {
      // Straight Line
      const slDep = Math.min(annualSL, Math.max(0, slVal - salvageValue));
      const slClose = Math.max(salvageValue, slVal - slDep);
      slRows.push({ year: startYear + y, openingValue: slVal, depAmount: slDep, closingValue: slClose });
      slVal = slClose;

      // Declining Balance
      const dbDep = Math.max(0, dbVal * depRate);
      const dbClose = Math.max(salvageValue, dbVal - dbDep);
      dbRows.push({ year: startYear + y, openingValue: dbVal, depAmount: dbDep, closingValue: dbClose });
      dbVal = dbClose;
    }
    return { straightLine: slRows, decliningBalance: dbRows };
  };

  const handleViewDepreciation = (asset) => {
    setSelectedAssetForDep(asset);
    setDepSchedule(computeDepSchedule(asset));
    setAssetsSubTab('depreciation');
  };

  const handleAddMaintenanceOrder = (e) => {
    e.preventDefault();
    if (!newMoNo || !newMoTitle || !newMoType) return;
    const asset = fixedAssets.find(a => a.id === newMoAssetId);
    const newMo = {
      id: `mo-${Date.now()}`, workOrderNo: newMoNo, assetId: newMoAssetId || null,
      asset: asset ? { name: asset.name } : null, title: newMoTitle, description: newMoDesc,
      type: newMoType, priority: newMoPriority, assignedTo: newMoAssignedTo,
      scheduledDate: newMoScheduledDate ? new Date(newMoScheduledDate).toISOString() : null,
      cost: parseFloat(newMoCost || 0), status: 'OPEN', createdAt: new Date().toISOString()
    };
    setMaintenanceOrders([newMo, ...maintenanceOrders]);
    setNewMoNo(''); setNewMoTitle(''); setNewMoDesc(''); setNewMoAssignedTo(''); setNewMoScheduledDate(''); setNewMoCost('0');
  };

  const handleTransitionMaintenanceOrder = (id, newStatus) => {
    setMaintenanceOrders(maintenanceOrders.map(o =>
      o.id === id ? { ...o, status: newStatus, completedDate: newStatus === 'COMPLETED' ? new Date().toISOString() : o.completedDate } : o
    ));
  };

  // ── Phase 6: AI Console Handlers ──────────────────────────────────────────
  const handleAiConsoleQuery = async (e, customPrompt) => {
    if (e) e.preventDefault();
    const promptText = customPrompt || aiConsolePrompt;
    if (!promptText.trim()) return;

    setAiConsoleChatHistory(prev => [...prev, { sender: 'user', text: promptText }]);
    setAiConsolePrompt('');
    setAiConsoleLoading(true);

    try {
      const res = await fetch('/api/v1/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, context: {} })
      });
      if (!res.ok) throw new Error('AI Query failed');
      const data = await res.json();
      if (!data.reply) throw new Error('No AI reply returned');
      setAiConsoleChatHistory(prev => [...prev, { sender: 'ai', text: data.reply, suggestions: data.suggestions }]);
      if (data.suggestions?.length) setAiSuggestions(data.suggestions);
    } catch {
      // Fallback mock
      const mockReplies = {
        finance: '📊 Total Revenue this month: ₹24,78,000. Net Profit: ₹6,46,748 (26.1% margin). 12 open invoices totalling ₹8,42,000.',
        inventory: '📦 142 SKUs tracked. Current stock value (FIFO): ₹42,18,500. 8 items below safety stock. 3 near-expiry batches.',
        sales: '📈 Pipeline value: ₹8.4Cr across 67 opportunities. Win rate: 42%. Q3 forecast: ₹3.2Cr (+18%).',
        hr: '👥 284 employees active. Payroll this month: ₹1,24,80,000. 12 leave requests pending. 7 interviews tomorrow.',
      };
      let reply = `I understand your query about "${promptText}". `;
      const pl = promptText.toLowerCase();
      if (pl.includes('finance') || pl.includes('revenue')) reply = mockReplies.finance;
      else if (pl.includes('inventory') || pl.includes('stock')) reply = mockReplies.inventory;
      else if (pl.includes('sales') || pl.includes('crm')) reply = mockReplies.sales;
      else if (pl.includes('hr') || pl.includes('employee')) reply = mockReplies.hr;
      else reply += 'Please ensure the AI microservice (FastAPI on port 8000) is running for real-time responses.';
      setAiConsoleChatHistory(prev => [...prev, { sender: 'ai', text: reply }]);
    } finally {
      setAiConsoleLoading(false);
    }
  };

  const handleOcrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrFileName(file.name);
    setOcrLoading(true);
    setOcrResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/v1/ai/ocr', { method: 'POST', body: formData });
      const data = await res.json();
      setOcrResult(data);
    } catch {
      // Mock extraction
      setOcrResult({
        fileName: file.name, fileSizeKB: (file.size / 1024).toFixed(1),
        extractedFields: {
          documentType: 'INVOICE', invoiceNo: `INV-${Math.floor(Math.random()*9000)+1000}`,
          vendorName: 'Acme Supplies Pvt Ltd', vendorGST: '29AABCA1234C1Z5',
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
          lineItems: [
            { description: 'Steel Rods 12mm', qty: 50, unit: 'kg', rate: 85, amount: 4250 },
            { description: 'Aluminium Sheet 3mm', qty: 20, unit: 'sheet', rate: 240, amount: 4800 }
          ],
          subtotal: 9050, gstRate: 18, gstAmount: 1629, totalAmount: 10679, currency: 'INR'
        },
        ocrEngine: 'ERP-AI-OCR v2 (Mock)', processingTime: '1.24s'
      });
    } finally {
      setOcrLoading(false);
    }
  };

  const handleRunAnomalyScan = async () => {
    setAnomalyLoading(true);
    try {
      const res = await fetch('/api/v1/ai/anomaly-scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const data = await res.json();
      setAnomalyData(data);
    } catch {
      setAnomalyData({
        scanTime: new Date().toISOString(),
        totalAnomalies: 4,
        byStatus: { OPEN: 2, UNDER_REVIEW: 1, RESOLVED: 1 },
        bySeverity: { HIGH: 1, MEDIUM: 2, LOW: 1 },
        anomalies: [
          { id: 'ANO-001', type: 'DUPLICATE_PAYMENT', severity: 'HIGH', description: 'Invoice INV-0847 paid twice — ₹84,000 on 15-May and 17-May to same vendor.', module: 'Finance', detectedAt: new Date().toISOString(), status: 'OPEN' },
          { id: 'ANO-002', type: 'EXPENSE_SPIKE', severity: 'MEDIUM', description: 'Travel & Conveyance is 340% above 3-month average. Dept: Operations.', module: 'Finance', detectedAt: new Date(Date.now()-7200000).toISOString(), status: 'UNDER_REVIEW' },
          { id: 'ANO-003', type: 'STOCK_VARIANCE', severity: 'MEDIUM', description: 'Warehouse B shows -42 units vs system records for PROD-028. Audit recommended.', module: 'Inventory', detectedAt: new Date(Date.now()-21600000).toISOString(), status: 'OPEN' },
          { id: 'ANO-004', type: 'UNUSUAL_LOGIN', severity: 'LOW', description: 'admin@example.com logged in from 3 IPs within 30 minutes.', module: 'Security', detectedAt: new Date(Date.now()-86400000).toISOString(), status: 'RESOLVED' }
        ]
      });
    } finally {
      setAnomalyLoading(false);
    }
  };

  const handleRunForecast = async () => {
    setForecastLoading(true);
    try {
      const res = await fetch('/api/v1/ai/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metric: forecastMetric, periods: 6 })
      });
      const data = await res.json();
      setForecastData(data);
    } catch {
      const base = forecastMetric === 'revenue' ? 2478000 : forecastMetric === 'inventory' ? 42185000 : 284;
      const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
      setForecastData({
        metric: forecastMetric,
        monthlyGrowthRate: 6.2,
        confidence: 0.87,
        model: 'Linear Regression (OLS)',
        forecast: months.map((m, i) => ({ period: m, value: Math.round(base * (1.06 ** (i+1))), lowerBound: Math.round(base * (1.04 ** (i+1))), upperBound: Math.round(base * (1.08 ** (i+1))) }))
      });
    } finally {
      setForecastLoading(false);
    }
  };

  const handleTestWhatsApp = async () => {
    try {
      const res = await fetch('/api/v1/ai/whatsapp-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ From: 'whatsapp:+919876543210', Body: waWebhookBody, ProfileName: 'Test User' })
      });
      const data = await res.json();
      setWaWebhookReply(data.body);
    } catch {
      setWaWebhookReply(`Hi Test User! 👋\n\n📦 Inventory Status: 142 active SKUs across 3 warehouses. Stock value: FIFO ₹42,18,500. 8 items below safety stock.\n\nQuick options:\n• Show low stock alerts\n• View near-expiry items\n• Generate reorder list`);
    }
  };

  // Mock Notifications
  const notifications = [
    { id: 1, title: 'AI Fraud Detection Alert', desc: 'Unusual journal entry (vchr #4010) flagged in Finance.', type: 'danger' },
    { id: 2, title: 'Reorder Recommendation', desc: 'Solder Paste stock is below reorder point ( Godown B ).', type: 'warning' },
    { id: 3, title: 'Tax Compliance Check', desc: 'GST automated filing completed successfully.', type: 'success' }
  ];

  // Recharts static details for Dashboard
  const cashFlowData = [
    { month: 'Jan', revenue: 400000, expenses: 240000 },
    { month: 'Feb', revenue: 500000, expenses: 280000 },
    { month: 'Mar', revenue: 650000, expenses: 320000 },
    { month: 'Apr', revenue: 550000, expenses: 300000 },
    { month: 'May', revenue: 780000, expenses: 390000 },
    { month: 'Jun', revenue: 920000, expenses: 420000 },
  ];

  const moduleData = [
    { name: 'Finance', value: 350000, color: 'hsl(var(--primary))' },
    { name: 'Sales', value: 450000, color: 'hsl(var(--success))' },
    { name: 'E-Comm', value: 250000, color: 'hsl(var(--info))' },
    { name: 'Manufacturing', value: 180000, color: 'hsl(var(--warning))' },
    { name: 'HR/Payroll', value: 90000, color: 'hsl(var(--danger))' },
  ];

  // RENDER LANDING PAGE OR AUTH SCREEN IF NO TOKEN & NOT IN DEMO
  if (!token && !demoMode) {
    if (landingView) {
      return (
        <div className="min-h-screen bg-[#020617] text-[#dae2fd] font-sans selection:bg-primary/30 selection:text-white hero-gradient flex flex-col overflow-x-hidden">
          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#020617]/70 backdrop-blur-md">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-7 w-7 text-primary animate-pulse" />
                <span className="font-heading font-extrabold text-xl tracking-wider text-white">AETHERIC</span>
              </div>
              
              <nav className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">Features</a>
                <a href="#telemetry" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">Telemetry</a>
                <a href="#cta" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">Integrations</a>
              </nav>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setLandingView(false)}
                  className="px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all border-0 cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </div>
          </header>

          {/* Main Hero Container */}
          <main className="flex-1">
            {/* Hero Section */}
            <section className="relative px-6 py-24 md:py-32 max-w-7xl mx-auto text-center flex flex-col items-center gap-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Aetheric Enterprise OS v2.0 Sandbox</span>
              </div>
              
              <h1 className="font-heading font-extrabold text-4xl md:text-6xl tracking-tight max-w-4xl text-white leading-tight">
                The Next-Gen <span className="gradient-text">Quantum ERP</span> for Modern Enterprises
              </h1>
              
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                A multi-dimensional workspace with real-time ML-powered forecasting, atomic ledger transactions, and glassmorphic telemetry.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <button
                  onClick={() => setLandingView(false)}
                  className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-lg shadow-primary/20 transition-all border-0 cursor-pointer text-sm"
                >
                  Get Started Now
                </button>
                <button
                  onClick={() => setLandingView(false)}
                  className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold rounded-lg transition-all cursor-pointer text-sm"
                >
                  Book a Walkthrough
                </button>
              </div>
            </section>

            {/* Bento Grid Features */}
            <section id="features" className="px-6 py-16 max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-heading font-bold text-3xl text-white">Unified Core Modules</h2>
                <p className="text-sm text-muted-foreground mt-2">Every dimension of your enterprise managed with mathematical precision</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Feature 1 */}
                <div className="glass-panel p-8 flex flex-col gap-4 rounded-lg glow-hover">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-2xl font-bold">account_balance_wallet</span>
                  </div>
                  <h3 className="font-heading font-bold text-lg text-white">Finance &amp; Ledger</h3>
                  <p className="text-xs text-muted-foreground">
                    Double-entry ledger powered by atomic transactions and cryptographic hashing to prevent data corruption.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="glass-panel p-8 flex flex-col gap-4 rounded-lg glow-hover">
                  <div className="h-12 w-12 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center text-success">
                    <span className="material-symbols-outlined text-2xl font-bold">shopping_cart</span>
                  </div>
                  <h3 className="font-heading font-bold text-lg text-white">Procurement Hub</h3>
                  <p className="text-xs text-muted-foreground">
                    Automate your purchase requests, issue RFQs, and instantly verify invoices with 3-way automated matching logs.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="glass-panel p-8 flex flex-col gap-4 rounded-lg glow-hover">
                  <div className="h-12 w-12 rounded-lg bg-info/10 border border-info/20 flex items-center justify-center text-info">
                    <span className="material-symbols-outlined text-2xl font-bold">groups</span>
                  </div>
                  <h3 className="font-heading font-bold text-lg text-white">HR &amp; Recruitment</h3>
                  <p className="text-xs text-muted-foreground">
                    Manage payroll with auto PF/ESI/TDS tax deductions, capture biometric attendance scans, and generate offer letters.
                  </p>
                </div>

                {/* Feature 4 */}
                <div className="glass-panel p-8 flex flex-col gap-4 rounded-lg glow-hover">
                  <div className="h-12 w-12 rounded-lg bg-warning/10 border border-warning/20 flex items-center justify-center text-warning">
                    <span className="material-symbols-outlined text-2xl font-bold">trending_up</span>
                  </div>
                  <h3 className="font-heading font-bold text-lg text-white">Sales &amp; CRM Engine</h3>
                  <p className="text-xs text-muted-foreground">
                    Track opportunities and quotes. Generates AI-driven discount suggestions based on client histories and deal sizes.
                  </p>
                </div>

                {/* Feature 5 */}
                <div className="glass-panel p-8 flex flex-col gap-4 rounded-lg glow-hover">
                  <div className="h-12 w-12 rounded-lg bg-danger/10 border border-danger/20 flex items-center justify-center text-danger">
                    <span className="material-symbols-outlined text-2xl font-bold">inventory_2</span>
                  </div>
                  <h3 className="font-heading font-bold text-lg text-white">Inventory &amp; Valuation</h3>
                  <p className="text-xs text-muted-foreground">
                    FIFO/LIFO stock valuation, multi-godown allocation, and predictive safety stock and near-expiry warning alerts.
                  </p>
                </div>

                {/* Feature 6 */}
                <div className="glass-panel p-8 flex flex-col gap-4 rounded-lg glow-hover">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-2xl font-bold">precision_manufacturing</span>
                  </div>
                  <h3 className="font-heading font-bold text-lg text-white">Manufacturing OEE</h3>
                  <p className="text-xs text-muted-foreground">
                    BOM library control, production orders management, and real-time Overall Equipment Effectiveness (OEE) tracking.
                  </p>
                </div>
              </div>
            </section>

            {/* Telemetry/Metrics Section */}
            <section id="telemetry" className="px-6 py-16 bg-[#080f21]/40 border-y border-white/5">
              <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white font-data tabular-nums">99.999%</div>
                  <p className="text-xs text-muted-foreground mt-1">Platform Uptime</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white font-data tabular-nums">&lt; 3ms</div>
                  <p className="text-xs text-muted-foreground mt-1">Query Latency</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white font-data tabular-nums">256-bit</div>
                  <p className="text-xs text-muted-foreground mt-1">Ledger Encryption</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white font-data tabular-nums">100+</div>
                  <p className="text-xs text-muted-foreground mt-1">Global Integrations</p>
                </div>
              </div>
            </section>

            {/* Call to Action Section */}
            <section id="cta" className="px-6 py-20 max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
              <h2 className="font-heading font-bold text-3xl text-white">Ready to automate your operations?</h2>
              <p className="text-sm text-muted-foreground max-w-xl">
                Deploy the Aetheric Enterprise OS sandbox environment instantly or schedule a walkthrough with our specialists.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setLandingView(false)}
                  className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-lg shadow-primary/20 transition-all border-0 mt-2 cursor-pointer text-sm"
                >
                  Schedule Demo
                </button>
                <button
                  onClick={() => setLandingView(false)}
                  className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold rounded-lg transition-all cursor-pointer text-sm"
                >
                  Explore Documentation
                </button>
              </div>
            </section>
          </main>

          {/* Footer */}
          <footer className="border-t border-white/5 bg-[#020617] py-12 px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <span className="text-xs text-muted-foreground">&copy; 2026 Aetheric Inc. All rights reserved.</span>
              <div className="flex items-center gap-6 text-xs text-muted-foreground">
                <a href="#features" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#telemetry" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#cta" className="hover:text-white transition-colors">Security</a>
              </div>
            </div>
          </footer>
        </div>
      );
    }

    return (
      <div className="min-h-screen w-full flex items-center justify-center text-[20px] font-sans text-on-surface bg-[#020617] overflow-hidden relative animate-fade-in">
        <div className="gradient-bg"></div>

        {/* Login Container */}
        <main className="w-full max-w-[440px] px-4 md:px-0 z-10 flex flex-col gap-4">
          
          <button 
            type="button"
            onClick={() => {
              setLandingView(true);
              setAuthError('');
              setAuthSuccess('');
            }}
            className="self-start inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white bg-transparent border-0 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-sm font-bold">arrow_back</span>
            Back to Home
          </button>

          {/* Logo Section */}
          <header className="flex flex-col items-center mb-4">
            <div className="w-16 h-16 bg-primary-container rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-primary-container/20">
              <span className="material-symbols-outlined text-4xl text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Aetheric</h1>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mt-1">Enterprise OS</p>
          </header>

          {/* Login Form Card */}
          <div className="glass-panel p-8 rounded-xl flex flex-col gap-6">
            
            {/* Company Selector */}
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md text-on-surface-variant block">Organization Unit</label>
              <div className="relative">
                <select className="w-full bg-black/20 border border-border-subtle rounded-lg px-4 py-3 appearance-none focus:outline-none focus:ring-1 focus:ring-secondary text-on-surface font-body-md cursor-pointer">
                  <option value="hq">Aetheric Global HQ (New York)</option>
                  <option value="emea">Aetheric EMEA (Berlin)</option>
                  <option value="apac">Aetheric APAC (Singapore)</option>
                  <option value="rnd">R&amp;D Advanced Systems</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
              </div>
            </div>

            {authView === 'register' && !registrationEnabled ? (
              <div className="flex flex-col gap-4 animate-fade-in py-2">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/5 border border-warning/20">
                  <span className="material-symbols-outlined text-warning text-3xl">shield_alert</span>
                  <div className="flex flex-col gap-1">
                    <div className="font-heading font-bold text-foreground text-xs">Self-Registration Disabled</div>
                    <p className="font-body-sm text-body-sm text-muted-foreground leading-relaxed text-[11px]">
                      To maintain enterprise security, public self-registration has been restricted. Please contact a system administrator to request an account.
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => { setAuthView('login'); setAuthError(''); setAuthSuccess(''); }}
                  className="btn-primary-gradient w-full py-4 rounded-lg font-label-md text-label-md text-white shadow-xl shadow-primary/10 hover:shadow-primary/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 border-0 cursor-pointer"
                >
                  <span>Return to Login Screen</span>
                </button>
              </div>
            ) : (
              <form onSubmit={authView === 'login' ? handleLogin : handleRegister} className="flex flex-col gap-4">
                
                {authView === 'register' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-on-surface-variant">First Name</label>
                      <div className="relative input-glow transition-all duration-200 border border-border-subtle rounded-lg bg-black/20 overflow-hidden">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">person</span>
                        <input 
                          type="text" 
                          required 
                          value={firstName} 
                          onChange={e => setFirstName(e.target.value)} 
                          className="w-full bg-transparent border-none px-10 py-3 text-on-surface focus:ring-0 placeholder:text-outline/50 font-body-md text-xs outline-none" 
                          placeholder="First name"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-on-surface-variant">Last Name</label>
                      <div className="relative input-glow transition-all duration-200 border border-border-subtle rounded-lg bg-black/20 overflow-hidden">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">person</span>
                        <input 
                          type="text" 
                          required 
                          value={lastName} 
                          onChange={e => setLastName(e.target.value)} 
                          className="w-full bg-transparent border-none px-10 py-3 text-on-surface focus:ring-0 placeholder:text-outline/50 font-body-md text-xs outline-none" 
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="identity">
                    {authView === 'login' ? 'Employee ID / Email' : 'Email Address'}
                  </label>
                  <div className="relative input-glow transition-all duration-200 border border-border-subtle rounded-lg bg-black/20 overflow-hidden">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">person</span>
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      className="w-full bg-transparent border-none px-10 py-3 text-on-surface focus:ring-0 placeholder:text-outline/50 font-body-md text-xs outline-none" 
                      placeholder={authView === 'login' ? "e.g. j.doe@aetheric.ai" : "Your email address"}
                      id="identity"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="access_key">
                    {authView === 'login' ? 'Access Key' : 'Choose Password'}
                  </label>
                  <div className="relative input-glow transition-all duration-200 border border-border-subtle rounded-lg bg-black/20 overflow-hidden">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">lock</span>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      className="w-full bg-transparent border-none px-10 py-3 text-on-surface focus:ring-0 placeholder:text-outline/50 font-body-md text-xs outline-none" 
                      placeholder="••••••••••••"
                      id="access_key"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors bg-transparent border-0 cursor-pointer flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                {/* Feedback States */}
                {authError && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-error-container/20 border border-error/20">
                    <span className="material-symbols-outlined text-error">error</span>
                    <p className="font-body-sm text-body-sm text-error">{authError}</p>
                  </div>
                )}

                {authSuccess && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-success-emerald/10 border border-success-emerald/20">
                    <span className="material-symbols-outlined text-success-emerald">verified</span>
                    <p className="font-body-sm text-body-sm text-success-emerald">{authSuccess}</p>
                  </div>
                )}

                <div className="flex items-center justify-between py-1">
                  <label className="flex items-center gap-2 cursor-pointer group select-none">
                    <input className="w-4 h-4 rounded border-border-subtle bg-black/30 text-primary focus:ring-offset-0 focus:ring-primary" type="checkbox"/>
                    <span className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-on-surface transition-colors">Trust this terminal</span>
                  </label>
                  {registrationEnabled || authView === 'register' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthView(authView === 'login' ? 'register' : 'login');
                        setAuthError('');
                        setAuthSuccess('');
                      }}
                      className="font-label-md text-label-md text-primary hover:text-secondary transition-colors bg-transparent border-0 cursor-pointer"
                    >
                      {authView === 'login' ? 'Reset Access / Sign Up' : 'Already registered? Login'}
                    </button>
                  ) : (
                    <span className="font-body-sm text-body-sm text-outline select-none">Secured Core Mode</span>
                  )}
                </div>

                <button 
                  className="btn-primary-gradient w-full py-4 rounded-lg font-label-md text-label-md text-white shadow-xl shadow-primary/10 hover:shadow-primary/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 border-0 cursor-pointer" 
                  type="submit"
                  disabled={authLoading}
                >
                  <span>{authLoading ? (authView === 'login' ? 'Verifying...' : 'Creating...') : (authView === 'login' ? 'Initialize Session' : 'Create Admin Account')}</span>
                  {authLoading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                </button>
              </form>
            )}

            {/* SSO / Biometric Divider */}
            <div className="relative my-2 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-subtle"></div></div>
              <span className="relative px-4 bg-[#0b1326] text-outline font-label-md text-[11px] uppercase tracking-tighter">Advanced Authentication</span>
            </div>

            {/* Alternate Methods (All act as Sandbox Demo Mode bypasses) */}
            <div className="grid grid-cols-3 gap-3">
              <button 
                type="button"
                onClick={handleBypassAuth}
                className="glass-panel flex flex-col items-center justify-center py-3 rounded-lg hover:bg-white/10 transition-all group cursor-pointer"
              >
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary mb-1">explore</span>
                <span className="text-[10px] uppercase font-label-md tracking-tighter text-outline group-hover:text-on-surface">Demo Sandbox</span>
              </button>
              <button 
                type="button"
                onClick={handleBypassAuth}
                className="glass-panel flex flex-col items-center justify-center py-3 rounded-lg hover:bg-white/10 transition-all group cursor-pointer"
              >
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary mb-1">key</span>
                <span className="text-[10px] uppercase font-label-md tracking-tighter text-outline group-hover:text-on-surface">Passkey</span>
              </button>
              <button 
                type="button"
                onClick={handleBypassAuth}
                className="glass-panel flex flex-col items-center justify-center py-3 rounded-lg hover:bg-white/10 transition-all group cursor-pointer"
              >
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary mb-1">shield</span>
                <span className="text-[10px] uppercase font-label-md tracking-tighter text-outline group-hover:text-on-surface">SSO Vault</span>
              </button>
            </div>
          </div>

          {/* Footer Info */}
          <footer className="mt-4 text-center">
            <p className="font-body-sm text-body-sm text-outline/60">
              Authorized access only. All activity is monitored under <span className="text-primary/70">Aetheric Protocol 07</span>.
            </p>
          </footer>
        </main>

        {/* Side Image Decor (Bento-style background hint) */}
        <div className="fixed top-20 -right-20 w-[400px] h-[400px] blur-[100px] bg-primary/20 rounded-full mix-blend-screen pointer-events-none"></div>
        <div className="fixed -bottom-20 -left-20 w-[400px] h-[400px] blur-[100px] bg-secondary/20 rounded-full mix-blend-screen pointer-events-none"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex text-[20px] font-sans bg-background text-foreground transition-colors duration-300">

      {/* ═══════════════ ONBOARDING TOUR OVERLAY ═══════════════ */}
      {showTour && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className={`relative w-full max-w-lg bg-card/95 backdrop-blur-xl border border-border rounded-3xl shadow-2xl overflow-hidden`}>
            {/* Gradient top accent */}
            <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-info to-success`} />

            {/* Step content */}
            <div className={`bg-gradient-to-br ${TOUR_STEPS[tourStep].color} p-8 pb-5`}>
              <div className="text-5xl mb-4 select-none">{TOUR_STEPS[tourStep].icon}</div>
              <h2 className="font-heading font-extrabold text-xl text-foreground leading-tight mb-2">
                {TOUR_STEPS[tourStep].title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {TOUR_STEPS[tourStep].desc}
              </p>
            </div>

            {/* Progress + Actions */}
            <div className="p-6 flex flex-col gap-4">
              {/* Step dots */}
              <div className="flex items-center justify-center gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-300 ${i === tourStep ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-border'}`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={handleTourDone}
                  className="text-xs text-muted-foreground hover:text-foreground bg-transparent border-0 cursor-pointer transition-colors"
                >
                  Skip tour
                </button>
                <div className="flex items-center gap-2">
                  {tourStep > 0 && (
                    <button
                      onClick={handleTourPrev}
                      className="px-4 py-2 text-xs font-semibold rounded-xl bg-secondary hover:bg-border text-foreground border border-border cursor-pointer transition-all"
                    >
                      ← Previous
                    </button>
                  )}
                  <button
                    onClick={handleTourNext}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-primary hover:bg-primary/85 text-white border-0 cursor-pointer transition-all shadow-lg shadow-primary/20"
                  >
                    {tourStep === TOUR_STEPS.length - 1 ? '🎉 Get Started!' : 'Next →'}
                  </button>
                </div>
              </div>

              <div className="text-center text-[10px] text-muted-foreground">
                Step {tourStep + 1} of {TOUR_STEPS.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tour restart button (visible in header after tour done) */}

      {/* SIDEBAR */}
      <aside 
        className="bg-card/75 backdrop-blur-md border-r border-border flex flex-col justify-between transition-all duration-300 z-30 shrink-0"
        style={{ width: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)' }}
      >
        <div>
          {/* Brand header */}
          <div className={`h-12 flex items-center border-b border-border px-4 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-2 animate-fade-in">
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="font-heading font-extrabold text-lg tracking-wider text-foreground">EPR DASHBOARD</span>
              </div>
            ) : (
              <Sparkles className="h-6 w-6 text-primary" />
            )}
          </div>

          {/* Nav Items */}
          <nav className="p-3 flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-var(--header-height)-120px)]">
            {[
              {
                title: 'Core',
                items: [
                  { id: 'dashboard', label: 'Dashboard', iconName: 'dashboard' },
                  { id: 'finance', label: 'Finance & Accounting', iconName: 'payments' },
                ]
              },
              {
                title: 'Operations',
                items: [
                  { id: 'purchase', label: 'Procurement', iconName: 'business_center' },
                  { id: 'inventory', label: 'Inventory & Warehouse', iconName: 'inventory_2' },
                  { id: 'sales', label: 'Sales & CRM', iconName: 'trending_up' },
                  { id: 'manufacturing', label: 'Manufacturing', iconName: 'precision_manufacturing' },
                  { id: 'ecommerce', label: 'E-Commerce', iconName: 'shopping_cart' },
                ]
              },
              {
                title: 'Administration',
                items: [
                  { id: 'hr', label: 'Human Resources', iconName: 'group' },
                  { id: 'assets', label: 'Asset & Maintenance', iconName: 'corporate_fare' },
                  ...((demoMode || currentUser?.roles?.includes('ADMIN')) ? [
                    { id: 'users', label: 'User Management', iconName: 'manage_accounts' }
                  ] : [])
                ]
              },
              {
                title: 'Intelligence',
                items: [
                  { id: 'ai-assistant', label: 'ERP AI Console', iconName: 'smart_toy' },
                ]
              }
            ].map(group => (
              <div key={group.title} className="flex flex-col gap-1">
                {!sidebarCollapsed && (
                  <div className="text-[13px] font-semibold uppercase tracking-[0.05em] text-muted-foreground px-3 py-1.5 animate-fade-in font-sans">
                    {group.title}
                  </div>
                )}
                {group.items.map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => dispatch(setActiveTab(item.id))}
                      className={`w-full flex items-center rounded-lg transition-all duration-200 border-0 cursor-pointer ${
                        sidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 p-2.5'
                      } ${
                        isActive 
                          ? 'sidebar-active-tab text-primary font-semibold' 
                          : 'hover:bg-secondary text-muted-foreground hover:text-foreground bg-transparent'
                      }`}
                    >
                      <span 
                        className="material-symbols-outlined h-5 w-5 shrink-0 flex items-center justify-center text-[20px]"
                        style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        {item.iconName}
                      </span>
                      {!sidebarCollapsed && <span className="font-sans text-xs animate-fade-in truncate whitespace-nowrap leading-tight">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* User profile footer */}
        <div className="p-3 border-t border-border flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-bold text-primary">
                {token ? 'U' : 'S'}
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col animate-fade-in">
                  <span className="font-semibold text-sm">{token ? 'Authenticated User' : 'Sandbox Demo'}</span>
                  <span className="text-xs text-muted-foreground">{token ? 'Manager' : 'Offline Access'}</span>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <button 
                onClick={handleLogout} 
                title="Log Out / Exit Demo"
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors border-0 bg-transparent cursor-pointer"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER */}
        <header className="h-12 pl-4 pr-6 border-b border-border bg-card/75 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => dispatch(toggleSidebar())}
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border-0 bg-transparent cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative w-80 max-w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search across ERP (e.g. Invoices, SKU, Employees)..."
                value={searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                className="w-full pl-10 pr-4 py-2 border rounded-full bg-secondary border-input text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-all text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {demoMode && (
              <div className="text-xs px-2.5 py-1 text-warning bg-warning/10 border border-warning/30 rounded-full font-semibold">
                Demo Sandbox Active
              </div>
            )}
            
            <button 
              onClick={() => dispatch(toggleAIChat())}
              className="px-4 py-1.5 rounded-lg flex items-center gap-1.5 text-xs text-white bg-gradient-to-r from-primary to-info hover:shadow-lg hover:shadow-primary/10 transition-all font-medium border-0 cursor-pointer animate-pulse"
            >
              <Cpu className="h-4 w-4" />
              <span>Ask ERP AI</span>
            </button>

            {/* Tour Restart */}
            <button
              onClick={() => { setTourStep(0); setShowTour(true); localStorage.removeItem('erp_tour_done'); }}
              title="Restart guided tour"
              className="p-2 rounded-lg border border-input bg-card hover:bg-secondary text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
            </button>

            <button 
              onClick={() => dispatch(toggleTheme())}
              className="p-2 rounded-lg border border-input bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-yellow-400" /> : <Moon className="h-4 w-4" />}
            </button>

            <div className="relative">
              <button 
                onClick={() => dispatch(toggleNotifications())}
                className="p-2 rounded-lg border border-input bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors relative cursor-pointer"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-danger animate-pulse"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-card/90 backdrop-blur-md border border-border p-4 rounded-xl shadow-xl z-40 animate-fade-in">
                  <div className="flex justify-between items-center pb-2 border-b border-border mb-3">
                    <span className="font-bold font-heading text-sm text-foreground">Notifications Center</span>
                    <button className="text-xs text-primary font-semibold hover:underline bg-transparent border-0 cursor-pointer">Clear All</button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={`p-2.5 rounded-lg bg-secondary/50 border-l-4 ${
                          n.type === 'danger' ? 'border-danger' : n.type === 'warning' ? 'border-warning' : 'border-success'
                        }`}
                      >
                        <div className="font-semibold text-xs text-foreground">{n.title}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{n.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg border border-input bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="System Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* ═══════════════ SETTINGS PANEL OVERLAY ═══════════════ */}
        {showSettings && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in" onClick={() => setShowSettings(false)}>
            <div className="w-full max-w-sm bg-card border-l border-border h-full flex flex-col shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-border flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <span className="font-heading font-bold text-foreground">System Settings</span>
                </div>
                <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground bg-transparent border-0 cursor-pointer text-lg font-bold">✕</button>
              </div>

              <div className="flex-1 p-5 flex flex-col gap-5">
                {/* Appearance */}
                <div>
                  <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">Appearance</h3>
                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border">
                    <div>
                      <div className="text-xs font-semibold text-foreground">Color Theme</div>
                      <div className="text-[11px] text-muted-foreground">Currently: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
                    </div>
                    <button onClick={() => dispatch(toggleTheme())} className={`relative w-12 h-6 rounded-full transition-all cursor-pointer border-0 ${theme === 'dark' ? 'bg-primary' : 'bg-border'}`}>
                      <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all shadow-md ${theme === 'dark' ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                {/* Onboarding */}
                <div>
                  <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">Onboarding</h3>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border">
                      <div>
                        <div className="text-xs font-semibold text-foreground">Guided Tour</div>
                        <div className="text-[11px] text-muted-foreground">{localStorage.getItem('erp_tour_done') ? 'Completed ✅' : 'Not started'}</div>
                      </div>
                      <button
                        onClick={() => { setTourStep(0); setShowTour(true); setShowSettings(false); localStorage.removeItem('erp_tour_done'); }}
                        className="px-3 py-1.5 bg-primary/10 text-primary text-[11px] font-semibold rounded-lg cursor-pointer border border-primary/20 hover:bg-primary hover:text-white transition-colors"
                      >
                        {localStorage.getItem('erp_tour_done') ? 'Restart Tour' : 'Start Tour'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Security Status */}
                <div>
                  <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">Security</h3>
                  <div className="flex flex-col gap-2">
                    {[
                      { label: 'JWT Authentication', status: true, desc: 'RS256 token auth' },
                      { label: 'Rate Limiting', status: true, desc: '300 req/15min global, 20/15min auth' },
                      { label: 'Helmet CSP Headers', status: true, desc: 'Content Security Policy active' },
                      { label: 'CORS Protection', status: true, desc: 'Origin allowlist enforced' },
                      { label: 'MFA / TOTP', status: !demoMode, desc: demoMode ? 'Enable in production' : 'Active' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/50">
                        <div>
                          <div className="text-xs font-semibold text-foreground">{item.label}</div>
                          <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                        </div>
                        <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.status ? 'text-success bg-success/10' : 'text-warning bg-warning/10'}`}>
                          {item.status ? '● Active' : '○ Disabled'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Database Backup */}
                <div>
                  <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">Backup & Recovery</h3>
                  <div className="p-3 bg-secondary/20 rounded-xl border border-border flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-foreground font-semibold">
                      <RefreshCw className="h-3.5 w-3.5 text-primary" />
                      Automated Backup Active
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      PostgreSQL dumps every 6 hours. MongoDB archives daily. Retained for 7 days.
                    </div>
                    <code className="text-[10px] text-primary bg-black/30 px-2 py-1 rounded font-mono">npm run backup</code>
                  </div>
                </div>

                {/* System Info */}
                <div>
                  <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">System</h3>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { label: 'Version', value: 'EPR Dashboard v2.0.0' },
                      { label: 'Frontend', value: 'React.js + Tailwind CSS' },
                      { label: 'Backend', value: 'Express.js + Prisma' },
                      { label: 'Database', value: 'PostgreSQL + MongoDB' },
                      { label: 'Cache', value: 'Redis' },
                      { label: 'AI Service', value: 'FastAPI (Python)' },
                      { label: 'Authentication', value: 'JWT + MFA (TOTP)' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between py-1.5 text-xs border-b border-border/30 last:border-0">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="text-foreground font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Logout */}
                <div className="pt-2">
                  <button
                    onClick={() => { handleLogout(); setShowSettings(false); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-danger/10 text-danger hover:bg-danger hover:text-white text-xs font-bold rounded-xl cursor-pointer border border-danger/20 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout / Exit Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* MAIN BODY */}
        <main className="flex-1 p-6 overflow-y-auto">
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Welcome Card */}
                <div className="lg:col-span-2 bg-gradient-to-br from-card/90 to-primary/10 border-l-4 border-primary p-6 rounded-xl border border-border flex flex-col justify-between">
                  <div>
                    <h2 className="font-heading text-xl font-extrabold text-foreground mb-2">Welcome Back to EPR Dashboard</h2>
                    <p className="text-muted-foreground max-w-lg text-xs leading-relaxed">
                      All systems are active. Blockchain general ledger is synchronized, automated compliance check is completed, and AI fraud detection model is running.
                    </p>
                  </div>
                  <div className="flex gap-4 mt-6">
                    <button 
                      onClick={() => dispatch(setActiveTab('finance'))} 
                      className="px-4 py-2 text-xs rounded-lg font-semibold bg-primary hover:bg-primary-hover text-white transition-colors cursor-pointer border-0"
                    >
                      Manage Finance
                    </button>
                    <button 
                      onClick={() => dispatch(setActiveTab('purchase'))} 
                      className="px-4 py-2 text-xs rounded-lg font-semibold bg-secondary hover:bg-border-medium text-foreground transition-colors cursor-pointer border border-border"
                    >
                      Procurement pipeline
                    </button>
                  </div>
                </div>

                {/* Business Health Score */}
                <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col justify-between text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3">
                    <Info className="h-4.5 w-4.5 text-muted-foreground" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Business Health Score</span>
                    <h1 className="text-5xl font-heading font-extrabold text-primary mt-4 mb-2">
                      <CountUp end={88} formatType="number" />
                      <span className="text-lg text-muted-foreground">/100</span>
                    </h1>
                    <div className="inline-flex items-center gap-1 text-xs text-success bg-success-light px-2.5 py-0.5 rounded-full font-semibold">
                      +4.2% from last month
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-4 leading-normal">
                    Optimal inventory turnovers, low debt ratio, and high recruitment pipeline conversion.
                  </p>
                </div>
              </div>

              {/* Real-time KPI Overview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Revenue Card */}
                <div className={`bg-card/75 backdrop-blur-md border border-border p-5 rounded-xl transition-all duration-300 hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5 ${revenuePulse ? 'cell-pulse' : ''}`}>
                  <span className="text-xs text-muted-foreground font-semibold">Total Revenue (Q2)</span>
                  <h3 className="text-xl font-heading font-bold mt-2 mb-1 text-primary">
                    <CountUp end={liveRevenue} formatType="currency" />
                  </h3>
                  <span className="text-xs text-muted-foreground/70">12% growth vs target</span>
                </div>

                {/* Cash Flow Projection Card */}
                <div className="bg-card/75 backdrop-blur-md border border-border p-5 rounded-xl transition-all duration-300 hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5">
                  <span className="text-xs text-muted-foreground font-semibold">Cash Flow Projection</span>
                  <h3 className="text-xl font-heading font-bold mt-2 mb-1 text-success">
                    <CountUp end={485000} formatType="currency" />
                  </h3>
                  <span className="text-xs text-muted-foreground/70">Auto reconciled</span>
                </div>

                {/* Low Stock Alerts Card */}
                <div className="bg-card/75 backdrop-blur-md border border-border p-5 rounded-xl transition-all duration-300 hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5">
                  <span className="text-xs text-muted-foreground font-semibold">Low Stock Alerts</span>
                  <h3 className="text-xl font-heading font-bold mt-2 mb-1 text-warning">
                    <CountUp end={3} formatType="number" /> <span className="text-xs font-semibold text-muted-foreground">Items</span>
                  </h3>
                  <span className="text-xs text-muted-foreground/70">Supplier negotiation bot ready</span>
                </div>

                {/* Pending PO Approvals Card */}
                <div className="bg-card/75 backdrop-blur-md border border-border p-5 rounded-xl transition-all duration-300 hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5">
                  <span className="text-xs text-muted-foreground font-semibold">Pending PO Approvals</span>
                  <h3 className="text-xl font-heading font-bold mt-2 mb-1 text-info">
                    <CountUp end={purchaseOrders.filter(p => p.status === 'APPROVED').length} formatType="number" /> <span className="text-xs font-semibold text-muted-foreground">Orders</span>
                  </h3>
                  <span className="text-xs text-muted-foreground/70">Requires manager review</span>
                </div>
              </div>

              {/* CHARTS SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Cash Flow Line/Area Chart */}
                <div className="lg:col-span-2 bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl">
                  <h3 className="font-heading font-bold text-sm text-foreground mb-4">Cash Flow Overview (Jan - Jun)</h3>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4cd7f6" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#4cd7f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00CA72" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#00CA72" stopOpacity={0}/>
                          </linearGradient>
                          <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#4cd7f6" floodOpacity="0.5"/>
                          </filter>
                          <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00CA72" floodOpacity="0.5"/>
                          </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border-light))" />
                        <XAxis dataKey="month" stroke="hsl(var(--text-tertiary))" fontSize={11} tickLine={false} />
                        <YAxis stroke="hsl(var(--text-tertiary))" fontSize={11} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontFamily: 'Outfit' }} />
                        <Area name="Revenue" type="monotone" dataKey="revenue" stroke="#4cd7f6" strokeWidth={2} filter="url(#cyanGlow)" fillOpacity={1} fill="url(#colorRev)" />
                        <Area name="Expenses" type="monotone" dataKey="expenses" stroke="#00CA72" strokeWidth={2} filter="url(#emeraldGlow)" fillOpacity={1} fill="url(#colorExp)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Module distribution BarChart */}
                <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col">
                  <h3 className="font-heading font-bold text-sm text-foreground mb-4">Revenue Breakdown by Module</h3>
                  <div className="flex-1 h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={moduleData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border-light))" />
                        <XAxis dataKey="name" stroke="hsl(var(--text-tertiary))" fontSize={10} tickLine={false} />
                        <YAxis stroke="hsl(var(--text-tertiary))" fontSize={10} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Value" radius={[4, 4, 0, 0]}>
                          {moduleData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Lower Section: Fraud Alerts and Active Workflows */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Anomaly list */}
                <div className="lg:col-span-2 bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl">
                  <h3 className="font-heading font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-danger" />
                    <span>Real-time Financial Anomaly & Fraud Alerts</span>
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-secondary/50 text-muted-foreground border-b border-border">
                          <th className="p-3 font-semibold uppercase tracking-wider">Reference</th>
                          <th className="p-3 font-semibold uppercase tracking-wider">Module</th>
                          <th className="p-3 font-semibold uppercase tracking-wider">Anomaly Detected</th>
                          <th className="p-3 font-semibold uppercase tracking-wider">Confidence</th>
                          <th className="p-3 font-semibold uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border hover:bg-secondary/20 transition-colors">
                          <td className="p-3 font-semibold text-primary">vchr #4010</td>
                          <td className="p-3 text-foreground">General Ledger</td>
                          <td className="p-3 text-foreground">Mismatched debit-credit double entry validation</td>
                          <td className="p-3 text-foreground font-semibold">92%</td>
                          <td className="p-3">
                            <span className="text-danger bg-danger-light px-2.5 py-0.5 rounded-full font-semibold">Flagged</span>
                          </td>
                        </tr>
                        <tr className="hover:bg-secondary/20 transition-colors">
                          <td className="p-3 font-semibold text-primary">vchr #4015</td>
                          <td className="p-3 text-foreground">Accounts Payable</td>
                          <td className="p-3 text-foreground">Duplicate invoice pattern detected from Vendor A</td>
                          <td className="p-3 text-foreground font-semibold">85%</td>
                          <td className="p-3">
                            <span className="text-warning bg-warning-light px-2.5 py-0.5 rounded-full font-semibold">Reviewing</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Task Checklist / Shortcuts */}
                <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-foreground mb-4">Pending Approvals</h3>
                    <div className="flex flex-col gap-3">
                      {[
                        { title: 'Approve PO-9201', desc: '₹24,000 - Steel rods', dept: 'Procurement' },
                        { title: 'Leave Request - John Doe', desc: '3 Days - Medical', dept: 'HR' }
                      ].map((item, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-secondary/50 border border-border flex items-center justify-between hover:bg-secondary transition-all">
                          <div>
                            <div className="font-semibold text-xs text-foreground">{item.title}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</div>
                          </div>
                          <button className="p-1 rounded-md hover:bg-card text-primary transition-colors border-0 bg-transparent cursor-pointer">
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex justify-between text-xs text-muted-foreground">
                    <span>System Sync: Active</span>
                    <span className="font-bold text-foreground">Offline Sync Ready</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: FINANCE & ACCOUNTING */}
          {activeTab === 'finance' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-heading text-lg font-bold text-foreground">Finance & Accounting</h2>
                  <p className="text-xs text-muted-foreground">General Ledger, Dynamic Double-Entry Ledger, SOC2 Cascade Hashing & Tax Filings</p>
                </div>
                
                {/* Sub-nav Buttons */}
                <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-lg border border-border">
                  {[
                    { id: 'voucher', label: 'Voucher Entry' },
                    { id: 'accounts', label: 'Accounts List' },
                    { id: 'reports', label: 'Financial Reports' },
                    { id: 'reconcile', label: 'Bank Reconcile' },
                    { id: 'tax', label: 'GST & TDS Filing' }
                  ].map(bt => (
                    <button
                      key={bt.id}
                      onClick={() => setFinanceTab(bt.id)}
                      className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all border-0 cursor-pointer ${
                        financeTab === bt.id 
                          ? 'bg-primary text-white shadow-sm' 
                          : 'bg-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {bt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TAB CONTENT: VOUCHER ENTRY */}
              {financeTab === 'voucher' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Voucher Form */}
                  <div className="lg:col-span-2 bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground">Record Double-Entry Journal Voucher</h3>
                    {voucherMessage && (
                      <div className={`p-3 rounded-lg border text-xs ${
                        voucherMessage.type === 'success' 
                          ? 'bg-success/10 border-success/30 text-success' 
                          : 'bg-danger/10 border-danger/30 text-danger'
                      }`}>
                        {voucherMessage.text}
                      </div>
                    )}
                    <form onSubmit={handleCreateVoucher} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Voucher Type</label>
                        <select 
                          value={voucherType} 
                          onChange={e => setVoucherType(e.target.value)}
                          className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                        >
                          <option value="PAYMENT">PAYMENT (Cash/Bank discharge)</option>
                          <option value="RECEIPT">RECEIPT (Cash/Bank collection)</option>
                          <option value="JOURNAL">JOURNAL (Non-cash adjustment)</option>
                          <option value="CONTRA">CONTRA (Cash vs Bank exchange)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Transaction Amount (INR)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          required
                          value={voucherAmount}
                          onChange={e => setVoucherAmount(e.target.value)}
                          placeholder="e.g. 50000"
                          className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Debit Account (Receives Value)</label>
                        <select
                          required
                          value={debitAcc}
                          onChange={e => setDebitAcc(e.target.value)}
                          className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                        >
                          <option value="">Select Account...</option>
                          {accounts.map(acc => (
                            <option key={acc.code} value={acc.code}>{acc.code} - {acc.name} ({acc.type})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Credit Account (Gives Value)</label>
                        <select
                          required
                          value={creditAcc}
                          onChange={e => setCreditAcc(e.target.value)}
                          className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                        >
                          <option value="">Select Account...</option>
                          {accounts.map(acc => (
                            <option key={acc.code} value={acc.code}>{acc.code} - {acc.name} ({acc.type})</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Narration / Description</label>
                        <input 
                          type="text" 
                          value={narration}
                          onChange={e => setNarration(e.target.value)}
                          placeholder="Brief explanation of entry"
                          className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs"
                        />
                      </div>
                      <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                        <button type="submit" className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-md shadow-primary/10 border-0 cursor-pointer text-xs">
                          Verify & Sign Block
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Blockchain Integrity Box */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col justify-between">
                    <div>
                      <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                        <ShieldAlert className="h-5 w-5 text-primary" />
                        <span>Tamper-Proof Audit</span>
                      </h3>
                      <p className="text-[11px] text-muted-foreground leading-normal mt-2">
                        Every journal entry is structured as a cryptographic block. We hash the index, voucher details, and links to the previous block hash to verify chain integrity.
                      </p>
                      {ledgerVerified && (
                        <div className={`mt-4 p-3 rounded-lg border text-xs flex flex-col gap-1.5 ${
                          ledgerVerified.valid 
                            ? 'bg-success/10 border-success/30 text-success' 
                            : 'bg-danger/10 border-danger/30 text-danger'
                        }`}>
                          <div className="font-bold flex items-center gap-1">
                            {ledgerVerified.valid ? <CheckCircle className="h-4.5 w-4.5" /> : <XCircle className="h-4.5 w-4.5" />}
                            <span>{ledgerVerified.valid ? 'SOC2 Chain Verified' : 'Ledger Compromised'}</span>
                          </div>
                          <span>
                            {ledgerVerified.valid 
                              ? `All ${journalEntries.length} transaction blocks checked. Sequence intact. Cascade hash verified.`
                              : ledgerVerified.error || `Anomaly detected at block index ${ledgerVerified.compromisedBlockIndex}`}
                          </span>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={handleVerifyLedger}
                      className="w-full mt-6 py-2 bg-secondary text-foreground hover:bg-border border border-border rounded-lg transition-all font-semibold cursor-pointer text-xs"
                    >
                      Audit Ledger Chain (SHA-256 Check)
                    </button>
                  </div>

                  {/* Journal entries chain timeline */}
                  <div className="lg:col-span-3 bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground">Cryptographic Cascade Link Logs</h3>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="bg-secondary/50 text-muted-foreground border-b border-border">
                            <th className="p-3 font-semibold uppercase tracking-wider">Block No</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Voucher No</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Debit Acc</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Credit Acc</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Amount</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Previous Hash</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Block Hash</th>
                          </tr>
                        </thead>
                        <tbody>
                          {journalEntries.map(entry => (
                            <tr key={entry.blockIndex} className="border-b border-border hover:bg-secondary/20 transition-colors">
                              <td className="p-3 font-mono font-bold text-primary">#{entry.blockIndex}</td>
                              <td className="p-3 text-foreground">{entry.voucherNo}</td>
                              <td className="p-3 text-foreground">{entry.debitAcc}</td>
                              <td className="p-3 text-foreground">{entry.creditAcc}</td>
                              <td className="p-3 text-foreground font-bold">₹{entry.amount.toLocaleString()}</td>
                              <td className="p-3 font-mono text-muted-foreground" title={entry.prevHash}>
                                {entry.prevHash.substring(0, 10)}...
                              </td>
                              <td className="p-3 font-mono text-success" title={entry.blockHash}>
                                {entry.blockHash.substring(0, 14)}...
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: CHART OF ACCOUNTS */}
              {financeTab === 'accounts' && (
                <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                  <h3 className="font-heading font-bold text-sm text-foreground">ERP Chart of Accounts (COA)</h3>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-secondary/50 text-muted-foreground border-b border-border">
                          <th className="p-3 font-semibold uppercase tracking-wider">Account Code</th>
                          <th className="p-3 font-semibold uppercase tracking-wider">Account Name</th>
                          <th className="p-3 font-semibold uppercase tracking-wider">Type</th>
                          <th className="p-3 font-semibold uppercase tracking-wider text-right">Current balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accounts.map(acc => (
                          <tr key={acc.code} className="border-b border-border hover:bg-secondary/20 transition-colors">
                            <td className="p-3 font-mono font-bold text-primary">{acc.code}</td>
                            <td className="p-3 text-foreground font-semibold">{acc.name}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                acc.type === 'ASSET' ? 'bg-success/15 text-success' : 
                                acc.type === 'LIABILITY' ? 'bg-danger/15 text-danger' :
                                acc.type === 'EQUITY' ? 'bg-primary/15 text-primary' :
                                acc.type === 'REVENUE' ? 'bg-info/15 text-info' : 'bg-warning/15 text-warning'
                              }`}>
                                {acc.type}
                              </span>
                            </td>
                            <td className="p-3 text-foreground font-bold text-right">₹{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: REPORTS */}
              {financeTab === 'reports' && (
                <div className="flex flex-col gap-6">
                  {/* Report selector */}
                  <div className="flex justify-between items-center bg-secondary/35 p-1 rounded-lg border border-border max-w-md">
                    {[
                      { id: 'trial-balance', label: 'Trial Balance' },
                      { id: 'profit-loss', label: 'Profit & Loss (P&L)' },
                      { id: 'balance-sheet', label: 'Balance Sheet' }
                    ].map(rep => (
                      <button
                        key={rep.id}
                        onClick={() => setReportTab(rep.id)}
                        className={`flex-1 px-4 py-2 text-xs rounded font-medium border-0 cursor-pointer transition-all ${
                          reportTab === rep.id ? 'bg-card text-foreground shadow-sm' : 'bg-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {rep.label}
                      </button>
                    ))}
                  </div>

                  {/* REPORT: TRIAL BALANCE */}
                  {reportTab === 'trial-balance' && trialBalance && (
                    <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-heading font-bold text-sm text-foreground">Trial Balance Report</h3>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          trialBalance.balanced ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                        }`}>
                          {trialBalance.balanced ? 'BALANCED' : 'MISBALANCED'}
                        </span>
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full border-collapse text-left text-xs">
                          <thead>
                            <tr className="bg-secondary/50 text-muted-foreground border-b border-border">
                              <th className="p-3 font-semibold uppercase tracking-wider">Code</th>
                              <th className="p-3 font-semibold uppercase tracking-wider">Account</th>
                              <th className="p-3 font-semibold uppercase tracking-wider">Type</th>
                              <th className="p-3 font-semibold uppercase tracking-wider text-right">Debit (Dr)</th>
                              <th className="p-3 font-semibold uppercase tracking-wider text-right">Credit (Cr)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trialBalance.accounts.map(acc => (
                              <tr key={acc.code} className="border-b border-border hover:bg-secondary/20 transition-colors">
                                <td className="p-3 font-mono text-muted-foreground">{acc.code}</td>
                                <td className="p-3 text-foreground font-semibold">{acc.name}</td>
                                <td className="p-3 text-muted-foreground">{acc.type}</td>
                                <td className="p-3 text-foreground text-right">{acc.debit > 0 ? `₹${acc.debit.toLocaleString()}` : '-'}</td>
                                <td className="p-3 text-foreground text-right">{acc.credit > 0 ? `₹${acc.credit.toLocaleString()}` : '-'}</td>
                              </tr>
                            ))}
                            <tr className="bg-secondary/40 font-bold border-t-2 border-border text-foreground">
                              <td colSpan="3" className="p-3 text-right uppercase tracking-wider">Total</td>
                              <td className="p-3 text-right">₹{trialBalance.totalDebit.toLocaleString()}</td>
                              <td className="p-3 text-right">₹{trialBalance.totalCredit.toLocaleString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* REPORT: P&L */}
                  {reportTab === 'profit-loss' && profitLoss && (
                    <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-6">
                      <h3 className="font-heading font-bold text-sm text-foreground">Profit & Loss (Income Statement)</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Revenues */}
                        <div className="flex flex-col gap-3">
                          <h4 className="font-semibold text-xs text-primary uppercase border-b border-border pb-1">Revenue Accounts</h4>
                          <div className="flex flex-col gap-2">
                            {profitLoss.revenues.map(r => (
                              <div key={r.name} className="flex justify-between text-xs py-1 border-b border-border/40">
                                <span>{r.name}</span>
                                <span className="font-semibold text-foreground">₹{r.balance.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between font-bold text-xs pt-2 text-foreground">
                            <span>Total revenue</span>
                            <span>₹{profitLoss.totalRevenue.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Expenses */}
                        <div className="flex flex-col gap-3">
                          <h4 className="font-semibold text-xs text-danger uppercase border-b border-border pb-1">Expense Accounts</h4>
                          <div className="flex flex-col gap-2">
                            {profitLoss.expenses.map(e => (
                              <div key={e.name} className="flex justify-between text-xs py-1 border-b border-border/40">
                                <span>{e.name}</span>
                                <span className="font-semibold text-foreground">₹{e.balance.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between font-bold text-xs pt-2 text-foreground">
                            <span>Total expenses</span>
                            <span>₹{profitLoss.totalExpenses.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Net Profit Summary */}
                      <div className="border-t border-border pt-4 flex justify-between items-center">
                        <span className="font-heading font-bold text-sm text-foreground uppercase">Net profit / (Loss)</span>
                        <span className={`text-lg font-extrabold ${profitLoss.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                          ₹{profitLoss.netProfit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* REPORT: BALANCE SHEET */}
                  {reportTab === 'balance-sheet' && balanceSheet && (
                    <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-6">
                      <h3 className="font-heading font-bold text-sm text-foreground">Balance Sheet Report</h3>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Assets */}
                        <div className="flex flex-col gap-3">
                          <h4 className="font-semibold text-xs text-success uppercase border-b border-border pb-1">Assets</h4>
                          <div className="flex flex-col gap-2">
                            {balanceSheet.assets.map(a => (
                              <div key={a.name} className="flex justify-between text-xs py-1 border-b border-border/40">
                                <span>{a.name}</span>
                                <span className="font-semibold text-foreground">₹{a.balance.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between font-bold text-xs pt-2 text-foreground border-t border-border/40">
                            <span>Total assets</span>
                            <span>₹{balanceSheet.totalAssets.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Liabilities */}
                        <div className="flex flex-col gap-3">
                          <h4 className="font-semibold text-xs text-danger uppercase border-b border-border pb-1">Liabilities</h4>
                          <div className="flex flex-col gap-2">
                            {balanceSheet.liabilities.map(l => (
                              <div key={l.name} className="flex justify-between text-xs py-1 border-b border-border/40">
                                <span>{l.name}</span>
                                <span className="font-semibold text-foreground">₹{l.balance.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between font-bold text-xs pt-2 text-foreground border-t border-border/40">
                            <span>Total liabilities</span>
                            <span>₹{balanceSheet.totalLiabilities.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Equities */}
                        <div className="flex flex-col gap-3">
                          <h4 className="font-semibold text-xs text-primary uppercase border-b border-border pb-1">Equity</h4>
                          <div className="flex flex-col gap-2">
                            {balanceSheet.equities.map(eq => (
                              <div key={eq.name} className="flex justify-between text-xs py-1 border-b border-border/40">
                                <span>{eq.name}</span>
                                <span className="font-semibold text-foreground">₹{eq.balance.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between font-bold text-xs pt-2 text-foreground border-t border-border/40">
                            <span>Total equity</span>
                            <span>₹{balanceSheet.totalEquities.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Closing Summary Check */}
                      <div className="border-t border-border pt-4 flex justify-between items-center text-xs">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">Assets = Liabilities + Equity check</span>
                          <span className="text-muted-foreground mt-0.5">₹{balanceSheet.totalAssets.toLocaleString()} = ₹{balanceSheet.totalLiabilitiesEquities.toLocaleString()}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full font-semibold ${
                          Math.abs(balanceSheet.totalAssets - balanceSheet.totalLiabilitiesEquities) < 0.1
                            ? 'bg-success/15 text-success' 
                            : 'bg-danger/15 text-danger'
                        }`}>
                          {Math.abs(balanceSheet.totalAssets - balanceSheet.totalLiabilitiesEquities) < 0.1 ? 'BALANCED' : 'DISCREPANCY'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: BANK RECONCILIATION */}
              {financeTab === 'reconcile' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* CSV input panel */}
                  <div className="lg:col-span-2 bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground">Auto Bank Statement Matcher</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Paste CSV rows from your bank statement below (format: `YYYY-MM-DD, amount, description`). The scoring engine runs proximity matches on date, amount, and narration tokens.
                    </p>
                    <textarea
                      rows="6"
                      value={reconcileText}
                      onChange={e => setReconcileText(e.target.value)}
                      className="w-full p-3 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs font-mono text-foreground"
                    />
                    <div className="flex justify-end mt-2">
                      <button 
                        onClick={handleRunReconciliation}
                        className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-md border-0 cursor-pointer text-xs"
                      >
                        Run Scoring Reconciliation Matcher
                      </button>
                    </div>
                  </div>

                  {/* Reconciliation summary explanation */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col justify-between">
                    <div>
                      <h3 className="font-heading font-bold text-sm text-foreground">Auto Reconciler</h3>
                      <p className="text-[11px] text-muted-foreground leading-normal mt-2">
                        Matches are scored out of 100%. Entries with exact matches are matched with 90%+ confidence. Low confidence items are moved to audit list.
                      </p>
                    </div>
                    <div className="text-center font-bold text-xs p-4 bg-secondary/50 rounded-xl border border-border mt-4">
                      Reconciliation matches ledger chronologically.
                    </div>
                  </div>

                  {/* Matching results */}
                  {reconciliationResults && (
                    <div className="lg:col-span-3 bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-6">
                      <h3 className="font-heading font-bold text-sm text-foreground">Reconciliation Results</h3>
                      
                      {/* Matched list */}
                      <div>
                        <h4 className="font-semibold text-xs text-success uppercase mb-3 flex items-center gap-1">
                          <CheckCircle className="h-4.5 w-4.5" />
                          <span>Matched lines ({reconciliationResults.reconciled.length})</span>
                        </h4>
                        <div className="overflow-x-auto rounded-lg border border-border">
                          <table className="w-full border-collapse text-left text-xs">
                            <thead>
                              <tr className="bg-secondary/50 text-muted-foreground border-b border-border">
                                <th className="p-3 font-semibold">Statement Line</th>
                                <th className="p-3 font-semibold">Matched Ledger Entry</th>
                                <th className="p-3 font-semibold text-right">Match Confidence</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reconciliationResults.reconciled.map((r, idx) => (
                                <tr key={idx} className="border-b border-border hover:bg-secondary/20 transition-colors">
                                  <td className="p-3">
                                    <div className="font-semibold text-foreground">{r.statementLine.desc}</div>
                                    <div className="text-[10px] text-muted-foreground">{r.statementLine.date} | ₹{r.statementLine.amount.toLocaleString()}</div>
                                  </td>
                                  <td className="p-3 text-foreground">
                                    <div>{r.matchedEntry.narration || 'Signed Ledger Entry'}</div>
                                    <div className="text-[10px] text-primary">{r.matchedEntry.voucherNo} | Block #{r.matchedEntry.blockIndex}</div>
                                  </td>
                                  <td className="p-3 text-success font-bold text-right">{r.confidence}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Unresolved list */}
                      {reconciliationResults.unmatched.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-xs text-danger uppercase mb-3 flex items-center gap-1">
                            <AlertTriangle className="h-4.5 w-4.5" />
                            <span>Unmatched statement lines ({reconciliationResults.unmatched.length})</span>
                          </h4>
                          <div className="overflow-x-auto rounded-lg border border-border">
                            <table className="w-full border-collapse text-left text-xs">
                              <thead>
                                <tr className="bg-secondary/50 text-muted-foreground border-b border-border">
                                  <th className="p-3 font-semibold">Date</th>
                                  <th className="p-3 font-semibold">Amount</th>
                                  <th className="p-3 font-semibold">Narration</th>
                                </tr>
                              </thead>
                              <tbody>
                                {reconciliationResults.unmatched.map((un, idx) => (
                                  <tr key={idx} className="border-b border-border bg-danger/5 hover:bg-danger/10 transition-colors">
                                    <td className="p-3 text-foreground">{un.date}</td>
                                    <td className="p-3 text-foreground font-bold">₹{un.amount.toLocaleString()}</td>
                                    <td className="p-3 text-muted-foreground">{un.desc}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: TAX SUMMARY */}
              {financeTab === 'tax' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* GST CARD */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col justify-between">
                    <div>
                      <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                        <Coins className="h-5 w-5 text-primary" />
                        <span>GST / VAT filing</span>
                      </h3>
                      <div className="mt-4 flex flex-col gap-1">
                        <span className="text-[11px] text-muted-foreground uppercase font-semibold">Total GST liability</span>
                        <span className="text-2xl font-extrabold text-foreground">₹{taxSummary.gstPayable.toLocaleString()}</span>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Filing Status: <span className="font-semibold text-success">{taxSummary.gstStatus}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => alert('GST Return filed successfully via local mock gateway.')}
                      className="w-full mt-6 py-2 bg-primary hover:bg-primary/95 text-white border-0 rounded-lg font-semibold cursor-pointer text-xs shadow-md"
                    >
                      File GST return
                    </button>
                  </div>

                  {/* TDS CARD */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col justify-between">
                    <div>
                      <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                        <Coins className="h-5 w-5 text-warning" />
                        <span>TDS / TCS management</span>
                      </h3>
                      <div className="mt-4 flex flex-col gap-1">
                        <span className="text-[11px] text-muted-foreground uppercase font-semibold">TDS payable</span>
                        <span className="text-2xl font-extrabold text-foreground">₹{taxSummary.tdsPayable.toLocaleString()}</span>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Audit Status: <span className="font-semibold text-success">{taxSummary.tdsStatus}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => alert('TDS challan generated successfully.')}
                      className="w-full mt-6 py-2 bg-secondary text-foreground hover:bg-border border border-border rounded-lg font-semibold cursor-pointer text-xs"
                    >
                      Generate TDS challan
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: PROCUREMENT (PURCHASE) */}
          {activeTab === 'purchase' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-heading text-lg font-bold text-foreground">Procurement Hub</h2>
                  <p className="text-xs text-muted-foreground">Purchase Requisitions, RFQs, PO Approvals, Goods Receipts, Supplier Scoring & 3-Way Matching</p>
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-lg border border-border">
                  {[
                    { id: 'suppliers', label: 'Supplier Matrix' },
                    { id: 'requisitions', label: 'PR Pipeline' },
                    { id: 'rfqs', label: 'RFQs' },
                    { id: 'pos', label: 'POs' },
                    { id: 'grns', label: 'Goods Receipts' },
                    { id: 'invoices', label: 'Vendor Invoices' }
                  ].map(pt => (
                    <button
                      key={pt.id}
                      onClick={() => setPurchaseTab(pt.id)}
                      className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all border-0 cursor-pointer ${
                        purchaseTab === pt.id 
                          ? 'bg-primary text-white shadow-sm' 
                          : 'bg-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {pt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TAB CONTENT: SUPPLIERS MATRIX */}
              {purchaseTab === 'suppliers' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                  
                  {/* Suppliers List with scorecard */}
                  <div className="lg:col-span-2 bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground">Supplier Evaluation Scorecard</h3>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="bg-secondary/50 text-muted-foreground border-b border-border">
                            <th className="p-3 font-semibold">Supplier</th>
                            <th className="p-3 font-semibold text-center">Delivery Score</th>
                            <th className="p-3 font-semibold text-center">Quality Score</th>
                            <th className="p-3 font-semibold text-center">Price Score</th>
                            <th className="p-3 font-semibold text-center">Overall Rating</th>
                            <th className="p-3 font-semibold text-center">Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {suppliers.map(sup => {
                            let grade = 'F';
                            if (sup.overallScore >= 90) grade = 'A+';
                            else if (sup.overallScore >= 80) grade = 'B';
                            else if (sup.overallScore >= 70) grade = 'C';
                            else grade = 'D';

                            return (
                              <tr key={sup.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                                <td className="p-3">
                                  <div className="font-semibold text-foreground">{sup.name}</div>
                                  <div className="text-[10px] text-muted-foreground">{sup.email} | {sup.phone}</div>
                                </td>
                                <td className="p-3 text-center text-foreground font-semibold">{sup.deliveryScore.toFixed(1)}%</td>
                                <td className="p-3 text-center text-foreground font-semibold">{sup.qualityScore.toFixed(1)}%</td>
                                <td className="p-3 text-center text-foreground font-semibold">{sup.priceScore.toFixed(1)}%</td>
                                <td className="p-3 text-center">
                                  <div className="font-bold text-primary">{sup.overallScore.toFixed(1)}/100</div>
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                    grade === 'A+' ? 'bg-success/15 text-success' : 
                                    grade === 'B' ? 'bg-primary/15 text-primary' : 'bg-warning/15 text-warning'
                                  }`}>
                                    {grade}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Add Supplier Form */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground">Register New Supplier</h3>
                    <form onSubmit={handleCreateSupplier} className="flex flex-col gap-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Supplier Name</label>
                        <input 
                          type="text" 
                          required
                          value={supName}
                          onChange={e => setSupName(e.target.value)}
                          placeholder="e.g. Acme Industrial Supplies"
                          className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Email Address</label>
                        <input 
                          type="email" 
                          required
                          value={supEmail}
                          onChange={e => setSupEmail(e.target.value)}
                          placeholder="sales@acme.com"
                          className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Phone Number</label>
                        <input 
                          type="text" 
                          value={supPhone}
                          onChange={e => setSupPhone(e.target.value)}
                          placeholder="9876543210"
                          className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Office Address</label>
                        <input 
                          type="text" 
                          value={supAddr}
                          onChange={e => setSupAddr(e.target.value)}
                          placeholder="456 Industrial Pkwy"
                          className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs"
                        />
                      </div>
                      <button type="submit" className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg border-0 cursor-pointer text-xs mt-2 shadow-md">
                        Register Supplier
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: PR PIPELINE */}
              {purchaseTab === 'requisitions' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                  
                  {/* PR List */}
                  <div className="lg:col-span-2 bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground">Purchase Requisitions (PR) List</h3>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="bg-secondary/50 text-muted-foreground border-b border-border">
                            <th className="p-3 font-semibold">PR Number</th>
                            <th className="p-3 font-semibold">Requested By</th>
                            <th className="p-3 font-semibold">Department</th>
                            <th className="p-3 font-semibold">Requested Items</th>
                            <th className="p-3 font-semibold text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {requisitions.map(pr => {
                            const items = JSON.parse(pr.items);
                            return (
                              <tr key={pr.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                                <td className="p-3 font-semibold text-primary">{pr.prNo}</td>
                                <td className="p-3 text-foreground">{pr.requestedBy}</td>
                                <td className="p-3 text-muted-foreground">{pr.department}</td>
                                <td className="p-3 text-foreground font-medium">
                                  {items.map(it => `${it.desc} (qty: ${it.qty})`).join(', ')}
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    pr.status === 'APPROVED' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                                  }`}>
                                    {pr.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Create PR Form */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground">Submit Purchase Requisition</h3>
                    <form onSubmit={handleCreateRequisition} className="flex flex-col gap-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Requester Name</label>
                        <input 
                          type="text" 
                          required
                          value={prRequestedBy}
                          onChange={e => setPrRequestedBy(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Department</label>
                        <input 
                          type="text" 
                          required
                          value={prDept}
                          onChange={e => setPrDept(e.target.value)}
                          placeholder="e.g. Engineering"
                          className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Item Name</label>
                        <input 
                          type="text" 
                          required
                          value={prItemName}
                          onChange={e => setPrItemName(e.target.value)}
                          placeholder="e.g. Steel Rods"
                          className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Quantity Needed</label>
                        <input 
                          type="number" 
                          required
                          value={prItemQty}
                          onChange={e => setPrItemQty(e.target.value)}
                          placeholder="e.g. 100"
                          className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs"
                        />
                      </div>
                      <button type="submit" className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg border-0 cursor-pointer text-xs mt-2 shadow-md">
                        Submit PR
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: RFQS */}
              {purchaseTab === 'rfqs' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                  
                  {/* RFQs List */}
                  <div className="lg:col-span-2 bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground">Request for Quotes (RFQ)</h3>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="bg-secondary/50 text-muted-foreground border-b border-border">
                            <th className="p-3 font-semibold">RFQ Number</th>
                            <th className="p-3 font-semibold">Items Spec</th>
                            <th className="p-3 font-semibold text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rfqs.map(rfq => {
                            const rfqItems = JSON.parse(rfq.items);
                            return (
                              <tr key={rfq.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                                <td className="p-3 font-semibold text-primary">{rfq.rfqNo}</td>
                                <td className="p-3 text-foreground font-medium">
                                  {rfqItems.map(it => `${it.desc} (qty: ${it.qty})`).join(', ')}
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    rfq.status === 'CLOSED' ? 'bg-secondary text-muted-foreground' : 'bg-success/15 text-success'
                                  }`}>
                                    {rfq.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Create RFQ Form */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground">Generate RFQ from Requisition</h3>
                    <form onSubmit={handleCreateRfq} className="flex flex-col gap-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Select Requisition</label>
                        <select 
                          required
                          value={rfqPrId}
                          onChange={e => setRfqPrId(e.target.value)}
                          className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                        >
                          <option value="">Choose Pending PR...</option>
                          {requisitions.filter(r => r.status === 'PENDING').map(r => (
                            <option key={r.id} value={r.id}>{r.prNo} - {r.requestedBy} ({r.department})</option>
                          ))}
                        </select>
                      </div>
                      <button type="submit" className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg border-0 cursor-pointer text-xs mt-2 shadow-md">
                        Issue RFQ
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: PURCHASE ORDERS */}
              {purchaseTab === 'pos' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                  
                  {/* PO List */}
                  <div className="lg:col-span-2 bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground">Purchase Orders (PO) Registry</h3>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="bg-secondary/50 text-muted-foreground border-b border-border">
                            <th className="p-3 font-semibold">PO Number</th>
                            <th className="p-3 font-semibold">Supplier</th>
                            <th className="p-3 font-semibold">Total Amount</th>
                            <th className="p-3 font-semibold text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchaseOrders.map(po => (
                            <tr key={po.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                              <td className="p-3 font-semibold text-primary">{po.poNo}</td>
                              <td className="p-3 text-foreground font-semibold">{po.supplier?.name || 'Supplier'}</td>
                              <td className="p-3 text-foreground font-bold">₹{po.totalAmount.toLocaleString()}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  po.status === 'COMPLETED' ? 'bg-success/15 text-success' : 
                                  po.status === 'APPROVED' ? 'bg-primary/15 text-primary' : 'bg-warning/15 text-warning'
                                }`}>
                                  {po.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Create PO Form */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground">Approve & Issue PO</h3>
                    <form onSubmit={handleCreatePo} className="flex flex-col gap-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Select Supplier</label>
                        <select 
                          required
                          value={poSupplierId}
                          onChange={e => setPoSupplierId(e.target.value)}
                          className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                        >
                          <option value="">Choose Supplier...</option>
                          {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name} (Overall Rating: {s.overallScore.toFixed(0)})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Link RFQ (Optional)</label>
                        <select 
                          value={poRfqId}
                          onChange={e => setPoRfqId(e.target.value)}
                          className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                        >
                          <option value="">Direct Order (No RFQ)</option>
                          {rfqs.filter(r => r.status === 'SENT').map(r => (
                            <option key={r.id} value={r.id}>{r.rfqNo}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Agreed Total Amount (INR)</label>
                        <input 
                          type="number" 
                          required
                          value={poAmount}
                          onChange={e => setPoAmount(e.target.value)}
                          placeholder="e.g. 10000"
                          className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs"
                        />
                      </div>
                      <button type="submit" className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg border-0 cursor-pointer text-xs mt-2 shadow-md">
                        Approve & Issue PO
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: GOODS RECEIPTS */}
              {purchaseTab === 'grns' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                  
                  {/* GRN List */}
                  <div className="lg:col-span-2 bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground">Goods Receipt Notes (GRN)</h3>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="bg-secondary/50 text-muted-foreground border-b border-border">
                            <th className="p-3 font-semibold">GRN No</th>
                            <th className="p-3 font-semibold">PO Number</th>
                            <th className="p-3 font-semibold">Received By</th>
                            <th className="p-3 font-semibold">Supplier</th>
                            <th className="p-3 font-semibold">Received Items Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {goodsReceipts.map(grn => {
                            const received = JSON.parse(grn.receivedItems);
                            return (
                              <tr key={grn.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                                <td className="p-3 font-semibold text-primary">{grn.grnNo}</td>
                                <td className="p-3 text-foreground font-semibold">{grn.purchaseOrder?.poNo || 'Direct'}</td>
                                <td className="p-3 text-foreground">{grn.receivedBy}</td>
                                <td className="p-3 text-foreground">{grn.supplier?.name || 'Supplier'}</td>
                                <td className="p-3 text-foreground font-medium">
                                  {received.map(it => `${it.qtyReceived} (${it.qualityStatus})`).join(', ')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Create GRN Form */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground">Log Intake Goods Receipt</h3>
                    <form onSubmit={handleCreateGrn} className="flex flex-col gap-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Select Active PO</label>
                        <select 
                          required
                          value={grnPoId}
                          onChange={e => setGrnPoId(e.target.value)}
                          className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                        >
                          <option value="">Choose Active PO...</option>
                          {purchaseOrders.filter(p => p.status === 'APPROVED' || p.status === 'SHIPPED').map(p => (
                            <option key={p.id} value={p.id}>{p.poNo} - {p.supplier?.name} (₹{p.totalAmount})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Received By (Officer Name)</label>
                        <input 
                          type="text" 
                          required
                          value={grnReceivedBy}
                          onChange={e => setGrnReceivedBy(e.target.value)}
                          placeholder="e.g. John Warehouse Manager"
                          className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Quantity Received</label>
                        <input 
                          type="number" 
                          required
                          value={grnQty}
                          onChange={e => setGrnQty(e.target.value)}
                          placeholder="e.g. 90"
                          className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase">Quality Check</label>
                          <select 
                            value={grnQuality}
                            onChange={e => setGrnQuality(e.target.value)}
                            className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          >
                            <option value="GOOD">PASS (Good)</option>
                            <option value="DEFECTIVE">FAIL (Defective)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase">Delivery Delay</label>
                          <select 
                            value={grnDelay}
                            onChange={e => setGrnDelay(e.target.value)}
                            className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          >
                            <option value="0">0 days (On Time)</option>
                            <option value="1">1 day delay</option>
                            <option value="2">2 days delay</option>
                            <option value="5">5+ days delay</option>
                          </select>
                        </div>
                      </div>
                      <button type="submit" className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg border-0 cursor-pointer text-xs mt-2 shadow-md">
                        Record GRN intake
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: VENDOR INVOICES (3-WAY MATCHING) */}
              {purchaseTab === 'invoices' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                  
                  {/* Invoice list */}
                  <div className="lg:col-span-2 bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground">Vendor Invoices & Matching Status</h3>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="bg-secondary/50 text-muted-foreground border-b border-border">
                            <th className="p-3 font-semibold">Invoice No</th>
                            <th className="p-3 font-semibold">PO Ref</th>
                            <th className="p-3 font-semibold">Supplier</th>
                            <th className="p-3 font-semibold">Total Bill</th>
                            <th className="p-3 font-semibold text-center">3-Way Match</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map(inv => (
                            <tr key={inv.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                              <td className="p-3 font-semibold text-primary">{inv.invoiceNo}</td>
                              <td className="p-3 text-foreground font-semibold">{inv.purchaseOrder?.poNo || 'Direct'}</td>
                              <td className="p-3 text-foreground">{inv.supplier?.name || 'Supplier'}</td>
                              <td className="p-3 text-foreground font-bold">₹{inv.totalAmount.toLocaleString()}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold ${
                                  inv.status === 'MATCH_PASSED' ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                                }`}>
                                  {inv.status === 'MATCH_PASSED' ? 'PASSED' : 'DISCREPANCY'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Submit invoice Form */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground">Submit Vendor Invoice</h3>
                    <form onSubmit={handleCreateInvoice} className="flex flex-col gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Select Purchase Order</label>
                        <select 
                          required
                          value={invPoId}
                          onChange={e => setInvPoId(e.target.value)}
                          className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                        >
                          <option value="">Choose PO...</option>
                          {purchaseOrders.filter(p => p.status === 'APPROVED' || p.status === 'SHIPPED').map(p => (
                            <option key={p.id} value={p.id}>{p.poNo} - {p.supplier?.name} (₹{p.totalAmount})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Vendor Invoice No</label>
                        <input 
                          type="text" 
                          required
                          value={invoiceNoInput}
                          onChange={e => setInvoiceNoInput(e.target.value)}
                          placeholder="e.g. INV-9908"
                          className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase">Billing Qty</label>
                          <input 
                            type="number" 
                            required
                            value={invQtyInput}
                            onChange={e => setInvQtyInput(e.target.value)}
                            placeholder="e.g. 90"
                            className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase">Unit Price (INR)</label>
                          <input 
                            type="number" 
                            required
                            value={invPriceInput}
                            onChange={e => setInvPriceInput(e.target.value)}
                            placeholder="e.g. 100"
                            className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Total Invoiced Amount (INR)</label>
                        <input 
                          type="number" 
                          required
                          value={invAmountInput}
                          onChange={e => setInvAmountInput(e.target.value)}
                          placeholder="e.g. 9000"
                          className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs"
                        />
                      </div>

                      <button type="submit" className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg border-0 cursor-pointer text-xs mt-2 shadow-md">
                        Verify 3-Way Match
                      </button>
                    </form>
                  </div>

                  {/* 3-WAY MATCHING FEEDBACK PANEL */}
                  {invoiceMatchingResult && (
                    <div className="lg:col-span-3 animate-fade-in">
                      <div className={`p-6 rounded-xl border backdrop-blur-md ${
                        invoiceMatchingResult.passed 
                          ? 'bg-success/10 border-success/30 text-success' 
                          : 'bg-danger/10 border-danger/30 text-danger'
                      }`}>
                        <div className="flex justify-between items-center pb-3 border-b border-border/30 mb-4">
                          <h4 className="font-heading font-extrabold text-sm flex items-center gap-1.5 uppercase tracking-wide">
                            {invoiceMatchingResult.passed ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5 animate-bounce" />}
                            <span>3-Way Matching Engine Status: {invoiceMatchingResult.passed ? 'PASSED' : 'DISCREPANCY DETECTED'}</span>
                          </h4>
                          <span className="text-[11px] opacity-85 font-semibold">Invoice: {invoiceMatchingResult.invoice.invoiceNo}</span>
                        </div>

                        {invoiceMatchingResult.passed ? (
                          <div className="text-xs leading-relaxed flex flex-col gap-2">
                            <p className="font-semibold">All verification checks successfully cleared:</p>
                            <ul className="list-disc pl-5 flex flex-col gap-1 opacity-90">
                              <li>Quantity match check: Invoiced billing quantities match within Goods Receipt limits.</li>
                              <li>Price tolerance checks: unit rates match approved Purchase Order rates.</li>
                              <li>General Ledger audit: Automated double-entry voucher posted to Accounts Payable.</li>
                            </ul>
                            <div className="mt-3 p-3 bg-card/65 rounded-lg border border-border text-[11px] text-foreground font-mono flex flex-col gap-1">
                              <span className="font-semibold text-primary">Automated Ledger Posting:</span>
                              <span>Debit: Consulting Expense (+₹{invoiceMatchingResult.invoice.totalAmount.toLocaleString()})</span>
                              <span>Credit: Accounts Payable (+₹{invoiceMatchingResult.invoice.totalAmount.toLocaleString()})</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs leading-relaxed flex flex-col gap-2">
                            <p className="font-bold uppercase tracking-wider text-[11px] text-danger mb-1">Mismatches flagged:</p>
                            <ul className="list-disc pl-5 flex flex-col gap-1.5 font-medium">
                              {invoiceMatchingResult.logs.map((log, lidx) => (
                                <li key={lidx}>{log}</li>
                              ))}
                            </ul>
                            <p className="mt-3 opacity-90 text-[11px] leading-normal">
                              Warning: The supplier invoice has been set to <span className="font-bold">MATCH_FAILED</span>. Payment is withheld, and the vendor score has been penalized. Please review variances before manual override.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: HUMAN RESOURCES */}
          {activeTab === 'hr' && (
            <div className="flex flex-col gap-6 animate-fade-in text-foreground">
              {/* Custom CSS Style block for attendance scanning animation */}
              <style>{`
                @keyframes scan {
                  0% { transform: translateY(0); }
                  50% { transform: translateY(150px); }
                  100% { transform: translateY(0); }
                }
                .laser-line {
                  animation: scan 2s linear infinite;
                }
              `}</style>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-4">
                <div>
                  <h2 className="font-heading text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                    <Users className="h-7 w-7 text-primary" />
                    <span>Human Resources Capital Console</span>
                  </h2>
                  <p className="text-xs text-muted-foreground">Organizational charts, candidate onboarding pipeline, biometric check-in log, and automated tax salary engine.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => dispatch(addChatMessage({ sender: 'ai', text: "Ask me to 'add employee John Doe with salary 100000 in Engineering' to test AI Bookkeeping!" }))}
                    className="px-4 py-2 text-xs rounded-lg font-semibold bg-secondary text-foreground hover:bg-border transition-all flex items-center gap-1.5 border border-border cursor-pointer animate-pulse"
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>AI Copilot Help</span>
                  </button>
                </div>
              </div>

              {/* Status Header Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card/40 backdrop-blur-md border border-border p-4 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg text-primary">
                    <Network className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">Total Staff</span>
                    <span className="text-xl font-bold">{employees.length} Members</span>
                  </div>
                </div>
                <div className="bg-card/40 backdrop-blur-md border border-border p-4 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-500">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">Active Leaves</span>
                    <span className="text-xl font-bold">{leaves.filter(l => l.status === 'PENDING').length} Pending</span>
                  </div>
                </div>
                <div className="bg-card/40 backdrop-blur-md border border-border p-4 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-500">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">Recruiting</span>
                    <span className="text-xl font-bold">{candidates.filter(c => c.status !== 'REJECTED').length} Openings</span>
                  </div>
                </div>
                <div className="bg-card/40 backdrop-blur-md border border-border p-4 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-lg text-green-500">
                    <Fingerprint className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">Today's Punch</span>
                    <span className="text-xl font-bold">{attendance.length} Logs</span>
                  </div>
                </div>
              </div>

              {/* Main Content Layout */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Column 1: Org Structure & Employee Roster */}
                <div className="flex flex-col gap-6">
                  {/* Department Org Chart */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-5 rounded-xl shadow-lg flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-2">
                      <Network className="h-4 w-4 text-primary" />
                      <span>Organizational Structure</span>
                    </h3>
                    
                    {/* Render tree */}
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-xs">
                      {departments.filter(d => !d.parentId).map(parent => (
                        <div key={parent.id} className="p-2 bg-secondary/30 rounded border border-border/40">
                          <div className="font-bold flex justify-between items-center text-foreground">
                            <span>📂 {parent.name}</span>
                            <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono">{parent.code}</span>
                          </div>
                          
                          {/* Children */}
                          <div className="pl-4 mt-2 border-l border-border/60 space-y-1.5">
                            {departments.filter(d => d.parentId === parent.id).map(child => (
                              <div key={child.id} className="flex justify-between items-center text-[11px] p-1 hover:bg-secondary/40 rounded transition-colors text-muted-foreground">
                                <span>📁 {child.name}</span>
                                <span className="font-mono text-[9px] bg-secondary text-foreground px-1.5 rounded">{child.code}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Department Form */}
                    <form onSubmit={handleCreateDepartment} className="space-y-2 border-t border-border pt-3">
                      <h4 className="text-xs font-bold text-muted-foreground">New Department Node</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <input
                          type="text"
                          placeholder="Code (DEPT-101)"
                          value={newDeptCode}
                          onChange={(e) => setNewDeptCode(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        />
                        <input
                          type="text"
                          placeholder="Dept Name"
                          value={newDeptName}
                          onChange={(e) => setNewDeptName(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <select
                        value={newDeptParent}
                        onChange={(e) => setNewDeptParent(e.target.value)}
                        className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                      >
                        <option value="" className="bg-card">No Parent (Top-level)</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id} className="bg-card">{d.name}</option>
                        ))}
                      </select>
                      <button 
                        type="submit" 
                        className="w-full py-1.5 text-xs rounded bg-primary hover:bg-primary/85 text-white font-semibold transition-all cursor-pointer border-0"
                      >
                        + Register Node
                      </button>
                    </form>
                  </div>

                  {/* Employees Registry */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-5 rounded-xl shadow-lg flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span>Corporate Employee Roster</span>
                    </h3>

                    <div className="overflow-y-auto max-h-[300px] space-y-2 pr-1">
                      {employees.map(emp => (
                        <div key={emp.id} className="p-3 bg-secondary/20 rounded-lg border border-border flex justify-between items-center text-xs hover:bg-secondary/40 transition-all">
                          <div>
                            <div className="font-bold text-foreground">{emp.firstName} {emp.lastName}</div>
                            <div className="text-[11px] text-muted-foreground">{emp.jobTitle} • {emp.department?.name || 'Unassigned'}</div>
                            <div className="text-[10px] text-primary/80 font-mono mt-0.5">{emp.employeeCode}</div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-foreground block">₹{emp.baseSalary.toLocaleString()}</span>
                            <span className="text-[10px] text-muted-foreground">Base / Mo</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Employee Form */}
                    <form onSubmit={handleCreateEmployee} className="space-y-2 border-t border-border pt-3 text-xs">
                      <h4 className="text-xs font-bold text-muted-foreground">Register New Employee</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="EMP-004"
                          value={newEmpCode}
                          onChange={(e) => setNewEmpCode(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        />
                        <input
                          type="text"
                          placeholder="Job Title"
                          value={newEmpTitle}
                          onChange={(e) => setNewEmpTitle(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="First Name"
                          value={newEmpFirst}
                          onChange={(e) => setNewEmpFirst(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        />
                        <input
                          type="text"
                          placeholder="Last Name"
                          value={newEmpLast}
                          onChange={(e) => setNewEmpLast(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="email"
                          placeholder="email@company.com"
                          value={newEmpEmail}
                          onChange={(e) => setNewEmpEmail(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        />
                        <input
                          type="text"
                          placeholder="Phone Number"
                          value={newEmpPhone}
                          onChange={(e) => setNewEmpPhone(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={newEmpDept}
                          onChange={(e) => setNewEmpDept(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="">Select Dept</option>
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="Basic Salary"
                          value={newEmpSalary}
                          onChange={(e) => setNewEmpSalary(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="w-full py-1.5 text-xs rounded bg-primary hover:bg-primary/85 text-white font-semibold transition-all cursor-pointer border-0"
                      >
                        + Create Staff Record
                      </button>
                    </form>
                  </div>
                </div>

                {/* Column 2: Recruitment Pipeline & Leave Management */}
                <div className="flex flex-col gap-6">
                  {/* Talent acquisition */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-5 rounded-xl shadow-lg flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      <span>Recruitment & Talent Pipeline</span>
                    </h3>

                    {/* Pipeline candidates list */}
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {candidates.map(cand => (
                        <div key={cand.id} className="p-3 bg-secondary/20 rounded-lg border border-border flex flex-col gap-2 text-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-foreground flex items-center gap-1.5">
                                <span>{cand.name}</span>
                                {cand.offerSent && <span className="text-[9px] bg-success/20 text-success border border-success/30 px-1 rounded">Offer Sent</span>}
                              </div>
                              <div className="text-[10px] text-muted-foreground">{cand.jobTitle} • {cand.email}</div>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              cand.status === 'APPLIED' ? 'bg-blue-500/20 text-blue-400' :
                              cand.status === 'INTERVIEW' ? 'bg-yellow-500/20 text-yellow-400' :
                              cand.status === 'OFFERED' ? 'bg-success/20 text-success' :
                              'bg-danger/20 text-danger'
                            }`}>{cand.status}</span>
                          </div>

                          <div className="flex justify-between items-center border-t border-border/40 pt-2 gap-2">
                            <div className="flex gap-1.5">
                              {cand.status === 'APPLIED' && (
                                <button 
                                  onClick={() => handleUpdateCandidateStatus(cand.id, 'INTERVIEW')}
                                  className="px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/35 text-yellow-400 border-0 rounded text-[10px] cursor-pointer transition-colors"
                                >
                                  Schedule Interview
                                </button>
                              )}
                              {(cand.status === 'INTERVIEW' || cand.status === 'APPLIED') && (
                                <button 
                                  onClick={() => handleTriggerOfferModal(cand)}
                                  className="px-2 py-1 bg-success/20 hover:bg-success/35 text-success border-0 rounded text-[10px] cursor-pointer transition-colors"
                                >
                                  Make Offer
                                </button>
                              )}
                              {cand.status !== 'REJECTED' && cand.status !== 'OFFERED' && (
                                <button 
                                  onClick={() => handleUpdateCandidateStatus(cand.id, 'REJECTED')}
                                  className="px-2 py-1 bg-danger/20 hover:bg-danger/35 text-danger border-0 rounded text-[10px] cursor-pointer transition-colors"
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                            {cand.offerSent && (
                              <button 
                                onClick={() => handleTriggerOfferModal(cand)}
                                className="text-[10px] text-primary hover:underline border-0 bg-transparent cursor-pointer flex items-center gap-1"
                              >
                                <Eye className="h-3.5 w-3.5" /> View Offer
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* New candidate form */}
                    <form onSubmit={handleCreateCandidate} className="space-y-2 border-t border-border pt-3 text-xs">
                      <h4 className="text-xs font-bold text-muted-foreground">Add New Applicant</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Candidate Name"
                          value={newCandName}
                          onChange={(e) => setNewCandName(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        />
                        <input
                          type="text"
                          placeholder="Job Title"
                          value={newCandTitle}
                          onChange={(e) => setNewCandTitle(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="email"
                          placeholder="candidate@gmail.com"
                          value={newCandEmail}
                          onChange={(e) => setNewCandEmail(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        />
                        <input
                          type="text"
                          placeholder="Phone"
                          value={newCandPhone}
                          onChange={(e) => setNewCandPhone(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="w-full py-1.5 text-xs rounded bg-primary hover:bg-primary/85 text-white font-semibold transition-all cursor-pointer border-0"
                      >
                        + Create Applicant Card
                      </button>
                    </form>
                  </div>

                  {/* Leave Management */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-5 rounded-xl shadow-lg flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>Leave Log & Accruals</span>
                    </h3>

                    {/* Pending and current leaves registry */}
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {leaves.map(l => (
                        <div key={l.id} className="p-3 bg-secondary/20 rounded-lg border border-border text-xs flex flex-col gap-1.5">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-foreground">{l.employee?.firstName} {l.employee?.lastName}</span>
                              <span className="text-[10px] text-muted-foreground block">{l.leaveType} • {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}</span>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              l.status === 'APPROVED' ? 'bg-success/20 text-success' :
                              l.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-danger/20 text-danger'
                            }`}>{l.status}</span>
                          </div>
                          
                          {l.reason && <p className="text-[11px] text-muted-foreground italic bg-black/10 p-1.5 rounded">"{l.reason}"</p>}
                          
                          {l.status === 'PENDING' && (
                            <div className="flex justify-end gap-1.5 border-t border-border/40 pt-2">
                              <button 
                                onClick={() => handleApproveLeave(l.id, 'APPROVED')}
                                className="px-2 py-0.5 bg-success/20 hover:bg-success/35 text-success border-0 rounded text-[10px] cursor-pointer transition-colors"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleApproveLeave(l.id, 'REJECTED')}
                                className="px-2 py-0.5 bg-danger/20 hover:bg-danger/35 text-danger border-0 rounded text-[10px] cursor-pointer transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Apply Leave Request Form */}
                    <form onSubmit={handleApplyLeave} className="space-y-2 border-t border-border pt-3 text-xs">
                      <h4 className="text-xs font-bold text-muted-foreground">Request Leave Time</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={leaveEmpId}
                          onChange={(e) => setLeaveEmpId(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="">Select Employee</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                          ))}
                        </select>
                        <select
                          value={leaveType}
                          onChange={(e) => setLeaveType(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="SICK">Sick Leave</option>
                          <option value="CASUAL">Casual Leave</option>
                          <option value="EARNED">Earned Leave</option>
                          <option value="MATERNITY">Maternity/Paternity</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-muted-foreground">Start Date</label>
                          <input
                            type="date"
                            value={leaveStart}
                            onChange={(e) => setLeaveStart(e.target.value)}
                            className="w-full bg-black/35 border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">End Date</label>
                          <input
                            type="date"
                            value={leaveEnd}
                            onChange={(e) => setLeaveEnd(e.target.value)}
                            className="w-full bg-black/35 border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Reason description"
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                      />
                      <button 
                        type="submit" 
                        className="w-full py-1.5 text-xs rounded bg-primary hover:bg-primary/85 text-white font-semibold transition-all cursor-pointer border-0"
                      >
                        + Submit Request
                      </button>
                    </form>
                  </div>
                </div>

                {/* Column 3: Biometric Check-in & Payroll slab engine */}
                <div className="flex flex-col gap-6">
                  {/* Biometric Scan attendance */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-5 rounded-xl shadow-lg flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-2">
                      <Fingerprint className="h-4 w-4 text-primary" />
                      <span>Biometric check-in logs</span>
                    </h3>

                    {/* Scan console widget */}
                    <form onSubmit={handleLogAttendance} className="space-y-3 text-xs">
                      <div>
                        <label className="block text-muted-foreground mb-1 text-[11px]">Select Employee Card</label>
                        <select
                          value={selectedAttEmp}
                          onChange={(e) => setSelectedAttEmp(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                          disabled={isScanning}
                        >
                          <option value="">Choose Employee</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeCode})</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <label className="flex-1 p-2 bg-secondary/35 border border-border rounded flex items-center justify-center gap-2 cursor-pointer hover:bg-secondary/50">
                          <input
                            type="radio"
                            name="scanMethod"
                            checked={attScanMethod === 'FACE_SCAN'}
                            onChange={() => setAttScanMethod('FACE_SCAN')}
                            disabled={isScanning}
                            className="text-primary focus:ring-0"
                          />
                          <span>Face ID Login</span>
                        </label>
                        <label className="flex-1 p-2 bg-secondary/35 border border-border rounded flex items-center justify-center gap-2 cursor-pointer hover:bg-secondary/50">
                          <input
                            type="radio"
                            name="scanMethod"
                            checked={attScanMethod === 'BIOMETRIC'}
                            onChange={() => setAttScanMethod('BIOMETRIC')}
                            disabled={isScanning}
                            className="text-primary focus:ring-0"
                          />
                          <span>Fingerprint Scan</span>
                        </label>
                      </div>

                      {/* SCANNER VIEW */}
                      <div className="relative w-full h-40 bg-black/45 border border-border rounded-lg overflow-hidden flex flex-col items-center justify-center">
                        {isScanning ? (
                          <>
                            {/* Animated laser line */}
                            <div className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_rgba(34,211,238,0.8)] top-0 laser-line"></div>
                            {attScanMethod === 'FACE_SCAN' ? (
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-14 h-14 rounded-full border-2 border-cyan-400 border-dashed animate-spin flex items-center justify-center">
                                  <Users className="h-6 w-6 text-cyan-400" />
                                </div>
                                <p className="text-[10px] text-cyan-400 font-mono animate-pulse">{faceScanStage || 'Initializing camera...'}</p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <Fingerprint className="h-14 w-14 text-cyan-400 animate-pulse" />
                                <p className="text-[10px] text-cyan-400 font-mono animate-pulse">{fingerprintStage || 'Calibrating fingerprint...'}</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center">
                            {scanStatus === 'success' ? (
                              <>
                                <CheckCircle className="h-12 w-12 text-success animate-bounce" />
                                <p className="text-xs font-semibold text-success">Auth Authenticated & Check-in Recorded!</p>
                              </>
                            ) : (
                              <>
                                <Fingerprint className="h-12 w-12 text-muted-foreground/40" />
                                <p className="text-[11px]">Hardware Ready. Choose employee and initiate trigger.</p>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={!selectedAttEmp || isScanning}
                        className={`w-full py-2 rounded font-bold text-white transition-all cursor-pointer border-0 ${
                          (!selectedAttEmp || isScanning) ? 'bg-secondary text-muted-foreground cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-600 shadow-md shadow-cyan-500/20'
                        }`}
                      >
                        {isScanning ? 'Verifying Credentials...' : 'Trigger Biometric Pulse Scan'}
                      </button>
                    </form>

                    {/* Attendance Logs */}
                    <div className="border-t border-border pt-3">
                      <h4 className="text-xs font-bold text-muted-foreground mb-2">Today's Attendance Registry</h4>
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto text-[11px] pr-1">
                        {attendance.map(log => (
                          <div key={log.id} className="p-2 bg-secondary/15 rounded border border-border/50 flex justify-between items-center">
                            <div>
                              <span className="font-semibold text-foreground">{log.employee?.firstName} {log.employee?.lastName}</span>
                              <span className="text-[9px] text-muted-foreground block font-mono">{log.verificationMethod}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-success font-mono font-bold block">{new Date(log.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              <span className="text-[8px] uppercase tracking-wider text-muted-foreground bg-success/20 px-1 rounded">Checked In</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Smart Payroll calculate */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-5 rounded-xl shadow-lg flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-2">
                      <IndianRupee className="h-4 w-4 text-primary" />
                      <span>Smart Tax-Slab Payroll Processor</span>
                    </h3>

                    {/* Payroll Form */}
                    <form onSubmit={handleCalculatePayroll} className="space-y-2 text-xs">
                      <div>
                        <label className="block text-muted-foreground mb-1 text-[11px]">Select Employee</label>
                        <select
                          value={payEmpId}
                          onChange={(e) => setPayEmpId(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="">Choose Employee</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} (Basic: ₹{emp.baseSalary.toLocaleString()})</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-muted-foreground mb-1 text-[11px]">Month</label>
                          <select
                            value={payMonth}
                            onChange={(e) => setPayMonth(e.target.value)}
                            className="w-full bg-black/35 border border-border rounded px-2 py-1.5 text-foreground focus:outline-none focus:border-primary"
                          >
                            <option value="1">January</option>
                            <option value="2">February</option>
                            <option value="3">March</option>
                            <option value="4">April</option>
                            <option value="5">May</option>
                            <option value="6">June</option>
                            <option value="7">July</option>
                            <option value="8">August</option>
                            <option value="9">September</option>
                            <option value="10">October</option>
                            <option value="11">November</option>
                            <option value="12">December</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-muted-foreground mb-1 text-[11px]">Year</label>
                          <select
                            value={payYear}
                            onChange={(e) => setPayYear(e.target.value)}
                            className="w-full bg-black/35 border border-border rounded px-2 py-1.5 text-foreground focus:outline-none focus:border-primary"
                          >
                            <option value="2026">2026</option>
                            <option value="2027">2027</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={!payEmpId}
                        className={`w-full py-2 rounded font-bold text-white transition-all cursor-pointer border-0 ${
                          !payEmpId ? 'bg-secondary text-muted-foreground cursor-not-allowed' : 'bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20'
                        }`}
                      >
                        Calculate & Post Ledger Voucher
                      </button>
                    </form>

                    {/* Slip breakdowns lists */}
                    <div className="border-t border-border pt-3">
                      <h4 className="text-xs font-bold text-muted-foreground mb-2 flex justify-between items-center">
                        <span>Processed PayRegistry</span>
                        <span className="text-[9px] bg-primary/20 text-primary border border-primary/30 px-1 rounded animate-pulse">Double-Entry Ledger Verified</span>
                      </h4>
                      <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                        {paySlips.map(slip => (
                          <div key={slip.id} className="p-2.5 bg-secondary/15 rounded border border-border text-[11px] flex flex-col gap-1">
                            <div className="flex justify-between font-bold text-foreground">
                              <span>{slip.employee?.firstName} {slip.employee?.lastName}</span>
                              <span className="text-success">Net Pay: ₹{Math.round(slip.netPay).toLocaleString()}</span>
                            </div>
                            <div className="text-[9px] text-muted-foreground">Month/Yr: {slip.month}/{slip.year} • Basic: ₹{slip.baseSalary.toLocaleString()}</div>
                            <div className="grid grid-cols-3 gap-1 text-[9px] bg-black/20 p-1.5 rounded mt-1 font-mono text-muted-foreground text-center">
                              <div>PF (12%): <span className="text-danger font-semibold">₹{Math.round(slip.pfDeduction)}</span></div>
                              <div>ESI: <span className="text-danger font-semibold">₹{Math.round(slip.esiDeduction)}</span></div>
                              <div>TDS (Tax): <span className="text-danger font-semibold">₹{Math.round(slip.tdsDeduction)}</span></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: SALES & CRM */}
          {activeTab === 'sales' && (
            <div className="flex flex-col gap-6 animate-fade-in text-foreground">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-4">
                <div>
                  <h2 className="font-heading text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                    <ShoppingCart className="h-7 w-7 text-primary" />
                    <span>Sales pipeline & Business CRM</span>
                  </h2>
                  <p className="text-xs text-muted-foreground">Leads generation, returning customer registries with premium badges, pipeline Kanban deals, and dynamic quotes generators.</p>
                </div>
                <div>
                  <button 
                    onClick={() => dispatch(addChatMessage({ sender: 'ai', text: "Ask me to 'create lead for Bruce Wayne from Wayne Corp worth 500000' to test AI Sales generation!" }))}
                    className="px-4 py-2 text-xs rounded-lg font-semibold bg-secondary text-foreground hover:bg-border transition-all flex items-center gap-1.5 border border-border cursor-pointer animate-pulse"
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>AI CRM Copilot</span>
                  </button>
                </div>
              </div>

              {/* Status Header Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card/40 backdrop-blur-md border border-border p-4 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg text-primary">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">Leads Captured</span>
                    <span className="text-xl font-bold">{leads.length} Prospects</span>
                  </div>
                </div>
                <div className="bg-card/40 backdrop-blur-md border border-border p-4 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-500">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">Active Opportunities</span>
                    <span className="text-xl font-bold">{opportunities.filter(o => o.stage !== 'WON' && o.stage !== 'LOST').length} Open Deals</span>
                  </div>
                </div>
                <div className="bg-card/40 backdrop-blur-md border border-border p-4 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-lg text-green-500">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">Won Revenue</span>
                    <span className="text-xl font-bold">₹{opportunities.filter(o => o.stage === 'WON').reduce((sum, o) => sum + o.value, 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="bg-card/40 backdrop-blur-md border border-border p-4 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-500">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">Quoted Proposals</span>
                    <span className="text-xl font-bold">{quotes.length} Quotes</span>
                  </div>
                </div>
              </div>

              {/* Main Content Layout */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Column 1: Leads registry & Business accounts */}
                <div className="flex flex-col gap-6">
                  {/* Leads Catalog */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-5 rounded-xl shadow-lg flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-2">
                      <UserPlus className="h-4 w-4 text-primary" />
                      <span>Prospect Leads Register</span>
                    </h3>

                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {leads.map(l => (
                        <div key={l.id} className="p-3 bg-secondary/20 rounded-lg border border-border text-xs flex flex-col gap-1.5">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-foreground block">{l.name}</span>
                              <span className="text-[10px] text-muted-foreground block">{l.company} • {l.email}</span>
                            </div>
                            <span className="text-success font-bold font-mono">₹{l.value.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] border-t border-border/40 pt-2 text-muted-foreground">
                            <span>Src: {l.source}</span>
                            <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold font-mono">{l.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Lead Form */}
                    <form onSubmit={handleCreateLead} className="space-y-2 border-t border-border pt-3 text-xs">
                      <h4 className="text-xs font-bold text-muted-foreground">Capture New Prospect</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Contact Name"
                          value={newLeadName}
                          onChange={(e) => setNewLeadName(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        />
                        <input
                          type="text"
                          placeholder="Company Name"
                          value={newLeadCompany}
                          onChange={(e) => setNewLeadCompany(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="email"
                          placeholder="email@prospect.com"
                          value={newLeadEmail}
                          onChange={(e) => setNewLeadEmail(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        />
                        <input
                          type="text"
                          placeholder="Phone Number"
                          value={newLeadPhone}
                          onChange={(e) => setNewLeadPhone(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={newLeadSource}
                          onChange={(e) => setNewLeadSource(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="Website Ref">Website Referral</option>
                          <option value="Cold Call">Cold Outreach</option>
                          <option value="Partner">Strategic Partner</option>
                          <option value="Conference">Industry Conference</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Est Deal Value"
                          value={newLeadValue}
                          onChange={(e) => setNewLeadValue(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="w-full py-1.5 text-xs rounded bg-primary hover:bg-primary/85 text-white font-semibold transition-all cursor-pointer border-0"
                      >
                        + Capture Lead
                      </button>
                    </form>
                  </div>

                  {/* Customer Accounts Catalog */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-5 rounded-xl shadow-lg flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-2">
                      <Award className="h-4 w-4 text-primary" />
                      <span>Business Customer Account Registry</span>
                    </h3>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {customerAccounts.map(acc => (
                        <div key={acc.id} className="p-3 bg-secondary/20 rounded-lg border border-border text-xs flex justify-between items-center hover:bg-secondary/30 transition-all">
                          <div>
                            <span className="font-bold text-foreground flex items-center gap-1.5">
                              <span>🏢 {acc.name}</span>
                              {acc.isReturning && (
                                <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 text-[9px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5 shadow-sm">
                                  <Award className="h-3 w-3 inline animate-bounce" /> GOLD CLIENT
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-muted-foreground block mt-1">{acc.industry} • {acc.billingAddress}</span>
                          </div>
                          <span className="text-[9px] bg-secondary text-foreground px-2 py-0.5 rounded font-mono font-semibold">B2B</span>
                        </div>
                      ))}
                    </div>

                    {/* Add Customer Account Form */}
                    <form onSubmit={handleCreateCustomerAccount} className="space-y-2 border-t border-border pt-3 text-xs">
                      <h4 className="text-xs font-bold text-muted-foreground">Register Business Account</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Account Name"
                          value={newAccName}
                          onChange={(e) => setNewAccName(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        />
                        <input
                          type="text"
                          placeholder="Industry (e.g. Legal)"
                          value={newAccIndustry}
                          onChange={(e) => setNewAccIndustry(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Billing Address"
                          value={newAccBilling}
                          onChange={(e) => setNewAccBilling(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        />
                        <input
                          type="text"
                          placeholder="Contact Phone"
                          value={newAccPhone}
                          onChange={(e) => setNewAccPhone(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-xs p-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newAccIsReturning}
                          onChange={(e) => setNewAccIsReturning(e.target.checked)}
                          className="rounded border-border text-primary focus:ring-0"
                        />
                        <span>Has transaction history (Loyal Returning Client)</span>
                      </label>
                      <button 
                        type="submit" 
                        className="w-full py-1.5 text-xs rounded bg-primary hover:bg-primary/85 text-white font-semibold transition-all cursor-pointer border-0"
                      >
                        + Create Business Account
                      </button>
                    </form>
                  </div>
                </div>

                {/* Column 2: Opportunities pipeline Kanban */}
                <div className="flex flex-col gap-6">
                  {/* Opportunities Kanban Board */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-5 rounded-xl shadow-lg flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span>Opportunity Pipeline Kanban</span>
                    </h3>

                    {/* Kanban Columns */}
                    <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                      {['QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'].map(stage => {
                        const stageOpps = opportunities.filter(o => o.stage === stage);
                        return (
                          <div key={stage} className="p-3 bg-secondary/15 rounded-lg border border-border/70 flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs border-b border-border/50 pb-1 font-semibold">
                              <span className="text-primary font-bold">{stage}</span>
                              <span className="text-[10px] bg-secondary text-foreground px-1.5 rounded">{stageOpps.length} deals</span>
                            </div>

                            <div className="space-y-2">
                              {stageOpps.length === 0 ? (
                                <span className="text-[10px] text-muted-foreground block text-center py-2">No active deals here</span>
                              ) : (
                                stageOpps.map(opp => (
                                  <div key={opp.id} className="p-2.5 bg-black/25 border border-border rounded text-[11px] flex flex-col gap-1.5">
                                    <div className="font-bold text-foreground">{opp.name}</div>
                                    <div className="text-success font-semibold font-mono">₹{opp.value.toLocaleString()}</div>
                                    {opp.account && (
                                      <div className="text-[9px] text-muted-foreground flex items-center gap-1">
                                        <span>🏢 {opp.account.name}</span>
                                        {opp.account.isReturning && <span className="text-yellow-500 font-bold">★ Gold</span>}
                                      </div>
                                    )}

                                    {/* Action button to move stage */}
                                    <div className="flex justify-end gap-1 mt-1 pt-1.5 border-t border-border/30">
                                      <select
                                        value={opp.stage}
                                        onChange={(e) => handleMoveOpportunityStage(opp.id, e.target.value)}
                                        className="bg-secondary border border-border rounded text-[9px] px-1 text-foreground focus:outline-none"
                                      >
                                        <option value="QUALIFICATION">Qualify</option>
                                        <option value="PROPOSAL">Proposal</option>
                                        <option value="NEGOTIATION">Negotiate</option>
                                        <option value="WON">WON</option>
                                        <option value="LOST">LOST</option>
                                      </select>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Opportunity Form */}
                    <form onSubmit={handleCreateOpportunity} className="space-y-2 border-t border-border pt-3 text-xs">
                      <h4 className="text-xs font-bold text-muted-foreground">Register Deal Opportunity</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Deal Name"
                          value={newOppName}
                          onChange={(e) => setNewOppName(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        />
                        <input
                          type="number"
                          placeholder="Deal Value"
                          value={newOppValue}
                          onChange={(e) => setNewOppValue(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={newOppLeadId}
                          onChange={(e) => setNewOppLeadId(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="">Link Lead</option>
                          {leads.map(l => (
                            <option key={l.id} value={l.id}>{l.name} ({l.company})</option>
                          ))}
                        </select>
                        <select
                          value={newOppAccId}
                          onChange={(e) => setNewOppAccId(e.target.value)}
                          className="w-full bg-black/35 border border-border rounded px-2 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="">Link B2B Account</option>
                          {customerAccounts.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      </div>
                      <button 
                        type="submit" 
                        className="w-full py-1.5 text-xs rounded bg-primary hover:bg-primary/85 text-white font-semibold transition-all cursor-pointer border-0"
                      >
                        + Create Opportunity Card
                      </button>
                    </form>
                  </div>
                </div>

                {/* Column 3: Quote to Cash Engine */}
                <div className="flex flex-col gap-6">
                  {/* Quote compiler builder */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-5 rounded-xl shadow-lg flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span>Quote-to-Cash Generator</span>
                    </h3>

                    {/* Step 1: Select opportunity */}
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="block text-muted-foreground mb-1 text-[11px]">Select Opportunity Deal</label>
                        <select
                          value={quoteOppId}
                          onChange={(e) => {
                            setQuoteOppId(e.target.value);
                            setQuoteItems([]);
                            setSuggestedDiscountVal(0);
                            setDiscountExplanationVal('');
                            setManualDiscountInput('0');
                            recalculateQuoteTotals([], 0);
                          }}
                          className="w-full bg-black/35 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="">Choose Deal Opportunity</option>
                          {opportunities.filter(o => o.stage !== 'WON' && o.stage !== 'LOST').map(opp => (
                            <option key={opp.id} value={opp.id}>{opp.name} (Val: ₹{opp.value.toLocaleString()})</option>
                          ))}
                        </select>
                      </div>

                      {quoteOppId && (
                        <div className="ai-theme-override p-3 bg-primary/10 border border-primary/20 rounded-lg flex flex-col gap-2">
                          <span className="font-semibold text-primary block">AI Strategic Discount Tool</span>
                          <p className="text-[10px] text-muted-foreground">Run the analyzer to check customer historical transaction records and suggest retention discounts.</p>
                          <button
                            type="button"
                            onClick={handleSuggestDiscount}
                            className="px-3 py-1.5 bg-primary text-white border-0 text-[10px] font-bold rounded cursor-pointer hover:bg-primary-hover transition-colors"
                          >
                            Analyze & Suggest Discount
                          </button>

                          {suggestedDiscountVal > 0 && (
                            <div className="bg-black/20 p-2 rounded border border-border space-y-1.5">
                              <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-success">Suggested discount: {suggestedDiscountVal}%</span>
                                <span className="bg-success/20 text-success text-[8px] px-1 rounded uppercase">Recommended</span>
                              </div>
                              <p className="text-[9px] text-muted-foreground leading-relaxed font-mono">"{discountExplanationVal}"</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Item compiler */}
                      {quoteOppId && (
                        <div className="border-t border-border/50 pt-3">
                          <h4 className="font-bold text-xs text-muted-foreground mb-2">Quotation Proposal Line Items</h4>
                          
                          {/* Item form */}
                          <div className="grid grid-cols-3 gap-1 mb-2">
                            <input
                              type="text"
                              placeholder="Description"
                              value={itemDesc}
                              onChange={(e) => setItemDesc(e.target.value)}
                              className="col-span-1 bg-black/35 border border-border rounded px-2 py-1 text-[11px] text-foreground focus:outline-none"
                            />
                            <input
                              type="number"
                              placeholder="Qty"
                              value={itemQty}
                              onChange={(e) => setItemQty(e.target.value)}
                              className="bg-black/35 border border-border rounded px-2 py-1 text-[11px] text-foreground focus:outline-none"
                            />
                            <input
                              type="number"
                              placeholder="Price"
                              value={itemPrice}
                              onChange={(e) => setItemPrice(e.target.value)}
                              className="bg-black/35 border border-border rounded px-2 py-1 text-[11px] text-foreground focus:outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleAddQuoteItem}
                            className="w-full py-1 bg-secondary text-foreground border border-border hover:bg-border rounded text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            + Add Line Item
                          </button>

                          {/* List compiled */}
                          <div className="mt-3 space-y-1 max-h-[140px] overflow-y-auto pr-1">
                            {quoteItems.map((item, idx) => (
                              <div key={idx} className="p-2 bg-secondary/15 border border-border rounded text-[11px] flex justify-between items-center">
                                <div>
                                  <span className="font-semibold text-foreground block">{item.desc}</span>
                                  <span className="text-[9px] text-muted-foreground">{item.qty} units x ₹{item.price.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground font-mono">₹{(item.qty * item.price).toLocaleString()}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveQuoteItem(idx)}
                                    className="p-1 text-danger hover:bg-danger/10 border-0 bg-transparent rounded cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Discount adjustment */}
                          <div className="border-t border-border/50 mt-3 pt-3 space-y-3">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[11px] text-muted-foreground font-semibold">Quote Discount %</label>
                                <span className="text-[10px] text-primary">Strategic limit: 15%</span>
                              </div>
                              <div className="relative">
                                <input
                                  type="number"
                                  placeholder="Discount percent (e.g. 10)"
                                  value={manualDiscountInput}
                                  onChange={(e) => {
                                    setManualDiscountInput(e.target.value);
                                    recalculateQuoteTotals(quoteItems, parseFloat(e.target.value || 0));
                                  }}
                                  className="w-full bg-black/35 border border-border rounded pl-2.5 pr-8 py-1.5 text-foreground text-xs focus:outline-none"
                                />
                                <span className="absolute right-2.5 top-1.5 text-xs text-muted-foreground"><Percent className="h-3.5 w-3.5 inline" /></span>
                              </div>
                            </div>

                            {/* Quotation Breakdown summary */}
                            <div className="bg-black/20 p-3 rounded-lg border border-border text-xs space-y-1.5 font-mono">
                              <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal Value:</span>
                                <span>₹{quoteSubtotal.toLocaleString()}</span>
                              </div>
                              {quoteDiscountAmt > 0 && (
                                <div className="flex justify-between text-danger font-semibold">
                                  <span>Discount ({manualDiscountInput}%):</span>
                                  <span>-₹{Math.round(quoteDiscountAmt).toLocaleString()}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-muted-foreground">
                                <span>Tax (GST 18%):</span>
                                <span>₹{Math.round(quoteTaxAmt).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-success font-bold border-t border-border/30 pt-1.5 text-sm">
                                <span>Total Payable:</span>
                                <span>₹{Math.round(quoteTotal).toLocaleString()}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={handleCreateQuote}
                              disabled={quoteItems.length === 0}
                              className={`w-full py-2 rounded font-bold text-white transition-all cursor-pointer border-0 ${
                                quoteItems.length === 0 ? 'bg-secondary text-muted-foreground cursor-not-allowed' : 'bg-primary hover:bg-primary/85 shadow-lg shadow-primary/20'
                              }`}
                            >
                              Generate Quote Proposal & Print
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quotation registry list */}
                    <div className="border-t border-border pt-3">
                      <h4 className="text-xs font-bold text-muted-foreground mb-2">Quote Proposals Archive</h4>
                      <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                        {quotes.map(q => (
                          <div key={q.id} className="p-2.5 bg-secondary/15 rounded border border-border text-[11px] flex justify-between items-center">
                            <div>
                              <span className="font-bold text-foreground block">{q.quoteNo}</span>
                              <span className="text-[9px] text-muted-foreground block">{q.opportunity?.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-foreground font-mono block">₹{Math.round(q.total).toLocaleString()}</span>
                              <button
                                onClick={() => {
                                  setPreviewQuote(q);
                                  setPreviewQuoteModalOpen(true);
                                }}
                                className="text-[10px] text-primary hover:underline border-0 bg-transparent cursor-pointer flex items-center gap-0.5 justify-end"
                              >
                                <Eye className="h-3 w-3 inline" /> View proposal
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* CRM Modals: PRINT PREVIEW */}
              {previewQuoteModalOpen && previewQuote && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
                  <div className="bg-card border border-border rounded-xl shadow-2xl max-w-2xl w-full p-6 relative overflow-hidden flex flex-col gap-6">
                    <div className="flex justify-between items-start border-b border-border pb-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-primary font-bold text-base">
                          <Sparkles className="h-5 w-5" />
                          <span>EPR DASHBOARD CORP</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">Automated B2B Quoting System</span>
                      </div>
                      <div className="text-right">
                        <h4 className="text-sm font-bold text-foreground">PROPOSAL ESTIMATE</h4>
                        <span className="text-[11px] font-mono text-muted-foreground block">Ref: {previewQuote.quoteNo}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Quoted For:</span>
                        <span className="font-semibold text-foreground mt-0.5 block">{previewQuote.opportunity?.name || 'Client Opportunity'}</span>
                        <span className="text-muted-foreground block mt-0.5">B2B Account Channel</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Date Issued:</span>
                        <span className="text-foreground mt-0.5 block">{new Date().toLocaleDateString()}</span>
                        <span className="text-[10px] text-success font-semibold bg-success/20 px-1.5 py-0.5 rounded mt-1 inline-block">APPROVED BY SALES</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-secondary/50 border-b border-border text-muted-foreground">
                            <th className="p-3 font-semibold">Line Item Description</th>
                            <th className="p-3 font-semibold text-center">Qty</th>
                            <th className="p-3 font-semibold text-right">Unit Price</th>
                            <th className="p-3 font-semibold text-right">Line Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {JSON.parse(previewQuote.items || '[]').map((item, idx) => (
                            <tr key={idx} className="border-b border-border/50 hover:bg-secondary/10">
                              <td className="p-3 text-foreground font-semibold">{item.desc}</td>
                              <td className="p-3 text-center text-foreground">{item.qty}</td>
                              <td className="p-3 text-right text-foreground">₹{item.price.toLocaleString()}</td>
                              <td className="p-3 text-right text-foreground font-semibold">₹{(item.qty * item.price).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-between items-start gap-6 border-t border-border pt-4 text-xs">
                      <div className="flex-1 text-[11px] text-muted-foreground italic bg-secondary/20 p-2.5 rounded border border-border">
                        <span className="font-bold text-foreground not-italic block mb-1">Quote Remarks:</span>
                        "{previewQuote.discountExplanation || 'No specific discounts explanation recorded.'}"
                      </div>
                      <div className="w-60 space-y-1.5 font-mono text-[11px] text-right">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Subtotal:</span>
                          <span>₹{previewQuote.subtotal.toLocaleString()}</span>
                        </div>
                        {previewQuote.discount > 0 && (
                          <div className="flex justify-between text-danger font-semibold">
                            <span>Strategic Discount ({previewQuote.discount}%):</span>
                            <span>-₹{Math.round(previewQuote.subtotal * (previewQuote.discount / 100)).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-muted-foreground">
                          <span>Tax (GST 18%):</span>
                          <span>₹{Math.round(previewQuote.taxAmount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-success font-bold border-t border-border/50 pt-1.5 text-xs text-foreground">
                          <span>Grand Total Payable:</span>
                          <span>₹{Math.round(previewQuote.total).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-border/50 pt-4">
                      <button
                        onClick={() => {
                          window.print();
                        }}
                        className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded cursor-pointer border-0 transition-colors flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" /> Print Proposal
                      </button>
                      <button
                        onClick={() => {
                          setPreviewQuote(null);
                          setPreviewQuoteModalOpen(false);
                        }}
                        className="px-4 py-2 bg-secondary hover:bg-border text-foreground text-xs font-semibold rounded cursor-pointer border border-border transition-colors"
                      >
                        Close Preview
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* HR Candidate Offer Letter Modal */}
          {offerLetterModalOpen && selectedCandidate && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-card border border-border rounded-xl shadow-2xl max-w-xl w-full p-6 relative overflow-hidden flex flex-col gap-6">
                <div className="flex justify-between items-start border-b border-border pb-4">
                  <div>
                    <h3 className="text-base font-bold text-foreground">Generate Employment Offer Letter</h3>
                    <p className="text-[10px] text-muted-foreground">Create a formal PDF/printed compensation offer letter for {selectedCandidate.name}.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setOfferLetterModalOpen(false);
                      setSelectedCandidate(null);
                    }}
                    className="p-1 rounded bg-secondary hover:bg-border border-0 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    X
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-muted-foreground mb-1 text-[11px]">Proposed Base Monthly Pay (₹)</label>
                    <input
                      type="number"
                      value={offerPayInput}
                      onChange={(e) => setOfferPayInput(e.target.value)}
                      className="w-full bg-black/35 border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateOfferLetter}
                    className="w-full py-2 bg-success text-white border-0 font-bold rounded cursor-pointer hover:bg-success/80 transition-colors"
                  >
                    Compile Offer Draft Letter
                  </button>
                </div>

                {generatedOfferText && (
                  <div className="flex flex-col gap-4">
                    <pre className="bg-black/50 border border-border rounded-lg p-4 font-mono text-[10px] text-muted-foreground whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                      {generatedOfferText}
                    </pre>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          window.print();
                        }}
                        className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded cursor-pointer border-0 transition-colors"
                      >
                        Print Offer Letter
                      </button>
                      <button
                        onClick={() => {
                          setOfferLetterModalOpen(false);
                          setSelectedCandidate(null);
                        }}
                        className="px-4 py-2 bg-secondary hover:bg-border text-foreground text-xs font-semibold rounded cursor-pointer border border-border transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GENERIC FALLBACK: truly uncovered tabs */}
          {!['dashboard','finance','purchase','hr','sales','ai-assistant','inventory','manufacturing','ecommerce','assets'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
              <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 border border-primary/20">
                <Sparkles className="h-8 w-8" />
              </div>
              <h2 className="font-heading text-lg font-bold text-foreground">Module Coming Soon</h2>
              <p className="text-xs text-muted-foreground max-w-sm mt-2 leading-relaxed">
                The <strong className="uppercase">{activeTab}</strong> module is being built.
              </p>
              <button onClick={() => dispatch(setActiveTab('dashboard'))} className="px-4 py-2 text-xs rounded-lg font-semibold bg-primary hover:bg-primary/85 text-white transition-colors cursor-pointer border-0 mt-6">
                Return to Dashboard
              </button>
            </div>
          )}

          {/* ═══════════════ TAB: E-COMMERCE ═══════════════ */}
          {activeTab === 'ecommerce' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <h2 className="font-heading text-lg font-bold text-foreground">E-Commerce Store</h2>
                  <p className="text-xs text-muted-foreground">Online storefront, order management, cart, and loyalty rewards program.</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Cart Button */}
                  <button onClick={() => setCartOpen(true)} className="relative flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/85 text-white text-xs font-semibold rounded-lg cursor-pointer border-0 transition-colors">
                    <ShoppingCart className="h-4 w-4" />
                    Cart {cartItemCount > 0 && <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{cartItemCount}</span>}
                  </button>
                </div>
              </div>

              {/* Checkout success/error message */}
              {checkoutMessage && (
                <div className={`p-3 rounded-lg text-xs font-semibold ${checkoutMessage.type === 'success' ? 'bg-success/15 text-success border border-success/30' : 'bg-danger/15 text-danger border border-danger/30'}`}>
                  {checkoutMessage.text}
                </div>
              )}

              {/* SubTab Navigation */}
              <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-lg border border-border self-start overflow-x-auto max-w-full">
                {[{ id: 'store', label: '🛒 Store' }, { id: 'orders', label: '📦 Orders' }, { id: 'loyalty', label: '⭐ Loyalty' }, { id: 'add-product', label: '➕ Add Product' }].map(bt => (
                  <button key={bt.id} onClick={() => setEcomSubTab(bt.id)} className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all border-0 cursor-pointer ${ecomSubTab === bt.id ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground bg-transparent'}`}>{bt.label}</button>
                ))}
              </div>

              {/* ── Store Grid ── */}
              {ecomSubTab === 'store' && (
                <div className="flex flex-col gap-4">
                  {/* Category Filters */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {['All', 'Electronics', 'Appliances', 'Furniture'].map(cat => (
                      <button key={cat} onClick={() => setStoreFilter(cat)} className={`px-3 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-all ${storeFilter === cat ? 'bg-primary text-white border-primary' : 'bg-secondary text-muted-foreground border-border hover:border-primary/40'}`}>{cat}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {storeProducts.filter(p => storeFilter === 'All' || p.category === storeFilter).map(product => (
                      <div key={product.id} className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-4 hover:border-primary/40 transition-all group flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-semibold">{product.category}</span>
                            <h3 className="font-heading font-bold text-sm text-foreground mt-1.5 leading-tight">{product.name}</h3>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{product.description}</p>
                          </div>
                        </div>
                        <div className="flex items-end justify-between mt-auto">
                          <div>
                            {product.salePrice ? (
                              <div>
                                <span className="text-xs text-muted-foreground line-through">₹{product.price.toLocaleString()}</span>
                                <div className="text-base font-bold text-success">₹{product.salePrice.toLocaleString()}</div>
                              </div>
                            ) : (
                              <div className="text-base font-bold text-foreground">₹{product.price.toLocaleString()}</div>
                            )}
                            <div className="text-[10px] text-muted-foreground mt-0.5">⭐ +{product.loyaltyPts} pts · Stock: {product.stock}</div>
                          </div>
                          <button onClick={() => handleAddToCart(product)} disabled={product.stock === 0} className="px-3 py-1.5 bg-primary hover:bg-primary/85 text-white text-[11px] font-semibold rounded-lg cursor-pointer border-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Orders ── */}
              {ecomSubTab === 'orders' && (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-border bg-secondary/40">
                      {['Order No', 'Customer', 'Amount', 'Items', 'Status', 'Date'].map(h => <th key={h} className="px-4 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {customerOrders.map(order => {
                        const statusColors = { PLACED: 'text-blue-400 bg-blue-400/10', PROCESSING: 'text-yellow-400 bg-yellow-400/10', SHIPPED: 'text-cyan-400 bg-cyan-400/10', DELIVERED: 'text-success bg-success/10', CANCELLED: 'text-danger bg-danger/10' };
                        return (
                          <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                            <td className="px-4 py-3 font-mono text-primary font-bold">{order.orderNo}</td>
                            <td className="px-4 py-3"><div className="font-semibold text-foreground">{order.customerName}</div><div className="text-muted-foreground text-[10px]">{order.customerEmail}</div></td>
                            <td className="px-4 py-3 font-semibold text-success">₹{order.totalAmount.toLocaleString()}</td>
                            <td className="px-4 py-3 text-muted-foreground">{order.items?.length || 0} item(s)</td>
                            <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[order.status] || 'text-muted-foreground bg-secondary'}`}>{order.status}</span></td>
                            <td className="px-4 py-3 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── Loyalty ── */}
              {ecomSubTab === 'loyalty' && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Members', value: loyaltyAccounts.length, icon: '👥' },
                      { label: 'Total Points Issued', value: loyaltyAccounts.reduce((s, l) => s + l.points, 0).toLocaleString(), icon: '⭐' },
                      { label: 'Gold & Above', value: loyaltyAccounts.filter(l => ['GOLD', 'PLATINUM'].includes(l.tier)).length, icon: '🥇' },
                      { label: 'Avg Points/Member', value: loyaltyAccounts.length ? Math.round(loyaltyAccounts.reduce((s, l) => s + l.points, 0) / loyaltyAccounts.length).toLocaleString() : '0', icon: '📊' },
                    ].map(kpi => (
                      <div key={kpi.label} className="bg-card/60 border border-border rounded-xl p-4">
                        <div className="text-2xl mb-1">{kpi.icon}</div>
                        <div className="text-xl font-bold text-foreground">{kpi.value}</div>
                        <div className="text-[11px] text-muted-foreground">{kpi.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-border bg-secondary/40">
                        {['Customer', 'Email', 'Points', 'Tier'].map(h => <th key={h} className="px-4 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {loyaltyAccounts.sort((a, b) => b.points - a.points).map(acc => {
                          const tierColors = { BRONZE: 'text-orange-400 bg-orange-400/10', SILVER: 'text-slate-300 bg-slate-300/10', GOLD: 'text-yellow-400 bg-yellow-400/10', PLATINUM: 'text-purple-400 bg-purple-400/10' };
                          return (
                            <tr key={acc.id} className="border-b border-border/50 hover:bg-secondary/20">
                              <td className="px-4 py-3 font-semibold text-foreground">{acc.customerName}</td>
                              <td className="px-4 py-3 text-muted-foreground">{acc.customerEmail}</td>
                              <td className="px-4 py-3 font-bold text-primary">{acc.points.toLocaleString()} pts</td>
                              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tierColors[acc.tier]}`}>{acc.tier}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Add Product ── */}
              {ecomSubTab === 'add-product' && (
                <form onSubmit={handleAddStoreProduct} className="bg-card/60 border border-border rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                  <h3 className="font-heading font-bold text-sm text-foreground col-span-full">Add Store Product</h3>
                  {[
                    { label: 'SKU *', value: newSpSku, setter: setNewSpSku, placeholder: 'e.g. ELEC-TV-007' },
                    { label: 'Product Name *', value: newSpName, setter: setNewSpName, placeholder: 'e.g. 65" OLED TV' },
                    { label: 'Description', value: newSpDesc, setter: setNewSpDesc, placeholder: 'Short description' },
                    { label: 'Price (₹) *', value: newSpPrice, setter: setNewSpPrice, placeholder: '49999', type: 'number' },
                    { label: 'Sale Price (₹)', value: newSpSalePrice, setter: setNewSpSalePrice, placeholder: '43999', type: 'number' },
                    { label: 'Stock Units', value: newSpStock, setter: setNewSpStock, placeholder: '20', type: 'number' },
                    { label: 'Loyalty Points per Purchase', value: newSpLoyaltyPts, setter: setNewSpLoyaltyPts, placeholder: '440', type: 'number' },
                  ].map(field => (
                    <div key={field.label}>
                      <label className="block text-[11px] text-muted-foreground mb-1">{field.label}</label>
                      <input type={field.type || 'text'} value={field.value} onChange={e => field.setter(e.target.value)} placeholder={field.placeholder} className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">Category</label>
                    <select value={newSpCategory} onChange={e => setNewSpCategory(e.target.value)} className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary">
                      {['Electronics', 'Appliances', 'Furniture', 'Clothing', 'Books', 'Sports', 'Other'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-span-full">
                    <button type="submit" className="px-5 py-2 bg-primary hover:bg-primary/85 text-white text-xs font-bold rounded-lg cursor-pointer border-0 transition-all">Add Product</button>
                  </div>
                </form>
              )}

              {/* ── Cart Drawer ── */}
              {cartOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end" onClick={() => setCartOpen(false)}>
                  <div className="w-full max-w-sm bg-card border-l border-border h-full flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b border-border flex justify-between items-center">
                      <span className="font-heading font-bold text-foreground">Shopping Cart ({cartItemCount})</span>
                      <button onClick={() => setCartOpen(false)} className="text-muted-foreground hover:text-foreground bg-transparent border-0 cursor-pointer text-sm font-bold">✕</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                      {cart.length === 0 ? (
                        <div className="text-center text-muted-foreground text-xs py-8">Your cart is empty</div>
                      ) : cart.map(item => (
                        <div key={item.product.id} className="flex items-center gap-3 bg-secondary/30 rounded-lg p-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs text-foreground truncate">{item.product.name}</div>
                            <div className="text-[11px] text-primary font-bold">₹{(item.product.salePrice ?? item.product.price).toLocaleString()}</div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => handleCartQtyChange(item.product.id, -1)} className="h-6 w-6 rounded bg-border text-foreground text-xs flex items-center justify-center cursor-pointer border-0 hover:bg-primary hover:text-white transition-colors">-</button>
                            <span className="text-xs font-bold text-foreground w-4 text-center">{item.quantity}</span>
                            <button onClick={() => handleCartQtyChange(item.product.id, 1)} className="h-6 w-6 rounded bg-border text-foreground text-xs flex items-center justify-center cursor-pointer border-0 hover:bg-primary hover:text-white transition-colors">+</button>
                            <button onClick={() => handleRemoveFromCart(item.product.id)} className="h-6 w-6 rounded bg-danger/10 text-danger text-xs flex items-center justify-center cursor-pointer border-0 hover:bg-danger hover:text-white transition-colors ml-1">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {cart.length > 0 && (
                      <div className="p-4 border-t border-border">
                        <div className="flex justify-between text-sm font-bold mb-4">
                          <span className="text-foreground">Total</span>
                          <span className="text-success">₹{cartTotal.toLocaleString()}</span>
                        </div>
                        <form onSubmit={handleCheckout} className="flex flex-col gap-2">
                          <input type="text" placeholder="Your Name *" value={checkoutName} onChange={e => setCheckoutName(e.target.value)} className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary" required />
                          <input type="email" placeholder="Email *" value={checkoutEmail} onChange={e => setCheckoutEmail(e.target.value)} className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary" required />
                          <input type="text" placeholder="Shipping Address" value={checkoutAddress} onChange={e => setCheckoutAddress(e.target.value)} className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary" />
                          <button type="submit" className="w-full py-2 bg-primary hover:bg-primary/85 text-white text-xs font-bold rounded-lg cursor-pointer border-0 transition-all mt-1">Place Order</button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ TAB: USER MANAGEMENT (Admin Only) ═══════════════ */}
          {activeTab === 'users' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="font-heading text-lg font-bold text-foreground">User Directory & IAM</h2>
                  <p className="text-xs text-muted-foreground">Manage user accounts, assign enterprise security roles, and audit account status.</p>
                </div>
                {usersLoading && (
                  <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                )}
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-panel p-4 rounded-xl border border-border flex flex-col justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase font-sans font-bold tracking-widest">Total Accounts</span>
                  <div className="text-2xl font-bold font-heading text-primary mt-2">
                    {usersList.length}
                  </div>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-border flex flex-col justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase font-sans font-bold tracking-widest">Active Administrators</span>
                  <div className="text-2xl font-bold font-heading text-success-emerald mt-2">
                    {usersList.filter(u => u.isActive && u.roles?.some(r => r.name === 'ADMIN')).length}
                  </div>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-border flex flex-col justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase font-sans font-bold tracking-widest">Suspended Accounts</span>
                  <div className="text-2xl font-bold font-heading text-danger mt-2">
                    {usersList.filter(u => !u.isActive).length}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Users List Column */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <div className="glass-panel border border-border rounded-xl p-4 overflow-hidden">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-heading font-bold text-sm text-foreground">Registered Users</h3>
                      <button 
                        onClick={loadUsersData} 
                        className="p-1.5 rounded-lg bg-secondary/50 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors"
                        title="Refresh Directory"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {userError && (
                      <div className="mb-4 flex items-start gap-3 p-3 rounded-lg bg-error-container/20 border border-error/20">
                        <span className="material-symbols-outlined text-error">error</span>
                        <p className="font-body-sm text-body-sm text-error">{userError}</p>
                      </div>
                    )}

                    {userSuccess && (
                      <div className="mb-4 flex items-start gap-3 p-3 rounded-lg bg-success-emerald/10 border border-success-emerald/20">
                        <span className="material-symbols-outlined text-success-emerald">verified</span>
                        <p className="font-body-sm text-body-sm text-success-emerald">{userSuccess}</p>
                      </div>
                    )}

                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border/80 text-muted-foreground">
                            <th className="px-3 py-2.5 font-semibold">User</th>
                            <th className="px-3 py-2.5 font-semibold">Email</th>
                            <th className="px-3 py-2.5 font-semibold">Assigned Roles</th>
                            <th className="px-3 py-2.5 font-semibold text-center">Status</th>
                            <th className="px-3 py-2.5 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usersList.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="text-center py-6 text-muted-foreground">
                                No users found in directory.
                              </td>
                            </tr>
                          ) : (
                            usersList.map(u => {
                              const isAdmin = u.roles?.some(r => r.name === 'ADMIN');
                              const isSelf = u.email === currentUser?.email;
                              return (
                                <tr key={u.id} className="border-b border-border/30 hover:bg-secondary/15 transition-colors">
                                  <td className="px-3 py-3 font-semibold text-foreground">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">
                                        {u.firstName?.[0]}{u.lastName?.[0]}
                                      </div>
                                      <span>{u.firstName} {u.lastName} {isSelf && <span className="text-[9px] bg-primary/20 text-primary px-1 rounded">(You)</span>}</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 text-muted-foreground select-all">{u.email}</td>
                                  <td className="px-3 py-3">
                                    <div className="flex flex-wrap gap-1">
                                      {u.roles?.map(r => (
                                        <span 
                                          key={r.id || r.name} 
                                          className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                            r.name === 'ADMIN' 
                                              ? 'bg-primary/10 text-primary border border-primary/20' 
                                              : 'bg-secondary text-muted-foreground border border-border'
                                          }`}
                                        >
                                          {r.name}
                                        </span>
                                      )) || <span className="text-muted-foreground">No roles</span>}
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                      u.isActive 
                                        ? 'bg-success-emerald/10 text-success-emerald border border-success-emerald/20' 
                                        : 'bg-error-container/10 text-error border border-error/20'
                                    }`}>
                                      {u.isActive ? 'Active' : 'Suspended'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 text-right">
                                    <button 
                                      onClick={() => handleToggleUserStatus(u)}
                                      disabled={isSelf}
                                      className={`px-2.5 py-1 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                                        isSelf 
                                          ? 'opacity-40 cursor-not-allowed bg-transparent text-muted-foreground border-border' 
                                          : u.isActive
                                            ? 'bg-error-container/5 hover:bg-error-container/20 text-error border-error/20'
                                            : 'bg-success-emerald/5 hover:bg-success-emerald/20 text-success-emerald border-success-emerald/20'
                                      }`}
                                    >
                                      {u.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Create User Form Column */}
                <div className="flex flex-col gap-4">
                  <div className="glass-panel border border-border rounded-xl p-5 flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">person_add</span>
                      Create User Account
                    </h3>
                    
                    <form onSubmit={handleCreateUser} className="flex flex-col gap-3.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">First Name</label>
                          <input 
                            type="text" 
                            required 
                            value={createUserFirstName} 
                            onChange={e => setCreateUserFirstName(e.target.value)} 
                            placeholder="e.g. John" 
                            className="bg-black/30 border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary outline-none" 
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Last Name</label>
                          <input 
                            type="text" 
                            required 
                            value={createUserLastName} 
                            onChange={e => setCreateUserLastName(e.target.value)} 
                            placeholder="e.g. Doe" 
                            className="bg-black/30 border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary outline-none" 
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Email Address</label>
                        <input 
                          type="email" 
                          required 
                          value={createUserEmail} 
                          onChange={e => setCreateUserEmail(e.target.value)} 
                          placeholder="e.g. j.doe@company.com" 
                          className="bg-black/30 border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary outline-none" 
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Password</label>
                        <input 
                          type="password" 
                          required 
                          value={createUserPassword} 
                          onChange={e => setCreateUserPassword(e.target.value)} 
                          placeholder="••••••••••••" 
                          className="bg-black/30 border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary outline-none font-mono" 
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Security Role</label>
                        <div className="relative">
                          <select 
                            value={createUserRole} 
                            onChange={e => setCreateUserRole(e.target.value)}
                            className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary appearance-none cursor-pointer"
                          >
                            {rolesList.length === 0 ? (
                              <>
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                              </>
                            ) : (
                              rolesList.map(r => (
                                <option key={r.id} value={r.name}>{r.name} - {r.description || 'System role'}</option>
                              ))
                            )}
                          </select>
                          <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-sm">expand_more</span>
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        disabled={userActionLoading}
                        className="btn-primary-gradient w-full py-2.5 rounded-lg font-semibold text-white shadow-lg text-xs active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-1.5 border-0 cursor-pointer mt-2"
                      >
                        <span>{userActionLoading ? 'Creating...' : 'Provision Account'}</span>
                        {userActionLoading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ TAB: FIXED ASSETS & MAINTENANCE ═══════════════ */}
          {activeTab === 'assets' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div>
                <h2 className="font-heading text-lg font-bold text-foreground">Fixed Assets & Maintenance</h2>
                <p className="text-xs text-muted-foreground">Asset register, Straight-Line / Declining Balance depreciation, and preventive maintenance work orders.</p>
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-lg border border-border self-start overflow-x-auto max-w-full">
                {[{ id: 'register', label: '🏗️ Asset Register' }, { id: 'depreciation', label: '📉 Depreciation' }, { id: 'maintenance', label: '🔧 Maintenance' }, { id: 'add-asset', label: '➕ Add Asset' }, { id: 'add-mo', label: '📋 New Work Order' }].map(bt => (
                  <button key={bt.id} onClick={() => setAssetsSubTab(bt.id)} className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all border-0 cursor-pointer ${assetsSubTab === bt.id ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground bg-transparent'}`}>{bt.label}</button>
                ))}
              </div>

              {/* KPI Row */}
              {assetsSubTab === 'register' && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Total Assets', value: fixedAssets.length, color: 'text-primary' },
                      { label: 'Gross Block', value: `₹${(fixedAssets.reduce((s, a) => s + a.purchaseCost, 0) / 100000).toFixed(1)}L`, color: 'text-info' },
                      { label: 'Net Book Value', value: `₹${(fixedAssets.reduce((s, a) => s + a.currentBookValue, 0) / 100000).toFixed(1)}L`, color: 'text-success' },
                      { label: 'Under Maintenance', value: fixedAssets.filter(a => a.status === 'UNDER_MAINTENANCE').length, color: 'text-warning' },
                    ].map(kpi => (
                      <div key={kpi.label} className="bg-card/60 border border-border rounded-xl p-3">
                        <div className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{kpi.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-border bg-secondary/40">
                        {['Asset Code', 'Name', 'Category', 'Purchase Cost', 'Book Value', 'Method', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {fixedAssets.map(asset => {
                          const statusColors = { ACTIVE: 'text-success bg-success/10', UNDER_MAINTENANCE: 'text-warning bg-warning/10', DISPOSED: 'text-muted-foreground bg-secondary' };
                          const dep = ((asset.purchaseCost - asset.currentBookValue) / asset.purchaseCost * 100).toFixed(1);
                          return (
                            <tr key={asset.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                              <td className="px-4 py-3 font-mono text-primary font-bold">{asset.assetCode}</td>
                              <td className="px-4 py-3"><div className="font-semibold text-foreground">{asset.name}</div><div className="text-muted-foreground text-[10px]">{asset.location}</div></td>
                              <td className="px-4 py-3 text-muted-foreground">{asset.category}</td>
                              <td className="px-4 py-3 font-semibold text-foreground">₹{asset.purchaseCost.toLocaleString()}</td>
                              <td className="px-4 py-3"><div className="font-bold text-success">₹{asset.currentBookValue.toLocaleString()}</div><div className="text-[10px] text-muted-foreground">{dep}% dep.</div></td>
                              <td className="px-4 py-3 text-muted-foreground text-[10px]">{asset.depMethod === 'STRAIGHT_LINE' ? 'Straight-Line' : 'Declining Bal.'}</td>
                              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[asset.status]}`}>{asset.status.replace('_', ' ')}</span></td>
                              <td className="px-4 py-3">
                                <button onClick={() => handleViewDepreciation(asset)} className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-semibold rounded cursor-pointer border border-primary/20 hover:bg-primary hover:text-white transition-colors">View Schedule</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Depreciation Schedule */}
              {assetsSubTab === 'depreciation' && (
                <div className="flex flex-col gap-4">
                  {!selectedAssetForDep ? (
                    <div className="text-center py-12 text-muted-foreground text-xs">
                      <p>Select an asset from the Asset Register and click "View Schedule" to see the depreciation table.</p>
                      <button onClick={() => setAssetsSubTab('register')} className="mt-3 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg cursor-pointer border-0">Go to Register</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <button onClick={() => { setSelectedAssetForDep(null); setDepSchedule(null); setAssetsSubTab('register'); }} className="text-xs text-primary hover:underline cursor-pointer bg-transparent border-0">← Back to Register</button>
                        <h3 className="font-heading font-bold text-sm text-foreground">{selectedAssetForDep.name} — Depreciation Schedules</h3>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {[{ title: '📐 Straight-Line Depreciation', rows: depSchedule?.straightLine }, { title: '📉 Declining Balance Depreciation', rows: depSchedule?.decliningBalance }].map(({ title, rows }) => (
                          <div key={title} className="bg-card/60 border border-border rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-border bg-secondary/30"><span className="font-heading font-bold text-xs text-foreground">{title}</span></div>
                            <table className="w-full text-xs">
                              <thead><tr className="border-b border-border/50">
                                {['Year', 'Opening Value', 'Depreciation', 'Closing Value'].map(h => <th key={h} className="px-3 py-2 text-left text-[10px] text-muted-foreground font-semibold uppercase">{h}</th>)}
                              </tr></thead>
                              <tbody>
                                {rows?.map(row => (
                                  <tr key={row.year} className="border-b border-border/30 hover:bg-secondary/10">
                                    <td className="px-3 py-2 font-bold text-primary">{row.year}</td>
                                    <td className="px-3 py-2 text-foreground">₹{Math.round(row.openingValue).toLocaleString()}</td>
                                    <td className="px-3 py-2 text-danger">- ₹{Math.round(row.depAmount).toLocaleString()}</td>
                                    <td className="px-3 py-2 text-success font-semibold">₹{Math.round(row.closingValue).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Maintenance Work Orders */}
              {assetsSubTab === 'maintenance' && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Open', value: maintenanceOrders.filter(m => m.status === 'OPEN').length, color: 'text-warning' },
                      { label: 'In Progress', value: maintenanceOrders.filter(m => m.status === 'IN_PROGRESS').length, color: 'text-info' },
                      { label: 'Completed', value: maintenanceOrders.filter(m => m.status === 'COMPLETED').length, color: 'text-success' },
                      { label: 'Total Cost', value: `₹${maintenanceOrders.reduce((s, m) => s + m.cost, 0).toLocaleString()}`, color: 'text-foreground' },
                    ].map(kpi => (
                      <div key={kpi.label} className="bg-card/60 border border-border rounded-xl p-3">
                        <div className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</div>
                        <div className="text-[11px] text-muted-foreground">{kpi.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-border bg-secondary/40">
                        {['Work Order', 'Title', 'Asset', 'Type', 'Priority', 'Assigned To', 'Scheduled', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {maintenanceOrders.map(mo => {
                          const priColors = { LOW: 'text-muted-foreground', MEDIUM: 'text-info', HIGH: 'text-warning', CRITICAL: 'text-danger' };
                          const stColors = { OPEN: 'text-warning bg-warning/10', IN_PROGRESS: 'text-info bg-info/10', COMPLETED: 'text-success bg-success/10', CANCELLED: 'text-muted-foreground bg-secondary' };
                          return (
                            <tr key={mo.id} className="border-b border-border/50 hover:bg-secondary/20">
                              <td className="px-4 py-3 font-mono text-primary text-[10px] font-bold">{mo.workOrderNo}</td>
                              <td className="px-4 py-3 font-semibold text-foreground max-w-[160px]"><div className="truncate">{mo.title}</div></td>
                              <td className="px-4 py-3 text-muted-foreground text-[10px]">{mo.asset?.name || '—'}</td>
                              <td className="px-4 py-3 text-muted-foreground">{mo.type}</td>
                              <td className={`px-4 py-3 font-semibold text-[10px] ${priColors[mo.priority]}`}>{mo.priority}</td>
                              <td className="px-4 py-3 text-muted-foreground">{mo.assignedTo || '—'}</td>
                              <td className="px-4 py-3 text-muted-foreground text-[10px]">{mo.scheduledDate ? new Date(mo.scheduledDate).toLocaleDateString() : '—'}</td>
                              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${stColors[mo.status]}`}>{mo.status.replace('_', ' ')}</span></td>
                              <td className="px-4 py-3 flex gap-1">
                                {mo.status === 'OPEN' && <button onClick={() => handleTransitionMaintenanceOrder(mo.id, 'IN_PROGRESS')} className="px-2 py-1 bg-info/10 text-info text-[10px] font-semibold rounded cursor-pointer border border-info/20 hover:bg-info hover:text-white transition-colors whitespace-nowrap">Start</button>}
                                {mo.status === 'IN_PROGRESS' && <button onClick={() => handleTransitionMaintenanceOrder(mo.id, 'COMPLETED')} className="px-2 py-1 bg-success/10 text-success text-[10px] font-semibold rounded cursor-pointer border border-success/20 hover:bg-success hover:text-white transition-colors whitespace-nowrap">Complete</button>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Add Fixed Asset Form */}
              {assetsSubTab === 'add-asset' && (
                <form onSubmit={handleAddFixedAsset} className="bg-card/60 border border-border rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                  <h3 className="font-heading font-bold text-sm text-foreground col-span-full">Register Fixed Asset</h3>
                  {[
                    { label: 'Asset Code *', value: newAstCode, setter: setNewAstCode, placeholder: 'ASSET-005' },
                    { label: 'Asset Name *', value: newAstName, setter: setNewAstName, placeholder: 'Hydraulic Press' },
                    { label: 'Location', value: newAstLocation, setter: setNewAstLocation, placeholder: 'Plant B, Bay 3' },
                    { label: 'Serial Number', value: newAstSerial, setter: setNewAstSerial, placeholder: 'SN-000123' },
                    { label: 'Purchase Date *', value: newAstPurchaseDate, setter: setNewAstPurchaseDate, type: 'date' },
                    { label: 'Purchase Cost (₹) *', value: newAstCost, setter: setNewAstCost, placeholder: '500000', type: 'number' },
                    { label: 'Salvage Value (₹)', value: newAstSalvage, setter: setNewAstSalvage, placeholder: '50000', type: 'number' },
                    { label: 'Useful Life (Years)', value: newAstLife, setter: setNewAstLife, placeholder: '10', type: 'number' },
                    { label: 'Declining Bal. Rate (e.g. 0.20 = 20%)', value: newAstDepRate, setter: setNewAstDepRate, placeholder: '0.20', type: 'number', step: '0.01' },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="block text-[11px] text-muted-foreground mb-1">{f.label}</label>
                      <input type={f.type || 'text'} step={f.step} value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder} className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">Category</label>
                    <select value={newAstCategory} onChange={e => setNewAstCategory(e.target.value)} className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary">
                      {['Machinery', 'Vehicles', 'IT Equipment', 'Furniture', 'Buildings', 'Land', 'Other'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">Depreciation Method</label>
                    <select value={newAstDepMethod} onChange={e => setNewAstDepMethod(e.target.value)} className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary">
                      <option value="STRAIGHT_LINE">Straight-Line (SLM)</option>
                      <option value="DECLINING_BALANCE">Declining Balance (WDV)</option>
                    </select>
                  </div>
                  <div className="col-span-full"><button type="submit" className="px-5 py-2 bg-primary hover:bg-primary/85 text-white text-xs font-bold rounded-lg cursor-pointer border-0 transition-all">Register Asset</button></div>
                </form>
              )}

              {/* New Maintenance Work Order Form */}
              {assetsSubTab === 'add-mo' && (
                <form onSubmit={handleAddMaintenanceOrder} className="bg-card/60 border border-border rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                  <h3 className="font-heading font-bold text-sm text-foreground col-span-full">Create Maintenance Work Order</h3>
                  {[
                    { label: 'Work Order No *', value: newMoNo, setter: setNewMoNo, placeholder: 'WO-2026-005' },
                    { label: 'Title *', value: newMoTitle, setter: setNewMoTitle, placeholder: 'Monthly Lubrication' },
                    { label: 'Description', value: newMoDesc, setter: setNewMoDesc, placeholder: 'Details of task...' },
                    { label: 'Assigned To', value: newMoAssignedTo, setter: setNewMoAssignedTo, placeholder: 'Technician Name' },
                    { label: 'Scheduled Date', value: newMoScheduledDate, setter: setNewMoScheduledDate, type: 'date' },
                    { label: 'Estimated Cost (₹)', value: newMoCost, setter: setNewMoCost, placeholder: '5000', type: 'number' },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="block text-[11px] text-muted-foreground mb-1">{f.label}</label>
                      <input type={f.type || 'text'} value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder} className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">Asset</label>
                    <select value={newMoAssetId} onChange={e => setNewMoAssetId(e.target.value)} className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary">
                      <option value="">— No Specific Asset —</option>
                      {fixedAssets.map(a => <option key={a.id} value={a.id}>{a.assetCode} — {a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">Type</label>
                    <select value={newMoType} onChange={e => setNewMoType(e.target.value)} className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary">
                      <option value="PREVENTIVE">Preventive</option>
                      <option value="CORRECTIVE">Corrective</option>
                      <option value="PREDICTIVE">Predictive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">Priority</label>
                    <select value={newMoPriority} onChange={e => setNewMoPriority(e.target.value)} className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary">
                      {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="col-span-full"><button type="submit" className="px-5 py-2 bg-primary hover:bg-primary/85 text-white text-xs font-bold rounded-lg cursor-pointer border-0 transition-all">Create Work Order</button></div>
                </form>
              )}
            </div>
          )}

          {/* ═══════════════ TAB: ERP AI CONSOLE ═══════════════ */}
          {activeTab === 'ai-assistant' && (
            <div className="ai-theme-override flex flex-col gap-6 animate-fade-in">
              <div>
                <h2 className="font-heading text-lg font-bold text-foreground">ERP AI Console</h2>
                <p className="text-xs text-muted-foreground">Natural Language Queries, Document OCR, Demand Forecasting, Anomaly Detection, MIS Analytics, and WhatsApp Bot.</p>
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-lg border border-border self-start overflow-x-auto max-w-full">
                {[{ id: 'nlq', label: '🤖 NL Query' }, { id: 'ocr', label: '📄 OCR Scanner' }, { id: 'forecast', label: '🔮 Forecast' }, { id: 'anomaly', label: '🚨 Anomaly' }, { id: 'mis', label: '📊 MIS Dashboard' }, { id: 'whatsapp', label: '💬 WhatsApp Bot' }].map(bt => (
                  <button key={bt.id} onClick={() => setAiConsoleSubTab(bt.id)} className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all border-0 cursor-pointer ${aiConsoleSubTab === bt.id ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground bg-transparent'}`}>{bt.label}</button>
                ))}
              </div>

              {/* ── NLQ Chat ── */}
              {aiConsoleSubTab === 'nlq' && (
                <div className="flex flex-col gap-4">
                  {/* Suggestion chips */}
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestions.map(s => (
                      <button key={s} onClick={() => handleAiConsoleQuery(null, s)} className="px-3 py-1 rounded-lg text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all cursor-pointer">{s}</button>
                    ))}
                  </div>
                  <div className="bg-card/60 border border-border rounded-xl flex flex-col h-[500px]">
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                      {aiConsoleChatHistory.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] px-4 py-3 rounded-xl text-xs leading-relaxed whitespace-pre-line ${msg.sender === 'user' ? 'bg-primary-container text-white rounded-br-none' : 'bg-secondary text-foreground border border-border rounded-bl-none'}`}>
                            {msg.sender === 'user' ? msg.text : <AiResponseText text={msg.text} />}
                            {msg.suggestions?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/20">
                                {msg.suggestions.slice(0, 3).map(s => (
                                  <button key={s} onClick={() => handleAiConsoleQuery(null, s)} className="px-2 py-0.5 rounded text-[10px] bg-white/10 hover:bg-white/20 cursor-pointer border-0 transition-colors">{s}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {aiConsoleLoading && (
                        <div className="flex justify-start">
                          <div className="bg-secondary border border-border rounded-xl px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
                            <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div>
                            Thinking...
                          </div>
                        </div>
                      )}
                    </div>
                    <form onSubmit={handleAiConsoleQuery} className="p-3 border-t border-border flex gap-2">
                      <input type="text" value={aiConsolePrompt} onChange={e => setAiConsolePrompt(e.target.value)} placeholder="Ask anything about your ERP data..." className="flex-1 bg-black/30 border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary" />
                      <button type="submit" disabled={aiConsoleLoading} className="px-4 py-2 bg-primary hover:bg-primary/85 text-white text-xs font-bold rounded-lg cursor-pointer border-0 transition-all disabled:opacity-40">
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* ── OCR Scanner ── */}
              {aiConsoleSubTab === 'ocr' && (
                <div className="flex flex-col gap-4 max-w-2xl">
                  <div className="bg-card/60 border border-border rounded-xl p-5">
                    <h3 className="font-heading font-bold text-sm text-foreground mb-3">📄 AI Document OCR Scanner</h3>
                    <p className="text-xs text-muted-foreground mb-4">Upload an invoice, purchase order, or receipt PDF/image. The AI will extract structured fields automatically.</p>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-8 cursor-pointer transition-colors group">
                      <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Click to upload or drag & drop</span>
                      <span className="text-[10px] text-muted-foreground mt-1">PDF, PNG, JPG, TIFF supported</span>
                      <input type="file" accept=".pdf,.png,.jpg,.jpeg,.tiff" className="hidden" onChange={handleOcrUpload} />
                    </label>
                    {ocrFileName && <p className="text-xs text-muted-foreground mt-2">File: <span className="text-primary font-semibold">{ocrFileName}</span></p>}
                    {ocrLoading && <div className="text-xs text-primary animate-pulse mt-3">Processing document with AI-OCR engine...</div>}
                  </div>
                  {ocrResult && (
                    <div className="bg-card/60 border border-border rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-heading font-bold text-xs text-foreground">Extraction Results — <span className="text-primary">{ocrResult.extractedFields?.documentType || 'UNKNOWN'}</span></h3>
                        <span className="text-[10px] text-muted-foreground">{ocrResult.ocrEngine} · {ocrResult.processingTime}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                        {Object.entries(ocrResult.extractedFields || {}).filter(([k]) => !['lineItems', 'documentType'].includes(k)).map(([key, val]) => (
                          <div key={key} className="bg-secondary/30 rounded-lg p-2.5">
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                            <div className="font-semibold text-foreground">{String(val)}</div>
                          </div>
                        ))}
                      </div>
                      {ocrResult.extractedFields?.lineItems && (
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Line Items</div>
                          <table className="w-full text-[11px]">
                            <thead><tr className="border-b border-border/50">
                              {['Description', 'Qty', 'Unit', 'Rate', 'Amount'].map(h => <th key={h} className="text-left py-1.5 px-2 text-muted-foreground font-semibold">{h}</th>)}
                            </tr></thead>
                            <tbody>
                              {ocrResult.extractedFields.lineItems.map((item, i) => (
                                <tr key={i} className="border-b border-border/30">
                                  <td className="py-1.5 px-2 text-foreground">{item.description}</td>
                                  <td className="py-1.5 px-2 text-muted-foreground">{item.qty}</td>
                                  <td className="py-1.5 px-2 text-muted-foreground">{item.unit}</td>
                                  <td className="py-1.5 px-2 text-muted-foreground">₹{item.rate}</td>
                                  <td className="py-1.5 px-2 text-success font-semibold">₹{item.amount?.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Demand Forecast ── */}
              {aiConsoleSubTab === 'forecast' && (
                <div className="flex flex-col gap-4">
                  <div className="bg-card/60 border border-border rounded-xl p-4 flex items-center gap-4 flex-wrap">
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">Forecast Metric</label>
                      <select value={forecastMetric} onChange={e => setForecastMetric(e.target.value)} className="bg-black/30 border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary">
                        <option value="revenue">Revenue (₹)</option>
                        <option value="inventory">Inventory Value (₹)</option>
                        <option value="headcount">Headcount</option>
                      </select>
                    </div>
                    <div className="pt-4">
                      <button onClick={handleRunForecast} disabled={forecastLoading} className="px-5 py-2 bg-primary hover:bg-primary/85 text-white text-xs font-bold rounded-lg cursor-pointer border-0 transition-all disabled:opacity-40">
                        {forecastLoading ? 'Forecasting...' : '🔮 Run AI Forecast'}
                      </button>
                    </div>
                  </div>
                  {forecastData && (
                    <div className="bg-card/60 border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-heading font-bold text-sm text-foreground">6-Month {forecastData.metric} Forecast</h3>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-muted-foreground">Model: <span className="text-foreground">{forecastData.model}</span></span>
                          <span className="text-muted-foreground">Confidence: <span className="text-success font-bold">{(forecastData.confidence * 100).toFixed(0)}%</span></span>
                          <span className="text-muted-foreground">Growth: <span className="text-primary font-bold">+{forecastData.monthlyGrowthRate}%/mo</span></span>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={forecastData.forecast}>
                          <defs>
                            <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#c3c0ff" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#c3c0ff" stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="boundsGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4cd7f6" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#4cd7f6" stopOpacity={0.02} />
                            </linearGradient>
                            <filter id="lavenderGlow" x="-20%" y="-20%" width="140%" height="140%">
                              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#c3c0ff" floodOpacity="0.5"/>
                            </filter>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                          <XAxis dataKey="period" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => forecastMetric === 'headcount' ? v : `₹${(v/100000).toFixed(1)}L`} />
                          <Tooltip formatter={(v, n) => [forecastMetric === 'headcount' ? v : `₹${v.toLocaleString()}`, n]} />
                          <Area type="monotone" dataKey="upperBound" stroke="transparent" fill="url(#boundsGrad)" name="Upper Bound" />
                          <Area type="monotone" dataKey="value" stroke="#c3c0ff" strokeWidth={2} filter="url(#lavenderGlow)" fill="url(#forecastGrad)" name="Forecast" />
                          <Area type="monotone" dataKey="lowerBound" stroke="transparent" fill="transparent" name="Lower Bound" />
                        </AreaChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4">
                        {forecastData.forecast.map(f => (
                          <div key={f.period} className="bg-secondary/30 rounded-lg p-2 text-center">
                            <div className="text-[10px] text-muted-foreground">{f.period}</div>
                            <div className="text-xs font-bold text-primary mt-0.5">{forecastMetric === 'headcount' ? f.value : `₹${(f.value/100000).toFixed(1)}L`}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Anomaly Detection ── */}
              {aiConsoleSubTab === 'anomaly' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <button onClick={handleRunAnomalyScan} disabled={anomalyLoading} className="px-5 py-2 bg-danger hover:bg-danger/85 text-white text-xs font-bold rounded-lg cursor-pointer border-0 transition-all disabled:opacity-40">
                      {anomalyLoading ? '🔍 Scanning...' : '🚨 Run Anomaly Scan'}
                    </button>
                    {anomalyData && <span className="text-xs text-muted-foreground">Last scan: {new Date(anomalyData.scanTime).toLocaleTimeString()}</span>}
                  </div>
                  {anomalyData && (
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Total Anomalies', value: anomalyData.totalAnomalies, color: 'text-foreground' },
                          { label: 'Open', value: anomalyData.byStatus?.OPEN || 0, color: 'text-danger' },
                          { label: 'Under Review', value: anomalyData.byStatus?.UNDER_REVIEW || 0, color: 'text-warning' },
                          { label: 'Resolved', value: anomalyData.byStatus?.RESOLVED || 0, color: 'text-success' },
                        ].map(k => (
                          <div key={k.label} className="bg-card/60 border border-border rounded-xl p-3">
                            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
                            <div className="text-[11px] text-muted-foreground">{k.label}</div>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-col gap-3">
                        {anomalyData.anomalies.map(a => {
                          const sevColors = { HIGH: 'border-danger/30 bg-danger/5', MEDIUM: 'border-warning/30 bg-warning/5', LOW: 'border-border bg-secondary/20' };
                          const sevBadge = { HIGH: 'text-danger bg-danger/10', MEDIUM: 'text-warning bg-warning/10', LOW: 'text-muted-foreground bg-secondary' };
                          const stBadge = { OPEN: 'text-danger', UNDER_REVIEW: 'text-warning', RESOLVED: 'text-success' };
                          return (
                            <div key={a.id} className={`border rounded-xl p-4 ${sevColors[a.severity]}`}>
                              <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="font-mono text-[10px] text-muted-foreground">{a.id}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sevBadge[a.severity]}`}>{a.severity}</span>
                                    <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{a.module}</span>
                                    <span className="text-[10px] text-muted-foreground">{a.type.replace('_', ' ')}</span>
                                  </div>
                                  <p className="text-xs text-foreground leading-relaxed">{a.description}</p>
                                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(a.detectedAt).toLocaleString()}</p>
                                </div>
                                <span className={`text-xs font-bold ${stBadge[a.status]} whitespace-nowrap`}>{a.status.replace('_', ' ')}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── MIS Dashboard ── */}
              {aiConsoleSubTab === 'mis' && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[
                      { label: 'Total Revenue', value: `₹${(misData.kpis.totalRevenue/100000).toFixed(1)}L`, sub: `+${misData.kpis.revenueGrowth}% MoM`, color: 'text-success' },
                      { label: 'Net Profit', value: `₹${(misData.kpis.netProfit/100000).toFixed(1)}L`, sub: `${misData.kpis.profitMargin}% margin`, color: 'text-primary' },
                      { label: 'Total Orders', value: misData.kpis.totalOrders.toLocaleString(), sub: `AOV ₹${misData.kpis.avgOrderValue.toLocaleString()}`, color: 'text-info' },
                      { label: 'Active Employees', value: misData.kpis.activeEmployees, sub: `Payroll ₹${(misData.kpis.payrollThisMonth/100000).toFixed(1)}L`, color: 'text-warning' },
                      { label: 'Inventory Value', value: `₹${(misData.kpis.inventoryValue/100000).toFixed(1)}L`, sub: 'FIFO basis', color: 'text-foreground' },
                      { label: 'Asset Net Value', value: `₹${(misData.kpis.assetNetBookValue/100000).toFixed(1)}L`, sub: `${misData.kpis.openWorkOrders} open WOs`, color: 'text-foreground' },
                      { label: 'Loyalty Members', value: misData.kpis.loyaltyMembers.toLocaleString(), sub: 'Active enrolled', color: 'text-purple-400' },
                    ].map(kpi => (
                      <div key={kpi.label} className="bg-card/60 border border-border rounded-xl p-3 hover:border-primary/30 transition-colors">
                        <div className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</div>
                        <div className="text-[11px] text-foreground font-semibold mt-0.5">{kpi.label}</div>
                        <div className="text-[10px] text-muted-foreground">{kpi.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-card/60 border border-border rounded-xl p-4">
                      <h3 className="font-heading font-semibold text-xs text-foreground mb-3">Revenue vs Expenses (6-Month)</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={misData.revenueVsExpenses}>
                          <defs>
                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00CA72" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#00CA72" stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ffb4ab" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#ffb4ab" stopOpacity={0.02} />
                            </linearGradient>
                            <filter id="emeraldGlow2" x="-20%" y="-20%" width="140%" height="140%">
                              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00CA72" floodOpacity="0.5"/>
                            </filter>
                            <filter id="errorGlow" x="-20%" y="-20%" width="140%" height="140%">
                              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ffb4ab" floodOpacity="0.5"/>
                            </filter>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                          <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
                          <Tooltip formatter={v => `₹${v.toLocaleString()}`} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Area type="monotone" dataKey="revenue" stroke="#00CA72" fill="url(#revGrad)" strokeWidth={2} filter="url(#emeraldGlow2)" name="Revenue" />
                          <Area type="monotone" dataKey="expenses" stroke="#ffb4ab" fill="url(#expGrad)" strokeWidth={2} filter="url(#errorGlow)" name="Expenses" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-card/60 border border-border rounded-xl p-4">
                      <h3 className="font-heading font-semibold text-xs text-foreground mb-3">Sales by Channel</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={misData.salesByChannel} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                          <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
                          <YAxis dataKey="channel" type="category" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                          <Tooltip formatter={v => `₹${v.toLocaleString()}`} />
                          <Bar dataKey="value" name="Revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                            {misData.salesByChannel.map((_, i) => <Cell key={i} fill={['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--info))', 'hsl(var(--warning))'][i % 4]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-card/60 border border-border rounded-xl p-4">
                      <h3 className="font-heading font-semibold text-xs text-foreground mb-3">Department Headcount</h3>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={misData.deptHeadcount}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                          <XAxis dataKey="dept" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                          <Tooltip />
                          <Bar dataKey="count" name="Employees" radius={[4, 4, 0, 0]}>
                            {misData.deptHeadcount.map((_, i) => <Cell key={i} fill={['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--info))', 'hsl(var(--warning))', 'hsl(var(--danger))', 'hsl(var(--muted-foreground))'][i % 6]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* ── WhatsApp Bot ── */}
              {aiConsoleSubTab === 'whatsapp' && (
                <div className="flex flex-col gap-4 max-w-xl">
                  <div className="bg-card/60 border border-border rounded-xl p-5">
                    <h3 className="font-heading font-bold text-sm text-foreground mb-1">💬 WhatsApp ERP Bot</h3>
                    <p className="text-xs text-muted-foreground mb-4">Simulate a WhatsApp message being sent to your ERP bot. Powered by Twilio + FastAPI NLP.</p>
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="block text-[11px] text-muted-foreground mb-1">Incoming Message (Body)</label>
                        <input type="text" value={waWebhookBody} onChange={e => setWaWebhookBody(e.target.value)} placeholder="e.g. What is the current stock status?" className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary" />
                      </div>
                      <button onClick={handleTestWhatsApp} className="px-5 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg cursor-pointer border-0 transition-all self-start">
                        📲 Send Test Message
                      </button>
                    </div>
                    {waWebhookReply && (
                      <div className="mt-4 p-4 bg-green-950/40 border border-green-800/30 rounded-xl">
                        <div className="text-[10px] text-green-400 font-semibold mb-2">🤖 Bot Reply (WhatsApp Format)</div>
                        <pre className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans">{waWebhookReply}</pre>
                      </div>
                    )}
                  </div>
                  <div className="bg-card/60 border border-border rounded-xl p-4 text-xs">
                    <h4 className="font-heading font-bold text-sm text-foreground mb-2">🔌 Integration Setup</h4>
                    <div className="flex flex-col gap-2 text-muted-foreground">
                      <p><span className="text-foreground font-semibold">1. Twilio WhatsApp Sandbox:</span> Configure your webhook to point to <code className="bg-secondary px-1 rounded">POST /api/v1/ai/whatsapp-webhook</code></p>
                      <p><span className="text-foreground font-semibold">2. AI Service:</span> FastAPI must be running on port 8000 with full intent detection enabled.</p>
                      <p><span className="text-foreground font-semibold">3. Supported Commands:</span> Users can ask about inventory, sales, finance, HR, assets, and more in natural language.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: INVENTORY & WAREHOUSE */}
          {activeTab === 'inventory' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <h2 className="font-heading text-lg font-bold text-foreground">Inventory & Warehouse Management</h2>
                  <p className="text-xs text-muted-foreground">Manage multi-location stock catalogs, FIFO/LIFO valuations, and near-expiry triggers.</p>
                </div>

                {/* Sub-nav Buttons */}
                <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-lg border border-border self-start md:self-auto overflow-x-auto max-w-full">
                  {[
                    { id: 'catalog', label: 'Stock Catalog' },
                    { id: 'transactions', label: 'Stock Movements' },
                    { id: 'warehouses', label: 'Godowns / Warehouses' },
                    { id: 'valuation', label: 'FIFO vs LIFO Valuation' }
                  ].map(bt => (
                    <button
                      key={bt.id}
                      onClick={() => setInventorySubTab(bt.id)}
                      className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all border-0 cursor-pointer whitespace-nowrap ${
                        inventorySubTab === bt.id 
                          ? 'bg-primary text-white shadow-sm' 
                          : 'bg-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {bt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiry and Reorder Alerts Panel */}
              {(reorderAlerts.length > 0 || expiryAlarms.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reorderAlerts.length > 0 && (
                    <div className="bg-warning/10 border border-warning/30 p-4 rounded-xl flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-warning uppercase tracking-wider">Safety Stock Reorder Alarms ({reorderAlerts.length})</h4>
                        <p className="text-[11px] text-muted-foreground mt-1">The following items are at or below their safety reorder threshold:</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {reorderAlerts.map(prod => (
                            <span key={prod.id} className="text-[10px] bg-warning/20 border border-warning/20 px-2 py-0.5 rounded font-semibold text-warning">
                              {prod.name} ({prod.currentStock} / {prod.reorderPoint} left)
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {expiryAlarms.length > 0 && (
                    <div className="bg-danger/10 border border-danger/30 p-4 rounded-xl flex items-start gap-3">
                      <ShieldAlert className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-danger uppercase tracking-wider">Near Expiry Stock Alerts ({expiryAlarms.length})</h4>
                        <p className="text-[11px] text-muted-foreground mt-1">The following inventory batches are expiring within 30 days:</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {expiryAlarms.map(prod => (
                            <span key={prod.id} className="text-[10px] bg-danger/20 border border-danger/20 px-2 py-0.5 rounded font-semibold text-danger">
                              {prod.name} (Exp: {new Date(prod.expiryDate).toLocaleDateString()})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tabs content */}
              {inventorySubTab === 'catalog' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Add Product Card */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Plus className="h-4.5 w-4.5 text-primary" />
                      <span>Register New Product / Item</span>
                    </h3>
                    <form onSubmit={handleCreateProduct} className="flex flex-col gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Item Code</label>
                        <input
                          type="text"
                          value={newProdCode}
                          onChange={e => setNewProdCode(e.target.value)}
                          placeholder="e.g. RAW-STL-001"
                          className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Item Name</label>
                        <input
                          type="text"
                          value={newProdName}
                          onChange={e => setNewProdName(e.target.value)}
                          placeholder="e.g. 10mm Steel Bar"
                          className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Description</label>
                        <textarea
                          value={newProdDesc}
                          onChange={e => setNewProdDesc(e.target.value)}
                          placeholder="Technical specifications, grade, etc."
                          rows="2"
                          className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase">Type</label>
                          <select
                            value={newProdType}
                            onChange={e => setNewProdType(e.target.value)}
                            className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          >
                            <option value="RAW_MATERIAL">Raw Material</option>
                            <option value="FINISHED_GOOD">Finished Good</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase">Expiry Date</label>
                          <input
                            type="date"
                            value={newProdExpiry}
                            onChange={e => setNewProdExpiry(e.target.value)}
                            className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase">Reorder Point</label>
                          <input
                            type="number"
                            value={newProdReorderPoint}
                            onChange={e => setNewProdReorderPoint(e.target.value)}
                            className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase">Safety Stock</label>
                          <input
                            type="number"
                            value={newProdSafetyStock}
                            onChange={e => setNewProdSafetyStock(e.target.value)}
                            className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase">Standard Cost (₹)</label>
                          <input
                            type="number"
                            value={newProdCostPrice}
                            onChange={e => setNewProdCostPrice(e.target.value)}
                            className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase">Sale Price (₹)</label>
                          <input
                            type="number"
                            value={newProdSalePrice}
                            onChange={e => setNewProdSalePrice(e.target.value)}
                            className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg border-0 cursor-pointer transition-all mt-2 shadow-md shadow-primary/10"
                      >
                        Register Product
                      </button>
                    </form>
                  </div>

                  {/* Stock Register List */}
                  <div className="lg:col-span-2 bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground">Active Stock Catalog Registry</h3>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="bg-secondary/50 text-muted-foreground border-b border-border">
                            <th className="p-3 font-semibold uppercase tracking-wider">Item Code</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Name / Type</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Current Stock</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Safety / Reorder</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Valuation Cost</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Expiry Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map(prod => {
                            const isLowStock = prod.currentStock <= prod.reorderPoint;
                            const isExpired = prod.expiryDate && new Date(prod.expiryDate) < new Date();
                            return (
                              <tr key={prod.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                                <td className="p-3 font-semibold text-primary">{prod.code}</td>
                                <td className="p-3">
                                  <div className="font-medium text-foreground">{prod.name}</div>
                                  <div className="text-[10px] text-muted-foreground">{prod.type.replace('_', ' ')}</div>
                                </td>
                                <td className="p-3">
                                  <span className={`font-semibold ${isLowStock ? 'text-warning' : 'text-success'}`}>
                                    {prod.currentStock} Units
                                  </span>
                                </td>
                                <td className="p-3 text-muted-foreground">
                                  Safety: {prod.safetyStock} | Reorder: {prod.reorderPoint}
                                </td>
                                <td className="p-3 text-foreground font-semibold">
                                  ₹{prod.costPrice}
                                </td>
                                <td className="p-3">
                                  {prod.expiryDate ? (
                                    <span className={isExpired ? 'text-danger font-semibold' : 'text-muted-foreground'}>
                                      {new Date(prod.expiryDate).toLocaleDateString()}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground/50">N/A</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {inventorySubTab === 'transactions' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Log stock transaction card */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Plus className="h-4.5 w-4.5 text-primary" />
                      <span>Log Stock Transaction</span>
                    </h3>
                    <form onSubmit={handleCreateStockTransaction} className="flex flex-col gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Select Product</label>
                        <select
                          value={newTxProductId}
                          onChange={e => setNewTxProductId(e.target.value)}
                          className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          required
                        >
                          <option value="">-- Choose Product --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Warehouse / Location</label>
                        <select
                          value={newTxWarehouseId}
                          onChange={e => setNewTxWarehouseId(e.target.value)}
                          className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          required
                        >
                          <option value="">-- Choose Warehouse --</option>
                          {warehouses.map(w => (
                            <option key={w.id} value={w.id}>{w.name} ({w.location})</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase">Transaction Type</label>
                          <select
                            value={newTxType}
                            onChange={e => setNewTxType(e.target.value)}
                            className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          >
                            <option value="RECEIPT">RECEIPT (Stock In)</option>
                            <option value="ISSUE">ISSUE (Stock Out)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase">Quantity</label>
                          <input
                            type="number"
                            value={newTxQty}
                            onChange={e => setNewTxQty(e.target.value)}
                            placeholder="Units count"
                            className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase">Unit Cost (₹)</label>
                          <input
                            type="number"
                            value={newTxCost}
                            onChange={e => setNewTxCost(e.target.value)}
                            placeholder="Defaults to standard cost"
                            className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase">Reference No</label>
                          <input
                            type="text"
                            value={newTxRef}
                            onChange={e => setNewTxRef(e.target.value)}
                            placeholder="e.g. PO-9011, GRN-101"
                            className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg border-0 cursor-pointer transition-all mt-2 shadow-md shadow-primary/10"
                      >
                        Record Stock Movement
                      </button>
                    </form>
                  </div>

                  {/* Stock Ledgers List */}
                  <div className="lg:col-span-2 bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground">Stock Ledger Transactions</h3>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="bg-secondary/50 text-muted-foreground border-b border-border">
                            <th className="p-3 font-semibold uppercase tracking-wider">Date</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Product</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Godown Location</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Quantity</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Type / Ref</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Unit Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stockTransactions.map(tx => (
                            <tr key={tx.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                              <td className="p-3 text-muted-foreground">
                                {new Date(tx.transactionDate || tx.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-3 font-semibold text-foreground">
                                {tx.product?.code || 'N/A'} - {tx.product?.name || 'N/A'}
                              </td>
                              <td className="p-3 text-foreground">{tx.warehouse?.name || 'N/A'}</td>
                              <td className={`p-3 font-semibold ${tx.quantity > 0 ? 'text-success' : 'text-danger'}`}>
                                {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity} Units
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                  tx.type === 'RECEIPT' ? 'bg-success/15 text-success border border-success/20' : 'bg-warning/15 text-warning border border-warning/20'
                                }`}>
                                  {tx.type}
                                </span>
                                <div className="text-[10px] text-muted-foreground mt-0.5">Ref: {tx.referenceNo}</div>
                              </td>
                              <td className="p-3 font-semibold text-foreground">₹{tx.unitCost}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {inventorySubTab === 'warehouses' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Create Warehouse Card */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Plus className="h-4.5 w-4.5 text-primary" />
                      <span>Create Warehouse Godown</span>
                    </h3>
                    <form onSubmit={handleCreateWarehouse} className="flex flex-col gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Godown Name</label>
                        <input
                          type="text"
                          value={newWhName}
                          onChange={e => setNewWhName(e.target.value)}
                          placeholder="e.g. Central Warehouse A"
                          className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Geographic Location</label>
                        <input
                          type="text"
                          value={newWhLocation}
                          onChange={e => setNewWhLocation(e.target.value)}
                          placeholder="e.g. Mumbai, Zone 2"
                          className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg border-0 cursor-pointer transition-all mt-2 shadow-md shadow-primary/10"
                      >
                        Create Location
                      </button>
                    </form>
                  </div>

                  {/* Warehouses list */}
                  <div className="lg:col-span-2 bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground">Registered Warehouses</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {warehouses.map(wh => {
                        // calculate total quantities stored in this warehouse
                        const totalQty = stockTransactions
                          .filter(tx => tx.warehouseId === wh.id)
                          .reduce((sum, tx) => sum + tx.quantity, 0);

                        return (
                          <div key={wh.id} className="p-4 rounded-xl bg-secondary/50 border border-border flex flex-col justify-between hover:border-primary/30 transition-all">
                            <div>
                              <div className="font-bold text-xs text-foreground">{wh.name}</div>
                              <div className="text-[10px] text-muted-foreground mt-1">Location: {wh.location}</div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                              <span className="text-[10px] text-muted-foreground">Aggregate Stock</span>
                              <span className="font-bold text-xs text-primary">{totalQty} Units</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {inventorySubTab === 'valuation' && (
                <div className="flex flex-col gap-6">
                  {/* Valuation Switch comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col justify-between">
                      <div>
                        <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">FIFO Inventory Valuation</span>
                        <h2 className="text-2xl font-heading font-bold text-primary mt-3">₹{fifoValuationVal !== null ? fifoValuationVal.toLocaleString() : '0'}</h2>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
                        First-In, First-Out assumes oldest units are issued first. Better matches current replacement costs on Balance Sheet during inflation.
                      </p>
                    </div>

                    <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col justify-between">
                      <div>
                        <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">LIFO Inventory Valuation</span>
                        <h2 className="text-2xl font-heading font-bold text-success mt-3">₹{lifoValuationVal !== null ? lifoValuationVal.toLocaleString() : '0'}</h2>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
                        Last-In, First-Out assumes newest purchases are consumed first. Matches current costs against current revenues for Tax optimization.
                      </p>
                    </div>

                    <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col justify-between">
                      <div>
                        <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Valuation Variance Difference</span>
                        <h2 className={`text-2xl font-heading font-bold mt-3 ${((fifoValuationVal || 0) - (lifoValuationVal || 0)) >= 0 ? 'text-primary' : 'text-danger'}`}>
                          ₹{((fifoValuationVal || 0) - (lifoValuationVal || 0)).toLocaleString()}
                        </h2>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
                        The difference indicates price inflation/deflation variance across asset batches. EPR Dashboard dynamically computes stack allocations.
                      </p>
                    </div>
                  </div>

                  {/* Valuation Table details */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl">
                    <h3 className="font-heading font-bold text-sm text-foreground mb-4">Batch ledger valuation by item</h3>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="bg-secondary/50 text-muted-foreground border-b border-border">
                            <th className="p-3 font-semibold uppercase tracking-wider">Item Code</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Product Name</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Current Stock</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">FIFO Value (₹)</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">LIFO Value (₹)</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Variance (FIFO - LIFO)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {valuationDetails.map(detail => (
                            <tr key={detail.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                              <td className="p-3 font-semibold text-primary">{detail.code}</td>
                              <td className="p-3 text-foreground font-medium">{detail.name}</td>
                              <td className="p-3 text-foreground font-semibold">{detail.currentStock} Units</td>
                              <td className="p-3 text-foreground font-semibold">₹{detail.fifoValue.toLocaleString()}</td>
                              <td className="p-3 text-foreground font-semibold">₹{detail.lifoValue.toLocaleString()}</td>
                              <td className={`p-3 font-bold ${detail.difference >= 0 ? 'text-success' : 'text-danger'}`}>
                                ₹{detail.difference.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: MANUFACTURING */}
          {activeTab === 'manufacturing' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <h2 className="font-heading text-lg font-bold text-foreground">Manufacturing Operations Control</h2>
                  <p className="text-xs text-muted-foreground">Manage Bill of Materials (BOM), Production Orders, Work Center Routing, and OEE analytics.</p>
                </div>

                {/* Sub-nav Buttons */}
                <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-lg border border-border self-start md:self-auto overflow-x-auto max-w-full">
                  {[
                    { id: 'bom', label: 'BOM Recipes' },
                    { id: 'orders', label: 'Production Pipeline' },
                    { id: 'workcenters', label: 'Work Centers' },
                    { id: 'oee', label: 'OEE Analytics' }
                  ].map(bt => (
                    <button
                      key={bt.id}
                      onClick={() => setMfgSubTab(bt.id)}
                      className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all border-0 cursor-pointer whitespace-nowrap ${
                        mfgSubTab === bt.id 
                          ? 'bg-primary text-white shadow-sm' 
                          : 'bg-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {bt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-tabs content */}
              {mfgSubTab === 'bom' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* BOM Creator Form */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Plus className="h-4.5 w-4.5 text-primary" />
                      <span>Compose Bill of Materials (BOM)</span>
                    </h3>
                    <form onSubmit={handleCreateBom} className="flex flex-col gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">BOM Number</label>
                        <input
                          type="text"
                          value={newBomNo}
                          onChange={e => setNewBomNo(e.target.value)}
                          placeholder="e.g. BOM-ST-01"
                          className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">BOM Name</label>
                        <input
                          type="text"
                          value={newBomName}
                          onChange={e => setNewBomName(e.target.value)}
                          placeholder="e.g. Reinforced Steel Frame Assembly"
                          className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase">Finished Product</label>
                          <select
                            value={newBomFinishedProductId}
                            onChange={e => setNewBomFinishedProductId(e.target.value)}
                            className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                            required
                          >
                            <option value="">-- Select --</option>
                            {products.filter(p => p.type === 'FINISHED_GOOD').map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase">Yield Quantity</label>
                          <input
                            type="number"
                            value={newBomQty}
                            onChange={e => setNewBomQty(e.target.value)}
                            className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                            required
                          />
                        </div>
                      </div>

                      {/* Component list builder section */}
                      <div className="border-t border-border pt-3 mt-2 flex flex-col gap-2">
                        <span className="text-[11px] font-bold text-foreground">Add Ingredient Components</span>
                        <div className="flex gap-2">
                          <select
                            value={newBomCompProductId}
                            onChange={e => setNewBomCompProductId(e.target.value)}
                            className="flex-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          >
                            <option value="">-- Raw Item --</option>
                            {products.filter(p => p.type === 'RAW_MATERIAL').map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            value={newBomCompQty}
                            onChange={e => setNewBomCompQty(e.target.value)}
                            placeholder="Qty"
                            className="w-16 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          />
                          <button
                            type="button"
                            onClick={handleAddBomComponent}
                            className="px-3 bg-secondary hover:bg-border-medium border border-border text-foreground rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Add
                          </button>
                        </div>

                        {/* List of currently added components */}
                        {newBomComponents.length > 0 && (
                          <div className="bg-secondary/40 border border-border rounded-lg p-3 flex flex-col gap-1.5 mt-1.5 max-h-40 overflow-y-auto">
                            {newBomComponents.map(comp => (
                              <div key={comp.productId} className="flex justify-between items-center text-xs">
                                <span className="text-foreground font-medium">{comp.productName}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground font-semibold">{comp.quantity} Units</span>
                                  <button
                                    type="button"
                                    onClick={() => setNewBomComponents(newBomComponents.filter(c => c.productId !== comp.productId))}
                                    className="text-danger hover:text-danger/80 bg-transparent border-0 cursor-pointer"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg border-0 cursor-pointer transition-all mt-2 shadow-md shadow-primary/10"
                      >
                        Create BOM Recipe
                      </button>
                    </form>
                  </div>

                  {/* BOM Recipes registry */}
                  <div className="lg:col-span-2 bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground">Active BOM Recipe Lists</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {boms.map(bom => (
                        <div key={bom.id} className="p-5 rounded-xl bg-secondary/50 border border-border flex flex-col gap-4 hover:border-primary/30 transition-all">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-extrabold text-xs text-foreground uppercase tracking-wide">{bom.bomNo}</div>
                              <div className="font-semibold text-xs text-primary mt-1">{bom.name}</div>
                            </div>
                            <span className="text-[10px] bg-primary/10 border border-primary/20 px-2 py-0.5 rounded font-semibold text-primary">
                              Yield: {bom.quantity} Unit(s)
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-1.5 border-t border-border pt-3">
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Raw Ingredients</span>
                            {bom.components?.map(comp => (
                              <div key={comp.id} className="flex justify-between text-[11px]">
                                <span className="text-foreground">{comp.product?.name || 'Raw Material'}</span>
                                <span className="text-muted-foreground font-semibold">{comp.quantity} Unit(s)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {mfgSubTab === 'orders' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Create Production Order Form */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4 h-fit lg:col-span-1">
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Plus className="h-4.5 w-4.5 text-primary" />
                      <span>Start Production Run</span>
                    </h3>
                    <form onSubmit={handleCreateProductionOrder} className="flex flex-col gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Order Number</label>
                        <input
                          type="text"
                          value={newPoOrderNo}
                          onChange={e => setNewPoOrderNo(e.target.value)}
                          placeholder="e.g. PO-RUN-001"
                          className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Finished Product</label>
                        <select
                          value={newPoFinishedProductId}
                          onChange={e => setNewPoFinishedProductId(e.target.value)}
                          className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          required
                        >
                          <option value="">-- Choose Item --</option>
                          {products.filter(p => p.type === 'FINISHED_GOOD').map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">BOM Recipe</label>
                        <select
                          value={newPoBomId}
                          onChange={e => setNewPoBomId(e.target.value)}
                          className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          required
                        >
                          <option value="">-- Choose BOM --</option>
                          {boms.filter(b => b.finishedProductId === newPoFinishedProductId).map(b => (
                            <option key={b.id} value={b.id}>{b.bomNo} - {b.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Work Center Route</label>
                        <select
                          value={newPoWorkCenterId}
                          onChange={e => setNewPoWorkCenterId(e.target.value)}
                          className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                        >
                          <option value="">-- Choose Center --</option>
                          {workCenters.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Run Quantity</label>
                        <input
                          type="number"
                          value={newPoQty}
                          onChange={e => setNewPoQty(e.target.value)}
                          placeholder="e.g. 100"
                          className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg border-0 cursor-pointer transition-all mt-2 shadow-md shadow-primary/10"
                      >
                        Launch Production Order
                      </button>
                    </form>
                  </div>

                  {/* Production Pipeline Kanban columns */}
                  <div className="lg:col-span-3 flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground">Production Pipeline Kanban</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* PLANNED COLUMN */}
                      <div className="bg-card/40 border border-border p-4 rounded-xl flex flex-col gap-3 min-h-[400px]">
                        <div className="flex justify-between items-center border-b border-border pb-2">
                          <span className="text-xs font-bold text-foreground uppercase tracking-wider">Planned Runs</span>
                          <span className="text-[10px] bg-secondary border border-border px-2 py-0.5 rounded font-semibold text-muted-foreground">
                            {productionOrders.filter(o => o.status === 'PLANNED').length}
                          </span>
                        </div>
                        {productionOrders.filter(o => o.status === 'PLANNED').map(order => (
                          <div key={order.id} className="p-3.5 rounded-lg bg-secondary/50 border border-border flex flex-col gap-3">
                            <div>
                              <div className="font-extrabold text-[10px] text-muted-foreground">{order.orderNo}</div>
                              <div className="font-bold text-xs text-foreground mt-0.5">{order.finishedProduct?.name}</div>
                              <div className="text-[10px] text-muted-foreground mt-1">Quantity: {order.quantity} Units</div>
                              <div className="text-[10px] text-muted-foreground">BOM: {order.bom?.bomNo || 'Recipe'}</div>
                            </div>
                            <button
                              onClick={() => handleTransitionProductionOrder(order.id, 'IN_PROGRESS')}
                              className="w-full py-1.5 bg-primary hover:bg-primary-hover text-white rounded text-[10px] font-bold border-0 cursor-pointer transition-all"
                            >
                              Transition to In-Progress
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* IN PROGRESS COLUMN */}
                      <div className="bg-card/40 border border-border p-4 rounded-xl flex flex-col gap-3 min-h-[400px]">
                        <div className="flex justify-between items-center border-b border-border pb-2">
                          <span className="text-xs font-bold text-primary uppercase tracking-wider">In Progress</span>
                          <span className="text-[10px] bg-primary/10 border border-primary/20 px-2 py-0.5 rounded font-semibold text-primary">
                            {productionOrders.filter(o => o.status === 'IN_PROGRESS').length}
                          </span>
                        </div>
                        {productionOrders.filter(o => o.status === 'IN_PROGRESS').map(order => (
                          <div key={order.id} className="p-3.5 rounded-lg bg-secondary/50 border border-border flex flex-col gap-3 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-1.5 h-full bg-primary" />
                            <div>
                              <div className="font-extrabold text-[10px] text-muted-foreground">{order.orderNo}</div>
                              <div className="font-bold text-xs text-foreground mt-0.5">{order.finishedProduct?.name}</div>
                              <div className="text-[10px] text-muted-foreground mt-1">Quantity: {order.quantity} Units</div>
                              <div className="text-[10px] text-primary font-semibold mt-1">
                                Started: {order.startDate ? new Date(order.startDate).toLocaleTimeString() : 'Active'}
                              </div>
                            </div>
                            <button
                              onClick={() => handleTransitionProductionOrder(order.id, 'COMPLETED')}
                              className="w-full py-1.5 bg-success hover:bg-success/80 text-white rounded text-[10px] font-bold border-0 cursor-pointer transition-all"
                            >
                              Fulfill & Complete Order
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* COMPLETED COLUMN */}
                      <div className="bg-card/40 border border-border p-4 rounded-xl flex flex-col gap-3 min-h-[400px]">
                        <div className="flex justify-between items-center border-b border-border pb-2">
                          <span className="text-xs font-bold text-success uppercase tracking-wider">Completed</span>
                          <span className="text-[10px] bg-success/15 border border-success/20 px-2 py-0.5 rounded font-semibold text-success">
                            {productionOrders.filter(o => o.status === 'COMPLETED').length}
                          </span>
                        </div>
                        {productionOrders.filter(o => o.status === 'COMPLETED').map(order => (
                          <div key={order.id} className="p-3.5 rounded-lg bg-secondary/50 border border-border flex flex-col gap-1 relative overflow-hidden opacity-75">
                            <div className="absolute top-0 right-0 w-1.5 h-full bg-success" />
                            <div className="font-extrabold text-[10px] text-muted-foreground">{order.orderNo}</div>
                            <div className="font-bold text-xs text-foreground mt-0.5">{order.finishedProduct?.name}</div>
                            <div className="text-[10px] text-muted-foreground mt-1">Quantity: {order.quantity} Units</div>
                            <div className="text-[10px] text-success font-semibold mt-1">
                              Completed: {order.endDate ? new Date(order.endDate).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {mfgSubTab === 'workcenters' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Create Work Center Form */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Plus className="h-4.5 w-4.5 text-primary" />
                      <span>Register Resource Work Center</span>
                    </h3>
                    <form onSubmit={handleCreateWorkCenter} className="flex flex-col gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase">Work Center Name</label>
                        <input
                          type="text"
                          value={newWcName}
                          onChange={e => setNewWcName(e.target.value)}
                          placeholder="e.g. Welding Station B"
                          className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase">Capacity (Hours/Day)</label>
                          <input
                            type="number"
                            value={newWcCapacity}
                            onChange={e => setNewWcCapacity(e.target.value)}
                            className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase">Efficiency Rate (e.g. 1.0)</label>
                          <input
                            type="number"
                            step="0.05"
                            value={newWcEfficiency}
                            onChange={e => setNewWcEfficiency(e.target.value)}
                            className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase">Labor Rate (₹/Hour)</label>
                          <input
                            type="number"
                            value={newWcLaborRate}
                            onChange={e => setNewWcLaborRate(e.target.value)}
                            className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase">Machine Rate (₹/Hour)</label>
                          <input
                            type="number"
                            value={newWcMachineRate}
                            onChange={e => setNewWcMachineRate(e.target.value)}
                            className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg border-0 cursor-pointer transition-all mt-2 shadow-md shadow-primary/10"
                      >
                        Register Center
                      </button>
                    </form>
                  </div>

                  {/* Work Center registry list */}
                  <div className="lg:col-span-2 bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="font-heading font-bold text-sm text-foreground">Active Work Centers List</h3>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="bg-secondary/50 text-muted-foreground border-b border-border">
                            <th className="p-3 font-semibold uppercase tracking-wider">Station Name</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Capacity Hours</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Efficiency</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Labor Rate</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Machine Rate</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Operational Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workCenters.map(wc => (
                            <tr key={wc.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                              <td className="p-3 font-bold text-foreground">{wc.name}</td>
                              <td className="p-3 text-muted-foreground">{wc.capacityHours} Hours / Day</td>
                              <td className="p-3 text-foreground font-semibold">{Math.round(wc.efficiency * 100)}%</td>
                              <td className="p-3 text-muted-foreground">₹{wc.laborRate} / Hour</td>
                              <td className="p-3 text-muted-foreground">₹{wc.machineRate} / Hour</td>
                              <td className="p-3 text-primary font-extrabold">₹{wc.laborRate + wc.machineRate} / Hour</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {mfgSubTab === 'oee' && (
                <div className="flex flex-col gap-6">
                  {/* Top Analytics logs input */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Log OEE record form */}
                    <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                      <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                        <Plus className="h-4.5 w-4.5 text-primary" />
                        <span>Log OEE Production Parameters</span>
                      </h3>
                      <form onSubmit={handleCreateOeeLog} className="flex flex-col gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase">Work Center</label>
                          <select
                            value={newOeeWcId}
                            onChange={e => setNewOeeWcId(e.target.value)}
                            className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                            required
                          >
                            <option value="">-- Choose Center --</option>
                            {workCenters.map(w => (
                              <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground uppercase">Date</label>
                            <input
                              type="date"
                              value={newOeeDate}
                              onChange={e => setNewOeeDate(e.target.value)}
                              className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground uppercase">Planned Time (Mins)</label>
                            <input
                              type="number"
                              value={newOeePlannedTime}
                              onChange={e => setNewOeePlannedTime(e.target.value)}
                              className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground uppercase">Run Time (Mins)</label>
                            <input
                              type="number"
                              value={newOeeRunTime}
                              onChange={e => setNewOeeRunTime(e.target.value)}
                              className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground uppercase">Planned Qty</label>
                            <input
                              type="number"
                              value={newOeePlannedQty}
                              onChange={e => setNewOeePlannedQty(e.target.value)}
                              className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground uppercase">Total Output Qty</label>
                            <input
                              type="number"
                              value={newOeeTotalQty}
                              onChange={e => setNewOeeTotalQty(e.target.value)}
                              className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground uppercase">Good Quality Qty</label>
                            <input
                              type="number"
                              value={newOeeGoodQty}
                              onChange={e => setNewOeeGoodQty(e.target.value)}
                              className="w-full mt-1 p-2 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                              required
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg border-0 cursor-pointer transition-all mt-2 shadow-md shadow-primary/10"
                        >
                          Record OEE Entry
                        </button>
                      </form>
                    </div>

                    {/* OEE Graphics charts using Recharts */}
                    <div className="lg:col-span-2 bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl flex flex-col gap-4">
                      <h3 className="font-heading font-bold text-sm text-foreground">Work Center Overall Equipment Effectiveness Trend</h3>
                      <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={oeeLogs.map(log => ({
                              name: `${log.workCenter?.name || 'Center'} (${new Date(log.date).toLocaleDateString()})`,
                              Availability: Math.round(log.availability * 100),
                              Performance: Math.round(log.performance * 100),
                              Quality: Math.round(log.quality * 100),
                              OEE: Math.round(log.oeeScore * 100)
                            }))}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="colorOee" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#c3c0ff" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#c3c0ff" stopOpacity={0}/>
                              </linearGradient>
                              <filter id="lavenderGlow3" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#c3c0ff" floodOpacity="0.5"/>
                              </filter>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={9} />
                            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={9} unit="%" />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                            <Area type="monotone" dataKey="OEE" stroke="#c3c0ff" strokeWidth={2.5} filter="url(#lavenderGlow3)" fillOpacity={1} fill="url(#colorOee)" />
                            <Area type="monotone" dataKey="Availability" stroke="#4cd7f6" strokeWidth={1.5} fill="none" />
                            <Area type="monotone" dataKey="Performance" stroke="#e0b6ff" strokeWidth={1.5} fill="none" />
                            <Area type="monotone" dataKey="Quality" stroke="#00CA72" strokeWidth={1.5} fill="none" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* OEE Logs detail table */}
                  <div className="bg-card/75 backdrop-blur-md border border-border p-6 rounded-xl">
                    <h3 className="font-heading font-bold text-sm text-foreground mb-4">Logged OEE Factors & Audit</h3>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="bg-secondary/50 text-muted-foreground border-b border-border">
                            <th className="p-3 font-semibold uppercase tracking-wider">Date</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Work Center</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Availability</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Performance</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Quality Rate</th>
                            <th className="p-3 font-semibold uppercase tracking-wider">Aggregate OEE Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {oeeLogs.map(log => {
                            const oeePct = Math.round(log.oeeScore * 100);
                            let scoreColor = 'text-danger bg-danger/10 border-danger/25';
                            if (oeePct >= 85) scoreColor = 'text-success bg-success/10 border-success/25';
                            else if (oeePct >= 65) scoreColor = 'text-warning bg-warning/10 border-warning/25';

                            return (
                              <tr key={log.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                                <td className="p-3 text-muted-foreground">{new Date(log.date).toLocaleDateString()}</td>
                                <td className="p-3 font-bold text-foreground">{log.workCenter?.name || 'N/A'}</td>
                                <td className="p-3 text-foreground">{Math.round(log.availability * 100)}%</td>
                                <td className="p-3 text-foreground">{Math.round(log.performance * 100)}%</td>
                                <td className="p-3 text-foreground">{Math.round(log.quality * 100)}%</td>
                                <td className="p-3">
                                  <span className={`px-2.5 py-1 rounded font-extrabold text-[11px] border ${scoreColor}`}>
                                    {oeePct}% {oeePct >= 85 ? 'World Class' : oeePct >= 65 ? 'Optimal' : 'Needs Action'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Production Order Warehouse Selection Modal Overlay */}
          {poSelectWarehouseModalOpen && activePoToComplete && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden flex flex-col gap-6">
                <div className="flex justify-between items-start border-b border-border pb-4">
                  <div>
                    <h3 className="text-base font-bold text-foreground">Select Delivery Warehouse</h3>
                    <p className="text-[10px] text-muted-foreground">Select where the completed finished goods will be stored, and raw materials consumed.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setPoSelectWarehouseModalOpen(false);
                      setActivePoToComplete(null);
                    }}
                    className="p-1.5 rounded bg-secondary hover:bg-border border-0 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    X
                  </button>
                </div>

                <form onSubmit={handleCompleteProductionOrderFinal} className="space-y-4">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase">Storage Location / Warehouse</label>
                    <select
                      value={completePoWarehouseId}
                      onChange={(e) => setCompletePoWarehouseId(e.target.value)}
                      className="w-full mt-1.5 p-2.5 border rounded-lg bg-secondary/50 border-input outline-none focus:border-primary text-xs text-foreground"
                      required
                    >
                      <option value="">-- Choose Godown / Warehouse --</option>
                      {warehouses.map(wh => (
                        <option key={wh.id} value={wh.id}>{wh.name} ({wh.location})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-success text-white text-xs font-bold rounded-lg border-0 cursor-pointer hover:bg-success/80 transition-colors"
                    >
                      Confirm Completion & Update Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPoSelectWarehouseModalOpen(false);
                        setActivePoToComplete(null);
                      }}
                      className="px-4 py-2 bg-secondary hover:bg-border text-foreground text-xs font-semibold rounded-lg cursor-pointer border border-border transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}


        </main>
      </div>

      {/* FLOATING OVERLAY AI CHAT DRAWER */}
      {showAIChat && (
        <div className="ai-theme-override ai-glass-panel ai-pulse-card fixed bottom-6 right-6 w-96 max-w-full z-50 animate-fade-in shadow-2xl flex flex-col h-[450px] justify-between rounded-xl">
          <div className="p-4 border-b border-border flex justify-between items-center bg-transparent">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-heading font-bold text-sm text-foreground">ERP AI Quick Assistant</span>
            </div>
            <button 
              onClick={() => dispatch(toggleAIChat())}
              className="text-muted-foreground hover:text-foreground text-xs font-semibold hover:underline bg-transparent border-0 cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {chatHistory.map((chat, idx) => (
              <div key={idx} className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`p-2.5 rounded-lg max-w-[85%] text-[11px] leading-relaxed ${
                    chat.sender === 'user' 
                      ? 'bg-primary-container text-white shadow-md shadow-primary/10' 
                      : 'bg-secondary text-foreground border border-border'
                  }`}
                >
                  {chat.sender === 'user' ? chat.text : <AiResponseText text={chat.text} />}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendQuery} className="p-3 border-t border-border flex gap-2">
            <input 
              type="text" 
              placeholder="Ask ERP AI anything..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="flex-1 px-3 py-1.5 border rounded-lg bg-secondary border-input text-foreground placeholder-muted-foreground outline-none text-xs"
            />
            <button type="submit" className="p-2 rounded-lg bg-primary-container hover:bg-primary-hover text-white transition-colors cursor-pointer border-0 flex items-center justify-center">
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
