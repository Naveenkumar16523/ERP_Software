import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Landmark,
  Package,
  Users,
  Handshake,
  Wrench,
  BarChart3,
  ShoppingBag,
  Smartphone,
  RefreshCw,
  Sparkles,
  Building2,
  HeartPulse,
  GraduationCap,
  Leaf,
  Megaphone,
  Shield,
  Truck,
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Factory,
  HelpCircle,
  Cpu,
  Lock
} from 'lucide-react';
import { useERPStore } from '../../store/useERPStore';
import { RainbowButton } from '../ui/RainbowButton';

const MODULES_CONFIG = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-indigo-400', moduleKey: 'dashboard' },
  { id: 'finance', label: 'Finance', icon: Landmark, color: 'text-emerald-400', moduleKey: 'finance' },
  { id: 'hr', label: 'Human Resources', icon: Users, color: 'text-rose-400', moduleKey: 'human_resources' },
  { id: 'inventory', label: 'Inventory', icon: Package, color: 'text-amber-400', moduleKey: 'inventory' },
  { id: 'manufacturing', label: 'Manufacturing', icon: Factory, color: 'text-orange-400', moduleKey: 'manufacturing' },
  { id: 'procurement', label: 'Procurement', icon: ShoppingBag, color: 'text-yellow-400', moduleKey: 'procurement' },
  { id: 'crm', label: 'CRM & Pipeline', icon: Handshake, color: 'text-sky-400', moduleKey: 'crm_pipeline' },
  { id: 'payroll', label: 'Payroll', icon: CreditCard, color: 'text-teal-400', moduleKey: 'payroll' },
  { id: 'assets', label: 'Fixed Assets', icon: Wrench, color: 'text-violet-400', moduleKey: 'fixed_assets' },
  { id: 'projects', label: 'Projects', icon: Building2, color: 'text-blue-400', moduleKey: 'projects' },
  { id: 'supplychain', label: 'Supply Chain', icon: Truck, color: 'text-cyan-400', moduleKey: 'supply_chain' },
  { id: 'ecommerce', label: 'E-Commerce', icon: ShoppingBag, color: 'text-pink-400', moduleKey: 'ecommerce' },
  { id: 'analytics', label: 'Analytics Hub', icon: BarChart3, color: 'text-fuchsia-400', moduleKey: 'analytics_hub' },
  { id: 'banking', label: 'Banking', icon: Landmark, color: 'text-lime-400', moduleKey: 'banking' },
  { id: 'healthcare', label: 'Healthcare', icon: HeartPulse, color: 'text-red-400', moduleKey: 'healthcare' },
  { id: 'education', label: 'Education', icon: GraduationCap, color: 'text-indigo-300', moduleKey: 'education' },
  { id: 'sustainability', label: 'Sustainability', icon: Leaf, color: 'text-green-400', moduleKey: 'sustainability' },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, color: 'text-rose-300', moduleKey: 'marketing' },
  { id: 'security', label: 'Security', icon: Shield, color: 'text-red-500', moduleKey: 'security' },
  { id: 'mobile', label: 'Mobile Preview', icon: Smartphone, color: 'text-blue-300', moduleKey: 'mobile' },
  { id: 'migration', label: 'Migration Hub', icon: RefreshCw, color: 'text-orange-300', moduleKey: 'migration_hub' },
  { id: 'automation', label: 'RPA Automation', icon: Cpu, color: 'text-indigo-500', moduleKey: 'rpa_automation' },
  { id: 'ai', label: 'AI Companion', icon: Sparkles, color: 'text-cyan-400', moduleKey: 'ai' },
  { id: 'support', label: 'Support Center', icon: HelpCircle, color: 'text-amber-500', moduleKey: 'support' },
  { id: 'admin', label: 'Admin Settings', icon: Shield, color: 'text-purple-400', moduleKey: 'admin', ceoOnly: true },
  { id: 'change-password', label: 'Change Password', icon: Lock, color: 'text-cyan-400', moduleKey: 'change-password' }
];

