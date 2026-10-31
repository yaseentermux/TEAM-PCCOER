import { z } from "zod";

/**
 * Subscription status enum values matching Prisma SubscriptionStatus.
 */
export const subscriptionStatusEnum = z.enum([
  "DRAFT",
  "QUOTATION",
  "CONFIRMED",
  "ACTIVE",
  "PAUSED",
  "CLOSED",
]);

/**
 * Payment terms enum values matching Prisma PaymentTerms.
 */
export const paymentTermsEnum = z.enum([
  "IMMEDIATE",
  "NET_7",
  "NET_15",
  "NET_30",
]);

/**
 * Line item schema for staff-created subscriptions.
 * Allows optional unitPrice override where staff have permission.
 */
export const subscriptionLineInputSchema = z.object({
  productId: z
    .number({ error: "Product is required" })
    .int("Product ID must be an integer")
    .positive("Product ID must be a positive integer"),
  variantId: z
    .number()
    .int("Variant ID must be an integer")
    .positive("Variant ID must be a positive integer")
    .optional()
    .nullable(),
  quantity: z
    .number({ error: "Quantity is required" })
    .int("Quantity must be an integer")
    .positive("Quantity must be at least 1"),
  unitPrice: z
    .number()
    .nonnegative("Unit price cannot be negative")
    .optional(),
});

/**
 * Schema for creating a subscription by staff/admin.
 * Requires customerId, planId, startDate, and lines.
 * Corresponds to POST /api/subscriptions
 */
export const createSubscriptionSchema = z.object({
  customerId: z
    .number({ error: "Customer (User ID) is required" })
    .int("Customer ID must be an integer")
    .positive("Customer ID must be a positive integer"),
  planId: z
    .number({ error: "Plan is required" })
    .int("Plan ID must be an integer")
    .positive("Plan ID must be a positive integer"),
  templateId: z
    .number()
    .int("Template ID must be an integer")
    .positive("Template ID must be a positive integer")
    .optional()
    .nullable(),
  startDate: z
    .string({ error: "Start date is required" })
    .datetime({ error: "Start date must be a valid ISO datetime string" }),
  expiryDate: z
    .string()
    .datetime({ error: "Expiry date must be a valid ISO datetime string" })
    .optional()
    .nullable(),
  paymentTerms: paymentTermsEnum.default("IMMEDIATE"),
  discountId: z
    .number()
    .int("Discount ID must be an integer")
    .positive("Discount ID must be a positive integer")
    .optional()
    .nullable(),
  notes: z.string().trim().optional().nullable(),
  lines: z
    .array(subscriptionLineInputSchema)
    .min(1, "At least one order line is required"),
});

/**
 * Schema for updating an existing subscription.
 * Allowed strictly when subscription status is DRAFT or QUOTATION.
 * Rejects empty objects while preserving partial updates.
 * Corresponds to PATCH /api/subscriptions/:id
 */
export const updateSubscriptionSchema = z
  .object({
    customerId: z
      .number()
      .int("Customer ID must be an integer")
      .positive("Customer ID must be a positive integer")
      .optional(),
    planId: z
      .number()
      .int("Plan ID must be an integer")
      .positive("Plan ID must be a positive integer")
      .optional(),
    startDate: z
      .string()
      .datetime({ error: "Start date must be a valid ISO datetime string" })
      .optional(),
    expiryDate: z
      .string()
      .datetime({ error: "Expiry date must be a valid ISO datetime string" })
      .optional()
      .nullable(),
    paymentTerms: paymentTermsEnum.optional(),
    discountId: z
      .number()
      .int("Discount ID must be an integer")
      .positive("Discount ID must be a positive integer")
      .optional()
      .nullable(),
    notes: z.string().trim().optional().nullable(),
    lines: z
      .array(subscriptionLineInputSchema)
      .min(1, "At least one order line is required")
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { error: "At least one field must be provided for update" }
  );

/**
 * Query parameter schema for filtering and paginating subscriptions.
 * Corresponds to GET /api/subscriptions
 */
export const subscriptionQuerySchema = z.object({
  page: z.coerce
    .number()
    .int("Page must be an integer")
    .positive("Page must be greater than 0")
    .default(1),
  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .positive("Limit must be greater than 0")
    .max(100, "Limit cannot exceed 100")
    .default(20),
  status: subscriptionStatusEnum.optional(),
  customerId: z.coerce
    .number()
    .int("Customer ID must be an integer")
    .positive("Customer ID must be a positive integer")
    .optional(),
  planId: z.coerce
    .number()
    .int("Plan ID must be an integer")
    .positive("Plan ID must be a positive integer")
    .optional(),
  search: z.string().trim().optional(),
});

/**
 * Route parameter validation for subscription ID.
 */
export const subscriptionIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Subscription ID is required" })
    .int("Subscription ID must be an integer")
    .positive("Subscription ID must be a positive integer"),
});

/**
 * Route parameter validation for creating from template.
 * Corresponds to POST /api/subscriptions/from-template/:templateId
 */
export const createFromTemplateParamSchema = z.object({
  templateId: z.coerce
    .number({ error: "Template ID is required" })
    .int("Template ID must be an integer")
    .positive("Template ID must be a positive integer"),
});

/**
 * Payload schema for creating a subscription from a template.
 * Requires customerId and startDate; other fields optionally override template defaults.
 * Corresponds to POST /api/subscriptions/from-template/:templateId
 */
export const createFromTemplateBodySchema = z.object({
  customerId: z
    .number({ error: "Customer (User ID) is required" })
    .int("Customer ID must be an integer")
    .positive("Customer ID must be a positive integer"),
  startDate: z
    .string({ error: "Start date is required" })
    .datetime({ error: "Start date must be a valid ISO datetime string" }),
  paymentTerms: paymentTermsEnum.optional(),
  discountId: z
    .number()
    .int("Discount ID must be an integer")
    .positive("Discount ID must be a positive integer")
    .optional()
    .nullable(),
  notes: z.string().trim().optional().nullable(),
});

/**
 * Payload schema for sending quotation (DRAFT -> QUOTATION).
 * Quote validity is calculated on the backend from template.validityDays (default 30 days).
 * Corresponds to POST /api/subscriptions/:id/send-quotation
 */
export const sendQuotationSchema = z.object({
  notes: z.string().trim().optional(),
});

/**
 * Payload schema for closing a subscription.
 * Required reason note for closing from ACTIVE, PAUSED, or QUOTATION.
 * Corresponds to POST /api/subscriptions/:id/close
 */
export const closeSubscriptionSchema = z.object({
  reason: z
    .string({ error: "Cancellation reason is required" })
    .trim()
    .min(3, "Cancellation reason must be at least 3 characters"),
});

// Inferred TypeScript Types
export type SubscriptionStatus = z.infer<typeof subscriptionStatusEnum>;
export type PaymentTerms = z.infer<typeof paymentTermsEnum>;
export type SubscriptionLineInput = z.infer<typeof subscriptionLineInputSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type SubscriptionQueryParams = z.infer<typeof subscriptionQuerySchema>;
export type SubscriptionIdParam = z.infer<typeof subscriptionIdParamSchema>;
export type CreateFromTemplateParam = z.infer<typeof createFromTemplateParamSchema>;
export type CreateFromTemplateBodyInput = z.infer<typeof createFromTemplateBodySchema>;
export type SendQuotationInput = z.infer<typeof sendQuotationSchema>;
export type CloseSubscriptionInput = z.infer<typeof closeSubscriptionSchema>;
