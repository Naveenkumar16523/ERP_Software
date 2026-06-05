import React, { useState } from 'react';
import { Plus, Database, FileText, CheckCircle, RefreshCw } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';
import Modal from './ui/Modal';

export default function MigrationHubModule() {
  const {
    dataMigrations, addDataMigration,
    importExports, addImportExport,
    dataValidations, addDataValidation,
    dataTransformations, addDataTransformation,
    addToast
  } = useERPStore();
  const [activeTab, setActiveTab] = useState('migrations');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', source: '', target: '', type: 'IMPORT', module: '', dataset: '', rule: '', sourceFormat: '', targetFormat: '' });

  const handleAdd = () => {
    if (!form.name) return addToast('Name required', 'error');
    if (activeTab === 'migrations') addDataMigration({ ...form, startDate: new Date().toISOString().split('T')[0], recordsProcessed: 0, recordsFailed: 0 });
    else if (activeTab === 'impexp') addImportExport({ ...form, records: 0, date: new Date().toISOString().split('T')[0] });
    else if (activeTab === 'validation') addDataValidation({ ...form, recordsChecked: 0, errorsFound: 0, date: new Date().toISOString().split('T')[0] });
    else if (activeTab === 'transform') addDataTransformation({ ...form, lastRun: new Date().toISOString().split('T')[0], recordsProcessed: 0 });
    addToast('Record added successfully', 'success');
    setModal(false);
    setForm({ name: '', source: '', target: '', type: 'IMPORT', module: '', dataset: '', rule: '', sourceFormat: '', targetFormat: '' });
  };

  const TABS = [
    { id: 'migrations', label: 'Data Migrations', icon: Database },
    { id: 'impexp', label: 'Import/Export', icon: FileText },
    { id: 'validation', label: 'Data Validation', icon: CheckCircle },
    { id: 'transform', label: 'Transformations', icon: RefreshCw }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Migration Hub</h1>
          <p className="text-sm text-muted mt-1">Data migration tools, import/export, validation, and transformation</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Migrations', value: dataMigrations.length, color: 'text-indigo-400' },
          { label: 'Import/Export', value: importExports.length, color: 'text-sky-400' },
          { label: 'Validations', value: dataValidations.length, color: 'text-emerald-400' },
          { label: 'Transformations', value: dataTransformations.length, color: 'text-amber-400' },
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

      {activeTab === 'migrations' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Data Migrations ({dataMigrations.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Source</th>
                <th className="px-4 py-2.5">Target</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Start Date</th>
                <th className="px-4 py-2.5">End Date</th>
                <th className="px-4 py-2.5 text-right">Processed</th>
                <th className="px-4 py-2.5 text-right">Failed</th>
              </tr></thead>
              <tbody>
                {dataMigrations.map(migration => (
                  <tr key={migration.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{migration.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{migration.source}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{migration.target}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${migration.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : migration.status === 'IN_PROGRESS' ? 'bg-sky-500/10 text-sky-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {migration.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{migration.startDate}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{migration.endDate || '—'}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{migration.recordsProcessed.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-rose-400">{migration.recordsFailed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'impexp' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Import/Export ({importExports.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Source</th>
                <th className="px-4 py-2.5">Module</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5 text-right">Records</th>
              </tr></thead>
              <tbody>
                {importExports.map(impexp => (
                  <tr key={impexp.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${impexp.type === 'IMPORT' ? 'bg-sky-500/10 text-sky-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {impexp.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{impexp.source}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{impexp.module}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${impexp.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {impexp.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{impexp.date}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{impexp.records.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'validation' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Data Validation ({dataValidations.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Dataset</th>
                <th className="px-4 py-2.5">Rule</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5 text-right">Checked</th>
                <th className="px-4 py-2.5 text-right">Errors</th>
              </tr></thead>
              <tbody>
                {dataValidations.map(validation => (
                  <tr key={validation.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{validation.dataset}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{validation.rule}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${validation.status === 'PASSED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {validation.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{validation.date}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{validation.recordsChecked.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-rose-400">{validation.errorsFound}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'transform' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Data Transformations ({dataTransformations.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Source Format</th>
                <th className="px-4 py-2.5">Target Format</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Last Run</th>
                <th className="px-4 py-2.5 text-right">Processed</th>
              </tr></thead>
              <tbody>
                {dataTransformations.map(transform => (
                  <tr key={transform.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{transform.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{transform.source}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{transform.target}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${transform.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {transform.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{transform.lastRun}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{transform.recordsProcessed.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Migration Record">
        <div className="space-y-4">
          <div><label className="form-label">Name / Dataset</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          {activeTab === 'migrations' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="form-label">Source</label><input className="form-input" value={form.source} onChange={e => setForm({...form, source: e.target.value})} /></div>
                <div><label className="form-label">Target</label><input className="form-input" value={form.target} onChange={e => setForm({...form, target: e.target.value})} /></div>
              </div>
            </>
          )}
          {activeTab === 'impexp' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="form-label">Type</label>
                  <select className="form-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="IMPORT">Import</option>
                    <option value="EXPORT">Export</option>
                  </select>
                </div>
                <div><label className="form-label">Module</label><input className="form-input" value={form.module} onChange={e => setForm({...form, module: e.target.value})} /></div>
              </div>
            </>
          )}
          {activeTab === 'validation' && (
            <div><label className="form-label">Rule</label><input className="form-input" value={form.rule} onChange={e => setForm({...form, rule: e.target.value})} /></div>
          )}
          {activeTab === 'transform' && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Source Format</label><input className="form-input" value={form.sourceFormat} onChange={e => setForm({...form, sourceFormat: e.target.value})} /></div>
              <div><label className="form-label">Target Format</label><input className="form-input" value={form.targetFormat} onChange={e => setForm({...form, targetFormat: e.target.value})} /></div>
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAdd} className="btn-primary text-sm">Add Record</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
