import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  ShieldCheck,
  ShieldAlert,
  FileText,
  IndianRupee,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import { api } from '../utils/api';
import Modal from './ui/Modal';

export default function FinanceModule() {
  const {
    accounts,
    setAccounts,
    addAccount,
    journalEntries,
    setJournalEntries,
    addJournalEntry,
    invoices,
    setInvoices,
    addInvoice,
    updateInvoiceStatus,
    sendInvoice,
    checkOverdueInvoices,
    budgets,
    setBudgets,
    addBudget,
    updateBudget,
    expenses,
    setExpenses,
    addExpense,
    updateExpenseStatus,
    approvalWorkflows,
    setApprovalWorkflows,
    addApprovalWorkflow,
    approveWorkflowLevel,
    taxCompliance,
    setFilingDeadlines,
    updateTaxDeadline,
    statements,
    setStatements,
    addStatement,
    updateStatementStatus,
    exportAuditTrail,
    addNotification,
    addToast
  } = useERPStore();

  useEffect(() => {
    let active = true;
    const fetchFinanceData = async () => {
      try {
        const [accts, jEntries, invs, bdgts, exps, appr, tx, stmts, rates, logs] = await Promise.all([
          api.finance.getAccounts(),
          api.finance.getJournalEntries(),
          api.finance.getInvoices(),
          api.finance.getBudgets(),
          api.finance.getExpenses(),
          api.finance.getApprovalWorkflows(),
          api.finance.getTaxDeadlines(),
          api.finance.getStatements(),
          api.finance.getExchangeRates(),
          api.finance.getAuditLogs()
        ]);
        if (active) {
          if (Array.isArray(accts)) setAccounts(accts);
          if (Array.isArray(jEntries)) setJournalEntries(jEntries);
          if (Array.isArray(invs)) setInvoices(invs);
          if (Array.isArray(bdgts)) setBudgets(bdgts);
          if (Array.isArray(exps)) setExpenses(exps);
          if (Array.isArray(appr)) setApprovalWorkflows(appr);
          if (Array.isArray(tx)) setFilingDeadlines(tx);
          if (Array.isArray(stmts)) setStatements(stmts);
          if (rates) setExchangeRates(rates);
          if (Array.isArray(logs)) setAuditLogs(logs);
        }
      } catch (err) {
        console.error('Error fetching finance data:', err);
      }
    };
    fetchFinanceData();
    return () => {
      active = false;
    };
  }, [setAccounts, setJournalEntries, setInvoices, setBudgets, setExpenses, setApprovalWorkflows, setFilingDeadlines, setStatements]);

  const [activeTab, setActiveTab] = useState('accounts');
  const [acctModalOpen, setAcctModalOpen] = useState(false);
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [taxModalOpen, setTaxModalOpen] = useState(false);
  const [stmtModalOpen, setStmtModalOpen] = useState(false);

  const [newAcct, setNewAcct] = useState({ code: '', name: '', type: 'ASSET', balance: 0 });
  const [newJournal, setNewJournal] = useState({ debitAcc: '', creditAcc: '', amount: 0, narration: '', date: '', referenceNo: '' });
  const [newInv, setNewInv] = useState({ invoiceNo: '', customerName: '', invoiceDate: '', dueDate: '', subtotal: 0, taxRate: 0, status: 'PENDING' });
  const [newBudget, setNewBudget] = useState({ budgetName: '', category: '', period: 'monthly', amount: 0, spent: 0, year: 2026, month: 6 });
  const [newExpense, setNewExpense] = useState({ description: '', category: '', amount: 0, date: '', paidBy: '', receiptStatus: 'Pending' });
  const [newApproval, setNewApproval] = useState({ requestNo: '', type: 'PAYMENT', requester: '', amount: 0, date: '', reason: '' });
  const [newTax, setNewTax] = useState({ taxName: '', taxType: 'GST', rate: 0, applicableOn: '', effectiveDate: '', dueDate: '', period: 'monthly', status: 'PENDING' });
  const [newStmt, setNewStmt] = useState({ statementType: 'Profit & Loss', period: '', totalIncome: 0, totalExpense: 0, netAmount: 0, status: 'Generated' });
  const [ledgerStatus, setLedgerStatus] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [auditLogs, setAuditLogs] = useState([]);
  const [exchangeRates, setExchangeRates] = useState({ USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.2, AED: 3.67 });
  const [currency, setCurrency] = useState('USD');

  const formatC = (amt) => {
    const val = (amt / (exchangeRates['USD'] || 1)) * (exchangeRates[currency] || 1);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(val);
  };

  const [plPeriod, setPlPeriod] = useState('month');
  const [plYear, setPlYear] = useState(new Date().getFullYear());
  const [plQuarter, setPlQuarter] = useState(1);
  const [plMonth, setPlMonth] = useState(new Date().getMonth() + 1);

  const revenueAccounts = accounts.filter(a => a.type === 'REVENUE');
  const expenseAccounts = accounts.filter(a => a.type === 'EXPENSE');
  const assetAccounts = accounts.filter(a => a.type === 'ASSET');
  const liabilityAccounts = accounts.filter(a => a.type === 'LIABILITY');
  const equityAccounts = accounts.filter(a => a.type === 'EQUITY');

  const totalRev = revenueAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalExp = expenseAccounts.reduce((sum, a) => sum + a.balance, 0);
  const netIncome = totalRev - totalExp;
  const totalAssets = assetAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalLiab = liabilityAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = equityAccounts.reduce((sum, a) => sum + a.balance, 0);

  const handleAddAccount = async () => {
    if (!newAcct.code || !newAcct.name) return addToast('Account code and name are required', 'error');
    if (isSubmitting) return;
    setIsSubmitting(true);
    const payload = { ...newAcct, balance: parseFloat(newAcct.balance) || 0 };
    try {
      const savedAcc = await api.finance.createAccount(payload);
      const exists = accounts.some(a => a.code === savedAcc.code);
      if (!exists) {
        addAccount(savedAcc);
      }
      addToast('Account created successfully', 'success');
      addNotification(`New account "${newAcct.name}" added to ledger`);
      setNewAcct({ code: '', name: '', type: 'ASSET', balance: 0 });
      setAcctModalOpen(false);
    } catch (err) {
      addToast(`Error creating account: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddJournal = async () => {
    if (!newJournal.debitAcc || !newJournal.creditAcc || !newJournal.amount) {
      return addToast('All journal fields are required', 'error');
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    const payload = { ...newJournal, amount: parseFloat(newJournal.amount) };
    try {
      const savedJE = await api.finance.createJournalEntry(payload);
      const exists = journalEntries.some(j => j.voucherNo === savedJE.voucherNo);
      if (!exists) {
        addJournalEntry(savedJE);
      }
      // Refetch accounts to reflect ledger double-entry balances
      const accts = await api.finance.getAccounts();
      if (Array.isArray(accts)) setAccounts(accts);
      addToast('Journal entry recorded', 'success');
      setNewJournal({ debitAcc: '', creditAcc: '', amount: 0, narration: '', date: '', referenceNo: '' });
      setJournalModalOpen(false);
    } catch (err) {
      addToast(`Error recording journal: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddInvoice = async () => {
    if (!newInv.customerName || !newInv.subtotal) return addToast('Customer name and amount are required', 'error');
    if (isSubmitting) return;
    setIsSubmitting(true);
    const payload = { 
      ...newInv, 
      subtotal: parseFloat(newInv.subtotal) || 0,
      taxRate: parseFloat(newInv.taxRate) || 0 
    };
    try {
      const savedInv = await api.finance.createInvoice(payload);
      const exists = invoices.some(i => i.invoiceNo === savedInv.invoiceNo);
      if (!exists) {
        addInvoice(savedInv);
      }
      addToast('Invoice created', 'success');
      setNewInv({ invoiceNo: '', customerName: '', invoiceDate: '', dueDate: '', subtotal: 0, taxRate: 0, status: 'PENDING' });
      setInvoiceModalOpen(false);
    } catch (err) {
      addToast(`Error creating invoice: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddBudget = async () => {
    if (!newBudget.budgetName || !newBudget.category || !newBudget.amount) {
      return addToast('Budget Name, Category, and Allocated Amount are required', 'error');
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    const payload = { 
      ...newBudget, 
      amount: parseFloat(newBudget.amount) || 0,
      spent: parseFloat(newBudget.spent) || 0,
      costCenter: newBudget.category 
    };
    try {
      const savedBgt = await api.finance.createBudget(payload);
      const exists = budgets.some(b => b.id === savedBgt.id);
      if (!exists) {
        addBudget(savedBgt);
      }
      addToast('Budget created successfully', 'success');
      addNotification(`New budget "${newBudget.budgetName}" created`);
      setNewBudget({ budgetName: '', category: '', period: 'monthly', amount: 0, spent: 0, year: 2026, month: 6 });
      setBudgetModalOpen(false);
    } catch (err) {
      addToast(`Error creating budget: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.category || !newExpense.amount) return addToast('Description, category, and amount are required', 'error');
    if (isSubmitting) return;
    setIsSubmitting(true);
    const payload = { ...newExpense, amount: parseFloat(newExpense.amount), date: newExpense.date || new Date().toISOString().split('T')[0] };
    try {
      const savedExp = await api.finance.createExpense(payload);
      const exists = expenses.some(e => e.id === savedExp.id);
      if (!exists) {
        addExpense(savedExp);
      }
      addToast('Expense logged successfully', 'success');
      setNewExpense({ description: '', category: '', amount: 0, date: '', paidBy: '', receiptStatus: 'Pending' });
      setExpenseModalOpen(false);
    } catch (err) {
      addToast(`Error logging expense: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveExpense = async (expenseId) => {
    try {
      await api.finance.updateExpenseStatus(expenseId, 'APPROVED');
      updateExpenseStatus(expenseId, 'APPROVED', 'currentUser');
      addToast('Expense approved', 'success');
    } catch (err) {
      addToast(`Error approving expense: ${err.message}`, 'error');
    }
  };

  const handleAddApproval = async () => {
    if (!newApproval.type || !newApproval.requester || !newApproval.amount) {
      return addToast('Type, Requester, and Amount are required', 'error');
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    const payload = { ...newApproval, amount: parseFloat(newApproval.amount) || 0 };
    try {
      const savedApp = await api.finance.createApprovalWorkflow(payload);
      const exists = approvalWorkflows.some(w => w.id === savedApp.id);
      if (!exists) {
        addApprovalWorkflow(savedApp);
      }
      addToast('Approval request created successfully', 'success');
      setNewApproval({ requestNo: '', type: 'PAYMENT', requester: '', amount: 0, date: '', reason: '' });
      setApprovalModalOpen(false);
    } catch (err) {
      addToast(`Error creating approval request: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveWorkflow = async (workflowId, level) => {
    try {
      await api.finance.approveApprovalWorkflow(workflowId, level);
      approveWorkflowLevel(workflowId, level);
      addToast('Workflow level approved', 'success');
    } catch (err) {
      addToast(`Error approving workflow: ${err.message}`, 'error');
    }
  };

  const handleAddTax = async () => {
    if (!newTax.taxType || !newTax.dueDate) {
      return addToast('Tax Type and Due Date are required', 'error');
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    const payload = { ...newTax, rate: parseFloat(newTax.rate) || 0 };
    try {
      const savedTax = await api.finance.createTaxDeadline(payload);
      const oldDeadlines = taxCompliance.filingDeadlines;
      const exists = oldDeadlines.some(d => d.id === savedTax.id);
      if (!exists) {
        setFilingDeadlines([...oldDeadlines, savedTax]);
      }
      addToast('Tax record created successfully', 'success');
      setNewTax({ taxName: '', taxType: 'GST', rate: 0, applicableOn: '', effectiveDate: '', dueDate: '', period: 'monthly', status: 'PENDING' });
      setTaxModalOpen(false);
    } catch (err) {
      addToast(`Error creating tax record: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTaxDeadline = async (deadlineId, status) => {
    try {
      await api.finance.updateTaxDeadlineStatus(deadlineId, status);
      updateTaxDeadline(deadlineId, status);
      addToast('Tax status updated', 'success');
    } catch (err) {
      addToast(`Error updating tax status: ${err.message}`, 'error');
    }
  };

  const handleAddStatement = async () => {
    if (!newStmt.statementType || !newStmt.period) {
      return addToast('Statement Type and Period are required', 'error');
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    const payload = {
      ...newStmt,
      totalIncome: parseFloat(newStmt.totalIncome) || 0,
      totalExpense: parseFloat(newStmt.totalExpense) || 0,
      netAmount: parseFloat(newStmt.netAmount) || 0
    };
    try {
      const savedStmt = await api.finance.createStatement(payload);
      const exists = statements.some(s => s.id === savedStmt.id);
      if (!exists) {
        addStatement(savedStmt);
      }
      addToast('Statement logged successfully', 'success');
      setNewStmt({ statementType: 'Profit & Loss', period: '', totalIncome: 0, totalExpense: 0, netAmount: 0, status: 'Generated' });
      setStmtModalOpen(false);
    } catch (err) {
      addToast(`Error logging statement: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatementStatus = async (id, status) => {
    try {
      await api.finance.updateStatementStatus(id, status);
      updateStatementStatus(id, status);
      addToast('Statement status updated', 'success');
    } catch (err) {
      addToast(`Error updating statement status: ${err.message}`, 'error');
    }
  };

  const handleSendInvoice = async (invoiceId) => {
    try {
      await api.finance.updateInvoiceStatus(invoiceId, 'SENT');
      sendInvoice(invoiceId);
      addToast('Invoice sent successfully', 'success');
      addNotification(`Invoice sent to customer`);
    } catch (err) {
      addToast(`Error sending invoice: ${err.message}`, 'error');
    }
  };

  const handleCheckOverdue = () => {
    checkOverdueInvoices();
    addToast('Overdue invoices checked', 'info');
  };

  const validateLedger = () => {
    setIsValidating(true);
    setTimeout(() => {
      const balanced = Math.abs((totalAssets + totalExp) - (totalLiab + totalEquity + totalRev)) < 1;
      setLedgerStatus(balanced ? 'valid' : 'compromised');
      setIsValidating(false);
      addToast(balanced ? 'Ledger integrity verified ✓' : 'Ledger imbalance detected!', balanced ? 'success' : 'error');
    }, 1200);
  };

  const TABS = [
    { id: 'accounts', label: 'Chart of Accounts', icon: FileSpreadsheet },
    { id: 'journal', label: 'Journal Entries', icon: FileText },
    { id: 'invoices', label: 'Invoices', icon: IndianRupee },
    { id: 'budgets', label: 'Budget Planner', icon: TrendingUp },
    { id: 'expenses', label: 'Expense Tracker', icon: AlertCircle },
    { id: 'approvals', label: 'Approvals', icon: CheckCircle },
    { id: 'tax', label: 'Tax & Compliance', icon: ShieldCheck },
    { id: 'statements', label: 'Statements', icon: TrendingUp },
    { id: 'audit', label: 'Audit Trail', icon: ShieldCheck }
  ];

  const TYPE_COLORS = { ASSET: 'text-sky-400', LIABILITY: 'text-rose-400', EQUITY: 'text-violet-400', REVENUE: 'text-emerald-400', EXPENSE: 'text-amber-400' };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-main">Finance & Accounting</h1>
            <p className="text-sm text-muted mt-1">Blockchain-secured general ledger & financial statements</p>
          </div>
          <select 
            value={currency} 
            onChange={e => setCurrency(e.target.value)}
            className="input-field bg-surface text-main py-1.5 px-3 rounded-lg border-muted"
          >
            {Object.keys(exchangeRates).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          {ledgerStatus === 'valid' && <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20"><ShieldCheck className="w-3.5 h-3.5" /> Ledger Verified</span>}
          {ledgerStatus === 'compromised' && <span className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20"><ShieldAlert className="w-3.5 h-3.5" /> Imbalance Detected</span>}
          <button onClick={validateLedger} disabled={isValidating} className="btn-secondary text-xs">
            {isValidating ? 'Validating...' : 'Validate Ledger'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue', value: totalRev, color: 'text-emerald-400', icon: TrendingUp },
          { label: 'Total Expenses', value: totalExp, color: 'text-rose-400', icon: TrendingDown },
          { label: 'Net Income', value: netIncome, color: netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400', icon: IndianRupee },
          { label: 'Total Assets', value: totalAssets, color: 'text-sky-400', icon: FileSpreadsheet }
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="theme-card p-4">
              <p className="text-xs text-muted">{card.label}</p>
              <p className={`text-lg font-bold mt-1 font-data ${card.color}`}>{formatC(card.value)}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface p-1 rounded-xl w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-muted hover:text-main'}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'accounts' && (
        <div className="theme-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Chart of Accounts ({accounts.length})</h3>
            <button onClick={() => setAcctModalOpen(true)} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300">
              <Plus className="w-3.5 h-3.5" /> New Account
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-muted border-b border-main bg-surface">
                  <th className="px-4 py-2.5">Code</th>
                  <th className="px-4 py-2.5">Account Name</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id} className="border-b border-main/50 hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-muted">{acc.code}</td>
                    <td className="px-4 py-2.5 text-sm text-main">{acc.name}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium ${TYPE_COLORS[acc.type] || 'text-muted'}`}>{acc.type}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm font-data font-semibold text-main">{formatC(acc.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'journal' && (
        <div className="theme-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Journal Entries ({journalEntries.length})</h3>
            <button onClick={() => setJournalModalOpen(true)} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300">
              <Plus className="w-3.5 h-3.5" /> New Entry
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-muted border-b border-main bg-surface">
                  <th className="px-4 py-2.5">#</th>
                  <th className="px-4 py-2.5">Voucher</th>
                  <th className="px-4 py-2.5">Debit</th>
                  <th className="px-4 py-2.5">Credit</th>
                  <th className="px-4 py-2.5">Narration</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {journalEntries.map((je) => (
                  <tr key={je.id} className="border-b border-main/50 hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-dimmed">{je.blockIndex}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-indigo-400">{je.voucherNo}</td>
                    <td className="px-4 py-2.5 text-xs text-emerald-400">{je.debitAcc}</td>
                    <td className="px-4 py-2.5 text-xs text-rose-400">{je.creditAcc}</td>
                    <td className="px-4 py-2.5 text-xs text-muted max-w-xs truncate">{je.narration}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data font-semibold text-main">{formatC(je.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="theme-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Invoices ({invoices.length})</h3>
            <div className="flex items-center gap-2">
              <button onClick={handleCheckOverdue} className="btn-secondary text-xs">Check Overdue</button>
              <button onClick={() => setInvoiceModalOpen(true)} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300">
                <Plus className="w-3.5 h-3.5" /> New Invoice
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-muted border-b border-main bg-surface">
                  <th className="px-4 py-2.5">Invoice No</th>
                  <th className="px-4 py-2.5">Client Name</th>
                  <th className="px-4 py-2.5">Invoice Date</th>
                  <th className="px-4 py-2.5">Due Date</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Sent</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                  <th className="px-4 py-2.5 text-right">Tax</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                  <th className="px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const isOverdue = inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== 'PAID' && inv.status !== 'Paid';
                  const statusFormatted = inv.status ? inv.status.toUpperCase() : 'PENDING';
                  return (
                    <tr key={inv.id} className="border-b border-main/50 hover:bg-surface/50 transition-colors">
                      <td className="px-4 py-2.5 text-xs font-mono text-indigo-400">{inv.invoiceNo}</td>
                      <td className="px-4 py-2.5 text-sm text-main">{inv.customerName}</td>
                      <td className="px-4 py-2.5 text-xs text-muted">{inv.invoiceDate || '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-muted">{inv.dueDate || '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          statusFormatted === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' :
                          statusFormatted === 'OVERDUE' || isOverdue ? 'bg-rose-500/10 text-rose-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>{isOverdue ? 'OVERDUE' : statusFormatted}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted">{inv.sent ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-2.5 text-right text-sm font-data text-muted">{formatC(inv.subtotal || inv.totalAmount || 0)}</td>
                      <td className="px-4 py-2.5 text-right text-xs font-data text-muted">
                        {formatC(inv.taxAmount || 0)} <span className="text-[10px] text-dimmed">({inv.taxRate || 0}%)</span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm font-data font-semibold text-main">{formatC(inv.totalAmount || 0)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {!inv.sent && (
                            <button onClick={() => handleSendInvoice(inv.id)} className="text-xs text-indigo-400 hover:underline">
                              Send
                            </button>
                          )}
                          {(statusFormatted === 'PENDING' || statusFormatted === 'OVERDUE') && !isOverdue && (
                            <button onClick={async () => {
                              try {
                                await api.finance.updateInvoiceStatus(inv.id, 'PAID');
                                updateInvoiceStatus(inv.id, 'PAID');
                                addToast('Invoice marked as paid', 'success');
                              } catch (err) {
                                addToast(`Error marking invoice as paid: ${err.message}`, 'error');
                              }
                            }}
                              className="text-xs text-emerald-400 hover:underline">
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'budgets' && (
        <div className="theme-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Budget Planner ({budgets.length})</h3>
            <button onClick={() => setBudgetModalOpen(true)} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300">
              <Plus className="w-3.5 h-3.5" /> New Budget
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-muted border-b border-main bg-surface">
                  <th className="px-4 py-2.5">Budget Name</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Period</th>
                  <th className="px-4 py-2.5">Allocated Amount</th>
                  <th className="px-4 py-2.5">Spent Amount</th>
                  <th className="px-4 py-2.5">Remaining</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((budget) => {
                  const remaining = budget.amount - budget.spent;
                  const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
                  const isOverBudget = percentage > 100;
                  const isNearLimit = percentage > 80 && percentage <= 100;
                  return (
                    <tr key={budget.id} className="border-b border-main/50 hover:bg-surface/50 transition-colors">
                      <td className="px-4 py-2.5 text-sm font-semibold text-main">{budget.budgetName || '—'}</td>
                      <td className="px-4 py-2.5 text-sm text-main">{budget.category || budget.costCenter || '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-muted">{budget.period} ({budget.year}{budget.month ? `-${budget.month}` : ''})</td>
                      <td className="px-4 py-2.5 text-sm font-data font-semibold text-main">{formatC(budget.amount)}</td>
                      <td className="px-4 py-2.5 text-sm font-data text-muted">{formatC(budget.spent || 0)}</td>
                      <td className="px-4 py-2.5 text-sm font-data font-semibold text-main">
                        <span className={isOverBudget ? 'text-rose-400' : isNearLimit ? 'text-amber-400' : 'text-emerald-400'}>
                          {formatC(remaining)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isOverBudget ? 'bg-rose-500/10 text-rose-400' :
                          isNearLimit ? 'bg-amber-500/10 text-amber-400' :
                          'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {isOverBudget ? 'OVER BUDGET' : isNearLimit ? 'NEAR LIMIT' : 'ON TRACK'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="theme-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Expense Tracker ({expenses.length})</h3>
            <button onClick={() => setExpenseModalOpen(true)} className="btn-primary text-xs flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Log Expense
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-muted border-b border-main bg-surface">
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Paid By</th>
                  <th className="px-4 py-2.5">Receipt Status</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-main/50 hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{expense.description}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{expense.category}</td>
                    <td className="px-4 py-2.5 text-sm font-data font-semibold text-main">{formatC(expense.amount)}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{expense.date}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{expense.paidBy || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        expense.receiptStatus === 'Attached' ? 'bg-emerald-500/15 text-emerald-400' :
                        expense.receiptStatus === 'Missing' ? 'bg-rose-500/15 text-rose-400' :
                        'bg-amber-500/15 text-amber-400'
                      }`}>{expense.receiptStatus || 'Pending'}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        expense.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                        expense.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>{expense.status}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      {expense.status === 'PENDING' && (
                        <button onClick={() => handleApproveExpense(expense.id)} className="text-xs text-emerald-400 hover:underline">
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="theme-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Approval Workflows ({approvalWorkflows.length})</h3>
            <button onClick={() => setApprovalModalOpen(true)} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300">
              <Plus className="w-3.5 h-3.5" /> New Request
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-muted border-b border-main bg-surface">
                  <th className="px-4 py-2.5">Request No</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Requested By</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Reason</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvalWorkflows.map((workflow) => (
                  <tr key={workflow.id} className="border-b border-main/50 hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-indigo-400">{workflow.requestNo || '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-main">{workflow.type}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{workflow.requester}</td>
                    <td className="px-4 py-2.5 text-sm font-data font-semibold text-main">{formatC(workflow.amount)}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{workflow.date || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted max-w-xs truncate">{workflow.reason || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        workflow.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                        workflow.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>{workflow.status}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      {workflow.status === 'IN_PROGRESS' && workflow.levels && workflow.levels.length > 0 && (
                        <button onClick={() => handleApproveWorkflow(workflow.id, workflow.currentLevel)} className="text-xs text-emerald-400 hover:underline">
                          Approve Level {workflow.currentLevel}
                        </button>
                      )}
                      {workflow.status === 'PENDING' && (
                        <button onClick={() => handleApproveWorkflow(workflow.id, 1)} className="text-xs text-emerald-400 hover:underline">
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'tax' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="theme-card p-5 md:col-span-1">
              <h3 className="text-sm font-semibold text-main mb-4">Tax Rates</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted">GST Rate</span><span className="text-emerald-400 font-data">{taxCompliance.gstRate}%</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted">VAT Rate</span><span className="text-emerald-400 font-data">{taxCompliance.vatRate}%</span></div>
              </div>
            </div>
            <div className="theme-card p-5 md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-main">Filing Deadlines ({taxCompliance.filingDeadlines.length})</h3>
                <button onClick={() => setTaxModalOpen(true)} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300">
                  <Plus className="w-3.5 h-3.5" /> New Record
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-muted border-b border-main bg-surface">
                      <th className="px-3 py-2">Tax Name</th>
                      <th className="px-3 py-2">Tax Type</th>
                      <th className="px-3 py-2">Rate</th>
                      <th className="px-3 py-2">Applicable On</th>
                      <th className="px-3 py-2">Effective Date</th>
                      <th className="px-3 py-2">Due Date</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxCompliance.filingDeadlines.map((deadline) => (
                      <tr key={deadline.id} className="border-b border-main/50 hover:bg-surface/50 transition-colors">
                        <td className="px-3 py-2 text-xs text-main">{deadline.taxName || '—'}</td>
                        <td className="px-3 py-2 text-xs text-muted">{deadline.taxType}</td>
                        <td className="px-3 py-2 text-xs font-data text-emerald-400">{deadline.rate}%</td>
                        <td className="px-3 py-2 text-xs text-muted">{deadline.applicableOn || '—'}</td>
                        <td className="px-3 py-2 text-xs text-muted">{deadline.effectiveDate || '—'}</td>
                        <td className="px-3 py-2 text-xs text-muted">{deadline.dueDate}</td>
                        <td className="px-3 py-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            deadline.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                            deadline.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-rose-500/10 text-rose-400'
                          }`}>{deadline.status}</span>
                        </td>
                        <td className="px-3 py-2">
                          {deadline.status === 'PENDING' && (
                            <button onClick={() => handleUpdateTaxDeadline(deadline.id, 'COMPLETED')} className="text-xs text-emerald-400 hover:underline">
                              Mark Completed
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="theme-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-main">Audit Trail</h3>
              <button onClick={exportAuditTrail} className="btn-secondary text-xs">Export CSV</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-muted border-b border-main bg-surface">
                    <th className="px-3 py-2">Action</th>
                    <th className="px-3 py-2">Entity Type</th>
                    <th className="px-3 py-2">Entity ID</th>
                    <th className="px-3 py-2">User ID</th>
                    <th className="px-3 py-2">Timestamp</th>
                    <th className="px-3 py-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {taxCompliance.auditTrail.map((entry) => (
                    <tr key={entry.id} className="border-b border-main/50 hover:bg-surface/50 transition-colors">
                      <td className="px-3 py-2 text-xs text-indigo-400">{entry.action}</td>
                      <td className="px-3 py-2 text-xs text-muted">{entry.entityType}</td>
                      <td className="px-3 py-2 text-xs text-muted font-mono">{entry.entityId}</td>
                      <td className="px-3 py-2 text-xs text-muted">{entry.userId}</td>
                      <td className="px-3 py-2 text-xs text-muted">{new Date(entry.timestamp).toLocaleString()}</td>
                      <td className="px-3 py-2 text-xs text-main">{entry.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'statements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between theme-card p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted">Period:</label>
                <select className="form-input text-xs py-1" value={plPeriod} onChange={e => setPlPeriod(e.target.value)}>
                  <option value="month">Monthly</option>
                  <option value="quarter">Quarterly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted">Year:</label>
                <select className="form-input text-xs py-1" value={plYear} onChange={e => setPlYear(parseInt(e.target.value))}>
                  {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              {plPeriod === 'quarter' && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted">Quarter:</label>
                  <select className="form-input text-xs py-1" value={plQuarter} onChange={e => setPlQuarter(parseInt(e.target.value))}>
                    {[1, 2, 3, 4].map(q => <option key={q} value={q}>Q{q}</option>)}
                  </select>
                </div>
              )}
              {plPeriod === 'month' && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted">Month:</label>
                  <select className="form-input text-xs py-1" value={plMonth} onChange={e => setPlMonth(parseInt(e.target.value))}>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{new Date(2026, m-1).toLocaleString('default', { month: 'long' })}</option>)}
                  </select>
                </div>
              )}
            </div>
            <button onClick={() => {
              const periodStr = plPeriod === 'month' ? new Date(plYear, plMonth-1).toLocaleString('default', { month: 'long', year: 'numeric' }) : plPeriod === 'quarter' ? `Q${plQuarter} ${plYear}` : `${plYear}`;
              setNewStmt({
                statementType: 'Profit & Loss',
                period: periodStr,
                totalIncome: totalRev,
                totalExpense: totalExp,
                netAmount: netIncome,
                status: 'Generated'
              });
              setStmtModalOpen(true);
            }} className="btn-primary text-xs flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Generate & Log Statement
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="theme-card p-5">
              <h3 className="text-sm font-semibold text-main mb-4">Income Statement ({plPeriod === 'month' ? new Date(plYear, plMonth-1).toLocaleString('default', { month: 'long', year: 'numeric' }) : plPeriod === 'quarter' ? `Q${plQuarter} ${plYear}` : plYear})</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted">Total Revenue</span><span className="text-emerald-400 font-data">₹{totalRev.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted">Total Expenses</span><span className="text-rose-400 font-data">₹{totalExp.toLocaleString('en-IN')}</span></div>
                <div className="h-px border-t border-main/70 my-2" />
                <div className="flex justify-between text-sm font-bold"><span className="text-main">Net Income</span><span className={`font-data ${netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>₹{netIncome.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted">Gross Margin</span><span className="text-sky-400 font-data">{totalRev > 0 ? ((netIncome / totalRev) * 100).toFixed(1) : 0}%</span></div>
              </div>
            </div>
            <div className="theme-card p-5">
              <h3 className="text-sm font-semibold text-main mb-4">Balance Sheet ({plYear})</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted">Total Assets</span><span className="text-sky-400 font-data">₹{totalAssets.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted">Total Liabilities</span><span className="text-rose-400 font-data">₹{totalLiab.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted">Total Equity</span><span className="text-violet-400 font-data">₹{totalEquity.toLocaleString('en-IN')}</span></div>
                <div className="h-px border-t border-main/70 my-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Assets = Liab + Equity?</span>
                  <span className={Math.abs(totalAssets - (totalLiab + totalEquity)) < 1 ? 'text-emerald-400' : 'text-rose-400'}>
                    {Math.abs(totalAssets - (totalLiab + totalEquity)) < 1 ? '✓ Balanced' : '✗ Imbalanced'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="theme-card overflow-hidden">
            <div className="px-4 py-3 border-b border-main">
              <h3 className="text-sm font-semibold text-main">Saved Financial Statements ({statements.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-muted border-b border-main bg-surface">
                    <th className="px-4 py-2.5">Statement Type</th>
                    <th className="px-4 py-2.5">Period</th>
                    <th className="px-4 py-2.5 text-right">Total Income</th>
                    <th className="px-4 py-2.5 text-right">Total Expense</th>
                    <th className="px-4 py-2.5 text-right">Net Profit / Loss</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {statements.map((stmt) => (
                    <tr key={stmt.id} className="border-b border-main/50 hover:bg-surface/50 transition-colors">
                      <td className="px-4 py-2.5 text-sm font-semibold text-main">{stmt.statementType}</td>
                      <td className="px-4 py-2.5 text-xs text-muted">{stmt.period}</td>
                      <td className="px-4 py-2.5 text-right text-sm font-data text-emerald-400">₹{(stmt.totalIncome || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2.5 text-right text-sm font-data text-rose-400">₹{(stmt.totalExpense || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2.5 text-right text-sm font-data font-bold text-main">
                        <span className={stmt.netAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          ₹{(stmt.netAmount || 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          stmt.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' :
                          stmt.status === 'Audited' ? 'bg-indigo-500/10 text-indigo-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>{stmt.status}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-2">
                          {stmt.status === 'Generated' && (
                            <button onClick={() => handleUpdateStatementStatus(stmt.id, 'Audited')} className="text-xs text-indigo-400 hover:underline">
                              Audit
                            </button>
                          )}
                          {stmt.status === 'Audited' && (
                            <button onClick={() => handleUpdateStatementStatus(stmt.id, 'Approved')} className="text-xs text-emerald-400 hover:underline">
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      <Modal isOpen={acctModalOpen} onClose={() => setAcctModalOpen(false)} title="New Account">
        <div className="space-y-4">
          <div><label className="form-label">Account Code</label><input className="form-input" value={newAcct.code} onChange={e => setNewAcct({...newAcct, code: e.target.value})} placeholder="e.g. 1010" /></div>
          <div><label className="form-label">Account Name</label><input className="form-input" value={newAcct.name} onChange={e => setNewAcct({...newAcct, name: e.target.value})} placeholder="e.g. Cash Account" /></div>
          <div><label className="form-label">Type</label>
            <select className="form-input" value={newAcct.type} onChange={e => setNewAcct({...newAcct, type: e.target.value})}>
              {['ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="form-label">Opening Balance (₹)</label><input type="number" className="form-input" value={newAcct.balance} onChange={e => setNewAcct({...newAcct, balance: e.target.value})} /></div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setAcctModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Cancel</button>
            <button onClick={handleAddAccount} disabled={isSubmitting} className="btn-primary text-sm">
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Journal Modal */}
      <Modal isOpen={journalModalOpen} onClose={() => setJournalModalOpen(false)} title="New Journal Entry">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={newJournal.date} onChange={e => setNewJournal({...newJournal, date: e.target.value})} />
            </div>
            <div>
              <label className="form-label">Reference No</label>
              <input type="text" className="form-input" placeholder="e.g. REF-1001" value={newJournal.referenceNo} onChange={e => setNewJournal({...newJournal, referenceNo: e.target.value})} />
            </div>
          </div>
          <div><label className="form-label">Debit Account</label>
            <select className="form-input" value={newJournal.debitAcc} onChange={e => setNewJournal({...newJournal, debitAcc: e.target.value})}>
              <option value="">Select account...</option>
              {accounts.map(a => <option key={a.id} value={a.name}>{a.code} — {a.name}</option>)}
            </select>
          </div>
          <div><label className="form-label">Credit Account</label>
            <select className="form-input" value={newJournal.creditAcc} onChange={e => setNewJournal({...newJournal, creditAcc: e.target.value})}>
              <option value="">Select account...</option>
              {accounts.map(a => <option key={a.id} value={a.name}>{a.code} — {a.name}</option>)}
            </select>
          </div>
          <div><label className="form-label">Amount (₹)</label><input type="number" className="form-input" value={newJournal.amount} onChange={e => setNewJournal({...newJournal, amount: e.target.value})} /></div>
          <div><label className="form-label">Description</label><textarea className="form-input" rows={2} value={newJournal.narration} onChange={e => setNewJournal({...newJournal, narration: e.target.value})} /></div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setJournalModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Cancel</button>
            <button onClick={handleAddJournal} disabled={isSubmitting} className="btn-primary text-sm">
              {isSubmitting ? 'Recording...' : 'Record Entry'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Invoice Modal */}
      <Modal isOpen={invoiceModalOpen} onClose={() => setInvoiceModalOpen(false)} title="New Invoice">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Invoice No</label>
              <input type="text" className="form-input" placeholder="e.g. INV-1001" value={newInv.invoiceNo} onChange={e => setNewInv({...newInv, invoiceNo: e.target.value})} />
            </div>
            <div>
              <label className="form-label">Client Name</label>
              <input type="text" className="form-input" placeholder="Client name" value={newInv.customerName} onChange={e => setNewInv({...newInv, customerName: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Invoice Date</label>
              <input type="date" className="form-input" value={newInv.invoiceDate} onChange={e => setNewInv({...newInv, invoiceDate: e.target.value})} />
            </div>
            <div>
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={newInv.dueDate} onChange={e => setNewInv({...newInv, dueDate: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Amount (Subtotal ₹)</label>
              <input type="number" className="form-input" value={newInv.subtotal} onChange={e => setNewInv({...newInv, subtotal: e.target.value})} />
            </div>
            <div>
              <label className="form-label">Tax Rate (%)</label>
              <input type="number" className="form-input" value={newInv.taxRate} onChange={e => setNewInv({...newInv, taxRate: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-input" value={newInv.status} onChange={e => setNewInv({...newInv, status: e.target.value})}>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setInvoiceModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Cancel</button>
            <button onClick={handleAddInvoice} disabled={isSubmitting} className="btn-primary text-sm">
              {isSubmitting ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Budget Modal */}
      <Modal isOpen={budgetModalOpen} onClose={() => setBudgetModalOpen(false)} title="New Budget">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Budget Name</label>
              <input type="text" className="form-input" placeholder="e.g. Q3 Marketing Campaign" value={newBudget.budgetName} onChange={e => setNewBudget({...newBudget, budgetName: e.target.value})} />
            </div>
            <div>
              <label className="form-label">Category</label>
              <input type="text" className="form-input" placeholder="e.g. Marketing" value={newBudget.category} onChange={e => setNewBudget({...newBudget, category: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Allocated Amount (₹)</label>
              <input type="number" className="form-input" value={newBudget.amount} onChange={e => setNewBudget({...newBudget, amount: e.target.value})} />
            </div>
            <div>
              <label className="form-label">Spent Amount (₹)</label>
              <input type="number" className="form-input" value={newBudget.spent} onChange={e => setNewBudget({...newBudget, spent: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Period</label>
              <select className="form-input" value={newBudget.period} onChange={e => setNewBudget({...newBudget, period: e.target.value})}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="form-label">Year</label>
              <input type="number" className="form-input" value={newBudget.year} onChange={e => setNewBudget({...newBudget, year: parseInt(e.target.value) || 2026})} />
            </div>
          </div>
          {newBudget.period === 'monthly' && (
            <div><label className="form-label">Month</label>
              <select className="form-input" value={newBudget.month} onChange={e => setNewBudget({...newBudget, month: parseInt(e.target.value)})}>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{new Date(2026, m-1).toLocaleString('default', { month: 'long' })}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setBudgetModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Cancel</button>
            <button onClick={handleAddBudget} disabled={isSubmitting} className="btn-primary text-sm">
              {isSubmitting ? 'Creating...' : 'Create Budget'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Expense Modal */}
      <Modal isOpen={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} title="Log Expense">
        <div className="space-y-4">
          <div><label className="form-label">Description</label><input className="form-input" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} placeholder="Expense description" /></div>
          <div><label className="form-label">Category</label>
            <select className="form-input" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})}>
              <option value="">Select category...</option>
              <option value="Operations">Operations</option>
              <option value="IT">IT</option>
              <option value="Marketing">Marketing</option>
              <option value="Travel">Travel</option>
              <option value="Supplies">Supplies</option>
              <option value="Utilities">Utilities</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Amount (₹)</label>
              <input type="number" className="form-input" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} />
            </div>
            <div>
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Paid By</label>
              <input type="text" className="form-input" placeholder="e.g. Employee name" value={newExpense.paidBy} onChange={e => setNewExpense({...newExpense, paidBy: e.target.value})} />
            </div>
            <div>
              <label className="form-label">Receipt Status</label>
              <select className="form-input" value={newExpense.receiptStatus} onChange={e => setNewExpense({...newExpense, receiptStatus: e.target.value})}>
                <option value="Pending">Pending</option>
                <option value="Attached">Attached</option>
                <option value="Missing">Missing</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setExpenseModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Cancel</button>
            <button onClick={handleAddExpense} disabled={isSubmitting} className="btn-primary text-sm">
              {isSubmitting ? 'Logging...' : 'Log Expense'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Approval Modal */}
      <Modal isOpen={approvalModalOpen} onClose={() => setApprovalModalOpen(false)} title="New Approval Request">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Request No</label>
              <input type="text" className="form-input" placeholder="e.g. REQ-1001" value={newApproval.requestNo} onChange={e => setNewApproval({...newApproval, requestNo: e.target.value})} />
            </div>
            <div>
              <label className="form-label">Request Type</label>
              <select className="form-input" value={newApproval.type} onChange={e => setNewApproval({...newApproval, type: e.target.value})}>
                <option value="PAYMENT">Payment</option>
                <option value="EXPENSE">Expense Approval</option>
                <option value="PURCHASE">Purchase Approval</option>
                <option value="TRAVEL">Travel Request</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Requested By</label>
              <input type="text" className="form-input" placeholder="Requester name/email" value={newApproval.requester} onChange={e => setNewApproval({...newApproval, requester: e.target.value})} />
            </div>
            <div>
              <label className="form-label">Amount (₹)</label>
              <input type="number" className="form-input" value={newApproval.amount} onChange={e => setNewApproval({...newApproval, amount: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={newApproval.date} onChange={e => setNewApproval({...newApproval, date: e.target.value})} />
          </div>
          <div>
            <label className="form-label">Reason / Justification</label>
            <textarea className="form-input" rows={3} placeholder="Please provide details..." value={newApproval.reason} onChange={e => setNewApproval({...newApproval, reason: e.target.value})} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setApprovalModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Cancel</button>
            <button onClick={handleAddApproval} disabled={isSubmitting} className="btn-primary text-sm">
              {isSubmitting ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Tax Modal */}
      <Modal isOpen={taxModalOpen} onClose={() => setTaxModalOpen(false)} title="New Tax Deadline">
        <div className="space-y-4">
          <div>
            <label className="form-label">Tax Name</label>
            <input type="text" className="form-input" placeholder="e.g. Q2 GST Return Filing" value={newTax.taxName} onChange={e => setNewTax({...newTax, taxName: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Tax Type</label>
              <select className="form-input" value={newTax.taxType} onChange={e => setNewTax({...newTax, taxType: e.target.value})}>
                <option value="GST">GST</option>
                <option value="VAT">VAT</option>
                <option value="TDS">TDS</option>
                <option value="INCOME_TAX">Income Tax</option>
                <option value="CORPORATE_TAX">Corporate Tax</option>
              </select>
            </div>
            <div>
              <label className="form-label">Rate (%)</label>
              <input type="number" className="form-input" value={newTax.rate} onChange={e => setNewTax({...newTax, rate: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Applicable On</label>
              <input type="text" className="form-input" placeholder="e.g. Sales, Services" value={newTax.applicableOn} onChange={e => setNewTax({...newTax, applicableOn: e.target.value})} />
            </div>
            <div>
              <label className="form-label">Period</label>
              <select className="form-input" value={newTax.period} onChange={e => setNewTax({...newTax, period: e.target.value})}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Effective Date</label>
              <input type="date" className="form-input" value={newTax.effectiveDate} onChange={e => setNewTax({...newTax, effectiveDate: e.target.value})} />
            </div>
            <div>
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={newTax.dueDate} onChange={e => setNewTax({...newTax, dueDate: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-input" value={newTax.status} onChange={e => setNewTax({...newTax, status: e.target.value})}>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setTaxModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Cancel</button>
            <button onClick={handleAddTax} disabled={isSubmitting} className="btn-primary text-sm">
              {isSubmitting ? 'Creating...' : 'Create Tax Deadline'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Statement Modal */}
      <Modal isOpen={stmtModalOpen} onClose={() => setStmtModalOpen(false)} title="Log Statement Record">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Statement Type</label>
              <select className="form-input" value={newStmt.statementType} onChange={e => setNewStmt({...newStmt, statementType: e.target.value})}>
                <option value="Profit & Loss">Profit & Loss</option>
                <option value="Balance Sheet">Balance Sheet</option>
                <option value="Cash Flow">Cash Flow</option>
                <option value="Trial Balance">Trial Balance</option>
              </select>
            </div>
            <div>
              <label className="form-label">Period</label>
              <input type="text" className="form-input" placeholder="e.g. June 2026" value={newStmt.period} onChange={e => setNewStmt({...newStmt, period: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="form-label">Total Income (₹)</label>
              <input type="number" className="form-input" value={newStmt.totalIncome} onChange={e => {
                const inc = parseFloat(e.target.value) || 0;
                setNewStmt({...newStmt, totalIncome: inc, netAmount: inc - newStmt.totalExpense});
              }} />
            </div>
            <div>
              <label className="form-label">Total Expense (₹)</label>
              <input type="number" className="form-input" value={newStmt.totalExpense} onChange={e => {
                const exp = parseFloat(e.target.value) || 0;
                setNewStmt({...newStmt, totalExpense: exp, netAmount: newStmt.totalIncome - exp});
              }} />
            </div>
            <div>
              <label className="form-label">Net Profit/Loss</label>
              <input type="number" className="form-input bg-surface border-none" value={newStmt.netAmount} readOnly />
            </div>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-input" value={newStmt.status} onChange={e => setNewStmt({...newStmt, status: e.target.value})}>
              <option value="Generated">Generated</option>
              <option value="Audited">Audited</option>
              <option value="Approved">Approved</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setStmtModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Cancel</button>
            <button onClick={handleAddStatement} disabled={isSubmitting} className="btn-primary text-sm">
              {isSubmitting ? 'Logging...' : 'Log Statement'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}