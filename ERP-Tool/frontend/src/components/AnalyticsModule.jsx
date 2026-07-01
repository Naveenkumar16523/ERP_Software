import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar, Cell, LineChart, Line
} from 'recharts';
import { useERPStore } from '../store/useERPStore';
import { useKpis } from '../hooks/useAnalytics';
import { useEmployees } from '../hooks/useHR';
import { useLeads } from '../hooks/useCRM';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6'];

export default function AnalyticsModule() {
  const { addToast } = useERPStore();
  const { data: employeesData } = useEmployees();
  const { data: leadsData } = useLeads();
  const employees = employeesData || [];
  const leads = leadsData || [];
  const { data: logisticsKpis } = useKpis();

  const revenueByMonth = logisticsKpis?.revenueByMonth || [];

  const deptData = Object.entries(
    employees.reduce((acc, e) => { acc[e.department] = (acc[e.department] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const leadFunnel = [
    { stage: 'Total Leads', count: leads.length },
    { stage: 'Qualified', count: leads.filter(l => ['QUALIFIED', 'PROPOSAL', 'WON'].includes(l.status)).length },
    { stage: 'Proposal', count: leads.filter(l => ['PROPOSAL', 'WON'].includes(l.status)).length },
    { stage: 'Won', count: leads.filter(l => l.status === 'WON').length }
  ];

  const chartTextColor = 'rgba(120,130,150,0.9)';
  const gridColor = 'rgba(120,130,150,0.12)';
  const tooltipStyle = {
    background: 'hsl(222,47%,11%)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    fontSize: 12,
    color: '#e2e8f0',
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-main">Analytics Hub</h1>
        <p className="text-sm text-muted mt-1">Business intelligence, performance insights, and live logistics KPIs.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'YTD Revenue', value: `₹${revenueByMonth.reduce((s, d) => s + (d.revenue || 0), 0).toLocaleString('en-IN')}`, color: 'text-emerald-400' },
          { label: 'Total Leads', value: leads.length, color: 'text-sky-400' },
          { label: 'Conversion Rate', value: `${leads.length > 0 ? ((leads.filter(l => l.status === 'WON').length / leads.length) * 100).toFixed(1) : 0}%`, color: 'text-violet-400' },
          { label: 'Headcount', value: employees.length, color: 'text-rose-400' }
        ].map(s => (
          <div key={s.label} className="theme-card p-4">
            <p className="text-xs text-dimmed">{s.label}</p>
            <p className={`text-xl font-bold mt-1 font-data ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="theme-card p-5">
          <h3 className="text-sm font-semibold text-main mb-4">Revenue Trend (YTD)</h3>
          <ResponsiveContainer width="100%" height={200} minWidth={1} minHeight={1}>
            <AreaChart data={revenueByMonth}>
              <defs>
                <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="month" tick={{ fill: chartTextColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: chartTextColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#rev-grad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="theme-card p-5">
          <h3 className="text-sm font-semibold text-main mb-4">Sales Funnel</h3>
          <div className="space-y-4 mt-2">
            {leadFunnel.map((item, i) => (
              <div key={item.stage}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted">{item.stage}</span>
                  <span className="text-main font-semibold">{item.count}</span>
                </div>
                <div className="h-2 bg-surface rounded-full border border-main/30">
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${leadFunnel[0].count > 0 ? (item.count / leadFunnel[0].count * 100) : 0}%`,
                    background: COLORS[i]
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {logisticsKpis && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-main mt-4">Supply Chain & Logistics KPIs</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'OTIF Delivery', value: `${logisticsKpis.otifRate}%`, color: 'text-indigo-400' },
              { label: 'Fleet Utilization', value: `${logisticsKpis.fleetUtilization}%`, color: 'text-amber-400' },
              { label: 'Fuel Efficiency', value: `${logisticsKpis.fuelEfficiency} km/l`, color: 'text-emerald-400' },
              { label: 'Rev per Km', value: `₹${logisticsKpis.revenuePerKm}`, color: 'text-sky-400' },
              { label: 'Est. CO2', value: `${logisticsKpis.co2Emissions} t`, color: 'text-rose-400' },
            ].map(s => (
              <div key={s.label} className="theme-card p-4 border border-main">
                <p className="text-xs text-dimmed">{s.label}</p>
                <p className={`text-xl font-bold mt-1 font-data ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="theme-card p-5">
              <h3 className="text-sm font-semibold text-main mb-4">Shipments Trend</h3>
              <ResponsiveContainer width="100%" height={200} minWidth={1} minHeight={1}>
                <LineChart data={logisticsKpis.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" tick={{ fill: chartTextColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: chartTextColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="shipments" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="theme-card p-5">
              <h3 className="text-sm font-semibold text-main mb-4">Headcount by Department</h3>
              <ResponsiveContainer width="100%" height={200} minWidth={1} minHeight={1}>
                <BarChart data={deptData}>
                  <XAxis dataKey="name" tick={{ fill: chartTextColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: chartTextColor, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {deptData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}