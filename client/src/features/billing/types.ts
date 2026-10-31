// [M4] Invoice, InvoiceLine, Payment, BillingRun, report types (mirror the API responses)
export type InvoiceStatus = "DRAFT" | "CONFIRMED" | "PAID" | "CANCELLED";
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CARD" | "UPI" | "ONLINE";
export type BillingPeriod = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export type Paged<T> = { data: T[]; meta: { page: number; limit: number; total: number } };
export type Ref = { id: number; name: string };

export type InvoiceListItem = {
  id: number; number: string | null; status: InvoiceStatus;
  invoiceDate: string; dueDate: string; periodStart: string; periodEnd: string;
  total: number; amountPaid: number; balance: number; isOverdue: boolean; daysOverdue: number; sentAt: string | null;
  customer: Ref & { email: string };
  subscription: { id: number; number: string | null };
};

export type InvoiceLine = {
  id: number; productId: number | null; description: string; quantity: number;
  unitPrice: number; discountAmount: number; taxAmount: number; amount: number;
};

export type Payment = {
  id: number; invoiceId: number; method: PaymentMethod; amount: number; paymentDate: string; note: string | null;
  createdBy: Ref | null;
  invoice?: { id: number; number: string | null; customer: Ref };
};

export type InvoiceDetail = Omit<InvoiceListItem, "customer" | "subscription"> & {
  subtotal: number; discountTotal: number; taxTotal: number;
  customer: Ref & { email: string; company: string | null; address: string | null; phone: string | null };
  subscription: { id: number; number: string | null; paymentTerms: string; plan: Ref & { billingPeriod: BillingPeriod } };
  discount: { id: number; name: string; type: "PERCENT" | "FIXED"; value: number } | null;
  lines: InvoiceLine[];
  payments: Payment[];
  mailPreviewUrl?: string | null;
};

export type InvoiceStats = Record<InvoiceStatus | "OVERDUE" | "ALL", number>;

export type InvoiceFilters = {
  page?: number; limit?: number; status?: InvoiceStatus; overdue?: boolean;
  customerId?: number; subscriptionId?: number; from?: string; to?: string; search?: string;
};

export type PaymentFilters = { page?: number; limit?: number; method?: PaymentMethod; from?: string; to?: string; search?: string };

export type BillingRun = {
  id: number; trigger: "CRON" | "MANUAL"; startedAt: string; finishedAt: string | null;
  created: number; skipped: number; failed: number; log: string | null;
};

export type ReportFilters = { from?: string; to?: string; planId?: number };

export type ReportSummary = {
  range: { from: string; to: string };
  activeSubscriptions: number; mrr: number; revenueCollected: number; paymentsCount: number;
  invoicedAmount: number; invoicesCount: number; outstandingAmount: number; outstandingCount: number;
  overdueAmount: number; overdueCount: number;
};
export type TrendPoint = { month: string; invoiced: number; collected: number };
export type StatusCount = { status: string; count: number };
export type TopPlan = { planId: number; name: string; billingPeriod: BillingPeriod; activeSubscriptions: number; mrr: number };
export type OverdueInvoice = {
  id: number; number: string | null; dueDate: string; total: number; amountPaid: number; balance: number; daysOverdue: number;
  customer: Ref & { email: string }; subscription: { id: number; number: string | null };
};

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "CASH", label: "Cash" },
  { value: "ONLINE", label: "Online" },
];
export const methodLabel = (m: PaymentMethod) => PAYMENT_METHODS.find((x) => x.value === m)?.label ?? m;
