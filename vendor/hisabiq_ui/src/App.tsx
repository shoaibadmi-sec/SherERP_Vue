import './settings/navigationGuard';
import { lazy } from 'react';
import { PageBoundary } from './components/layout/PageBoundary';

import {SaasProvider} from './saas/SaasProvider';
import {SaasShell,Guard} from './saas/SaasShell';

import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext';
import { Toaster } from 'sonner';

import { AppShell } from './components/layout/AppShell';

const TenantSettingsPage = lazy(() => import('./settings/TenantSettingsPage').then(module => ({ default: module.TenantSettingsPage })));
const PlansPage = lazy(() => import('./saas/billing/PlansPage').then(module => ({ default: module.PlansPage })));
const SubscriptionsPage = lazy(() => import('./saas/billing/SubscriptionsPage').then(module => ({ default: module.SubscriptionsPage })));
const InvoicesPage = lazy(() => import('./saas/billing/InvoicesPage').then(module => ({ default: module.InvoicesPage })));
const InvoicePage = lazy(() => import('./saas/billing/InvoicesPage').then(module => ({ default: module.InvoicePage })));
const PaymentsPage = lazy(() => import('./saas/billing/PaymentsPage').then(module => ({ default: module.PaymentsPage })));
const PaymentReview = lazy(() => import('./saas/billing/PaymentsPage').then(module => ({ default: module.PaymentReview })));
const SmsPage = lazy(() => import('./saas/messaging/SmsPage').then(module => ({ default: module.SmsPage })));
const ServicesPage = lazy(() => import('./saas/services/ServicesPage').then(module => ({ default: module.ServicesPage })));
const ServiceOrderPage = lazy(() => import('./saas/services/ServicesPage').then(module => ({ default: module.ServiceOrderPage })));
const TicketsPage = lazy(() => import('./saas/support/TicketsPage').then(module => ({ default: module.TicketsPage })));
const TicketPage = lazy(() => import('./saas/support/TicketsPage').then(module => ({ default: module.TicketPage })));
const KnowledgePage = lazy(() => import('./saas/support/KnowledgePage').then(module => ({ default: module.KnowledgePage })));
const TenantSubscription = lazy(() => import('./saas/TenantPortal').then(module => ({ default: module.TenantSubscription })));
const TenantSupport = lazy(() => import('./saas/TenantPortal').then(module => ({ default: module.TenantSupport })));
const AnnouncementsPage = lazy(() => import('./saas/admin/AnnouncementsPage').then(module => ({ default: module.AnnouncementsPage })));
const SaasReports = lazy(() => import('./saas/admin/ReportsPage').then(module => ({ default: module.ReportsPage })));
const AuditPage = lazy(() => import('./saas/admin/AuditPage').then(module => ({ default: module.AuditPage })));
const SettingsPage = lazy(() => import('./saas/admin/SettingsPage').then(module => ({ default: module.SettingsPage })));
const OverviewPage = lazy(() => import('./saas/OverviewPage').then(module => ({ default: module.OverviewPage })));
const TeamPage = lazy(() => import('./saas/admin/TeamPage').then(module => ({ default: module.TeamPage })));
const TenantsPage = lazy(() => import('./saas/tenants/TenantsPage').then(module => ({ default: module.TenantsPage })));
const TenantPage = lazy(() => import('./saas/tenants/TenantsPage').then(module => ({ default: module.TenantPage })));
const BrandGuide = lazy(() => import('./pages/BrandGuide').then(module => ({ default: module.BrandGuide })));
const LoginPreviewPage = lazy(() => import('./features/auth/LoginPreviewPage').then(module => ({ default: module.LoginPreviewPage })));
const SignupPreviewPage = lazy(() => import('./features/auth/AuthFlowPage').then(module => ({ default: module.SignupPreviewPage })));
const RecoveryPreviewPage = lazy(() => import('./features/auth/AuthFlowPage').then(module => ({ default: module.RecoveryPreviewPage })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Pos = lazy(() => import('./pages/Pos').then(module => ({ default: module.Pos })));
const Sales = lazy(() => import('./pages/Sales').then(module => ({ default: module.Sales })));
const OnlineSales = lazy(() => import('./pages/OnlineSales').then(module => ({ default: module.OnlineSales })));
const ErpNotifications = lazy(() => import('./pages/ErpNotifications').then(module => ({ default: module.ErpNotifications })));
const Quotations = lazy(() => import('./pages/Quotations').then(module => ({ default: module.Quotations })));
const Warranty = lazy(() => import('./pages/Warranty').then(module => ({ default: module.Warranty })));
const Reconciliation = lazy(() => import('./pages/Reconciliation').then(module => ({ default: module.Reconciliation })));
const Finance = lazy(() => import('./pages/Finance').then(module => ({ default: module.Finance })));
const Products = lazy(() => import('./pages/Products').then(module => ({ default: module.Products })));
const Parties = lazy(() => import('./pages/Parties').then(module => ({ default: module.Parties })));
const Purchases = lazy(() => import('./pages/Purchases').then(module => ({ default: module.Purchases })));
const Vendors = lazy(() => import('./pages/Vendors').then(module => ({ default: module.Vendors })));
const PurchaseEditor = lazy(() => import('./pages/PurchaseEditor').then(module => ({ default: module.PurchaseEditor })));
const Expenses = lazy(() => import('./pages/Expenses').then(module => ({ default: module.Expenses })));
const Reports = lazy(() => import('./pages/Reports').then(module => ({ default: module.Reports })));
const Daybook = lazy(() => import('./pages/Daybook').then(module => ({ default: module.Daybook })));
const Accounts = lazy(() => import('./pages/Accounts').then(module => ({ default: module.Accounts })));
const AuditLedger = lazy(() => import('./pages/AuditLedger').then(module => ({ default: module.AuditLedger })));
const GlobalSearch = lazy(() => import('./pages/GlobalSearch').then(module => ({ default: module.GlobalSearch })));

export function App() {
  const { resolvedTheme } = useTheme();
  return (
    <SaasProvider><HashRouter>
      <Toaster theme={resolvedTheme} position="bottom-right" toastOptions={{ style: { fontFamily: 'Geist' } }} />
      <Routes>
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/design-system" element={<PageBoundary><BrandGuide /></PageBoundary>} />
        <Route path="/login" element={<PageBoundary><LoginPreviewPage view="password" /></PageBoundary>} />
        <Route path="/login/pin" element={<PageBoundary><LoginPreviewPage view="pin" /></PageBoundary>} />
        <Route path="/login/accounts" element={<PageBoundary><LoginPreviewPage view="accounts" /></PageBoundary>} />
        <Route path="/signup" element={<PageBoundary><SignupPreviewPage /></PageBoundary>} />
        <Route path="/register" element={<Navigate to="/signup" replace />} />
        <Route path="/login/signup" element={<Navigate to="/signup" replace />} />
        <Route path="/recovery" element={<PageBoundary><RecoveryPreviewPage /></PageBoundary>} />
        <Route path="/forgot-password" element={<Navigate to="/recovery" replace />} />
        <Route path="/login/recovery" element={<Navigate to="/recovery" replace />} />
        <Route path="/saas" element={<SaasShell />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="plans" element={<Guard permission="plans.view"><PlansPage /></Guard>} />
          <Route path="subscriptions" element={<Guard permission="subscriptions.view"><SubscriptionsPage /></Guard>} />
          <Route path="invoices" element={<Guard permission="billing.view"><InvoicesPage /></Guard>} />
          <Route path="invoices/:id" element={<Guard permission="billing.view"><InvoicePage /></Guard>} />
          <Route path="payments" element={<Guard permission="payments.view"><PaymentsPage /></Guard>} />
          <Route path="payments/:id" element={<Guard permission="payments.view"><PaymentReview /></Guard>} />
          <Route path="sms" element={<Guard permission="sms.view"><SmsPage /></Guard>} />
          <Route path="services" element={<Guard permission="services.view"><ServicesPage /></Guard>} />
          <Route path="services/:id" element={<Guard permission="services.view"><ServiceOrderPage /></Guard>} />
          <Route path="support" element={<Guard permission="support.view"><TicketsPage /></Guard>} />
          <Route path="support/:id" element={<Guard permission="support.view"><TicketPage /></Guard>} />
          <Route path="knowledge" element={<Guard permission="knowledge.view"><KnowledgePage /></Guard>} />
          <Route path="announcements" element={<Guard permission="announcements.view"><AnnouncementsPage /></Guard>} />
          <Route path="reports" element={<Guard permission="reports.view"><SaasReports /></Guard>} />
          <Route path="audit" element={<Guard permission="audit.view"><AuditPage /></Guard>} />
          <Route path="settings" element={<Guard permission="settings.view"><SettingsPage /></Guard>} />
          <Route path="team" element={<Guard permission="team.view"><TeamPage /></Guard>} />
          <Route path="tenants" element={<Guard permission="tenants.view"><TenantsPage /></Guard>} />
          <Route path="tenants/:id" element={<Guard permission="tenants.view"><TenantPage /></Guard>} />
        </Route>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="subscription" element={<TenantSubscription />} /><Route path="support" element={<TenantSupport />} /><Route path="support/:id" element={<TenantSupport detail />} />
          <Route path="settings" element={<Navigate to="business" replace />} />
          <Route path="settings/:section" element={<TenantSettingsPage />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="search" element={<GlobalSearch />} />
          <Route path="pos" element={<Pos />} />
          <Route path="counter" element={<Finance counterOnly />} />
          <Route path="sales" element={<Sales />} />
          <Route path="quotations" element={<Quotations />} />
          <Route path="online-sales" element={<OnlineSales />} />
          <Route path="notifications" element={<ErpNotifications />} />
          <Route path="warranty" element={<Warranty />} />
          <Route path="reconciliation" element={<Reconciliation />} />
          <Route path="finance" element={<Finance />} />
          <Route path="daybook" element={<Daybook />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="audit-ledger" element={<AuditLedger />} />
          <Route path="products" element={<Products />} />
          <Route path="parties" element={<Parties />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="purchases/new" element={<PurchaseEditor />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter></SaasProvider>
  );
}

