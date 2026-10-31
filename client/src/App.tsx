import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CatalogLayout } from './components/layout/CatalogLayout';
import { ProductsListPage } from './features/catalog/pages/ProductsListPage';
import { PlansListPage } from './features/catalog/pages/PlansListPage';
import { DiscountsPage } from './features/catalog/pages/DiscountsPage';
import { TaxesPage } from './features/catalog/pages/TaxesPage';
import { PublicPricingPage } from './features/catalog/pages/PublicPricingPage';

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
          <Route element={<CatalogLayout />}>
            <Route path="/" element={<Navigate to="/products" replace />} />
            <Route path="/products" element={<ProductsListPage />} />
            <Route path="/plans" element={<PlansListPage />} />
            <Route path="/discounts" element={<DiscountsPage />} />
            <Route path="/taxes" element={<TaxesPage />} />
          </Route>
          <Route path="/pricing" element={<PublicPricingPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
