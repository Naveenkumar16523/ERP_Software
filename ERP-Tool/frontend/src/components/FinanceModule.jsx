import React, { useState } from 'react';
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
import Modal from './ui/Modal';

export default function FinanceModule() {
  const {
    accounts,
    addAccount,
    journalEntries,
    addJournalEntry,
    invoices,
    addInvoice,
    updateInvoiceStatus,
    addNotification,
    addToast
  } = useERPStore();

  const [activeTab, setActiveTab] = useState('accounts');
  const [acctModalOpen, setAcctModalOpen] = useState(false);
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const [newAcct, setNewAcct] = useState({ code: '', name: '', type: 'ASSET', balance: 0 });
  const [newJournal, setNewJournal] = useState({ debitAcc: '', creditAcc: '', amount: 0, narration: '' });
  const [newInv, setNewInv] = useState({ customerName: '', totalAmount: 0 });
  const [ledgerStatus, setLedgerStatus] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

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

  const handleAddAccount = () => {
    if (!newAcct.code || !newAcct.name) return addToast('Account code and name are required', 'error');
    addAccount({ ...newAcct, balance: parseFloat(newAcct.balance) || 0 });
    addToast('Account created successfully', 'success');
    addNotification(`New account "${newAcct.name}" added to ledger`);
    setNewAcct({ code: '', name: '', type: 'ASSET', balance: 0 });
    setAcctModalOpen(false);
  };

  const handleAddJournal = () => {
    if (!newJournal.debitAcc || !newJournal.creditAcc || !newJournal.amount) {
      return addToast('All journal fields are required', 'error');
    }
    addJournalEntry({ ...newJournal, amount: parseFloat(newJournal.amount) });
    addToast('Journal entry recorded', 'success');
    setNewJournal({ debitAcc: '', creditAcc: '', amount: 0, narration: '' });
    setJournalModalOpen(false);
  };

  const handleAddInvoice = () => {
    if (!newInv.customerName || !newInv.totalAmount) return addToast('Customer name and amount required', 'error');
    addInvoice({ ...newInv, totalAmount: parseFloat(newInv.totalAmount), invoiceNo: `INV-${Date.now()}` });
    addToast('Invoice created', 'success');
    setNewInv({ customerName: '', totalAmount: 0 });
    setInvoiceModalOpen(false);
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
    { id: 'statements', label: 'Statements', icon: TrendingUp }
  ];

  const TYPE_COLORS = { ASSET: 'text-sky-400', LIABILITY: 'text-rose-400', EQUITY: 'text-violet-400', REVENUE: 'text-emerald-400', EXPENSE: 'text-amber-400' };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Finance & Accounting</h1>
          <p className="text-sm text-muted mt-1">Blockchain-secured general ledger & financial statements</p>
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
              <p className={`text-lg font-bold mt-1 font-data ${card.color}`}>₹{card.value.toLocaleString('en-IN')}</p>
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
            <button onClick={() => setAcctModalOpen(true)} className="btn-primary text-xs flex items-center gap-1.5">
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
                    <td className="px-4 py-2.5 text-right text-sm font-data font-semibold text-main">₹{acc.balance.toLocaleString('en-IN')}</td>
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
            <button onClick={() => setJournalModalOpen(true)} className="btn-primary text-xs flex items-center gap-1.5">
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
                    <td className="px-4 py-2.5 text-right text-sm font-data font-semibold text-main">₹{je.amount.toLocaleString('en-IN')}</td>
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
            <button onClick={() => setInvoiceModalOpen(true)} className="btn-primary text-xs flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> New Invoice
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-muted border-b border-main bg-surface">
                  <th className="px-4 py-2.5">Invoice No</th>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                  <th className="px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-main/50 hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-indigo-400">{inv.invoiceNo}</td>
                    <td className="px-4 py-2.5 text-sm text-main">{inv.customerName}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' :
                        inv.status === 'OVERDUE' ? 'bg-rose-500/10 text-rose-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>{inv.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm font-data font-semibold text-main">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5">
                      {inv.status === 'PENDING' && (
                        <button onClick={() => { updateInvoiceStatus(inv.id, 'PAID'); addToast('Invoice marked as paid', 'success'); }}
                          className="text-xs text-emerald-400 hover:underline">
                          Mark Paid
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

      {activeTab === 'statements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="theme-card p-5">
            <h3 className="text-sm font-semibold text-main mb-4">Income Statement</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted">Total Revenue</span><span className="text-emerald-400 font-data">₹{totalRev.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted">Total Expenses</span><span className="text-rose-400 font-data">₹{totalExp.toLocaleString('en-IN')}</span></div>
              <div className="h-px border-t border-main/70 my-2" />
              <div className="flex justify-between text-sm font-bold"><span className="text-main">Net Income</span><span className={`font-data ${netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>₹{netIncome.toLocaleString('en-IN')}</span></div>
            </div>
          </div>
          <div className="theme-card p-5">
            <h3 className="text-sm font-semibold text-main mb-4">Balance Sheet</h3>
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
            <button onClick={() => setAcctModalOpen(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAddAccount} className="btn-primary text-sm">Create Account</button>
          </div>
        </div>
      </Modal>

      {/* Add Journal Modal */}
      <Modal isOpen={journalModalOpen} onClose={() => setJournalModalOpen(false)} title="New Journal Entry">
        <div className="space-y-4">
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
          <div><label className="form-label">Narration</label><textarea className="form-input" rows={2} value={newJournal.narration} onChange={e => setNewJournal({...newJournal, narration: e.target.value})} /></div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setJournalModalOpen(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAddJournal} className="btn-primary text-sm">Record Entry</button>
          </div>
        </div>
      </Modal>

      {/* Add Invoice Modal */}
      <Modal isOpen={invoiceModalOpen} onClose={() => setInvoiceModalOpen(false)} title="New Invoice">
        <div className="space-y-4">
          <div><label className="form-label">Customer Name</label><input className="form-input" value={newInv.customerName} onChange={e => setNewInv({...newInv, customerName: e.target.value})} placeholder="Customer name" /></div>
          <div><label className="form-label">Total Amount (₹)</label><input type="number" className="form-input" value={newInv.totalAmount} onChange={e => setNewInv({...newInv, totalAmount: e.target.value})} /></div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setInvoiceModalOpen(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAddInvoice} className="btn-primary text-sm">Create Invoice</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}