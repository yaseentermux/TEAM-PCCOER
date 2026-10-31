// [M4] Billing routes. M1's router spreads these under the staff layout (/app) and the portal layout (/portal).
import type { RouteObject } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import InvoicesListPage from "./pages/InvoicesListPage";
import InvoiceDetailPage from "./pages/InvoiceDetailPage";
import PaymentsListPage from "./pages/PaymentsListPage";
import BillingRunsPage from "./pages/BillingRunsPage";
import MyInvoicesPage from "./pages/portal/MyInvoicesPage";
import MyInvoiceDetailPage from "./pages/portal/MyInvoiceDetailPage";

export const billingAdminRoutes: RouteObject[] = [
  { path: "dashboard", element: <DashboardPage /> },
  { path: "invoices", element: <InvoicesListPage /> },
  { path: "invoices/:id", element: <InvoiceDetailPage /> },
  { path: "payments", element: <PaymentsListPage /> },
  { path: "billing/runs", element: <BillingRunsPage /> },
];

export const billingPortalRoutes: RouteObject[] = [
  { path: "invoices", element: <MyInvoicesPage /> },
  { path: "invoices/:id", element: <MyInvoiceDetailPage /> },
];

// Sidebar entries for M1's menu.ts
export const billingMenu = [
  { label: "Dashboard", to: "/app/dashboard", roles: ["ADMIN", "INTERNAL"] },
  { label: "Invoices", to: "/app/invoices", roles: ["ADMIN", "INTERNAL"] },
  { label: "Payments", to: "/app/payments", roles: ["ADMIN", "INTERNAL"] },
  { label: "Billing runs", to: "/app/billing/runs", roles: ["ADMIN", "INTERNAL"] },
];
