import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Play, Square, Terminal, CheckCircle, Clock,
  BarChart3, Zap, Activity, RefreshCw, ChevronRight, Bot
} from 'lucide-react';
import { useERPStore } from '../store/useERPStore';

const BOT_SCRIPTS = {
  'bot-1': [
    'Connecting to ERP Financial gateway...',
    'Scanning incoming invoice queue... 124 documents pending.',
    'OCR extraction engine — processing Invoice INV-2026-041...',
    'Parsed: Vendor "Aether Industries LLC" • Amount: ₹4,800.00',
    'Validating against purchase order PO-2026-018 → MATCHED ✓',
    'Posting double-entry journal VCH-AUTO-041 to General Ledger...',
    'Dr: Accounts Payable ₹4,800 → Cr: Operating Cash Account ₹4,800',
    'Continuing batch... 123 invoices remaining.',
    'Processing Invoice INV-2026-042... Vendor "Boreas Energy Corp" • Amount: ₹12,500',
    '--- [COMPLETE] Invoice batch run finished. 124 invoices processed. 0 errors. ---'
  ],
  'bot-2': [
    'Initialising Payroll Reconciliation Agent v4.2...',
    'Fetching payroll run for May 2026 — 15 active employees detected.',
    'Validating gross salaries against HR records...',
    'EMP-001 Julian Vance → Base ₹18,500 → Deductions: ₹3,700 → Net: ₹14,800 ✓',
    'EMP-002 Seraphina Aria → Base ₹14,200 → Deductions: ₹2,840 → Net: ₹11,360 ✓',
    'EMP-003 Kaelen Ross → Base ₹11,000 → Deductions: ₹2,200 → Net: ₹8,800 ✓',
    'Processing statutory deductions: EPF 12%, ESI 0.75%, TDS 10%...',
    'Generating payroll vouchers for 15 employees...',
    'Posting disbursement batch VCH-PAY-MAY26 → Accrued Payroll: ₹1,25,000',
    '--- [COMPLETE] Payroll reconciliation finished. 15/15 processed. Zero errors. ---'
  ],
  'bot-3': [
    'Lead Scraping Bot v3.1 activated...',
    'Scanning LinkedIn Sales Navigator for ICP keyword matches...',
    'Query: "ERP Supply Chain Director" + "Head of Operations" (IN region)',
    'Found 847 matching profiles. Applying company size filter (500–5000 employees)...',
    'Filtered to 142 high-intent prospects. Enriching with email data via Hunter.io...',
    'Enriched 98 emails (69% match rate). Deduplicating against CRM...',
    '23 duplicates removed. 75 net new leads ready for outreach.',
    'Creating leads in CRM pipeline with tag: ICP-Q3-2026...',
    'Scheduling personalised email sequences via outreach automation...',
    '--- [COMPLETE] 75 new leads added to pipeline. Sequences activated. ---'
  ],
  'bot-4': [
    'Inventory Reorder Bot v2.0 starting...',
    'Scanning 20 active SKUs against safety stock thresholds...',
    'SKU: BATT-400W — Current Stock: 12 units | Reorder Level: 20 units → REORDER NEEDED',
    'SKU: CABLE-USB-C — Current Stock: 8 units | Reorder Level: 15 units → REORDER NEEDED',
    'Fetching preferred supplier for BATT-400W → Zenith Supplies (score: 94%)',
    'Generating Purchase Order PO-AUTO-2026-089 for BATT-400W × 100 units @ ₹850/unit',
    'Total PO Value: ₹85,000. Sending for manager approval...',
    'Approval workflow triggered. Expected delivery: 3–5 business days.',
    'Generating PO-AUTO-2026-090 for CABLE-USB-C × 200 units...',
    '--- [COMPLETE] 2 auto-POs raised. Approval notifications sent. ---'
  ]
};

const BOTS = [
  {
    id: 'bot-1',
    name: 'Invoice Processor',
    description: 'Auto-posts AP invoices to the GL with 3-way PO matching',
    icon: '🧾',
    category: 'Finance',
    lastRun: '2 hours ago',
    runsToday: 3,
    successRate: 99.2
  },
  {
    id: 'bot-2',
    name: 'Payroll Reconciler',
    description: 'Validates payroll, computes deductions & posts journal vouchers',
    icon: '💰',
    category: 'HR',
    lastRun: '1 day ago',
    runsToday: 1,
    successRate: 100
  },
  {
    id: 'bot-3',
    name: 'Lead Scraper',
    description: 'Enriches and imports high-intent B2B leads into the CRM pipeline',
    icon: '🎯',
    category: 'Sales',
    lastRun: '4 hours ago',
    runsToday: 2,
    successRate: 97.8
  },
  {
    id: 'bot-4',
    name: 'Reorder Bot',
    description: 'Monitors stock levels and auto-raises purchase orders when low',
    icon: '📦',
    category: 'Inventory',
    lastRun: '30 mins ago',
    runsToday: 5,
    successRate: 98.5
  }
];

