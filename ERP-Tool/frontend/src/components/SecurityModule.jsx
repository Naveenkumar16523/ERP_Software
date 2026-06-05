import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Activity, FileCheck, Users, ClipboardCheck } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';

const SEVERITY_STYLES = {
  CRITICAL: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  LOW: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
};

export default function SecurityModule() {
  const {
    accessLogs, addAccessLog,
    securityAlerts, addSecurityAlert,
    userActivity, addUserActivity,
    complianceTracking, addComplianceTracking,
    addToast
  } = useERPStore();
  const [activeTab, setActiveTab] = useState('alerts');

  const TABS = [
    { id: 'alerts', label: 'Security Alerts', icon: ShieldAlert },
    { id: 'access', label: 'Access Logs', icon: Activity },
    { id: 'activity', label: 'User Activity', icon: Users },
    { id: 'compliance', label: 'Compliance', icon: ClipboardCheck }
  ];

  const openAlerts = securityAlerts.filter(a => a.status !== 'RESOLVED').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main">Security Operations</h1>
          <p className="text-sm text-muted mt-1">Threat monitoring, SIEM, and audit trails</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
          openAlerts > 0
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          {openAlerts > 0 ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          {openAlerts > 0 ? `${openAlerts} Active Alert${openAlerts > 1 ? 's' : ''}` : 'All Clear'}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Security Alerts', value: securityAlerts.length, color: 'text-rose-400' },
          { label: 'Access Logs', value: accessLogs.length, color: 'text-indigo-400' },
          { label: 'User Activities', value: userActivity.length, color: 'text-sky-400' },
          { label: 'Compliance Items', value: complianceTracking.length, color: 'text-emerald-400' },
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

      {activeTab === 'alerts' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Security Alerts ({securityAlerts.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Severity</th>
                <th className="px-4 py-2.5">Description</th>
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Assigned To</th>
              </tr></thead>
              <tbody>
                {securityAlerts.map(alert => (
                  <tr key={alert.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-indigo-400">{alert.type}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${SEVERITY_STYLES[alert.severity] || ''}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-main">{alert.description}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{alert.timestamp}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${alert.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400' : alert.status === 'INVESTIGATING' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{alert.assignedTo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'access' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Access Logs ({accessLogs.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Username</th>
                <th className="px-4 py-2.5">Action</th>
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5">IP Address</th>
                <th className="px-4 py-2.5">Device</th>
                <th className="px-4 py-2.5">Status</th>
              </tr></thead>
              <tbody>
                {accessLogs.map(log => (
                  <tr key={log.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{log.username}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-indigo-400">{log.action}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{log.timestamp}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-dimmed">{log.ipAddress}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{log.device}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">User Activity ({userActivity.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Username</th>
                <th className="px-4 py-2.5">Action</th>
                <th className="px-4 py-2.5">Module</th>
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5 text-right">Duration (s)</th>
              </tr></thead>
              <tbody>
                {userActivity.map(activity => (
                  <tr key={activity.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{activity.username}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-indigo-400">{activity.action}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{activity.module}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{activity.timestamp}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{activity.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="theme-card overflow-hidden">
          <div className="px-4 py-3 border-b border-main">
            <h3 className="text-sm font-semibold text-main">Compliance Tracking ({complianceTracking.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs text-dimmed border-b border-main">
                <th className="px-4 py-2.5">Regulation</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Last Audit</th>
                <th className="px-4 py-2.5">Next Audit</th>
                <th className="px-4 py-2.5 text-right">Score</th>
              </tr></thead>
              <tbody>
                {complianceTracking.map(compliance => (
                  <tr key={compliance.id} className="border-b border-main hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-main">{compliance.regulation}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${compliance.status === 'COMPLIANT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {compliance.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{compliance.lastAudit}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{compliance.nextAudit}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-data text-main">{compliance.score}</td>
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