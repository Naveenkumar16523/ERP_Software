import React, { Suspense, lazy } from 'react';
import AppShell from './components/layout/AppShell';
import { useERPStore } from './store/useERPStore';
import SkeletonLoader from './components/ui/SkeletonLoader';
import FollowCursor from './components/ui/FollowCursor';
import AccessDenied from './components/AccessDenied';
import { useEffect } from 'react';

// Lazy-load all module components for optimal bundle splitting
const Dashboard          = lazy(() => import('./components/Dashboard'));
const FinanceModule      = lazy(() => import('./components/FinanceModule'));
const HRModule           = lazy(() => import('./components/HRModule'));
const InventoryModule    = lazy(() => import('./components/InventoryModule'));
const ManufacturingModule = lazy(() => import('./components/ManufacturingModule'));
const ProcurementModule  = lazy(() => import('./components/ProcurementModule'));
const CRMModule          = lazy(() => import('./components/CRMModule'));
const PayrollModule      = lazy(() => import('./components/PayrollModule'));
const AssetModule        = lazy(() => import('./components/AssetModule'));
const ProjectModule      = lazy(() => import('./components/ProjectModule'));
const SupplyChainModule  = lazy(() => import('./components/SupplyChainModule'));
const EcommerceModule    = lazy(() => import('./components/EcommerceModule'));
const AnalyticsModule    = lazy(() => import('./components/AnalyticsModule'));
const BankingModule      = lazy(() => import('./components/BankingModule'));
const HealthcareModule   = lazy(() => import('./components/HealthcareModule'));
const EducationModule    = lazy(() => import('./components/EducationModule'));
const SustainabilityModule = lazy(() => import('./components/SustainabilityModule'));
const MarketingModule    = lazy(() => import('./components/MarketingModule'));
const SecurityModule     = lazy(() => import('./components/SecurityModule'));
const MobileModule       = lazy(() => import('./components/MobileModule'));
const MigrationHub       = lazy(() => import('./components/MigrationHub'));
const AIModule           = lazy(() => import('./components/AIModule'));
const SupportModule      = lazy(() => import('./components/SupportModule'));
const AutomationModule   = lazy(() => import('./components/AutomationModule'));
const AdminPanel         = lazy(() => import('./components/AdminPanel'));
const ChangePassword     = lazy(() => import('./components/ChangePassword'));

import SignIn from './components/auth/SignIn';

const MODULE_MAP = {
  dashboard:      Dashboard,
  finance:        FinanceModule,
  hr:             HRModule,
  inventory:      InventoryModule,
  manufacturing:  ManufacturingModule,
  procurement:    ProcurementModule,
  crm:            CRMModule,
  payroll:        PayrollModule,
  assets:         AssetModule,
  projects:       ProjectModule,
  supplychain:    SupplyChainModule,
  ecommerce:      EcommerceModule,
  analytics:      AnalyticsModule,
  banking:        BankingModule,
  healthcare:     HealthcareModule,
  education:      EducationModule,
  sustainability: SustainabilityModule,
  marketing:      MarketingModule,
  security:       SecurityModule,
  mobile:         MobileModule,
  migration:      MigrationHub,
  ai:             AIModule,
  support:        SupportModule,
  automation:     AutomationModule,
  admin:          AdminPanel,
  'change-password': ChangePassword,
};

// Map frontend module IDs to backend module keys (exact mapping from specification)
const MODULE_KEY_MAP = {
  dashboard: 'dashboard',
  finance: 'finance',
  hr: 'human_resources',
  inventory: 'inventory',
  manufacturing: 'manufacturing',
  procurement: 'procurement',
  crm: 'crm_pipeline',
  payroll: 'payroll',
  assets: 'fixed_assets',
  projects: 'projects',
  supplychain: 'supply_chain',
  ecommerce: 'ecommerce',
  analytics: 'analytics_hub',
  banking: 'banking',
  healthcare: 'healthcare',
  education: 'education',
  sustainability: 'sustainability',
  marketing: 'marketing',
  security: 'security',
  mobile: 'mobile',
  migration: 'migration_hub',
  ai: 'ai',
  support: 'support',
  automation: 'rpa_automation',
  admin: 'admin',
  'change-password': 'change-password',
};

const ModuleFallback = () => (
  <div className="p-8 grid grid-cols-1 gap-4">
    <SkeletonLoader variant="card" />
    <SkeletonLoader variant="list" />
    <SkeletonLoader variant="card" />
  </div>
);

export default function App() {
  const { activeModule, theme, currentUser, token, demoMode, userPermissions, allowedModules, setActiveModule } = useERPStore();
  const ActiveComponent = MODULE_MAP[activeModule] || Dashboard;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const isAuthenticated = demoMode || (currentUser && token);

  // Check if user has access to the current module (route guard)
  const hasModuleAccess = () => {
    // Allow access in demo mode
    if (demoMode) return true;
    
    // CEO has access to all modules
    if (currentUser?.isCEO) return true;
    
    // Dashboard is always accessible
    if (activeModule === 'dashboard') return true;
    
    // Admin module is CEO-only
    if (activeModule === 'admin') return false;
    
    // If no allowed_modules, deny access
    if (!allowedModules || allowedModules.length === 0) return false;
    
    // If allowed_modules contains "all", allow access
    if (allowedModules.includes('all')) return true;
    
    // Check if module is in allowed_modules array
    const moduleKey = MODULE_KEY_MAP[activeModule];
    return allowedModules.includes(moduleKey);
  };

  // Redirect CEO to admin panel if they try to access dashboard
  useEffect(() => {
    if (currentUser?.isCEO && activeModule === 'dashboard') {
      setActiveModule('admin');
    }
  }, [currentUser, activeModule, setActiveModule]);

  if (!isAuthenticated) {
    return (
      <>
        <FollowCursor />
        <SignIn />
      </>
    );
  }

  // Show access denied if user doesn't have permission for the module
  if (!hasModuleAccess()) {
    return (
      <>
        <FollowCursor />
        <AccessDenied />
      </>
    );
  }

  return (
    <AppShell>
      <FollowCursor />
      <Suspense fallback={<ModuleFallback />}>
        <ActiveComponent />
      </Suspense>
    </AppShell>
  );
}


