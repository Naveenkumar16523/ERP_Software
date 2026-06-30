import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, LayoutDashboard, User, FileText, Briefcase } from 'lucide-react';
import { useERPStore } from '../../store/useERPStore';
import { api } from '../../utils/api';

const MODULE_LIST = [
  { id: 'dashboard', label: 'Dashboard', desc: 'Overview & KPIs' },
  { id: 'finance', label: 'Finance', desc: 'Ledger, Invoices & Reports' },
  { id: 'hr', label: 'Human Resources', desc: 'Employees & Leaves' },
  { id: 'inventory', label: 'Inventory', desc: 'Stock & Products' },
  { id: 'manufacturing', label: 'Manufacturing', desc: 'Production & QA' },
  { id: 'procurement', label: 'Procurement', desc: 'Purchase Orders & Suppliers' },
  { id: 'crm', label: 'CRM & Pipeline', desc: 'Leads & Customers' },
  { id: 'payroll', label: 'Payroll', desc: 'Payslips & Deductions' },
  { id: 'assets', label: 'Fixed Assets', desc: 'Asset Registry & Depreciation' },
  { id: 'projects', label: 'Projects', desc: 'Tasks & Budgets' },
  { id: 'supplychain', label: 'Supply Chain', desc: 'Shipments & Logistics' },
  { id: 'ecommerce', label: 'E-Commerce', desc: 'Shop & Orders' },
  { id: 'analytics', label: 'Analytics', desc: 'BI & Reports' },
  { id: 'banking', label: 'Banking', desc: 'Accounts & Loans' },
  { id: 'healthcare', label: 'Healthcare', desc: 'Patients & Wards' },
  { id: 'education', label: 'Education', desc: 'Students & Grades' },
  { id: 'sustainability', label: 'Sustainability', desc: 'ESG & Carbon Offsets' },
  { id: 'marketing', label: 'Marketing', desc: 'Campaigns & ROI' },
  { id: 'security', label: 'Security', desc: 'Threats & Audit Log' },
  { id: 'mobile', label: 'Mobile Preview', desc: 'Responsive Preview' },
  { id: 'migration', label: 'Migration Hub', desc: 'Import from SAP/Tally' },
  { id: 'ai', label: 'AI Companion', desc: 'Business Intelligence Chat' },
  { id: 'support', label: 'Support Center', desc: 'Help Desk & Tickets' },
];

