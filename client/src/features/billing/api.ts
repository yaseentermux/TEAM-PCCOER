// [M4] axios calls + TanStack Query hooks: invoices, payments, billing runs, reports, portal invoices
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import type {
  BillingRun, InvoiceDetail, InvoiceFilters, InvoiceListItem, InvoiceStats, OverdueInvoice, Paged, Payment,
  PaymentFilters, PaymentMethod, ReportFilters, ReportSummary, StatusCount, TopPlan, TrendPoint,
} from "./types";

const get = async <T,>(url: string, params?: object) => (await api.get<T>(url, { params })).data;
const unwrap = async <T,>(url: string, params?: object) => (await get<{ data: T }>(url, params)).data;
const post = async <T,>(url: string, body?: object) => (await api.post<{ data: T }>(url, body)).data.data;

// Everything billing-related shares the "billing" root key, so one invalidate refreshes lists, details and reports.
const keys = {
  invoices: (f: InvoiceFilters) => ["billing", "invoices", f] as const,
  invoiceStats: ["billing", "invoices", "stats"] as const,
  invoice: (id: number) => ["billing", "invoice", id] as const,
  payments: (f: PaymentFilters) => ["billing", "payments", f] as const,
  runs: ["billing", "runs"] as const,
  report: (name: string, f?: object) => ["billing", "reports", name, f ?? {}] as const,
  portal: (...k: unknown[]) => ["billing", "portal", ...k] as const,
};

function useBillingMutation<TVars, TRes>(fn: (v: TVars) => Promise<TRes>, success?: string | ((r: TRes) => string)) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["billing"] });
      if (success) toast.success(typeof success === "function" ? success(r) : success);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// ---- invoices (staff) ----
export const useInvoices = (f: InvoiceFilters) =>
  useQuery({ queryKey: keys.invoices(f), queryFn: () => get<Paged<InvoiceListItem>>("/invoices", f), placeholderData: keepPreviousData });
export const useInvoiceStats = () => useQuery({ queryKey: keys.invoiceStats, queryFn: () => unwrap<InvoiceStats>("/invoices/stats") });
export const useInvoice = (id: number) => useQuery({ queryKey: keys.invoice(id), queryFn: () => unwrap<InvoiceDetail>(`/invoices/${id}`) });

export const useConfirmInvoice = () => useBillingMutation((id: number) => post<InvoiceDetail>(`/invoices/${id}/confirm`), "Invoice confirmed");
export const useCancelInvoice = () => useBillingMutation((id: number) => post<InvoiceDetail>(`/invoices/${id}/cancel`), "Invoice cancelled");
export const useSendInvoice = () => useBillingMutation((id: number) => post<InvoiceDetail>(`/invoices/${id}/send`), (r) => `Invoice ${r.number} emailed to ${r.customer.email}`);
export const useRemindInvoice = () => useBillingMutation((id: number) => post<{ sent: boolean }>(`/invoices/${id}/remind`), "Reminder sent");
export const useCreateInvoiceFromSubscription = () =>
  useBillingMutation((subscriptionId: number) => post<InvoiceDetail>(`/invoices/from-subscription/${subscriptionId}`), (r) => `Invoice ${r.number} created`);

export const invoicePdfUrl = (id: number, download = false) => `/api/invoices/${id}/pdf${download ? "?download=1" : ""}`;

// ---- payments ----
export type RegisterPaymentInput = { invoiceId: number; method: PaymentMethod; amount: number; paymentDate?: string; note?: string };
export const usePayments = (f: PaymentFilters) =>
  useQuery({
    queryKey: keys.payments(f),
    queryFn: () => get<Paged<Payment> & { summary: { totalAmount: number } }>("/payments", f),
    placeholderData: keepPreviousData,
  });
export const useRegisterPayment = () => useBillingMutation((v: RegisterPaymentInput) => post<Payment>("/payments", v), "Payment registered");
export const useDeletePayment = () =>
  useBillingMutation(async (id: number) => { await api.delete(`/payments/${id}`); return id; }, "Payment deleted");

// ---- billing runs ----
export const useBillingRuns = () => useQuery({ queryKey: keys.runs, queryFn: () => unwrap<BillingRun[]>("/billing/runs") });
export const useRunBilling = () =>
  useBillingMutation(() => post<BillingRun>("/billing/run"), (r) => `Billing run: ${r.created} created, ${r.skipped} skipped, ${r.failed} failed`);

// ---- reports ----
export const useReportSummary = (f: ReportFilters) =>
  useQuery({ queryKey: keys.report("summary", f), queryFn: () => unwrap<ReportSummary>("/reports/summary", f), placeholderData: keepPreviousData });
export const useRevenueTrend = (planId?: number) =>
  useQuery({ queryKey: keys.report("trend", { planId }), queryFn: () => unwrap<TrendPoint[]>("/reports/revenue-trend", { months: 12, planId }) });
export const useSubscriptionsByStatus = (planId?: number) =>
  useQuery({ queryKey: keys.report("by-status", { planId }), queryFn: () => unwrap<StatusCount[]>("/reports/subscriptions-by-status", { planId }) });
export const useTopPlans = () => useQuery({ queryKey: keys.report("top-plans"), queryFn: () => unwrap<TopPlan[]>("/reports/top-plans", { limit: 10 }) });
export const useOverdueReport = (planId?: number) =>
  useQuery({ queryKey: keys.report("overdue", { planId }), queryFn: () => unwrap<OverdueInvoice[]>("/reports/overdue", { limit: 8, planId }) });

// ---- customer portal ----
export const useMyInvoices = (f: InvoiceFilters) =>
  useQuery({ queryKey: keys.portal("list", f), queryFn: () => get<Paged<InvoiceListItem>>("/portal/invoices", f), placeholderData: keepPreviousData });
export const useMyInvoiceStats = () => useQuery({ queryKey: keys.portal("stats"), queryFn: () => unwrap<InvoiceStats>("/portal/invoices/stats") });
export const useMyInvoice = (id: number) => useQuery({ queryKey: keys.portal("detail", id), queryFn: () => unwrap<InvoiceDetail>(`/portal/invoices/${id}`) });
export const usePayMyInvoice = () =>
  useBillingMutation((id: number) => post<InvoiceDetail>(`/portal/invoices/${id}/pay`), (r) => `Payment received. Invoice ${r.number} is paid`);
export const myInvoicePdfUrl = (id: number, download = false) => `/api/portal/invoices/${id}/pdf${download ? "?download=1" : ""}`;
