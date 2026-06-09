import React, { useState, useEffect } from 'react';
import { Plus, CreditCard, TrendingUp, Wallet } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import { api } from '../utils/api';
import Modal from './ui/Modal';

export default function BankingModule() {
  const {
    bankingAccounts, setBankingAccounts, addBankingAccount,
    bankingTransactions, setBankingTransactions, addBankingTransaction,
    bankingLoans, setBankingLoans, addBankingLoan,
    addToast
  } = useERPStore();
  const [activeTab, setActiveTab] = useState('accounts');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ accountId: '', description: '', amount: 0, type: 'CREDIT' });

  // Fetch banking data from DB on mount
  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const [accts, txs, loans] = await Promise.all([
          api.banking.getAccounts(),
          api.banking.getTransactions(),
          api.banking.getLoans()
        ]);
        if (active) {
          if (Array.isArray(accts)) setBankingAccounts(accts);
          if (Array.isArray(txs)) setBankingTransactions(txs);
          if (Array.isArray(loans)) setBankingLoans(loans);
        }
      } catch (err) {
        console.error('Error fetching banking data:', err);
      }
    };
    fetchData();
    return () => { active = false; };
  }, [setBankingAccounts, setBankingTransactions, setBankingLoans]);

  const totalBalance = bankingAccounts.reduce((s, a) => s + (a.balance || 0), 0);
  const totalOutstanding = bankingLoans.reduce((s, l) => s + (l.outstanding || 0), 0);

  const handlePost = async () => {
    if (!form.accountId || !form.amount) return addToast('All fields required', 'error');
    const payload = { ...form, amount: parseFloat(form.amount), date: new Date().toISOString().split('T')[0] };
    try {
      const saved = await api.banking.createTransaction(payload);
      addBankingTransaction(saved || payload);
      addToast(`Transaction posted: ₹${parseFloat(form.amount).toLocaleString('en-IN')}`, 'success');
    } catch {
      addBankingTransaction(payload);
      addToast('Transaction saved locally', 'info');
    }
    setModal(false);
    setForm({ accountId: '', description: '', amount: 0, type: 'CREDIT' });
  };

  const TABS = [
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'loans', label: 'Loans', icon: TrendingUp }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Banking & Treasury</h1>
          <p className="text-sm text-muted mt-1">Bank accounts, transactions and loan management</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Post Transaction
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Balance', value: `₹${totalBalance.toLocaleString('en-IN')}`, color: 'text-emerald-400' },
          { label: 'Accounts', value: bankingAccounts.length, color: 'text-indigo-400' },
          { label: 'Outstanding Loans', value: `₹${totalOutstanding.toLocaleString('en-IN')}`, color: 'text-rose-400' },
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
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Bank Accounts ({bankingAccounts.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Account Name</th>
                <th className="px-4 py-2.5">Bank</th>
                <th className="px-4 py-2.5">Account No</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5 text-right">Balance</th>
              </tr></thead>
              <tbody>
                {bankingAccounts.map(acc => (
                  <tr key={acc.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{acc.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{acc.bank}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-indigo-400">{acc.accountNo}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${acc.type === 'FD' ? 'bg-violet-500/10 text-violet-400' : acc.type === 'SAVINGS' ? 'bg-sky-500/10 text-sky-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {acc.type}
                      </span>
                    </td>
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
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Transactions ({bankingTransactions.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Description</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
              </tr></thead>
              <tbody>
                {bankingTransactions.map(tx => (
                  <tr key={tx.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-muted">{tx.date}</td>
                    <td className="px-4 py-2.5 text-sm text-main">{tx.description}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{tx.category}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tx.type === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm font-data font-bold">{tx.type === 'CREDIT' ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'loans' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Loans ({bankingLoans.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Loan No</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Lender</th>
                <th className="px-4 py-2.5 text-right">Principal</th>
                <th className="px-4 py-2.5 text-right">Outstanding</th>
                <th className="px-4 py-2.5 text-right">EMI</th>
                <th className="px-4 py-2.5">Next Due</th>
                <th className="px-4 py-2.5">Status</th>
              </tr></thead>
              <tbody>
                {bankingLoans.map(loan => (
                  <tr key={loan.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-indigo-400">{loan.loanNo}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{loan.type}</td>
                    <td className="px-4 py-2.5 text-sm text-main">{loan.lender}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{loan.principal.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-rose-400">₹{loan.outstanding.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">₹{loan.emi.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{loan.nextDue}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${loan.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {loan.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Post Bank Transaction">
        <div className="space-y-4">
          <div><label className="form-label">Account</label>
            <select className="form-input" value={form.accountId} onChange={e => setForm({...form, accountId: e.target.value})}>
              <option value="">Select account...</option>
              {bankingAccounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.bank})</option>)}
            </select>
          </div>
          <div><label className="form-label">Description</label>
            <input className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Amount (₹)</label>
              <input type="number" className="form-input" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
            </div>
            <div><label className="form-label">Type</label>
              <select className="form-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="CREDIT">Credit (+)</option>
                <option value="DEBIT">Debit (-)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handlePost} className="btn-primary text-sm">Post</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}