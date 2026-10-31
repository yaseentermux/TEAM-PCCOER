import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { PortalLayout } from "./components/layout/PortalLayout";

// Auth feature pages
import { LoginPage } from "./features/auth/LoginPage";
import { SignupPage } from "./features/auth/SignupPage";
import { ForgotPasswordPage } from "./features/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./features/auth/ResetPasswordPage";
import { ForbiddenPage } from "./features/auth/ForbiddenPage";
import { NotFoundPage } from "./features/auth/NotFoundPage";

// Dashboard & Management pages
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { UsersPage } from "./features/users/UsersPage";
import { CustomersPage } from "./features/customers/CustomersPage";
import { CustomerDetailPage } from "./features/customers/CustomerDetailPage";
import { ProfilePage } from "./features/profile/ProfilePage";

// Customer Portal pages
import { PortalDashboardPage } from "./features/portal/PortalDashboardPage";
import { PortalSubscriptionsPage } from "./features/portal/PortalSubscriptionsPage";
import { PortalInvoicesPage } from "./features/portal/PortalInvoicesPage";
import { PortalPlansPage } from "./features/portal/PortalPlansPage";

// Placeholder for upcoming M2/M3/M4 modules
import { ModulePlaceholderPage } from "./features/placeholder/ModulePlaceholderPage";

// Smart root redirect
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

function App() {
  return (
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
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Users & Staff (ADMIN only) */}
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            {/* Customers (ADMIN & INTERNAL) */}
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />

            {/* User Profile */}
            <Route path="profile" element={<ProfilePage />} />

            {/* M2 Catalog & Pricing Placeholders */}
            <Route
              path="products"
              element={
                <ModulePlaceholderPage
                  title="Products"
                  moduleName="M2 Product Catalog"
                  description="Manage subscription products, variants, and recurring units"
                />
              }
            />
            <Route
              path="plans"
              element={
                <ModulePlaceholderPage
                  title="Subscription Plans"
                  moduleName="M2 Pricing & Plans"
                  description="Configure pricing tiers, billing frequencies, and recurring models"
                />
              }
            />
            <Route
              path="taxes"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <ModulePlaceholderPage
                    title="Taxes & Fiscal Positions"
                    moduleName="M2 Tax Engine"
                    description="Define GST, VAT, and fiscal mapping rules"
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="discounts"
              element={
                <ModulePlaceholderPage
                  title="Discounts & Coupons"
                  moduleName="M2 Discounts"
                  description="Manage seasonal promotions, volume discounts, and coupon codes"
                />
              }
            />

            {/* M3 Sales & Contracts Placeholders */}
            <Route
              path="quotation-templates"
              element={
                <ModulePlaceholderPage
                  title="Quotation Templates"
                  moduleName="M3 Sales & Quotations"
                  description="Create reusable sales quotation templates with default recurring terms"
                />
              }
            />
            <Route
              path="subscriptions"
              element={
                <ModulePlaceholderPage
                  title="Subscriptions"
                  moduleName="M3 Subscription Engine"
                  description="Track recurring subscription contracts, auto-renewals, and pause/resume states"
                />
              }
            />

            {/* M4 Billing & Finance Placeholders */}
            <Route
              path="invoices"
              element={
                <ModulePlaceholderPage
                  title="Invoices"
                  moduleName="M4 Invoicing"
                  description="Review recurring draft and posted invoices, line items, and tax breakdowns"
                />
              }
            />
            <Route
              path="payments"
              element={
                <ModulePlaceholderPage
                  title="Payments"
                  moduleName="M4 Payment Processing"
                  description="Inspect payment transactions, refunds, and reconciliation status"
                />
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <ModulePlaceholderPage
                    title="Financial & MRR Reports"
                    moduleName="M4 Analytics"
                    description="Analyze MRR, ARR, churn rate, and customer lifetime value"
                  />
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
            <Route path="invoices" element={<PortalInvoicesPage />} />
            <Route path="plans" element={<PortalPlansPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Fallback 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
