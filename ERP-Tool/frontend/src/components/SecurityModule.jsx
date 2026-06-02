import React from 'react';
import { ShieldAlert, ShieldCheck, Activity } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';

const SEVERITY_STYLES = {
  CRITICAL: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  LOW: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
};

export default function SecurityModule() {
  const { securityThreats, securityAuditLog, mitigateThreat, addToast } = useERPStore();

  const critical = securityThreats.filter(t => t.severity === 'CRITICAL').length;
  const high = securityThreats.filter(t => t.severity === 'HIGH').length;
  const open = securityThreats.filter(t => t.status !== 'MITIGATED').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Security Operations</h1>
          <p className="text-sm text-muted mt-1">Threat monitoring, SIEM, and audit trails</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
          open > 0
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          {open > 0 ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          {open > 0 ? `${open} Active Threat${open > 1 ? 's' : ''}` : 'All Clear'}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Critical Threats', value: critical, color: 'text-rose-400' },
          { label: 'High Severity', value: high, color: 'text-orange-400' },
          { label: 'Open Incidents', value: open, color: 'text-amber-400' },
          { label: 'Mitigated', value: securityThreats.filter(t => t.status === 'MITIGATED').length, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="theme-card p-4">
            <p className="text-xs text-dimmed">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Threat List */}
      <div className="theme-card overflow-hidden">
        <div className="px-4 py-3 border-b border-main">
          <h3 className="text-sm font-semibold text-main flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" /> Active Threats
          </h3>
        </div>
        <div className="divide-y divide-main">
          {securityThreats.map(t => (
            <div key={t.id} className="px-4 py-3 hover:bg-surface/40 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${SEVERITY_STYLES[t.severity] || ''}`}>
                      {t.severity}
                    </span>
                    <span className="text-xs text-muted font-mono">{t.type}</span>
                    <span className="text-xs text-dimmed">from {t.source}</span>
                  </div>
                  <p className="text-sm text-main">{t.description}</p>
                  <p className="text-[10px] text-dimmed mt-0.5">{new Date(t.timestamp).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    t.status === 'MITIGATED' ? 'bg-emerald-500/10 text-emerald-400' :
                    t.status === 'INVESTIGATING' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-rose-500/10 text-rose-400'
                  }`}>{t.status}</span>
                  {t.status !== 'MITIGATED' && (
                    <button
                      onClick={() => { mitigateThreat(t.id); addToast('Threat mitigated', 'success'); }}
                      className="text-xs text-emerald-400 hover:underline"
                    >
                      Mitigate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {securityThreats.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-dimmed flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> No active threats detected
            </div>
          )}
        </div>
      </div>

      {/* Audit Log */}
      {securityAuditLog && securityAuditLog.length > 0 && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" /> Audit Log
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-dimmed border-b border-main">
                  <th className="px-4 py-2.5">Action</th>
                  <th className="px-4 py-2.5">User</th>
                  <th className="px-4 py-2.5">IP</th>
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5">Result</th>
                </tr>
              </thead>
              <tbody>
                {securityAuditLog.map(log => (
                  <tr key={log.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-indigo-400">{log.action}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{log.userId}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-dimmed">{log.ip}</td>
                    <td className="px-4 py-2.5 text-xs text-dimmed">{new Date(log.timestamp).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${log.result === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {log.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}