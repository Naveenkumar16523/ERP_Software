// AI assistant client utility communicating with the FastAPI AI service.
// Mimics the intent classification & responses locally if the service is offline.
import { useERPStore } from '../store/useERPStore';

const BASE_URL = '/api/v1/ai';

const LOCAL_SMART_REPLIES = {
  finance_summary: {
    reply: `📊 **Finance Summary (Offline Mode)**:\n• **Total Revenue**: ₹224,100.00\n• **Operating Expenses**: ₹136,000.00\n• **Net Profit**: ₹88,100.00\n• **Asset Accounts Balance**: ₹280,780.00\n• **Liabilities Balance**: ₹48,200.00\n\nWould you like the full P&L or Balance Sheet?`,
    suggestions: ['Show Balance Sheet', 'List overdue invoices', 'Run GST filing', 'Bank reconciliation status']
  },
  accounts_query: {
    reply: `💳 **Accounts Overview**: 4 open customer invoices totalling ₹34,100.00. Top pending: Delos Inc. (₹7,200.00, overdue). Accounts Payable: ₹32,400.00 due this month. Smart matching found 2 invoices ready for approval.`,
    suggestions: ['List overdue invoices', 'Match pending invoices', 'Create payment voucher']
  },
  inventory_status: {
    reply: `📦 **Inventory Status**: 20 active SKUs. Current stock value: ₹85,430.00. 2 items below safety stock threshold (Aether Battery Cell 400W). Turnover ratio: 4.5x.`,
    suggestions: ['Show low stock alerts', 'View near-expiry items', 'Generate reorder list']
  },
  hr_query: {
    reply: `👥 **HR Summary**: 15 active employees. Average payroll this month: ₹118,500.00. Leave balance: 2 pending approvals. Attendance today: 13/15 present (2 on approved leave).`,
    suggestions: ['Run payroll', 'Pending leave requests', 'Employee headcount by dept']
  },
  sales_forecast: {
    reply: `📈 **Sales Forecast**: Q3 revenue projected at ₹320,000 (+18% vs Q2). Pipeline value: ₹784,000 across 12 opportunities. Win rate: 42%. Top opportunity: Horizon Aerospace (₹125,000 value).`,
    suggestions: ['View sales pipeline', 'Top opportunities', 'Win/Loss analysis']
  },
  crm_query: {
    reply: `🤝 **CRM Overview**: 12 active leads in pipeline. 3 proposals sent this week. 2 leads converted to Won status this month. Total pipeline value: ₹4,82,000.`,
    suggestions: ['View pipeline board', 'Add new lead', 'Follow-up reminders']
  },
  supply_chain: {
    reply: `🚚 **Supply Chain**: 8 active shipments. 2 delayed (customs clearance). On-time delivery rate: 94%. Next expected arrival: Tomorrow — 3 pallets from Zenith Supplies.`,
    suggestions: ['Track shipments', 'Delayed deliveries', 'Supplier performance']
  },
  payroll_query: {
    reply: `💰 **Payroll Status**: May 2026 payroll — 15 employees processed. Total disbursement: ₹1,25,000. PF contribution: ₹15,000. ESI: ₹938. TDS withheld: ₹12,500. All slips generated.`,
    suggestions: ['Generate payslip', 'View pending payrolls', 'Tax summary']
  },
  project_status: {
    reply: `📋 **Projects Overview**: 4 active projects. 1 overdue (Aether ERP Integration). Overall completion: 67%. 8 tasks due this week. 2 milestones achieved this month.`,
    suggestions: ['View active projects', 'Overdue tasks', 'Add new project']
  },
  general_help: {
    reply: `👋 **CLARIX AI Assistant** here! I can help you with:\n• Finance & Accounting queries\n• HR & Payroll insights\n• Inventory & Supply Chain status\n• CRM & Sales pipeline\n• Project & Manufacturing updates\n\nWhat would you like to know?`,
    suggestions: ['Finance summary', 'HR status', 'Inventory alerts', 'Sales pipeline']
  }
};

