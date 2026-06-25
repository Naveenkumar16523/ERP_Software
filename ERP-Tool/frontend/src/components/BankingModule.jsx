import React, { useState, useEffect } from 'react';
import { Plus, CreditCard, TrendingUp, Wallet, RefreshCw, CheckCircle } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import { api } from '../utils/api';
import Modal from './ui/Modal';

export default function BankingModule() {
  const { addToast } = useERPStore();
  const [activeTab, setActiveTab] = useState('accounts');
  
  const [bankingAccounts, setBankingAccounts] = useState([]);
  const [bankingTransactions, setBankingTransactions] = useState([]);

  // Modals
  const [accountModal, setAccountModal] = useState(false);
  const [transactionModal, setTransactionModal] = useState(false);
  
  const [accountForm, setAccountForm] = useState({ accountName: '', accountNumber: '', bankName: '', balance: 0, currency: 'USD' });
  const [txForm, setTxForm] = useState({ accountId: '', description: '', amount: 0, type: 'CREDIT' });

  const loadData = async () => {
    try {
      const [accts, txs] = await Promise.all([
        api.banking.getAccounts(),
        api.banking.getTransactions()
      ]);
      setBankingAccounts(accts || []);
      setBankingTransactions(txs || []);
    } catch (err) {
      console.error('Error fetching banking data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalBalance = bankingAccounts.reduce((s, a) => s + (a.balance || 0), 0);

  const handleCreateAccount = async () => {
    if (!accountForm.accountName || !accountForm.accountNumber) return addToast('Name and Number required', 'error');
    try {
      await api.banking.createAccount(accountForm);
      addToast('Account created successfully', 'success');
      setAccountModal(false);
      setAccountForm({ accountName: '', accountNumber: '', bankName: '', balance: 0, currency: 'USD' });
      loadData();
    } catch(err) {
      addToast(err.message, 'error');
    }
  };

  const handlePostTransaction = async () => {
    if (!txForm.accountId || !txForm.amount) return addToast('All fields required', 'error');
    const amountVal = txForm.type === 'DEBIT' ? -Math.abs(txForm.amount) : Math.abs(txForm.amount);
    
    const payload = { 
      accountId: txForm.accountId,
      description: txForm.description,
      amount: amountVal, 
      transactionDate: new Date().toISOString()
    };
    
    try {
      await api.banking.createTransaction(payload);
      addToast(`Transaction posted: ₹${Math.abs(amountVal).toLocaleString('en-IN')}`, 'success');
      setTransactionModal(false);
      setTxForm({ accountId: '', description: '', amount: 0, type: 'CREDIT' });
      loadData();
    } catch(err) {
      addToast(err.message, 'error');
    }
  };

  const handleAutoReconcile = async () => {
    try {
      const res = await api.banking.autoReconcile();
      addToast(res.message || 'Reconciliation complete', 'success');
      loadData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const TABS = [
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'transactions', label: 'Transactions', icon: CreditCard }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Banking & Reconciliation</h1>
          <p className="text-sm text-muted mt-1">Manage accounts and auto-reconcile transactions with invoices.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setAccountModal(true)} className="btn-secondary text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Account
          </button>
          <button onClick={() => setTransactionModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Post Transaction
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Balance', value: `₹${totalBalance.toLocaleString('en-IN')}`, color: 'text-emerald-400' },
          { label: 'Bank Accounts', value: bankingAccounts.length, color: 'text-indigo-400' },
          { label: 'Unreconciled Txns', value: bankingTransactions.filter(tx => !tx.reconciled).length, color: 'text-rose-400' },
          { label: 'Reconciled Txns', value: bankingTransactions.filter(tx => tx.reconciled).length, color: 'text-sky-400' },
        ].map(s => (
          <div key={s.label} className="theme-card p-4">
            <p className="text-xs text-dimmed">{s.label}</p>
            <p className={`text-xl font-bold mt-1 font-data ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface p-1 rounded-xl w-fit border border-main">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-muted hover:text-main'}`}>
              <Icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'accounts' && (
        <div className="theme-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Account Name</th>
                <th className="px-4 py-2.5">Bank</th>
                <th className="px-4 py-2.5">Account No</th>
                <th className="px-4 py-2.5 text-right">Balance</th>
              </tr></thead>
              <tbody>
                {bankingAccounts.map(acc => (
                  <tr key={acc.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{acc.accountName}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{acc.bankName}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-indigo-400">{acc.accountNumber}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{acc.balance.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main flex justify-between items-center bg-surface/30">
            <h3 className="text-sm font-semibold text-main">Transaction Ledger</h3>
            <button onClick={handleAutoReconcile} className="btn-secondary text-xs flex items-center gap-1.5 py-1">
              <RefreshCw className="w-3.5 h-3.5" /> Auto-Reconcile with Invoices
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Account</th>
                <th className="px-4 py-2.5">Description</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="px-4 py-2.5">Status</th>
              </tr></thead>
              <tbody>
                {bankingTransactions.map(tx => {
                  const acc = bankingAccounts.find(a => a.id === tx.accountId);
                  return (
                    <tr key={tx.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-muted">{new Date(tx.transactionDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5 text-xs text-main">{acc ? acc.accountName : '—'}</td>
                      <td className="px-4 py-2.5 text-sm text-main">{tx.description}</td>
                      <td className="px-4 py-2.5 text-right text-sm font-data font-bold">
                        {tx.amount >= 0 ? '+' : ''}₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2.5">
                        {tx.reconciled ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full w-fit">
                            <CheckCircle className="w-3 h-3" /> Reconciled
                          </span>
                        ) : (
                          <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full w-fit">
                            Unreconciled
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={accountModal} onClose={() => setAccountModal(false)} title="New Bank Account">
        <div className="space-y-4">
          <div><label className="form-label">Account Name</label>
            <input className="form-input" value={accountForm.accountName} onChange={e => setAccountForm({...accountForm, accountName: e.target.value})} placeholder="e.g. Operating Account" />
          </div>
          <div><label className="form-label">Bank Name</label>
            <input className="form-input" value={accountForm.bankName} onChange={e => setAccountForm({...accountForm, bankName: e.target.value})} placeholder="e.g. HDFC Bank" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Account Number</label>
              <input className="form-input" value={accountForm.accountNumber} onChange={e => setAccountForm({...accountForm, accountNumber: e.target.value})} />
            </div>
            <div><label className="form-label">Initial Balance (₹)</label>
              <input type="number" className="form-input" value={accountForm.balance} onChange={e => setAccountForm({...accountForm, balance: parseInt(e.target.value) || 0})} />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setAccountModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleCreateAccount} className="btn-primary text-sm">Create Account</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={transactionModal} onClose={() => setTransactionModal(false)} title="Post Bank Transaction">
        <div className="space-y-4">
          <div><label className="form-label">Account</label>
            <select className="form-input" value={txForm.accountId} onChange={e => setTxForm({...txForm, accountId: e.target.value})}>
              <option value="">Select account...</option>
              {bankingAccounts.map(a => <option key={a.id} value={a.id}>{a.accountName} ({a.bankName})</option>)}
            </select>
          </div>
          <div><label className="form-label">Description</label>
            <input className="form-input" value={txForm.description} onChange={e => setTxForm({...txForm, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Amount (₹)</label>
              <input type="number" className="form-input" value={txForm.amount} onChange={e => setTxForm({...txForm, amount: e.target.value})} />
            </div>
            <div><label className="form-label">Type</label>
              <select className="form-input" value={txForm.type} onChange={e => setTxForm({...txForm, type: e.target.value})}>
                <option value="CREDIT">Deposit (+)</option>
                <option value="DEBIT">Withdrawal (-)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setTransactionModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handlePostTransaction} className="btn-primary text-sm">Post</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}