const CATEGORY_COLORS = {
  Finance: 'text-emerald-400 bg-emerald-500/10',
  HR: 'text-violet-400 bg-violet-500/10',
  Sales: 'text-sky-400 bg-sky-500/10',
  Inventory: 'text-amber-400 bg-amber-500/10'
};

export default function AutomationModule() {
  const { addToast, theme } = useERPStore();
  const [runningBots, setRunningBots] = useState({});
  const [completedBots, setCompletedBots] = useState({});
  const [terminalLines, setTerminalLines] = useState({});
  const [selectedBot, setSelectedBot] = useState('bot-1');
  const terminalRef = useRef(null);

  // Auto-scroll terminal on new lines
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  const runBot = (botId) => {
    if (runningBots[botId]) return;

    setRunningBots(prev => ({ ...prev, [botId]: true }));
    setCompletedBots(prev => ({ ...prev, [botId]: false }));
    setTerminalLines(prev => ({ ...prev, [botId]: [] }));
    setSelectedBot(botId);

    const script = BOT_SCRIPTS[botId] || [];
    let lineIndex = 0;

    const interval = setInterval(() => {
      if (lineIndex >= script.length) {
        clearInterval(interval);
        setRunningBots(prev => ({ ...prev, [botId]: false }));
        setCompletedBots(prev => ({ ...prev, [botId]: true }));
        const bot = BOTS.find(b => b.id === botId);
        addToast(`${bot?.name || 'Bot'} completed successfully`, 'success');
        return;
      }
      setTerminalLines(prev => ({
        ...prev,
        [botId]: [...(prev[botId] || []), { text: script[lineIndex], index: lineIndex }]
      }));
      lineIndex++;
    }, 500);
  };

  const stopBot = (botId) => {
    setRunningBots(prev => ({ ...prev, [botId]: false }));
    setTerminalLines(prev => ({
      ...prev,
      [botId]: [...(prev[botId] || []), { text: '⚠ Bot execution stopped by user.', index: 999, warn: true }]
    }));
    addToast('Bot stopped', 'warning');
  };

  const clearTerminal = (botId) => {
    setTerminalLines(prev => ({ ...prev, [botId]: [] }));
    setCompletedBots(prev => ({ ...prev, [botId]: false }));
  };

  const activeBot = BOTS.find(b => b.id === selectedBot);
  const currentLines = terminalLines[selectedBot] || [];
  const isRunning = runningBots[selectedBot];
  const isComplete = completedBots[selectedBot];
  const totalRunsToday = BOTS.reduce((s, b) => s + b.runsToday, 0);
  const avgSuccess = (BOTS.reduce((s, b) => s + b.successRate, 0) / BOTS.length).toFixed(1);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-400" /> RPA Automation Hub
          </h1>
          <p className="text-sm text-muted mt-1">Robotic process automation — bots that work while you sleep</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <Activity className="w-3 h-3" /> {Object.values(runningBots).filter(Boolean).length} running
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Bots', value: BOTS.length, color: 'text-indigo-400', icon: <Bot className="w-4 h-4" /> },
          { label: 'Runs Today', value: totalRunsToday, color: 'text-sky-400', icon: <Zap className="w-4 h-4" /> },
          { label: 'Avg Success Rate', value: `${avgSuccess}%`, color: 'text-emerald-400', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'Time Saved (hrs)', value: '14.2', color: 'text-amber-400', icon: <Clock className="w-4 h-4" /> }
        ].map(s => (
          <div key={s.label} className="theme-card p-4">
            <div className={`flex items-center gap-1.5 mb-1 ${s.color}`}>{s.icon}<p className="text-xs text-muted">{s.label}</p></div>
            <p className={`text-2xl font-bold font-data ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Main Layout: Bot List + Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Bot Cards */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Available Bots</h3>
          {BOTS.map(bot => {
            const running = runningBots[bot.id];
            const complete = completedBots[bot.id];
            const isSelected = selectedBot === bot.id;
            return (
              <motion.div
                key={bot.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedBot(bot.id)}
                className={`theme-card p-4 cursor-pointer transition-all ${isSelected ? 'ring-1 ring-indigo-500/50' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="text-2xl">{bot.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-main truncate">{bot.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${CATEGORY_COLORS[bot.category] || 'text-gray-400 bg-gray-500/10'}`}>
                          {bot.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">{bot.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-dimmed">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{bot.lastRun}</span>
                        <span className="flex items-center gap-1 text-emerald-400"><CheckCircle className="w-3 h-3" />{bot.successRate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    {running ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); stopBot(bot.id); }}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                      >
                        <Square className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); runBot(bot.id); }}
                        className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Indicator */}
                {running && (
                  <div className="mt-3">
                    <div className="h-0.5 bg-surface rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                        animate={{ width: ['0%', '100%'] }}
                        transition={{ duration: (BOT_SCRIPTS[bot.id]?.length || 10) * 0.5, ease: 'linear' }}
                      />
                    </div>
                    <p className="text-xs text-indigo-400 mt-1 flex items-center gap-1">
                      <Activity className="w-3 h-3 animate-pulse" /> Running...
                    </p>
                  </div>
                )}
                {complete && !running && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle className="w-3 h-3" /> Completed successfully
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Terminal Panel */}
        <div className="lg:col-span-3 theme-card flex flex-col" style={{ minHeight: 380 }}>
          {/* Terminal Header */}
          <div className="flex items-center justify-between p-3 border-b border-main">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500 opacity-80" />
                <div className="w-3 h-3 rounded-full bg-amber-500 opacity-80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500 opacity-80" />
              </div>
              <Terminal className="w-3.5 h-3.5 text-muted ml-1" />
              <span className="text-xs text-muted font-mono">
                {activeBot ? `${activeBot.icon} ${activeBot.name}` : 'terminal'}
              </span>
              {isRunning && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  running
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => clearTerminal(selectedBot)}
                className="p-1 rounded text-muted hover:text-main hover:bg-surface transition-colors"
                title="Clear terminal"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
              {isRunning ? (
                <button
                  onClick={() => stopBot(selectedBot)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors flex items-center gap-1"
                >
                  <Square className="w-3 h-3" /> Stop
                </button>
              ) : (
                <button
                  onClick={() => runBot(selectedBot)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors flex items-center gap-1"
                >
                  <Play className="w-3 h-3" /> Run
                </button>
              )}
            </div>
          </div>

          {/* Terminal Body */}
          <div
            ref={terminalRef}
            className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed"
            style={{ background: theme === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.03)', minHeight: 300 }}
          >
            {currentLines.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted">
                <Terminal className="w-8 h-8 opacity-30" />
                <p className="text-xs opacity-50">Select a bot and click Run to see output</p>
                <button
                  onClick={() => runBot(selectedBot)}
                  className="px-4 py-2 text-xs rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors flex items-center gap-2 border border-indigo-500/20"
                >
                  <Play className="w-3 h-3" /> Run {activeBot?.name}
                </button>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {currentLines.map((line, i) => (
                  <motion.div
                    key={`${line.index}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start gap-2 mb-1"
                  >
                    <span className="text-indigo-500 opacity-50 flex-shrink-0 select-none">$</span>
                    <span className={
                      line.warn ? 'text-amber-400' :
                      line.text.includes('[COMPLETE]') ? 'text-emerald-400 font-semibold' :
                      line.text.includes('MATCHED') || line.text.includes('✓') ? 'text-emerald-400' :
                      line.text.includes('ERROR') || line.text.includes('FAIL') ? 'text-rose-400' :
                      theme === 'dark' ? 'text-green-300/90' : 'text-slate-700'
                    }>
                      {line.text}
                    </span>
                  </motion.div>
                ))}
                {isRunning && (
                  <motion.div
                    key="cursor"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-indigo-500 opacity-50">$</span>
                    <span className="inline-block w-2 h-3.5 bg-green-400/80 rounded-sm" />
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Terminal Footer */}
          {isComplete && (
            <div className="px-4 py-2 border-t border-main flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle className="w-3 h-3" />
                Process exited with code 0
              </span>
              <button
                onClick={() => runBot(selectedBot)}
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Run again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Automation Stats Chart */}
      <div className="theme-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-main">Bot Performance Overview</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {BOTS.map(bot => (
            <div key={bot.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted flex items-center gap-1">{bot.icon} {bot.name.split(' ')[0]}</span>
                <span className="text-xs font-data text-emerald-400">{bot.successRate}%</span>
              </div>
              <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${bot.successRate}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-dimmed">
                <span>{bot.runsToday} runs today</span>
                <span className="flex items-center gap-0.5"><ChevronRight className="w-3 h-3" />{bot.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}