// Intent classification based on keywords
function classifyIntent(message) {
  const msg = message.toLowerCase();
  if (/finance|revenue|profit|p&l|balance sheet|income|expense|ledger/.test(msg)) return 'finance_summary';
  if (/invoice|account|payable|receivable|payment|overdue/.test(msg)) return 'accounts_query';
  if (/inventory|stock|sku|product|warehouse|reorder/.test(msg)) return 'inventory_status';
  if (/employee|hr|leave|attendance|hire|staff|headcount/.test(msg)) return 'hr_query';
  if (/sales|forecast|pipeline|lead|crm|opportunity|win rate/.test(msg)) return 'sales_forecast';
  if (/crm|customer|lead|deal|prospect/.test(msg)) return 'crm_query';
  if (/shipment|supply chain|delivery|logistics|shipping|freight/.test(msg)) return 'supply_chain';
  if (/payroll|salary|payslip|wages|deduction|tds|pf|esi/.test(msg)) return 'payroll_query';
  if (/project|task|milestone|sprint|deadline/.test(msg)) return 'project_status';
  return 'general_help';
}

// Build a dynamic reply using live Zustand store data
function buildLiveReply(intent, store) {
  const base = LOCAL_SMART_REPLIES[intent];
  if (!base) return LOCAL_SMART_REPLIES.general_help;

  if (intent === 'finance_summary') {
    const totalRev = (store.accounts || []).filter(a => a.type === 'REVENUE').reduce((s, a) => s + (a.balance || 0), 0);
    const totalExp = (store.accounts || []).filter(a => a.type === 'EXPENSE').reduce((s, a) => s + (a.balance || 0), 0);
    const netProfit = totalRev - totalExp;
    return {
      reply: `📊 **Finance Summary**:\n• **Total Revenue**: ₹${totalRev.toLocaleString('en-IN')}\n• **Operating Expenses**: ₹${totalExp.toLocaleString('en-IN')}\n• **Net Profit**: ₹${netProfit.toLocaleString('en-IN')}\n• **Open Invoices**: ${(store.invoices || []).filter(i => i.status === 'PENDING').length}\n\nWould you like the full P&L or Balance Sheet?`,
      suggestions: base.suggestions
    };
  }

  if (intent === 'inventory_status') {
    const products = store.products || [];
    const lowStock = products.filter(p => p.currentStock <= p.reorderLevel);
    const totalValue = products.reduce((s, p) => s + (p.currentStock || 0) * (p.costPrice || 0), 0);
    return {
      reply: `📦 **Inventory Status**: ${products.length} active SKUs. Stock value: ₹${totalValue.toLocaleString('en-IN')}. ${lowStock.length} item(s) below safety threshold${lowStock.length > 0 ? ` (${lowStock.map(p => p.name).slice(0, 2).join(', ')})` : ''}.`,
      suggestions: base.suggestions
    };
  }

  if (intent === 'hr_query') {
    const employees = store.employees || [];
    const pending = (store.leaveRequests || []).filter(l => l.status === 'PENDING');
    return {
      reply: `👥 **HR Summary**: ${employees.length} active employees. ${pending.length} leave request(s) pending approval. Monthly payroll cycle active.`,
      suggestions: base.suggestions
    };
  }

  if (intent === 'sales_forecast') {
    const leads = store.leads || [];
    const won = leads.filter(l => l.status === 'WON').length;
    const active = leads.filter(l => !['WON', 'LOST'].includes(l.status));
    const pipeline = active.reduce((s, l) => s + (l.value || 0), 0);
    return {
      reply: `📈 **Sales Pipeline**: ${leads.length} total leads. ${won} won this period. Active pipeline: ₹${pipeline.toLocaleString('en-IN')} across ${active.length} opportunities.`,
      suggestions: base.suggestions
    };
  }

  return base;
}

// Main function to send a message to the AI service
export async function sendAIMessage(userMessage) {
  const store = useERPStore.getState();

  // Try live AI service first
  try {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage, context: 'erp_assistant' }),
      signal: AbortSignal.timeout(5000)
    });

    if (res.ok) {
      const data = await res.json();
      return {
        reply: data.reply || data.message || 'No response from AI service.',
        suggestions: data.suggestions || [],
        source: 'live'
      };
    }
  } catch {
    // Fall through to offline mode
  }

  // Offline intent classification + live data
  const intent = classifyIntent(userMessage);
  const response = buildLiveReply(intent, store);
  return { ...response, source: 'offline' };
}

// Quick prompt suggestions for the AI module
export const QUICK_PROMPTS = [
  "Summarize this month's financial performance",
  'Which employees have pending leave requests?',
  'Show me low stock alerts',
  'List top opportunities in pipeline',
  'How many shipments are in transit?',
  'Generate payroll summary for May 2026'
];

export default { sendAIMessage, QUICK_PROMPTS };