export default function Sidebar() {
  const {
    activeModule,
    setActiveModule,
    sidebarCollapsed,
    toggleSidebar,
    mobileSidebarOpen,
    setMobileSidebar,
    currentUser,
    logout,
    userPermissions,
    allowedModules,
    demoMode
  } = useERPStore();

  const handleNavClick = (moduleId) => {
    setActiveModule(moduleId);
    setMobileSidebar(false);
  };

  // Filter modules based on user's allowed_modules from JWT
  const visibleModules = MODULES_CONFIG.filter((mod) => {
    // CEO-only modules (Admin Panel)
    if (mod.ceoOnly) {
      return currentUser?.isCEO;
    }
    
    // Change password is for employees only (not CEO)
    if (mod.id === 'change-password') {
      return currentUser && !currentUser.isCEO && !demoMode;
    }
    
    // Show all modules in demo mode or when not authenticated
    if (demoMode || !currentUser) return true;
    
    // CEO has access to all modules (except change-password)
    if (currentUser?.isCEO) return true;
    
    // Dashboard is always accessible
    if (mod.id === 'dashboard') return true;
    
    // If allowed_modules contains "all", show all modules (shouldn't happen for non-CEO but safe fallback)
    if (allowedModules.includes('all')) return true;
    
    // Check if module is in allowed_modules array
    return allowedModules.includes(mod.moduleKey);
  });


  return (
    <>
      {/* Mobile Drawer Overlay */}
      <div
        className={`mobile-overlay ${mobileSidebarOpen ? 'active' : ''}`}
        onClick={() => setMobileSidebar(false)}
      />

      <aside
        className={`sidebar dark ${sidebarCollapsed ? 'collapsed' : ''} ${
          mobileSidebarOpen ? 'mobile-open' : ''
        }`}
      >
        {/* Logo / Brand */}
        {/* Logo / Brand Header */}
        <div 
          onClick={sidebarCollapsed ? toggleSidebar : undefined}
          title={sidebarCollapsed ? "Expand Sidebar" : undefined}
          className={`sidebar-brand flex items-center justify-between px-4 w-full transition-colors ${
            sidebarCollapsed ? 'justify-center cursor-pointer hover:bg-white/5' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <p className="text-sm font-bold text-white leading-tight">CLARIX</p>
                <p className="text-[10px] text-white/40 leading-tight">Enterprise resource planning</p>
              </motion.div>
            )}
          </div>

          {!sidebarCollapsed && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleSidebar(); }}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all border border-white/10"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav custom-scrollbar flex-1 overflow-y-auto">
          {visibleModules.map((mod) => {
            const Icon = mod.icon;
            const isActive = activeModule === mod.id;
            
            return (
              <button
                key={mod.id}
                onClick={() => handleNavClick(mod.id)}
                title={sidebarCollapsed ? mod.label : undefined}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
              >
                <Icon className={`sidebar-icon ${isActive ? 'text-white' : mod.color}`} />
                {!sidebarCollapsed && (
                  <span className="sidebar-label">{mod.label}</span>
                )}
                {isActive && !sidebarCollapsed && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 rounded-lg bg-white/5 border border-white/10"
                    transition={{ type: 'spring', duration: 0.3 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className={`sidebar-footer flex-col items-stretch gap-2 !p-4 ${sidebarCollapsed ? '!px-2' : ''}`}>
          <RainbowButton
            onClick={logout}
            className={`w-full flex items-center gap-3 p-2 ${sidebarCollapsed ? 'justify-center !px-2' : ''}`}
            title="Logout"
          >
            <LogOut className="w-5 h-5 flex-shrink-0 text-rose-400 group-hover:text-rose-300" />
            {!sidebarCollapsed && <span className="text-sm font-medium text-rose-400 group-hover:text-rose-300">Logout</span>}
          </RainbowButton>
        </div>
      </aside>
    </>
  );
}