import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { PortalLayout } from "./components/layout/PortalLayout";

// M1: Auth & Administration
import { LoginPage } from "./features/auth/LoginPage";
import { SignupPage } from "./features/auth/SignupPage";
import { ForgotPasswordPage } from "./features/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./features/auth/ResetPasswordPage";
import { ForbiddenPage } from "./features/auth/ForbiddenPage";
import { NotFoundPage } from "./features/auth/NotFoundPage";
import { DashboardPage as PlatformDashboardPage } from "./features/dashboard/DashboardPage";
import { UsersPage } from "./features/users/UsersPage";
import { CustomersPage } from "./features/customers/CustomersPage";
import { CustomerDetailPage } from "./features/customers/CustomerDetailPage";
import { ProfilePage } from "./features/profile/ProfilePage";

// M1: Customer Portal
import { PortalDashboardPage } from "./features/portal/PortalDashboardPage";
import { PortalSubscriptionsPage } from "./features/portal/PortalSubscriptionsPage";
import { PortalPlansPage } from "./features/portal/PortalPlansPage";

// M2: Product Catalog & Pricing
import { ProductsListPage } from "./features/catalog/pages/ProductsListPage";
import { PlansListPage } from "./features/catalog/pages/PlansListPage";
import { DiscountsPage } from "./features/catalog/pages/DiscountsPage";
import { TaxesPage } from "./features/catalog/pages/TaxesPage";
import { PublicPricingPage } from "./features/catalog/pages/PublicPricingPage";

// M3: Sales & Subscription Management
import SubscriptionsListPage from "./features/sales/pages/SubscriptionsListPage";
import SubscriptionDetailPage from "./features/sales/pages/SubscriptionDetailPage";
import NewSubscriptionPage from "./features/sales/pages/NewSubscriptionPage";
import QuotationTemplatesListPage from "./features/sales/pages/QuotationTemplatesListPage";
import QuotationTemplateDetailPage from "./features/sales/pages/QuotationTemplateDetailPage";

// M4: Billing, Payments & Analytics
import BillingDashboardPage from "./features/billing/pages/DashboardPage";
import InvoicesListPage from "./features/billing/pages/InvoicesListPage";
import InvoiceDetailPage from "./features/billing/pages/InvoiceDetailPage";
import PaymentsListPage from "./features/billing/pages/PaymentsListPage";
import BillingRunsPage from "./features/billing/pages/BillingRunsPage";
import MyInvoicesPage from "./features/billing/pages/portal/MyInvoicesPage";
import MyInvoiceDetailPage from "./features/billing/pages/portal/MyInvoiceDetailPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30s
    },
  },
});

// Smart Root Redirect based on user authentication and role
const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Checking session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "CUSTOMER") {
    return <Navigate to="/portal" replace />;
  }

  return <Navigate to="/app/dashboard" replace />;
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Smart Root Redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/forbidden" element={<ForbiddenPage />} />

            {/* Public M2 Pricing Route */}
            <Route path="/pricing" element={<PublicPricingPage />} />

            {/* Internal Staff & Admin Routes */}
            <Route
              path="/app"
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "INTERNAL"]}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<PlatformDashboardPage />} />

              {/* M1: Administration */}
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="customers/:id" element={<CustomerDetailPage />} />
              <Route path="profile" element={<ProfilePage />} />

              {/* M2: Catalog & Pricing */}
              <Route path="products" element={<ProductsListPage />} />
              <Route path="plans" element={<PlansListPage />} />
              <Route path="discounts" element={<DiscountsPage />} />
              <Route
                path="taxes"
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <TaxesPage />
                  </ProtectedRoute>
                }
              />

              {/* M3: Sales & Subscription Management */}
              <Route path="subscriptions" element={<SubscriptionsListPage />} />
              <Route path="subscriptions/new" element={<NewSubscriptionPage />} />
              <Route path="subscriptions/:id/edit" element={<NewSubscriptionPage />} />
              <Route path="subscriptions/:id" element={<SubscriptionDetailPage />} />
              <Route path="quotation-templates" element={<QuotationTemplatesListPage />} />
              <Route path="quotation-templates/new" element={<QuotationTemplateDetailPage />} />
              <Route path="quotation-templates/:id" element={<QuotationTemplateDetailPage />} />

              {/* M4: Billing & Finance */}
              <Route path="invoices" element={<InvoicesListPage />} />
              <Route path="invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="payments" element={<PaymentsListPage />} />
              <Route path="billing-runs" element={<BillingRunsPage />} />
              <Route
                path="reports"
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <BillingDashboardPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Customer Portal Routes */}
            <Route
              path="/portal"
              element={
                <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                  <PortalLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PortalDashboardPage />} />
              <Route path="subscriptions" element={<PortalSubscriptionsPage />} />
              <Route path="invoices" element={<MyInvoicesPage />} />
              <Route path="invoices/:id" element={<MyInvoiceDetailPage />} />
              <Route path="plans" element={<PortalPlansPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Direct convenience aliases for quick demo access */}
            <Route path="/products" element={<Navigate to="/app/products" replace />} />
            <Route path="/plans" element={<Navigate to="/app/plans" replace />} />
            <Route path="/discounts" element={<Navigate to="/app/discounts" replace />} />
            <Route path="/taxes" element={<Navigate to="/app/taxes" replace />} />
            <Route path="/invoices" element={<Navigate to="/app/invoices" replace />} />
            <Route path="/payments" element={<Navigate to="/app/payments" replace />} />
            <Route path="/billing/*" element={<Navigate to="/app/invoices" replace />} />
            <Route path="/subscriptions" element={<Navigate to="/app/subscriptions" replace />} />

            {/* Fallback 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
