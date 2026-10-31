import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  type: z.enum(['SERVICE', 'GOODS', 'ADDON']).default('SERVICE'),
  salesPrice: z.number().nonnegative('Sales price must be >= 0'),
  costPrice: z.number().nonnegative('Cost price must be >= 0').default(0),
  notes: z.string().optional().nullable(),
  taxIds: z.array(z.number().int()).optional().default([]),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  type: z.enum(['SERVICE', 'GOODS', 'ADDON']).optional(),
  active: z.enum(['true', 'false']).optional(),
});

export const createVariantSchema = z.object({
  attribute: z.string().min(1, 'Attribute is required (e.g. Brand)'),
  value: z.string().min(1, 'Value is required (e.g. Odoo)'),
  extraPrice: z.number().default(0),
});

export const updateVariantSchema = z.object({
  attribute: z.string().min(1).optional(),
  value: z.string().min(1).optional(),
  extraPrice: z.number().optional(),
});
