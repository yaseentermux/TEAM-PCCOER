import type { RouteObject } from "react-router-dom";
import SubscriptionsListPage from "./pages/SubscriptionsListPage";
import SubscriptionDetailPage from "./pages/SubscriptionDetailPage";
import NewSubscriptionPage from "./pages/NewSubscriptionPage";
import QuotationTemplatesListPage from "./pages/QuotationTemplatesListPage";
import QuotationTemplateDetailPage from "./pages/QuotationTemplateDetailPage";

export const salesAdminRoutes: RouteObject[] = [
  { path: "subscriptions", element: <SubscriptionsListPage /> },
  { path: "subscriptions/new", element: <NewSubscriptionPage /> },
  { path: "subscriptions/:id/edit", element: <NewSubscriptionPage /> },
  { path: "subscriptions/:id", element: <SubscriptionDetailPage /> },
  { path: "quotation-templates", element: <QuotationTemplatesListPage /> },
  { path: "quotation-templates/new", element: <QuotationTemplateDetailPage /> },
  { path: "quotation-templates/:id", element: <QuotationTemplateDetailPage /> },
];

export const salesPortalRoutes: RouteObject[] = [];

// Sidebar menu entries for Member 3
export const salesMenu = [
  { label: "Subscriptions", to: "/app/subscriptions", roles: ["ADMIN", "INTERNAL"] },
  { label: "Quotation Templates", to: "/app/quotation-templates", roles: ["ADMIN", "INTERNAL"] },
];

