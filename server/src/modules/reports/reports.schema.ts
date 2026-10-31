// [M4] zod: from, to, planId filters
import { z } from "zod";

export const reportFilter = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  planId: z.coerce.number().int().positive().optional(),
  months: z.coerce.number().int().min(1).max(36).default(12),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type ReportFilter = z.infer<typeof reportFilter>;
