import React, { Suspense, lazy } from 'react';
import AppShell from './components/layout/AppShell';
import { useERPStore } from './store/useERPStore';
import SkeletonLoader from './components/ui/SkeletonLoader';
import FollowCursor from './components/ui/FollowCursor';
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
};

const ModuleFallback = () => (
  <div className="p-8 grid grid-cols-1 gap-4">
    <SkeletonLoader variant="card" />
    <SkeletonLoader variant="list" />
    <SkeletonLoader variant="card" />
  </div>
);

export default function App() {
  const { activeModule, theme } = useERPStore();
  const ActiveComponent = MODULE_MAP[activeModule] || Dashboard;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <AppShell>
      <FollowCursor />
      <Suspense fallback={<ModuleFallback />}>
        <ActiveComponent />
      </Suspense>
    </AppShell>
  );
}

