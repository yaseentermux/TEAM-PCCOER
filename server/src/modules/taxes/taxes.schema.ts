import { z } from 'zod';

export const createTaxSchema = z.object({
  name: z.string().min(1, 'Tax name is required (e.g. GST 18%)'),
  type: z.enum(['PERCENT', 'FIXED']).default('PERCENT'),
  amount: z.number().nonnegative('Tax amount must be >= 0'),
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.type === 'PERCENT' && (data.amount < 0 || data.amount > 100)) {
      return false;
    }
    return true;
  },
  {
    message: 'Percentage tax must be between 0 and 100',
    path: ['amount'],
  }
);

export const updateTaxSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['PERCENT', 'FIXED']).optional(),
  amount: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});
