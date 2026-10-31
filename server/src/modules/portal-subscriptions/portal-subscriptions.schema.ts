import { z } from "zod";
import {
  subscriptionStatusEnum,
  subscriptionIdParamSchema,
} from "../subscriptions/subscriptions.schema";

/**
 * Re-export route param for subscription ID to keep portal routes modular.
 */
export const portalSubscriptionIdParamSchema = subscriptionIdParamSchema;

/**
 * Line item schema for customer portal checkout.
 * Security enforcement: unitPrice is strictly omitted. Prices are computed
 * exclusively on the backend via product.salesPrice + variant.extraPrice.
 * Strict mode ensures unexpected fields like unitPrice are rejected immediately.
 */
export const portalSubscriptionLineSchema = z
  .object({
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
  })
  .strict();

/**
 * Schema for customer self-service subscription creation in customer portal.
 * Adheres strictly to the contract { planId, lines }.
 * customerId is securely derived from req.user.id.
 * Strict mode rejects tampering attempts (e.g., customerId, discountId, unitPrice).
 * Corresponds to POST /api/portal/subscriptions/subscribe
 */
export const portalSubscribeSchema = z
  .object({
    planId: z
      .number({ error: "Plan is required" })
      .int("Plan ID must be an integer")
      .positive("Plan ID must be a positive integer"),
    lines: z
      .array(portalSubscriptionLineSchema)
      .min(1, "At least one product line is required"),
  })
  .strict();

/**
 * Payload schema for customer cancelling/closing their own subscription.
 * Strict mode prevents unexpected parameters during cancellation.
 * Corresponds to POST /api/portal/subscriptions/:id/close
 */
export const portalCloseSubscriptionSchema = z
  .object({
    reason: z
      .string({ error: "Cancellation reason is required" })
      .trim()
      .min(3, "Please provide a reason for cancelling (at least 3 characters)"),
  })
  .strict();

/**
 * Optional notes schema for accepting an official quotation in the customer portal.
 */
export const portalAcceptQuotationSchema = z
  .object({
    notes: z.string().trim().optional(),
  })
  .strict();

/**
 * Optional notes schema for portal lifecycle actions (pause, resume, renew).
 */
export const portalLifecycleNotesSchema = z
  .object({
    notes: z.string().trim().optional(),
  })
  .strict();


/**
 * Query parameter schema for customer portal subscriptions list.
 * Automatically scoped to authenticated customer.
 * Strict mode prevents query tampering (e.g., customerId injection).
 * Corresponds to GET /api/portal/subscriptions
 */
export const portalSubscriptionQuerySchema = z
  .object({
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
  })
  .strict();

// Inferred TypeScript Types
export type PortalSubscriptionLineInput = z.infer<typeof portalSubscriptionLineSchema>;
export type PortalSubscribeInput = z.infer<typeof portalSubscribeSchema>;
export type PortalCloseSubscriptionInput = z.infer<typeof portalCloseSubscriptionSchema>;
export type PortalSubscriptionQueryParams = z.infer<typeof portalSubscriptionQuerySchema>;
export type PortalSubscriptionIdParam = z.infer<typeof portalSubscriptionIdParamSchema>;
