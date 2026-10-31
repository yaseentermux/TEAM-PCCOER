import { z } from 'zod';

export const createPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  price: z.number().nonnegative('Plan price must be >= 0').default(0),
  billingPeriod: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  minQuantity: z.number().int().min(1, 'Minimum quantity must be at least 1').default(1),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()).optional().nullable(),
  autoClose: z.boolean().default(false),
  closable: z.boolean().default(true),
  pausable: z.boolean().default(true),
  renewable: z.boolean().default(true),
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
      return false;
    }
    return true;
  },
  {
    message: 'endDate must be strictly after startDate',
    path: ['endDate'],
  }
);

export const updatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().nonnegative().optional(),
  billingPeriod: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  minQuantity: z.number().int().min(1).optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional().nullable(),
  autoClose: z.boolean().optional(),
  closable: z.boolean().optional(),
  pausable: z.boolean().optional(),
  renewable: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
