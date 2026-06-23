import React, { useState } from 'react';
import { RefreshCw, Database } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';

export default function MigrationHub() {
  const { migrationJobs, startMigrationJob, addToast } = useERPStore();

  const TEMPLATES = [
    { id: 'sap', label: 'SAP to CLARIX', desc: 'Migrate from SAP ECC/S4HANA', icon: '🏭', fields: ['Chart of Accounts', 'Vendors', 'Customers', 'Open POs'] },
    { id: 'tally', label: 'Tally to CLARIX', desc: 'Import from Tally Prime / Gold', icon: '📒', fields: ['Ledgers', 'Stock Items', 'Vouchers', 'Party Masters'] },
    { id: 'odoo', label: 'Odoo to CLARIX', desc: 'Migrate from Odoo 14/15/16', icon: '🔧', fields: ['Products', 'Contacts', 'Sales Orders', 'Invoices'] },
    { id: 'csv', label: 'CSV / Excel Import', desc: 'Bulk import from flat files', icon: '📊', fields: ['Any tabular data'] }
  ];

  const handleStartJob = (templateId) => {
    startMigrationJob({ templateId, status: 'RUNNING', progress: 0, jobNo: `MIG-${Date.now()}` });
    addToast(`Migration job ${templateId.toUpperCase()} started`, 'success');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-main">Data Migration Hub</h1>
        <p className="text-sm text-muted mt-1">Migrate from SAP, Tally, Odoo, or any CSV/Excel source</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Migration Jobs', value: migrationJobs.length, color: 'text-indigo-400' },
          { label: 'Completed', value: migrationJobs.filter(j => j.status === 'COMPLETED').length, color: 'text-emerald-400' },
          { label: 'Running', value: migrationJobs.filter(j => j.status === 'RUNNING').length, color: 'text-amber-400' },
          { label: 'Failed', value: migrationJobs.filter(j => j.status === 'FAILED').length, color: 'text-rose-400' }
        ].map(s => (
          <div key={s.label} className="theme-card p-4">
            <p className="text-xs text-dimmed">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 font-data ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Migration Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEMPLATES.map(t => (
          <div key={t.id} className="theme-card p-5 hover:ring-1 hover:ring-indigo-500/30 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-main">{t.label}</h3>
                  <p className="text-xs text-muted mt-0.5">{t.desc}</p>
                </div>
              </div>
              <Database className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {t.fields.map(f => (
                <span key={f} className="text-[10px] bg-surface text-muted px-2 py-0.5 rounded-full border border-main">{f}</span>
              ))}
            </div>
            <button
              onClick={() => handleStartJob(t.id)}
              className="w-full btn-secondary text-xs flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Start Migration
            </button>
          </div>
        ))}
      </div>

      {/* Active Jobs */}
      {migrationJobs.length > 0 && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Migration Jobs</h3>
          </div>
          <div className="divide-y divide-main">
            {migrationJobs.map(job => (
              <div key={job.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-main">{job.templateId?.toUpperCase()} Migration</p>
                    <p className="text-xs font-mono text-dimmed">{job.jobNo}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    job.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                    job.status === 'RUNNING' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-rose-500/10 text-rose-400'
                  }`}>{job.status}</span>
                </div>
                <div className="h-1.5 bg-surface rounded-full">
                  <div
                    className={`h-full rounded-full transition-all ${job.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-indigo-500 animate-pulse'}`}
                    style={{ width: `${job.progress || 0}%` }}
                  />
                </div>
                <p className="text-[10px] text-dimmed mt-1">{job.progress || 0}% complete</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}