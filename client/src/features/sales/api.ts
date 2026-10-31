import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import type {
  Paged,
  SubscriptionListItem,
  SubscriptionDetail,
  SubscriptionFilters,
  SubscriptionStats,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  QuotationTemplateItem,
  CreateQuotationTemplateInput,
  UpdateQuotationTemplateInput,
  PlanRef,
  CustomerRef,
  ProductRef,
  PortalSubscribeInput,
  SubscriptionPricingPreviewInput,
  SubscriptionPricingPreviewResult,
} from "./types";

const get = async <T>(url: string, params?: object) =>
  (await api.get<T>(url, { params })).data;

const unwrap = async <T>(url: string, params?: object) =>
  (await get<{ data: T }>(url, params)).data;

const post = async <T>(url: string, body?: object) =>
  (await api.post<{ data: T }>(url, body)).data.data;

const patch = async <T>(url: string, body?: object) =>
  (await api.patch<{ data: T }>(url, body)).data.data;

const del = async <T>(url: string) =>
  (await api.delete<{ data: T }>(url)).data.data;

// Shared root query key factory for sales
export const salesKeys = {
  subscriptions: (f: SubscriptionFilters) => ["sales", "subscriptions", f] as const,
  subscription: (id: number) => ["sales", "subscription", id] as const,
  stats: () => ["sales", "subscriptions", "stats"] as const,
  templates: () => ["sales", "quotation-templates"] as const,
  template: (id: number) => ["sales", "quotation-template", id] as const,
  plans: () => ["sales", "plans"] as const,
  customers: () => ["sales", "customers"] as const,
  products: () => ["sales", "products"] as const,
  portalSubscriptions: (f?: object) => ["sales", "portal", "subscriptions", f] as const,
  portalSubscription: (id: number) => ["sales", "portal", "subscription", id] as const,
};

