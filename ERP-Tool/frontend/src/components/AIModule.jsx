import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, Loader2, Zap, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useERPStore } from '../store/useERPStore';

const QUICK_PROMPTS = [
  'Summarize this month\'s financial performance',
  'Which employees have pending leave requests?',
  'Show me low stock alerts',
  'List top customers by spend',
  'How many shipments are in transit?'
];

export default function AIModule() {
  const { addToast, aiMessages, addAIMessage } = useERPStore();
  const { data: accounts = [] } = useQuery({ queryKey: ['crm', 'accounts'], queryFn: async () => [] });
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: async () => [] });
  const { data: products = [] } = useQuery({ queryKey: ['inventory', 'products'], queryFn: async () => [] });
  const { data: leads = [] } = useQuery({ queryKey: ['crm', 'leads'], queryFn: async () => [] });
  const { data: leaveRequests = [] } = useQuery({ queryKey: ['leaves'], queryFn: async () => [] });
  const { data: shipments = [] } = useQuery({ queryKey: ['ecommerce', 'orders'], queryFn: async () => [] });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const generateResponse = (userMsg) => {
    const msg = userMsg.toLowerCase();
    const totalRev = accounts.filter(a => a.type === 'REVENUE').reduce((s, a) => s + a.balance, 0);
    const totalExp = accounts.filter(a => a.type === 'EXPENSE').reduce((s, a) => s + a.balance, 0);
    const netInc = totalRev - totalExp;
    const pendingLeaves = leaveRequests.filter(l => l.status === 'PENDING');
    const lowStock = products.filter(p => p.currentStock <= p.reorderLevel);
    const topCustomers = leads.filter(l => l.status === 'WON').sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 3);
    const inTransit = (shipments || []).filter(s => ['IN_TRANSIT', 'DISPATCHED'].includes(s.status));

    if (msg.includes('financ') || msg.includes('revenue') || msg.includes('income')) {
      return `📊 **Financial Summary**\n\n- **Total Revenue:** ₹${totalRev.toLocaleString('en-IN')}\n- **Total Expenses:** ₹${totalExp.toLocaleString('en-IN')}\n- **Net Income:** ₹${netInc.toLocaleString('en-IN')} ${netInc >= 0 ? '✅' : '⚠️'}\n\nThe business is ${netInc >= 0 ? 'profitable' : 'currently running at a loss'}. Margin is ${totalRev > 0 ? ((netInc / totalRev) * 100).toFixed(1) : 0}%.`;
    }
    if (msg.includes('leave') || msg.includes('employee')) {
      return `👥 **HR Summary**\n\n- **Total Employees:** ${employees.length} (${employees.filter(e => e.isActive).length} active)\n- **Pending Leave Requests:** ${pendingLeaves.length}\n${pendingLeaves.length > 0 ? pendingLeaves.map(l => `  • ${l.employeeName}: ${l.leaveType} (${l.startDate} → ${l.endDate})`).join('\n') : '  ✅ No pending requests'}`;
    }
    if (msg.includes('stock') || msg.includes('inventory')) {
      return `📦 **Inventory Alert**\n\n- **Low Stock Items:** ${lowStock.length}\n${lowStock.length > 0 ? lowStock.map(p => `  • ${p.name}: ${p.currentStock} ${p.unit} (reorder at ${p.reorderLevel})`).join('\n') : '  ✅ All items adequately stocked'}\n\n- **Total SKUs:** ${products.length}`;
    }
    if (msg.includes('customer') || msg.includes('lead') || msg.includes('crm')) {
      return `🤝 **CRM Summary**\n\n- **Total Leads:** ${leads.length}\n- **Won Deals:** ${leads.filter(l => l.status === 'WON').length}\n- **Conversion Rate:** ${leads.length > 0 ? ((leads.filter(l => l.status === 'WON').length / leads.length) * 100).toFixed(1) : 0}%\n${topCustomers.length > 0 ? '\n**Top Won Deals:**\n' + topCustomers.map(c => `  • ${c.name} (${c.company}): ₹${(c.value || 0).toLocaleString('en-IN')}`).join('\n') : ''}`;
    }
    if (msg.includes('shipment') || msg.includes('transit') || msg.includes('logistics')) {
      return `🚚 **Supply Chain Status**\n\n- **In Transit:** ${inTransit.length} shipments\n${inTransit.slice(0, 3).map(s => `  • ${s.trackingNo} → ${s.destination} (${s.carrier})`).join('\n') || '  No shipments in transit'}`;
    }
    return `🤖 I can help you with:\n\n- **Finance** — Revenue, expenses, and P&L\n- **HR** — Employee data and leave requests\n- **Inventory** — Stock levels and alerts\n- **CRM** — Lead pipeline and conversions\n- **Logistics** — Shipment tracking\n\nTry asking: *"Summarize this month's financial performance"*`;
  };

  const handleSend = async (msg) => {
    const text = msg || input.trim();
    if (!text) return;
    addAIMessage({ role: 'user', content: text });
    setInput('');
    setLoading(true);
    setTimeout(() => {
      addAIMessage({ role: 'assistant', content: generateResponse(text) });
      setLoading(false);
    }, 900);
  };

  const handleExportChat = () => {
    if (aiMessages.length === 0) return addToast('No chat history to export', 'error');
    const text = aiMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_export_${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Chat exported successfully', 'success');
  };

  return (
    <div className="p-6 h-full flex flex-col space-y-4 animate-fade-up">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-md">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-main">AI Companion</h1>
          <p className="text-xs text-dimmed">Powered by LOGICORE Intelligence</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={handleExportChat} className="flex items-center gap-1.5 text-xs text-muted hover:text-main bg-surface border border-main px-3 py-1 rounded-full transition-colors">
            <Download className="w-3 h-3" /> Export Chat
          </button>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-medium">
            <Zap className="w-3 h-3 animate-pulse" /> Online
          </div>
        </div>
      </div>

      {/* Quick Prompts */}
      {aiMessages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map(p => (
            <button key={p} onClick={() => handleSend(p)}
              className="text-xs bg-surface border border-main text-muted hover:text-main hover:bg-surface-elevated px-3 py-1.5 rounded-full transition-colors">
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 min-h-0 max-h-[60vh]">
        {aiMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Bot className="w-10 h-10 text-muted/20 mb-2" />
            <p className="text-sm text-muted">Ask me anything about your business data</p>
          </div>
        )}
        {aiMessages.map((m, i) => (
          <div key={i} className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${m.role === 'user' ? 'bg-primary text-white' : 'bg-gradient-to-br from-cyan-500 to-violet-600 text-white'}`}>
              {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            </div>
            <div className={`max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'theme-card border border-main text-muted rounded-tl-none shadow-sm bg-surface/30'}`}>
              {m.content.split('\n').map((line, li) => (
                <p key={li} className={line.startsWith('**') ? 'font-semibold text-main' : 'text-muted'} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-3 animate-pulse">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="theme-card border border-main px-4 py-3 rounded-xl rounded-tl-none bg-surface/30">
              <div className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 text-muted animate-spin" /><span className="text-xs text-dimmed">Analyzing your data...</span></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask about your business data..."
          className="form-input flex-1 text-sm w-full"
        />
        <button onClick={() => handleSend()} disabled={!input.trim() || loading}
          className="btn-primary px-4 flex items-center gap-1.5 disabled:opacity-50">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}