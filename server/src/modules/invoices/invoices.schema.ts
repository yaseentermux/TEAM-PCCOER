// [M4] zod: list query, id params
import { z } from "zod";

const bool = z.preprocess((v) => v === true || v === "true" || v === "1", z.boolean());

export const listInvoicesQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(["DRAFT", "CONFIRMED", "PAID", "CANCELLED"]).optional(),
  overdue: bool.optional(),
  customerId: z.coerce.number().int().positive().optional(),
  subscriptionId: z.coerce.number().int().positive().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  search: z.string().trim().min(1).optional(),
});
export type ListInvoicesQuery = z.infer<typeof listInvoicesQuery>;

export const idParams = z.object({ id: z.coerce.number().int().positive() });
export const subscriptionIdParams = z.object({ subscriptionId: z.coerce.number().int().positive() });