const GlobalSearch = ({ open, onClose }) => {
  const { setActiveModule, setMobileSidebar } = useERPStore();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [apiResults, setApiResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);

  // Focus input & reset when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setQuery('');
      setActiveIndex(0);
      setApiResults([]);
    }
  }, [open]);

  // Debounce API Search
  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchApiResults = async () => {
      if (!query.trim()) {
        setApiResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await api.search.query(query, { signal: abortController.signal });
        setApiResults(res.results || []);
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.error(e);
        }
      } finally {
        setIsSearching(false);
      }
    };
    
    const timeout = setTimeout(fetchApiResults, 300);
    return () => {
      clearTimeout(timeout);
      abortController.abort();
    };
  }, [query]);

  const moduleResults = query.trim()
    ? MODULE_LIST.filter(
        (m) =>
          m.label.toLowerCase().includes(query.toLowerCase()) ||
          m.desc.toLowerCase().includes(query.toLowerCase())
      )
    : MODULE_LIST.slice(0, 8);

  const totalResults = [...moduleResults, ...apiResults];

  const handleSelect = (item) => {
    if (item.type) {
      // It's an API result, link to the respective module
      setActiveModule(item.link.replace('/', ''));
    } else {
      // It's a module
      setActiveModule(item.id);
    }
    setMobileSidebar(false);
    onClose();
  };

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, totalResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && totalResults[activeIndex]) {
        e.preventDefault();
        handleSelect(totalResults[activeIndex]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, totalResults, activeIndex]);

  // Reset active index when query changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const getIcon = (type) => {
    if (type === 'Lead') return <Briefcase className="w-4 h-4" />;
    if (type === 'Invoice') return <FileText className="w-4 h-4" />;
    if (type === 'Employee') return <User className="w-4 h-4" />;
    return <LayoutDashboard className="w-4 h-4" />;
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Search Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            className="relative w-full max-w-2xl theme-card overflow-hidden"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.35)' }}
          >
            {/* Search Input */}
            <div className="flex items-center px-4 py-3.5 border-b border-main gap-3">
              <Search className="w-5 h-5 text-muted flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search modules, documents, people..."
                className="flex-1 border-none outline-none text-base py-1 font-medium"
                style={{
                  background: 'transparent',
                  color: 'hsl(var(--text-primary))',
                  caretColor: 'hsl(var(--primary))',
                }}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-dimmed hover:text-main transition-colors p-1 rounded"
                  title="Clear"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="text-dimmed hover:text-main transition-colors p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results */}
            <div className="py-1.5 max-h-96 overflow-y-auto custom-scrollbar">
              {totalResults.length === 0 && !isSearching ? (
                <div className="text-center py-10">
                  <p className="text-sm text-dimmed">
                    No results found for{' '}
                    <span className="text-main font-semibold">"{query}"</span>
                  </p>
                  <p className="text-xs text-dimmed mt-1">Try a different keyword</p>
                </div>
              ) : (
                <>
                  {moduleResults.length > 0 && (
                    <p className="text-[11px] font-semibold text-dimmed uppercase tracking-widest px-4 py-2 mt-1">
                      {query.trim() ? `Modules — ${moduleResults.length} found` : 'Quick Access'}
                    </p>
                  )}
                  {moduleResults.map((mod, idx) => (
                    <button
                      key={mod.id}
                      onClick={() => handleSelect(mod)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 transition-all text-left ${
                        idx === activeIndex ? 'bg-surface' : 'hover:bg-surface/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                            idx === activeIndex
                              ? 'bg-primary/15 text-primary'
                              : 'bg-surface text-dimmed'
                          }`}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                        </div>
                        <div>
                          <p
                            className={`text-sm font-semibold transition-colors ${
                              idx === activeIndex ? 'text-main' : 'text-muted'
                            }`}
                          >
                            {mod.label}
                          </p>
                          <p className="text-xs text-dimmed">{mod.desc}</p>
                        </div>
                      </div>
                      <ArrowRight
                        className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                          idx === activeIndex ? 'text-primary' : 'text-dimmed opacity-0 group-hover:opacity-100'
                        }`}
                      />
                    </button>
                  ))}

                  {/* Backend API Results (Data) */}
                  {apiResults.length > 0 && (
                    <p className="text-[11px] font-semibold text-dimmed uppercase tracking-widest px-4 py-2 mt-3 border-t border-main pt-3">
                      Data Records
                    </p>
                  )}
                  
                  {isSearching && apiResults.length === 0 && (
                     <p className="text-xs text-muted px-4 py-3">Searching database...</p>
                  )}
                  
                  {apiResults.map((item, idx) => {
                    const globalIdx = moduleResults.length + idx;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setActiveIndex(globalIdx)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 transition-all text-left ${
                          globalIdx === activeIndex ? 'bg-surface' : 'hover:bg-surface/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                              globalIdx === activeIndex
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-surface text-dimmed'
                            }`}
                          >
                            {getIcon(item.type)}
                          </div>
                          <div>
                            <p
                              className={`text-sm font-semibold transition-colors ${
                                globalIdx === activeIndex ? 'text-main' : 'text-muted'
                              }`}
                            >
                              {item.title}
                            </p>
                            <p className="text-xs text-dimmed">{item.subtitle}</p>
                          </div>
                        </div>
                        <ArrowRight
                          className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                            globalIdx === activeIndex ? 'text-emerald-400' : 'text-dimmed opacity-0 group-hover:opacity-100'
                          }`}
                        />
                      </button>
                    )
                  })}
                </>
              )}
            </div>

            {/* Footer Keyboard Hints */}
            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-main text-[11px] text-dimmed bg-surface/40">
              <span className="flex items-center gap-1.5">
                <kbd className="bg-surface border border-main px-1.5 py-0.5 rounded text-[10px] font-mono leading-none">
                  ↑↓
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="bg-surface border border-main px-1.5 py-0.5 rounded text-[10px] font-mono leading-none">
                  ↵
                </kbd>
                Open
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="bg-surface border border-main px-1.5 py-0.5 rounded text-[10px] font-mono leading-none">
                  Esc
                </kbd>
                Close
              </span>
              <span className="ml-auto flex items-center gap-1.5">
                <kbd className="bg-surface border border-main px-1.5 py-0.5 rounded text-[10px] font-mono leading-none">
                  Ctrl K
                </kbd>
                Open Search
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default React.memo(GlobalSearch);
