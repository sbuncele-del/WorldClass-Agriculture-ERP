import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { ConfigProvider, Spin } from 'antd';
import { antdTheme } from './theme/antd.theme';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// Multi-Tenant Context Providers
import { ClientProvider } from './contexts/ClientContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { UserProvider } from './contexts/UserContext';
import { FeatureFlagProvider } from './contexts/FeatureFlagContext';

// Critical path components (loaded immediately)
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

// Premium Layout Components (loaded immediately for shell)
import PremiumSidebar from './components/layout/PremiumSidebar';
import PremiumTopBar from './components/layout/PremiumTopBar';

// Role-Based Workspace (Main Dashboard Hub)
const RoleBasedWorkspace = lazy(() => import('./components/RoleBasedWorkspace'));

// Landing Page (lazy loaded for performance)
const LandingPage = lazy(() => import('./pages/LandingPage'));

// Footer Pages (lazy loaded)
const About = lazy(() => import('./pages/About'));
const Careers = lazy(() => import('./pages/Careers'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const Security = lazy(() => import('./pages/Security'));
const Contact = lazy(() => import('./pages/Contact'));
const Documentation = lazy(() => import('./pages/Documentation'));
const Support = lazy(() => import('./pages/Support'));
const Partners = lazy(() => import('./pages/Partners'));
const Blog = lazy(() => import('./pages/Blog'));
const CaseStudies = lazy(() => import('./pages/CaseStudies'));
const Pricing = lazy(() => import('./pages/Pricing'));
const ConceptDocument = lazy(() => import('./pages/public/ConceptDocument'));

// Lazy-loaded Authentication Pages
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ResendVerification = lazy(() => import('./pages/ResendVerification'));
const AcceptInvite = lazy(() => import('./pages/AcceptInvite'));

// Lazy-loaded Main Pages
const EnterpriseDashboard = lazy(() => import('./pages/EnterpriseDashboard'));
const DriverDashboard = lazy(() => import('./pages/DriverDashboard'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Billing = lazy(() => import('./pages/Billing'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'));
const TenantSettings = lazy(() => import('./pages/TenantSettings'));
const APITestDashboard = lazy(() => import('./pages/APITestDashboard'));
const MyWorkspace = lazy(() => import('./pages/MyWorkspace'));

// Lazy-loaded Module Pages
const Sales = lazy(() => import('./pages/Sales'));
const Purchase = lazy(() => import('./pages/Purchase'));
const FinancialManagement = lazy(() => import('./pages/FinancialManagement'));
const CashManagement = lazy(() => import('./pages/CashManagement'));
const BankingDashboard = lazy(() => import('./pages/BankingDashboard'));
const TreasuryManagement = lazy(() => import('./pages/TreasuryManagement'));
const AuditReady = lazy(() => import('./pages/AuditReady'));

// Lazy-loaded Modules
const InventoryDashboard = lazy(() => import('./modules/inventory/InventoryDashboard'));
const HRDashboard = lazy(() => import('./modules/hr/HRDashboard'));
const AssetDashboard = lazy(() => import('./modules/assets/AssetDashboard'));
const WarehouseDashboard = lazy(() => import('./modules/warehouse/WarehouseDashboard'));
const ManufacturingDashboard = lazy(() => import('./modules/manufacturing/ManufacturingDashboard'));
const LogisticsModule = lazy(() => import('./modules/logistics/LogisticsModule'));
const SARSSentinel = lazy(() => import('./modules/sars-sentinel/SARSSentinel'));
const ProjectsModule = lazy(() => import('./modules/projects/ProjectsModule'));
const CommunicationModule = lazy(() => import('./modules/communication/CommunicationModule'));
const CalendarModule = lazy(() => import('./modules/calendar/CalendarModule'));
const ProposalsModule = lazy(() => import('./modules/proposals/ProposalsModule'));
const ClientPortal = lazy(() => import('./modules/proposals/pages/ClientPortal'));
const PortalAccess = lazy(() => import('./modules/proposals/pages/PortalAccess'));

// Lazy-loaded Practice Module
const PracticeDashboard = lazy(() => 
  import('./modules/practice/PracticeDashboard').then(module => ({ default: module.PracticeDashboard }))
);
const ClientManagement = lazy(() => import('./modules/practice/pages/ClientManagement'));

// Enterprise Hub Pages (Premium SaaS Design)
const MultiEntityHub = lazy(() => import('./modules/multi-entity/MultiEntityHub'));
const BankingHub = lazy(() => import('./modules/banking/BankingHub'));
const PracticeHub = lazy(() => import('./modules/professional/PracticeHub'));
const HRHub = lazy(() => import('./modules/hr/HRHub'));
const FinancialHub = lazy(() => import('./modules/financial/FinancialHub'));
const SalesHub = lazy(() => import('./modules/sales/SalesHub'));
const InventoryHub = lazy(() => import('./modules/inventory/InventoryHub'));
const PurchaseHub = lazy(() => import('./modules/purchase/PurchaseHub'));
const AssetsHub = lazy(() => import('./modules/assets/AssetsHub'));
const WarehouseHub = lazy(() => import('./modules/warehouse/WarehouseHub'));
const ManufacturingHub = lazy(() => import('./modules/manufacturing/ManufacturingHub'));
const LogisticsHub = lazy(() => import('./modules/logistics/LogisticsHub'));
const MiningHub = lazy(() => import('./modules/mining/MiningHub'));
const AgricultureHub = lazy(() => import('./modules/agriculture/AgricultureHub'));
const ProjectsHub = lazy(() => import('./modules/projects/ProjectsHub'));
const ProposalsHub = lazy(() => import('./modules/proposals/ProposalsHub'));
const ProposalEditor = lazy(() => import('./modules/proposals/ProposalEditor'));
const ProProposalBuilder = lazy(() => import('./modules/proposals/ProProposalBuilder'));
const SmartProposalBuilder = lazy(() => import('./modules/proposals/SmartProposalBuilder'));
const CoffeePitchDeck = lazy(() => import('./modules/proposals/CoffeePitchDeck'));
const SiyaBusaPitchDeck = lazy(() => import('./modules/proposals/SiyaBusaPitchDeck'));
const ConstructionHub = lazy(() => import('./modules/construction/ConstructionHub'));
const HealthcareHub = lazy(() => import('./modules/healthcare/HealthcareHub'));
const PropertyHub = lazy(() => import('./modules/property/PropertyHub'));
const CommunicationsHub = lazy(() => import('./modules/communication/CommunicationsHub'));
const AuditReadyHub = lazy(() => import('./modules/compliance/AuditReadyHub'));
const RegulatoryHub = lazy(() => import('./modules/compliance/RegulatoryHub'));
const AdminHub = lazy(() => import('./modules/admin/AdminHub'));

// Financial Sub-Pages
const Dimensions = lazy(() => import('./pages/Dimensions'));
const ChartOfAccountsPage = lazy(() => import('./modules/financial/components/ChartOfAccountsPage'));
const SuperAdminPanel = lazy(() => import('./modules/super-admin/SuperAdminPanel'));
const PlatformLogin = lazy(() => import('./modules/super-admin/PlatformLogin'));
const AuditorPortalPreview = lazy(() => import('./modules/compliance/AuditorPortalPreview'));

// Lazy-loaded Industry Pages
const Healthcare = lazy(() => import('./pages/Healthcare'));
const Construction = lazy(() => import('./pages/Construction'));
const Agriculture = lazy(() => import('./pages/Agriculture'));
const Mining = lazy(() => import('./pages/Mining'));
const Wholesale = lazy(() => import('./pages/Wholesale'));
const ProfessionalServices = lazy(() => import('./pages/ProfessionalServices'));

// Lazy-loaded Admin Pages
const UserManagement = lazy(() => import('./pages/UserManagement'));
const SystemSettings = lazy(() => import('./pages/SystemSettings'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));

// Component Preview (no login required)
const ComponentPreview = lazy(() => import('./pages/ComponentPreview'));

// Lazy-loaded UI Components
const CoPilotAssistant = lazy(() => 
  import('./components/ui/CoPilotAssistant').then(module => ({ default: module.CoPilotAssistant }))
);

// Loading component for Suspense
const PageLoader = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '400px' 
  }}>
    <Spin size="large" tip="Loading..." />
  </div>
);


function App() {
  // Load saved theme on app startup
  useEffect(() => {
    const savedTheme = localStorage.getItem('siyabusa-theme-colors');
    if (savedTheme) {
      try {
        const colors = JSON.parse(savedTheme);
        document.documentElement.style.setProperty('--primary-color', colors.primary);
        document.documentElement.style.setProperty('--secondary-color', colors.secondary);
        document.documentElement.style.setProperty('--gradient', colors.gradient);
        document.documentElement.style.setProperty('--theme-gradient', colors.gradient);
        document.documentElement.style.setProperty('--theme-bg', colors.bg || '#f8fafc');
        document.documentElement.style.setProperty('--theme-card-bg', colors.cardBg || '#ffffff');
        document.documentElement.style.setProperty('--theme-primary', colors.primary);
        document.documentElement.style.setProperty('--theme-secondary', colors.secondary);
        document.documentElement.style.setProperty('--sidebar-active-bg', colors.gradient);
        document.documentElement.style.setProperty('--button-gradient', colors.gradient);
        document.documentElement.style.setProperty('--chart-gradient', colors.gradient);
        
        const themeId = localStorage.getItem('siyabusa-theme') || 'default';
        document.body.setAttribute('data-theme', themeId);
      } catch {
        // Silently fail in production
        if (import.meta.env.DEV) {
          console.warn('Failed to load theme');
        }
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <ConfigProvider theme={antdTheme}>
        <UserProvider>
          <FeatureFlagProvider>
            <ClientProvider>
              <CurrencyProvider>
                <Router>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Landing Page - Public Homepage */}
                      <Route path="/" element={<LandingPage />} />
                      
                      {/* Public Footer Pages - No Layout */}
                      <Route path="/about" element={<About />} />
                      <Route path="/careers" element={<Careers />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/terms" element={<TermsOfService />} />
                      <Route path="/security" element={<Security />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/documentation" element={<Documentation />} />
                      <Route path="/support" element={<Support />} />
                      <Route path="/partners" element={<Partners />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/case-studies" element={<CaseStudies />} />
                      <Route path="/concept-document" element={<ConceptDocument />} />
                      <Route path="/stakeholders" element={<ConceptDocument />} />
                      
                      {/* Public Client Portal - Access with code (no login required) */}
                      <Route path="/portal/:id" element={<PortalAccess />} />
                      <Route path="/portal/:id/view" element={<ClientPortal />} />
                      
                      {/* Preview Routes - For approval before deployment */}
                      <Route path="/preview/components" element={<ComponentPreview />} />
                      <Route path="/preview/assets-hub" element={<AssetsHub />} />
                      <Route path="/preview/financial-hub" element={<FinancialHub />} />
                      <Route path="/preview/sales-hub" element={<SalesHub />} />
                      <Route path="/preview/inventory-hub" element={<InventoryHub />} />
                      <Route path="/preview/purchase-hub" element={<PurchaseHub />} />
                      <Route path="/preview/warehouse-hub" element={<WarehouseHub />} />
                      <Route path="/preview/manufacturing-hub" element={<ManufacturingHub />} />
                      <Route path="/preview/logistics-hub" element={<LogisticsHub />} />
                      <Route path="/preview/mining-hub" element={<MiningHub />} />
                      <Route path="/preview/agriculture-hub" element={<AgricultureHub />} />
                      <Route path="/preview/projects-hub" element={<ProjectsHub />} />
                      <Route path="/preview/proposals-hub" element={<ProposalsHub />} />
                      <Route path="/preview/construction-hub" element={<ConstructionHub />} />
                      <Route path="/preview/healthcare-hub" element={<HealthcareHub />} />
                      <Route path="/preview/property-hub" element={<PropertyHub />} />
                      <Route path="/preview/communications-hub" element={<CommunicationsHub />} />
                      <Route path="/preview/audit-ready-hub" element={<AuditReadyHub />} />
                      <Route path="/preview/regulatory-hub" element={<RegulatoryHub />} />
                      <Route path="/preview/admin-hub" element={<AdminHub />} />
                      <Route path="/preview/auditor-portal" element={<AuditorPortalPreview />} />
                      
                      {/* Direct Hub Routes */}
                      <Route path="/audit-ready" element={<AuditReadyHub />} />
                      <Route path="/regulatory" element={<RegulatoryHub />} />
                      <Route path="/admin" element={<AdminHub />} />
                      
                      {/* Public Routes - No Layout */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/pricing" element={<Pricing />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/verify-email" element={<VerifyEmail />} />
                      <Route path="/resend-verification" element={<ResendVerification />} />
                      <Route path="/accept-invite" element={<AcceptInvite />} />

                      {/* Platform Admin - Hidden from regular clients */}
                      <Route path="/platform-admin/login" element={<PlatformLogin />} />
                      <Route path="/platform-admin/*" element={<SuperAdminPanel />} />
                      <Route path="/platform-admin" element={<SuperAdminPanel />} />

                      {/* Onboarding - Protected but no sidebar/topbar */}
                      <Route
                        path="/onboarding"
                        element={
                          <ProtectedRoute>
                            <Onboarding />
                          </ProtectedRoute>
                        }
                      />

                      {/* Driver App - Has its own authentication (driverToken), NOT JWT protected */}
                      <Route
                        path="/driver"
                        element={<DriverDashboard />}
                      />
                      
                      {/* Protected Routes - With Premium Layout */}
                      <Route path="/app/*" element={
                        <ProtectedRoute>
                          <div className="app premium-layout">
                            <PremiumTopBar />
                            <PremiumSidebar />
                            <main className="main-content-v2">
                              <Suspense fallback={<PageLoader />}>
                                <Routes>
                                  {/* Main Dashboard */}
                                  <Route path="/" element={<RoleBasedWorkspace />} />
                                  <Route path="/dashboard" element={<RoleBasedWorkspace />} />
                                  <Route path="/workspace" element={<RoleBasedWorkspace />} />
                                  
                                  {/* Core Business Hubs */}
                                  <Route path="/sales/*" element={<SalesHub />} />
                                  <Route path="/sales-hub/*" element={<SalesHub />} />
                                  <Route path="/purchase/*" element={<PurchaseHub />} />
                                  <Route path="/purchase-hub/*" element={<PurchaseHub />} />
                                  <Route path="/inventory/*" element={<InventoryHub />} />
                                  <Route path="/inventory-hub/*" element={<InventoryHub />} />
                                  <Route path="/warehouse/*" element={<WarehouseHub />} />
                                  <Route path="/warehouse-hub/*" element={<WarehouseHub />} />
                                  <Route path="/manufacturing/*" element={<ManufacturingHub />} />
                                  <Route path="/manufacturing-hub/*" element={<ManufacturingHub />} />
                                  
                                  {/* Financial Hubs */}
                                  <Route path="/financial" element={<FinancialHub />} />
                                  <Route path="/financial/chart-of-accounts" element={<ChartOfAccountsPage />} />
                                  <Route path="/financial/dimensions" element={<Dimensions />} />
                                  <Route path="/financial/*" element={<FinancialHub />} />
                                  <Route path="/financial-hub/*" element={<FinancialHub />} />
                                  <Route path="/banking/*" element={<BankingHub />} />
                                  <Route path="/banking-hub/*" element={<BankingHub />} />
                                  <Route path="/assets/*" element={<AssetsHub />} />
                                  <Route path="/assets-hub/*" element={<AssetsHub />} />
                                  <Route path="/treasury" element={<TreasuryManagement />} />
                                  <Route path="/cash" element={<CashManagement />} />
                                  <Route path="/cash-management" element={<CashManagement />} />
                                  
                                  {/* HR & Practice Hubs */}
                                  <Route path="/hr/*" element={<HRHub />} />
                                  <Route path="/hr-hub/*" element={<HRHub />} />
                                  <Route path="/practice/*" element={<PracticeHub />} />
                                  <Route path="/practice-hub/*" element={<PracticeHub />} />
                                  
                                  {/* Operations Hubs */}
                                  <Route path="/logistics/*" element={<LogisticsHub />} />
                                  <Route path="/logistics-hub/*" element={<LogisticsHub />} />
                                  <Route path="/projects/*" element={<ProjectsHub />} />
                                  <Route path="/projects-hub/*" element={<ProjectsHub />} />
                                  <Route path="/proposals/pitch/coffee" element={<CoffeePitchDeck />} />
                                  <Route path="/proposals/pitch/siyabusa" element={<SiyaBusaPitchDeck />} />
                                  <Route path="/proposals/new" element={<SmartProposalBuilder />} />
                                  <Route path="/proposals/builder" element={<SmartProposalBuilder />} />
                                  <Route path="/proposals/edit/:id" element={<ProposalEditor />} />
                                  <Route path="/proposals" element={<ProposalsHub />} />
                                  <Route path="/communication/*" element={<CommunicationsHub />} />
                                  <Route path="/communications-hub/*" element={<CommunicationsHub />} />
                                  <Route path="/calendar/*" element={<CalendarModule />} />
                                  
                                  {/* Industry Hubs */}
                                  <Route path="/healthcare/*" element={<HealthcareHub />} />
                                  <Route path="/healthcare-hub/*" element={<HealthcareHub />} />
                                  <Route path="/construction/*" element={<ConstructionHub />} />
                                  <Route path="/construction-hub/*" element={<ConstructionHub />} />
                                  <Route path="/agriculture/*" element={<AgricultureHub />} />
                                  <Route path="/agriculture-hub/*" element={<AgricultureHub />} />
                                  <Route path="/mining/*" element={<MiningHub />} />
                                  <Route path="/mining-hub/*" element={<MiningHub />} />
                                  <Route path="/property/*" element={<PropertyHub />} />
                                  <Route path="/property-hub/*" element={<PropertyHub />} />
                                  
                                  {/* Compliance & Admin Hubs */}
                                  <Route path="/audit-ready" element={<AuditReadyHub />} />
                                  <Route path="/regulatory" element={<RegulatoryHub />} />
                                  <Route path="/sars/*" element={<SARSSentinel />} />
                                  <Route path="/admin/*" element={<AdminHub />} />
                                  <Route path="/admin-hub/*" element={<AdminHub />} />
                                  <Route path="/multi-entity" element={<MultiEntityHub />} />
                                  
                                  {/* Settings & Profile */}
                                  <Route path="/profile" element={<ProfileSettings />} />
                                  <Route path="/tenant-settings" element={<TenantSettings />} />
                                  <Route path="/users" element={<UserManagement />} />
                                  <Route path="/settings" element={<SystemSettings />} />
                                  <Route path="/audit-logs" element={<AuditLogs />} />
                                  <Route path="/help" element={<HelpCenter />} />
                                  <Route path="/onboarding" element={<Onboarding />} />
                                  <Route path="/billing" element={<Billing />} />
                                  <Route path="/api-test" element={<APITestDashboard />} />
                                </Routes>
                              </Suspense>
                            </main>
                            <Suspense fallback={null}>
                              <CoPilotAssistant />
                            </Suspense>
                          </div>
                        </ProtectedRoute>
                      } />
                    </Routes>
                  </Suspense>
                </Router>
              </CurrencyProvider>
            </ClientProvider>
          </FeatureFlagProvider>
        </UserProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App;
