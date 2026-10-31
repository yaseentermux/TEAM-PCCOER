import { z } from 'zod';

export const createDiscountSchema = z.object({
  name: z.string().min(1, 'Discount name is required'),
  code: z.string().min(1).optional().nullable(),
  type: z.enum(['PERCENT', 'FIXED']),
  value: z.number().positive('Discount value must be positive'),
  scope: z.enum(['PRODUCT', 'SUBSCRIPTION']).default('PRODUCT'),
  productIds: z.array(z.number().int()).optional().default([]),
  minPurchase: z.number().nonnegative().optional().nullable(),
  minQuantity: z.number().int().positive().optional().nullable(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()).optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.type === 'PERCENT' && data.value > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Percentage discount cannot exceed 100%',
      path: ['value'],
    });
  }
  if (data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'endDate must be after startDate',
      path: ['endDate'],
    });
  }
  if (data.scope === 'PRODUCT' && (!data.productIds || data.productIds.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'productIds are required when scope is PRODUCT',
      path: ['productIds'],
    });
  }
});

export const updateDiscountSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional().nullable(),
  type: z.enum(['PERCENT', 'FIXED']).optional(),
  value: z.number().positive().optional(),
  scope: z.enum(['PRODUCT', 'SUBSCRIPTION']).optional(),
  productIds: z.array(z.number().int()).optional(),
  minPurchase: z.number().nonnegative().optional().nullable(),
  minQuantity: z.number().int().positive().optional().nullable(),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const discountQuerySchema = z.object({
  state: z.enum(['SCHEDULED', 'ACTIVE', 'EXPIRED', 'EXHAUSTED', 'INACTIVE']).optional(),
  scope: z.enum(['PRODUCT', 'SUBSCRIPTION']).optional(),
});
