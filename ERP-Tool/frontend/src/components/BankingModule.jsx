import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';

export default function BankingModule() {
  const { bankingAccounts, bankingTransactions, bankingLoans, postBankingTransaction, addToast } = useERPStore();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ accountId: '', description: '', amount: 0, type: 'CREDIT' });

  const totalBalance = bankingAccounts.reduce((s, a) => s + (a.balance || 0), 0);
  const totalOutstanding = bankingLoans.reduce((s, l) => s + (l.outstanding || 0), 0);

  const handlePost = () => {
    if (!form.accountId || !form.amount) return addToast('All fields required', 'error');
    postBankingTransaction({ ...form, amount: parseFloat(form.amount) });
    addToast(`Transaction posted: ₹${parseFloat(form.amount).toLocaleString('en-IN')}`, 'success');
    setModal(false);
    setForm({ accountId: '', description: '', amount: 0, type: 'CREDIT' });
  };

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

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bankingAccounts.map(acc => (
          <div key={acc.id} className="theme-card p-5 hover:border-indigo-500/40 transition-all cursor-default">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-dimmed">{acc.bank}</p>
                <p className="text-sm font-semibold text-main">{acc.name}</p>
                <p className="text-xs font-mono text-dimmed mt-0.5">{acc.accountNo}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                acc.type === 'FD' ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' :
                acc.type === 'SAVINGS' ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' :
                'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}>{acc.type}</span>
            </div>
            <p className="text-2xl font-bold font-data text-main">₹{acc.balance.toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Recent Transactions */}
        <div className="theme-card p-5">
          <h3 className="text-sm font-semibold text-main mb-4">Recent Transactions</h3>
          <div className="space-y-2">
            {bankingTransactions.slice(0, 5).map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-main last:border-0">
                <div>
                  <p className="text-xs font-medium text-main">{tx.description}</p>
                  <p className="text-[10px] text-dimmed">{tx.date}</p>
                </div>
                <span className={`text-sm font-data font-bold ${tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {tx.type === 'CREDIT' ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
            {bankingTransactions.length === 0 && (
              <p className="text-xs text-dimmed text-center py-4">No transactions yet</p>
            )}
          </div>
        </div>

        {/* Active Loans */}
        <div className="theme-card p-5">
          <h3 className="text-sm font-semibold text-main mb-4">Active Loans</h3>
          <div className="space-y-4">
            {bankingLoans.map(loan => {
              const pct = Math.round((loan.outstanding / loan.principal) * 100);
              return (
                <div key={loan.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">{loan.type} — {loan.lender}</span>
                    <span className="text-rose-400 font-data font-semibold">₹{loan.outstanding.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full border border-main/30">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-dimmed">EMI: ₹{loan.emi.toLocaleString()} · Next due: {loan.nextDue}</p>
                </div>
              );
            })}
            {bankingLoans.length === 0 && (
              <p className="text-xs text-dimmed text-center py-4">No active loans</p>
            )}
          </div>
        </div>
      </div>

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