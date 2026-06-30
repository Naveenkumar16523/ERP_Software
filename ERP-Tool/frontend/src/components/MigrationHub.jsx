import React, { useState } from 'react';
import { RefreshCw, Database, Upload, X } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';

export default function MigrationHub() {
  const { migrationJobs, startMigrationJob, updateMigrationJob, addToast } = useERPStore();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetModule, setTargetModule] = useState('employees');
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const TEMPLATES = [
    { id: 'sap', label: 'SAP to CLARIX', desc: 'Migrate from SAP ECC/S4HANA', icon: '🏭', fields: ['Chart of Accounts', 'Vendors', 'Customers', 'Open POs'] },
    { id: 'tally', label: 'Tally to CLARIX', desc: 'Import from Tally Prime / Gold', icon: '📒', fields: ['Ledgers', 'Stock Items', 'Vouchers', 'Party Masters'] },
    { id: 'odoo', label: 'Odoo to CLARIX', desc: 'Migrate from Odoo 14/15/16', icon: '🔧', fields: ['Products', 'Contacts', 'Sales Orders', 'Invoices'] },
    { id: 'csv', label: 'CSV / Excel Import', desc: 'Bulk import from flat files', icon: '📊', fields: ['Any tabular data'] }
  ];

  const handleOpenModal = (templateId) => {
    setActiveTemplate(templateId);
    setUploadModalOpen(true);
    setSelectedFile(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('target', targetModule);

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_URL}/api/v1/migration/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        addToast(`Success: ${data.message}`, 'success');
        // Add a completed job to the list directly via startMigrationJob trick or just let startMigrationJob run very fast
        startMigrationJob({ templateId: activeTemplate, status: 'COMPLETED', progress: 100, jobNo: `MIG-${Date.now()}` });
        setUploadModalOpen(false);
      } else {
        addToast(`Error: ${data.detail || 'Failed to upload'}`, 'error');
        startMigrationJob({ templateId: activeTemplate, status: 'FAILED', progress: 0, jobNo: `MIG-${Date.now()}` });
      }
    } catch (error) {
      addToast(`Network Error: ${error.message}`, 'error');
      startMigrationJob({ templateId: activeTemplate, status: 'FAILED', progress: 0, jobNo: `MIG-${Date.now()}` });
    } finally {
      setIsUploading(false);
    }
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
          <div key={t.id} className="theme-card p-5 hover:ring-1 hover:ring-primary/30 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-main">{t.label}</h3>
                  <p className="text-xs text-muted mt-0.5">{t.desc}</p>
                </div>
              </div>
              <Database className="w-4 h-4 text-primary flex-shrink-0" />
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {t.fields.map(f => (
                <span key={f} className="text-[10px] bg-surface text-muted px-2 py-0.5 rounded-full border border-main">{f}</span>
              ))}
            </div>
            <button
              onClick={() => handleOpenModal(t.id)}
              className="w-full btn-secondary text-xs flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" /> Start Migration
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
              <div key={job.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-main">{job.templateId?.toUpperCase()} Migration</p>
                  <p className="text-xs font-mono text-dimmed">{job.jobNo}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    job.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                    job.status === 'RUNNING' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-rose-500/10 text-rose-400'
                  }`}>{job.status}</span>
                  {job.status === 'RUNNING' && (
                    <div className="w-24 h-1.5 bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all animate-pulse"
                        style={{ width: `${job.progress || 0}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" /> Data Ingestion
              </h2>
              <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Table</label>
                <select 
                  value={targetModule} 
                  onChange={e => setTargetModule(e.target.value)} 
                  className="w-full bg-black/30 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-4 py-2.5 text-sm text-white outline-none transition-all"
                >
                  <option value="employees">HR Employees</option>
                  <option value="suppliers">Procurement Suppliers</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Source CSV File</label>
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={e => setSelectedFile(e.target.files[0])} 
                  className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer" 
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/5 bg-white/5 flex gap-3 justify-end">
              <button onClick={() => setUploadModalOpen(false)} className="btn-secondary text-xs px-4 py-2">Cancel</button>
              <button 
                onClick={handleUpload} 
                className="btn-primary text-xs px-4 py-2 flex items-center gap-2" 
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing...</>
                ) : (
                  <><Upload className="w-3.5 h-3.5" /> Start Import</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}