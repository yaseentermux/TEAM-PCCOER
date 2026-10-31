import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Products
export function useProducts(params?: { search?: string; type?: string; active?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const res = await api.get('/products', { params });
      return res.data;
    },
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const res = await api.get(`/products/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/products', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.patch(`/products/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/products/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Variants
export function useAddVariant(productId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { attribute: string; value: string; extraPrice: number }) => {
      const res = await api.post(`/products/${productId}/variants`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteVariant(productId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variantId: number) => {
      const res = await api.delete(`/products/${productId}/variants/${variantId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Plans
export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const res = await api.get('/plans');
      return res.data.data;
    },
  });
}

export function useAvailablePlans() {
  return useQuery({
    queryKey: ['plans', 'available'],
    queryFn: async () => {
      const res = await api.get('/plans/available');
      return res.data.data;
    },
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/plans', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

export function useUpdatePlan(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.patch(`/plans/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

// Taxes
export function useTaxes() {
  return useQuery({
    queryKey: ['taxes'],
    queryFn: async () => {
      const res = await api.get('/taxes');
      return res.data.data;
    },
  });
}

export function useCreateTax() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/taxes', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
    },
  });
}

// Discounts
export function useDiscounts(params?: { state?: string; scope?: string }) {
  return useQuery({
    queryKey: ['discounts', params],
    queryFn: async () => {
      const res = await api.get('/discounts', { params });
      return res.data.data;
    },
  });
}

export function useCreateDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/discounts', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    },
  });
}
