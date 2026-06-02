import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Target,
  MoreHorizontal,
  ChevronRight,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Star
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { useERPStore } from '../store/useERPStore';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 22, stiffness: 200 } }
};

const PIE_COLORS = ['#4f46e5', '#f59e0b', '#ef4444', '#10b981'];

export default function Dashboard() {
  const { employees, products, notifications } = useERPStore();

  const revenueExpensesData = [
    { name: '1', current: 1400, previous: 900 },
    { name: '2', current: 2200, previous: 1200 },
    { name: '3', current: 2800, previous: 1800 },
    { name: '4', current: 2100, previous: 1400 },
    { name: '5', current: 2500, previous: 1600 },
    { name: '6', current: 1800, previous: 1200 },
    { name: '7', current: 2400, previous: 1500 },
    { name: '8', current: 3200, previous: 2100 },
    { name: '9', current: 2800, previous: 1900 },
  ];

  const learnerEngagementData = [
    { name: 'Active Learners', value: 1923 },
    { name: 'Inactive Learners', value: 924 },
    { name: 'At-risk Learners', value: 308 }
  ];

  const kpis = [
    {
      label: 'Total Learners',
      value: '10,590',
      change: '+8.2%',
      up: true,
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Total Revenue',
      value: '$142.8K',
      subValue: 'of $500.0K',
      change: '+18%',
      up: true,
      icon: CreditCard,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Avg Instructor Rating',
      value: '4.2',
      subValue: 'Based on student reviews',
      change: '+8%',
      up: true,
      icon: Star,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Total Courses',
      value: '248',
      change: '-12.5%',
      up: false,
      icon: Target,
      color: 'bg-rose-50 text-rose-600',
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto"
    >
      {/* Middle Section Label */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-main">Key Metrics</h2>
        <button className="flex items-center gap-2 px-4 py-2 btn-secondary text-sm rounded-lg transition-all">
          Monthly <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards (4 columns) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="theme-card p-5 hover:scale-[1.02] transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${kpi.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted mb-1">{kpi.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-main">{kpi.value}</p>
                    {kpi.subValue && <span className="text-[10px] text-dimmed font-medium">{kpi.subValue}</span>}
                  </div>
                  <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${kpi.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {kpi.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span>{kpi.change} <span className="text-dimmed font-medium ml-1">Vs Prev. 30 Days</span></span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Two Column Layout: Table & Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Data Table Card */}
        <motion.div variants={itemVariants} className="lg:col-span-2 theme-card flex flex-col">
          <div className="p-5 border-b border-main flex items-center justify-between">
            <h3 className="text-base font-bold text-main">Top Courses Performance</h3>
            <button className="flex items-center gap-2 px-3 py-1.5 btn-secondary text-sm rounded-lg transition-all">
              Enrollments <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold text-muted bg-surface uppercase tracking-wider border-b border-main">Course Name</th>
                  <th className="px-5 py-4 text-xs font-semibold text-muted bg-surface uppercase tracking-wider border-b border-main">Completion</th>
                  <th className="px-5 py-4 text-xs font-semibold text-muted bg-surface uppercase tracking-wider border-b border-main">Trend</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Advanced JavaScript Programming', comp: '1,245 learners', trend: '+ 12.5%', up: true },
                  { name: 'UI/UX Design Fundamentals', comp: '1,245 learners', trend: '+ 12.5%', up: true },
                  { name: 'Data Science with Python', comp: '1,245 learners', trend: '+ 12.5%', up: true },
                  { name: 'Digital Marketing Masterclass', comp: '1,245 learners', trend: '- 12.5%', up: false },
                  { name: 'Mobile App Development', comp: '1,245 learners', trend: '+ 12.5%', up: true }
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface/30 transition-colors group">
                    <td className="px-5 py-4 text-sm font-semibold text-main border-b border-main/50 group-last:border-0">{row.name}</td>
                    <td className="px-5 py-4 text-sm text-muted border-b border-main/50 group-last:border-0">{row.comp}</td>
                    <td className="px-5 py-4 text-sm font-medium border-b border-main/50 group-last:border-0">
                      <span className={`flex items-center gap-1 ${row.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {row.up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {row.trend}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Donut Chart Card */}
        <motion.div variants={itemVariants} className="theme-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-main flex items-center gap-2">
              Learner Engagement <AlertCircle className="w-4 h-4 text-muted" />
            </h3>
            <button className="p-1 btn-secondary rounded">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          
          <div className="relative flex-1 flex items-center justify-center min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={learnerEngagementData}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {learnerEngagementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label inside Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">Average Completion</p>
              <p className="text-4xl font-bold text-main">68.4%</p>
              <p className="text-xs font-semibold text-indigo-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> 5.2% from target
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {learnerEngagementData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-6 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="font-medium text-muted">{item.name}</span>
                </div>
                <span className="font-bold text-main">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Feed Card & Alerts + Area Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Alerts Stack) */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4">
          <h3 className="text-base font-bold text-main flex items-center justify-between mb-2">
            Important Alerts
            <button className="p-1 hover:bg-surface/30 rounded text-dimmed">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </h3>
          
          {[
            { title: 'New instructor awaiting approval', sub: 'Jeje Sunandar', icon: Users, color: 'indigo' },
            { title: 'Low completion rate detected', sub: 'Completion has dropped below the target', icon: TrendingDown, color: 'rose' },
            { title: 'New instructor awaiting approval', sub: 'Stephen Lance', icon: Users, color: 'amber' },
            { title: 'Monthly revenue target achieved', sub: 'Your platform has reached revenue goal', icon: TrendingUp, color: 'emerald' }
          ].map((alert, idx) => {
            const Icon = alert.icon;
            
            // Custom theme-aware alert class mapping
            const alertClasses = {
              indigo: 'alert-indigo',
              rose: 'alert-rose',
              amber: 'alert-amber',
              emerald: 'alert-emerald'
            };
            const accentColors = {
              indigo: 'bg-indigo-500',
              rose: 'bg-rose-500',
              amber: 'bg-amber-500',
              emerald: 'bg-emerald-500'
            };

            return (
              <div key={idx} className={`relative flex items-center justify-between p-4 rounded-xl border ${alertClasses[alert.color]} hover:shadow-sm transition-all group cursor-pointer overflow-hidden`}>
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColors[alert.color]}`} />
                <div>
                  <p className="text-sm font-semibold text-main mb-1">{alert.title}</p>
                  <p className="text-xs font-medium flex items-center gap-1.5 opacity-90">
                    <Icon className="w-3.5 h-3.5" />
                    {alert.sub}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-dimmed group-hover:text-main transition-colors" />
              </div>
            );
          })}
        </motion.div>

        {/* Right Columns (Area Chart + Recent Activity Feed) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Area Chart Card */}
          <motion.div variants={itemVariants} className="theme-card p-5 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-main">Revenue Trend</h3>
              <AlertCircle className="w-4 h-4 text-dimmed" />
            </div>
            <p className="text-xs font-medium text-muted mb-6">Revenue (Last 09 Days) vs previous period</p>
            
            <div className="relative flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueExpensesData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} dx={-10} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--bg-primary))', border: '1px solid hsl(var(--border-light))', borderRadius: '8px', fontSize: 12, boxShadow: 'var(--shadow-md)', color: 'hsl(var(--text-primary))' }}
                  />
                  <Area type="monotone" dataKey="current" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorCurrent)" dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                  <Area type="monotone" dataKey="previous" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorPrevious)" dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-main">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-rose-500 rounded-sm" />
                <span className="text-xs font-semibold text-main">Current period</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-amber-500 rounded-sm" />
                <span className="text-xs font-semibold text-main">Previous period</span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
      
      {/* Recent Activity Feed Card (Full Width at Bottom, or can be adjusted) */}
      <motion.div variants={itemVariants} className="theme-card p-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-main">Recent Activity</h3>
          <button className="p-1 hover:bg-surface/30 rounded text-dimmed">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-6">
          {[
            { img: 'bg-indigo-100 text-indigo-750 dark:bg-indigo-500/10 dark:text-indigo-400', name: 'Daniel Roe', action: 'registered as a', target: 'New Learner', time: '15 minutes ago' },
            { img: 'bg-emerald-100 text-emerald-750 dark:bg-emerald-500/10 dark:text-emerald-400', name: 'Maria Smith', action: 'published a new course with', target: 'Emily Stanton', time: '30 minutes ago' },
            { img: 'bg-amber-100 text-amber-750 dark:bg-amber-500/10 dark:text-amber-400', name: 'Sarah Lee', action: 'posted an update', target: 'Advanced UI Systems', time: '1 hour ago', note: 'The instructor added a note in Advanced UI Systems: "Slides for today\'s session are now available."' },
            { img: 'bg-teal-100 text-teal-750 dark:bg-teal-500/10 dark:text-teal-400', name: 'Stephen Lance', action: 'uploaded', target: "David Wilson's lab Results", time: '2 hours ago' }
          ].map((item, idx) => (
            <div key={idx} className="flex gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${item.img}`}>
                {item.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0 pb-6 border-b border-main/50 last:border-0 last:pb-0">
                <p className="text-sm text-muted leading-snug">
                  <span className="font-bold text-main">{item.name}</span> {item.action} <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.target}</span>
                </p>
                {item.note && (
                  <div className="mt-2 p-3 rounded-xl bg-surface/50 text-sm text-muted border border-main border-l-4 border-l-indigo-500">
                    {item.note}
                  </div>
                )}
                <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-dimmed">
                  <Clock className="w-3.5 h-3.5" /> {item.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

    </motion.div>
  );
}