export type SubscriptionStatus =
  | "DRAFT"
  | "QUOTATION"
  | "CONFIRMED"
  | "ACTIVE"
  | "PAUSED"
  | "CLOSED";

export type PaymentTerms = "IMMEDIATE" | "NET_7" | "NET_15" | "NET_30";
export type BillingPeriod = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type ProductType = "SERVICE" | "GOODS" | "ADDON";

export type SubscriptionStats = {
  total: number;
  draft: number;
  quotation: number;
  confirmed: number;
  active: number;
  paused: number;
  closed: number;
};

export type Paged<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

export type CustomerRef = {
  id: number;
  name: string;
  email: string;
  role?: string;
  company?: string | null;
  phone?: string | null;
  address?: string | null;
};

export type PlanRef = {
  id: number;
  name: string;
  price: number | string;
  billingPeriod: BillingPeriod;
  minQuantity: number;
  autoClose: boolean;
  closable: boolean;
  pausable: boolean;
  renewable: boolean;
  isActive: boolean;
};

export type ProductTaxRef = {
  id: number;
  name: string;
  amount: number | string;
};

export type ProductVariantRef = {
  id: number;
  attribute: string;
  value: string;
  extraPrice: number | string;
};

export type ProductRef = {
  id: number;
  name: string;
  salesPrice: number | string;
  type?: ProductType;
  isActive?: boolean;
  taxes?: ProductTaxRef[];
  variants?: ProductVariantRef[];
};

export type SubscriptionLineItem = {
  id: number;
  subscriptionId: number;
  productId: number;
  variantId: number | null;
  description: string | null;
  quantity: number;
  unitPrice: number | string;
  amount: number | string;
  product?: ProductRef;
  variant?: ProductVariantRef | null;
  taxes?: ProductTaxRef[];
};

export type SubscriptionEventItem = {
  id: number;
  subscriptionId: number;
  fromStatus: SubscriptionStatus | null;
  toStatus: SubscriptionStatus;
  note: string | null;
  userId: number | null;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
};

export type SubscriptionListItem = {
  id: number;
  number: string | null;
  customerId: number;
  planId: number;
  templateId: number | null;
  discountId: number | null;
  salespersonId: number | null;
  status: SubscriptionStatus;
  startDate: string;
  expiryDate: string | null;
  quoteValidUntil: string | null;
  paymentTerms: PaymentTerms;
  nextInvoiceDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: CustomerRef;
  plan: PlanRef;
  discount?: {
    id: number;
    name: string;
    type: "PERCENT" | "FIXED";
    value: number | string;
  } | null;
  lines: SubscriptionLineItem[];
  _count?: {
    invoices: number;
    events: number;
  };
};

export type SubscriptionDetail = SubscriptionListItem & {
  salesperson?: {
    id: number;
    name: string;
    email: string;
  } | null;
  template?: {
    id: number;
    name: string;
  } | null;
  events: SubscriptionEventItem[];
  invoices: {
    id: number;
    number: string | null;
    status: string;
    invoiceDate: string;
    dueDate: string;
    total: number | string;
    amountPaid: number | string;
    createdAt: string;
  }[];
};

export type QuotationTemplateLineItem = {
  id: number;
  templateId: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  product?: ProductRef;
  variant?: ProductVariantRef | null;
};

export type QuotationTemplateItem = {
  id: number;
  name: string;
  validityDays: number;
  planId: number;
  notes: string | null;
  createdAt: string;
  plan: PlanRef;
  lines: QuotationTemplateLineItem[];
  _count?: {
    subscriptions: number;
    lines: number;
  };
};

export type SubscriptionFilters = {
  page?: number;
  limit?: number;
  status?: SubscriptionStatus;
  customerId?: number;
  planId?: number;
  search?: string;
};

export type CreateSubscriptionInput = {
  customerId: number;
  planId: number;
  templateId?: number | null;
  startDate: string;
  expiryDate?: string | null;
  paymentTerms?: PaymentTerms;
  discountId?: number | null;
  notes?: string | null;
  lines: {
    productId: number;
    variantId?: number | null;
    quantity: number;
    unitPrice?: number;
  }[];
};

export type UpdateSubscriptionInput = Partial<CreateSubscriptionInput>;

export type QuotationTemplateLineInput = {
  productId: number;
  variantId?: number | null;
  quantity: number;
};

export type CreateQuotationTemplateInput = {
  name: string;
  validityDays?: number;
  planId: number;
  notes?: string | null;
  lines: QuotationTemplateLineInput[];
};

export type UpdateQuotationTemplateInput = Partial<CreateQuotationTemplateInput>;

export type PortalSubscriptionLineInput = {
  productId: number;
  variantId?: number | null;
  quantity: number;
};

export type PortalSubscribeInput = {
  planId: number;
  lines: PortalSubscriptionLineInput[];
};

export type SubscriptionPricingPreviewLineInput = {
  productId: number;
  variantId?: number | null;
  quantity: number;
};

export type SubscriptionPricingPreviewInput = {
  customerId?: number | null;
  planId: number;
  discountId?: number | null;
  lines: SubscriptionPricingPreviewLineInput[];
};

export type SubscriptionPricingPreviewResult = {
  plan: {
    id: number;
    name: string;
    billingPeriod: string;
    price: number;
    minQuantity: number;
  };
  lines: Array<{
    productId: number;
    productName: string;
    variantId: number | null;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    taxAmount: number;
    taxes: Array<{
      id: number;
      name: string;
      rate: number;
      amount: number;
    }>;
  }>;
  subtotal: number;
  discount: number;
  discountDetails: {
    id: number;
    name: string;
    type: string;
    value: number;
    amount: number;
  } | null;
  taxTotal: number;
  taxes: Array<{
    id: number;
    name: string;
    amount: number;
  }>;
  recurringAmount: number;
  total: number;
};



