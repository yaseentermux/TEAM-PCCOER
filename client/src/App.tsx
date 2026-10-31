import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainAppLayout } from './components/layout/MainAppLayout';

// M2 Features
import { ProductsListPage } from './features/catalog/pages/ProductsListPage';
import { PlansListPage } from './features/catalog/pages/PlansListPage';
import { DiscountsPage } from './features/catalog/pages/DiscountsPage';
import { TaxesPage } from './features/catalog/pages/TaxesPage';
import { PublicPricingPage } from './features/catalog/pages/PublicPricingPage';

// M4 Features
import { DashboardPage } from './features/billing/pages/DashboardPage';
import { InvoicesListPage } from './features/billing/pages/InvoicesListPage';
import { InvoiceDetailPage } from './features/billing/pages/InvoiceDetailPage';
import { PaymentsListPage } from './features/billing/pages/PaymentsListPage';
import { BillingRunsPage } from './features/billing/pages/BillingRunsPage';
import { MyInvoicesPage } from './features/billing/pages/portal/MyInvoicesPage';
import { MyInvoiceDetailPage } from './features/billing/pages/portal/MyInvoiceDetailPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30s
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<MainAppLayout />}>
            <Route path="/" element={<Navigate to="/products" replace />} />
            {/* M2 Catalog Routes */}
            <Route path="/products" element={<ProductsListPage />} />
            <Route path="/plans" element={<PlansListPage />} />
            <Route path="/discounts" element={<DiscountsPage />} />
            <Route path="/taxes" element={<TaxesPage />} />

            {/* M4 Billing Routes */}
            <Route path="/billing/dashboard" element={<DashboardPage />} />
            <Route path="/billing/invoices" element={<InvoicesListPage />} />
            <Route path="/billing/invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="/billing/payments" element={<PaymentsListPage />} />
            <Route path="/billing/runs" element={<BillingRunsPage />} />
          </Route>

          {/* Public & Portal Routes */}
          <Route path="/pricing" element={<PublicPricingPage />} />
          <Route path="/portal/invoices" element={<MyInvoicesPage />} />
          <Route path="/portal/invoices/:id" element={<MyInvoiceDetailPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
