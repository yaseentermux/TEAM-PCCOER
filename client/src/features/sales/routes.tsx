import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy-loaded page components for Member 3 (Sales & Subscriptions)
const SubscriptionsListPage = lazy(() => import("./pages/SubscriptionsListPage"));
const SubscriptionDetailPage = lazy(() => import("./pages/SubscriptionDetailPage"));
const NewSubscriptionPage = lazy(() => import("./pages/NewSubscriptionPage"));
const QuotationTemplatesListPage = lazy(() => import("./pages/QuotationTemplatesListPage"));
const QuotationTemplateDetailPage = lazy(() => import("./pages/QuotationTemplateDetailPage"));
const MySubscriptionsListPage = lazy(() => import("./pages/portal/MySubscriptionsListPage"));
const MySubscriptionDetailPage = lazy(() => import("./pages/portal/MySubscriptionDetailPage"));
const SubscribeCheckoutPage = lazy(() => import("./pages/portal/SubscribeCheckoutPage"));

function PageLoadingFallback() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 rounded-md" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<PageLoadingFallback />}>
    <Component />
  </Suspense>
);

export const salesAdminRoutes: RouteObject[] = [
  { path: "subscriptions", element: withSuspense(SubscriptionsListPage) },
  { path: "subscriptions/new", element: withSuspense(NewSubscriptionPage) },
  { path: "subscriptions/:id/edit", element: withSuspense(NewSubscriptionPage) },
  { path: "subscriptions/:id", element: withSuspense(SubscriptionDetailPage) },
  { path: "quotation-templates", element: withSuspense(QuotationTemplatesListPage) },
  { path: "quotation-templates/new", element: withSuspense(QuotationTemplateDetailPage) },
  { path: "quotation-templates/:id", element: withSuspense(QuotationTemplateDetailPage) },
];

export const salesPortalRoutes: RouteObject[] = [
  { path: "subscriptions", element: withSuspense(MySubscriptionsListPage) },
  { path: "subscriptions/:id", element: withSuspense(MySubscriptionDetailPage) },
  { path: "subscribe", element: withSuspense(SubscribeCheckoutPage) },
];

// Sidebar menu entries for Member 3
export const salesMenu = [
  { label: "Subscriptions", to: "/app/subscriptions", roles: ["ADMIN", "INTERNAL"] },
  { label: "Quotation Templates", to: "/app/quotation-templates", roles: ["ADMIN", "INTERNAL"] },
];

export const salesPortalMenu = [
  { label: "My subscriptions", to: "/portal/subscriptions", roles: ["CUSTOMER"] },
  { label: "Subscribe to a Plan", to: "/portal/subscribe", roles: ["CUSTOMER"] },
];

