// [M4] zod: invoiceId, method, amount, paymentDate, note
import { z } from "zod";

export const paymentMethod = z.enum(["CASH", "BANK_TRANSFER", "CARD", "UPI", "ONLINE"]);

export const createPaymentBody = z.object({
  invoiceId: z.coerce.number().int().positive(),
  method: paymentMethod,
  amount: z.coerce.number().positive("Amount must be greater than 0").multipleOf(0.01),
  paymentDate: z.coerce.date().optional(),
  note: z.string().trim().max(500).optional(),
});
export type CreatePaymentBody = z.infer<typeof createPaymentBody>;

export const listPaymentsQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  method: paymentMethod.optional(),
  invoiceId: z.coerce.number().int().positive().optional(),
  customerId: z.coerce.number().int().positive().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  search: z.string().trim().min(1).optional(),
});
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuery>;

export const idParams = z.object({ id: z.coerce.number().int().positive() });