function useSalesMutation<TVars, TRes>(
  fn: (v: TVars) => Promise<TRes>,
  success?: string | ((r: TRes) => string)
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      if (success) {
        toast.success(typeof success === "function" ? success(r) : success);
      }
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// ============================================================================
// SUBSCRIPTIONS QUERY HOOKS
// ============================================================================

export const useSubscriptions = (f: SubscriptionFilters) =>
  useQuery({
    queryKey: salesKeys.subscriptions(f),
    queryFn: () => get<Paged<SubscriptionListItem>>("/subscriptions", f),
    placeholderData: keepPreviousData,
  });

export const useSubscriptionStats = () =>
  useQuery({
    queryKey: salesKeys.stats(),
    queryFn: async () => {
      const res = await api.get<SubscriptionStats | { data: SubscriptionStats }>("/subscriptions/stats");
      if (res.data && "data" in res.data && typeof res.data.data === "object" && res.data.data !== null) {
        return res.data.data as SubscriptionStats;
      }
      return res.data as SubscriptionStats;
    },
  });

export const useSubscription = (id: number) =>
  useQuery({
    queryKey: salesKeys.subscription(id),
    queryFn: () => unwrap<SubscriptionDetail>(`/subscriptions/${id}`),
    enabled: !Number.isNaN(id) && id > 0,
  });

export const useCreateSubscription = () =>
  useSalesMutation(
    (data: CreateSubscriptionInput) =>
      post<SubscriptionDetail>("/subscriptions", data),
    (r) => `Subscription ${r.number ?? r.id} created in Draft`
  );

export const useCreateFromTemplate = () =>
  useSalesMutation(
    ({ templateId, data }: { templateId: number; data: Partial<CreateSubscriptionInput> }) =>
      post<SubscriptionDetail>(`/subscriptions/from-template/${templateId}`, data),
    (r) => `Subscription ${r.number ?? r.id} created from template`
  );

export const useUpdateSubscription = () =>
  useSalesMutation(
    ({ id, data }: { id: number; data: UpdateSubscriptionInput }) =>
      patch<SubscriptionDetail>(`/subscriptions/${id}`, data),
    "Subscription updated"
  );

export const useSubscriptionPricingPreview = () =>
  useMutation({
    mutationFn: async (data: SubscriptionPricingPreviewInput) => {
      const res = await api.post<
        SubscriptionPricingPreviewResult | { data: SubscriptionPricingPreviewResult }
      >("/subscriptions/preview-pricing", data);
      if (
        res.data &&
        "data" in res.data &&
        typeof res.data.data === "object" &&
        res.data.data !== null
      ) {
        return res.data.data as SubscriptionPricingPreviewResult;
      }
      return res.data as SubscriptionPricingPreviewResult;
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

// ============================================================================
// LIFECYCLE ACTION MUTATIONS
// ============================================================================

export const useSendQuotation = () =>
  useSalesMutation(
    ({ id, notes }: { id: number; notes?: string }) =>
      post<SubscriptionDetail>(`/subscriptions/${id}/send-quotation`, { notes }),
    "Quotation sent to customer"
  );

export const useConfirmSubscription = () =>
  useSalesMutation(
    ({ id, notes }: { id: number; notes?: string }) =>
      post<SubscriptionDetail>(`/subscriptions/${id}/confirm`, { notes }),
    "Quotation confirmed"
  );

export const useActivateSubscription = () =>
  useSalesMutation(
    ({ id, notes }: { id: number; notes?: string }) =>
      post<SubscriptionDetail>(`/subscriptions/${id}/activate`, { notes }),
    "Subscription activated"
  );

export const usePauseSubscription = () =>
  useSalesMutation(
    ({ id, notes }: { id: number; notes?: string }) =>
      post<SubscriptionDetail>(`/subscriptions/${id}/pause`, { notes }),
    "Subscription paused"
  );

export const useResumeSubscription = () =>
  useSalesMutation(
    ({ id, notes }: { id: number; notes?: string }) =>
      post<SubscriptionDetail>(`/subscriptions/${id}/resume`, { notes }),
    "Subscription resumed"
  );

export const useCloseSubscription = () =>
  useSalesMutation(
    ({ id, reason }: { id: number; reason: string }) =>
      post<SubscriptionDetail>(`/subscriptions/${id}/close`, { reason }),
    "Subscription closed"
  );

export const useRenewSubscription = () =>
  useSalesMutation(
    ({ id, notes }: { id: number; notes?: string }) =>
      post<SubscriptionDetail>(`/subscriptions/${id}/renew`, { notes }),
    "Subscription renewed"
  );

// ============================================================================
// QUOTATION TEMPLATES HOOKS
// ============================================================================

export const useQuotationTemplates = () =>
  useQuery({
    queryKey: salesKeys.templates(),
    queryFn: () => unwrap<QuotationTemplateItem[]>("/quotation-templates"),
  });

export const useQuotationTemplate = (id: number) =>
  useQuery({
    queryKey: salesKeys.template(id),
    queryFn: () => unwrap<QuotationTemplateItem>(`/quotation-templates/${id}`),
    enabled: !Number.isNaN(id) && id > 0,
  });

export const useCreateQuotationTemplate = () =>
  useSalesMutation(
    (data: CreateQuotationTemplateInput) =>
      post<QuotationTemplateItem>("/quotation-templates", data),
    (r) => `Quotation template "${r.name}" created`
  );

export const useUpdateQuotationTemplate = () =>
  useSalesMutation(
    ({ id, data }: { id: number; data: UpdateQuotationTemplateInput }) =>
      patch<QuotationTemplateItem>(`/quotation-templates/${id}`, data),
    "Quotation template updated"
  );

export const useDeleteQuotationTemplate = () =>
  useSalesMutation(
    (id: number) => del<{ message: string }>(`/quotation-templates/${id}`),
    "Quotation template deleted"
  );

// ============================================================================
// AUXILIARY QUERY HOOKS (PLANS & CUSTOMERS FOR FILTERS/DROPDOWNS)
// ============================================================================

export const usePlans = () =>
  useQuery({
    queryKey: salesKeys.plans(),
    queryFn: async () => {
      try {
        const res = await get<{ data: PlanRef[] }>("/plans");
        return res.data ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 60_000,
  });

export const useCustomers = () =>
  useQuery({
    queryKey: salesKeys.customers(),
    queryFn: async () => {
      try {
        const res = await get<{ data: CustomerRef[] }>("/customers");
        return res.data ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 60_000,
  });

export const useProducts = () =>
  useQuery({
    queryKey: salesKeys.products(),
    queryFn: async () => {
      try {
        const res = await get<{ data: ProductRef[] }>("/products");
        return res.data ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 60_000,
  });

// ============================================================================
// CUSTOMER PORTAL SUBSCRIPTION QUERY HOOKS
// ============================================================================

export const usePortalSubscriptions = (params?: {
  status?: string;
  page?: number;
  limit?: number;
}) =>
  useQuery({
    queryKey: salesKeys.portalSubscriptions(params),
    queryFn: () => get<Paged<SubscriptionListItem>>("/portal/subscriptions", params),
    placeholderData: keepPreviousData,
  });

export const usePortalSubscription = (id: number) =>
  useQuery({
    queryKey: salesKeys.portalSubscription(id),
    queryFn: () => unwrap<SubscriptionDetail>(`/portal/subscriptions/${id}`),
    enabled: !Number.isNaN(id) && id > 0,
  });

export const usePortalSubscribe = () =>
  useSalesMutation(
    (data: PortalSubscribeInput) =>
      post<SubscriptionDetail>("/portal/subscriptions/subscribe", data),
    (r) => `Subscription ${r.number ?? r.id} created successfully`
  );

export const usePortalAcceptQuotation = () =>
  useSalesMutation(
    ({ id, notes }: { id: number; notes?: string }) =>
      post<SubscriptionDetail>(`/portal/subscriptions/${id}/accept`, { notes }),
    "Quotation accepted successfully! Your subscription is now confirmed."
  );

export const usePortalPauseSubscription = () =>
  useSalesMutation(
    ({ id, notes }: { id: number; notes?: string }) =>
      post<SubscriptionDetail>(`/portal/subscriptions/${id}/pause`, { notes }),
    "Subscription paused"
  );

export const usePortalResumeSubscription = () =>
  useSalesMutation(
    ({ id, notes }: { id: number; notes?: string }) =>
      post<SubscriptionDetail>(`/portal/subscriptions/${id}/resume`, { notes }),
    "Subscription resumed"
  );

export const usePortalCloseSubscription = () =>
  useSalesMutation(
    ({ id, reason }: { id: number; reason: string }) =>
      post<SubscriptionDetail>(`/portal/subscriptions/${id}/close`, { reason }),
    "Subscription cancelled"
  );

export const usePortalRenewSubscription = () =>
  useSalesMutation(
    ({ id, notes }: { id: number; notes?: string }) =>
      post<SubscriptionDetail>(`/portal/subscriptions/${id}/renew`, { notes }),
    "Subscription renewed"
  );





