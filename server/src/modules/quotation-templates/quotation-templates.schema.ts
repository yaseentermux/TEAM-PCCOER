import { z } from "zod";

/**
 * Line item schema for quotation templates.
 */
export const quotationTemplateLineSchema = z.object({
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
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be at least 1")
    .default(1),
});

/**
 * Schema for creating a reusable quotation template.
 */
export const createQuotationTemplateSchema = z.object({
  name: z
    .string({ error: "Template name is required" })
    .trim()
    .min(2, "Template name must be at least 2 characters"),
  validityDays: z
    .number()
    .int("Validity days must be an integer")
    .positive("Validity days must be greater than 0")
    .default(30),
  planId: z
    .number({ error: "Plan is required" })
    .int("Plan ID must be an integer")
    .positive("Plan ID must be a positive integer"),
  notes: z.string().trim().optional().nullable(),
  lines: z
    .array(quotationTemplateLineSchema)
    .min(1, "At least one product line is required"),
});

/**
 * Schema for updating an existing quotation template.
 * Rejects empty objects while preserving partial updates.
 */
export const updateQuotationTemplateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Template name must be at least 2 characters")
      .optional(),
    validityDays: z
      .number()
      .int("Validity days must be an integer")
      .positive("Validity days must be greater than 0")
      .optional(),
    planId: z
      .number()
      .int("Plan ID must be an integer")
      .positive("Plan ID must be a positive integer")
      .optional(),
    notes: z.string().trim().optional().nullable(),
    lines: z
      .array(quotationTemplateLineSchema)
      .min(1, "At least one product line is required")
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { error: "At least one field must be provided for update" }
  );

/**
 * Route parameter validation for quotation template endpoints.
 */
export const quotationTemplateIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Template ID is required" })
    .int("Template ID must be an integer")
    .positive("Template ID must be a positive integer"),
});

// Inferred TypeScript Types
export type QuotationTemplateLineInput = z.infer<typeof quotationTemplateLineSchema>;
export type CreateQuotationTemplateInput = z.infer<typeof createQuotationTemplateSchema>;
export type UpdateQuotationTemplateInput = z.infer<typeof updateQuotationTemplateSchema>;
export type QuotationTemplateIdParam = z.infer<typeof quotationTemplateIdParamSchema>;
