// [M4] Customer's own invoices only: every query is scoped to customerId = req.user.id, drafts hidden
import type { Prisma } from "@prisma/client";
import * as invoices from "../invoices/invoices.service.js";
import { registerPayment } from "../payments/payments.service.js";
import type { ListInvoicesQuery } from "../invoices/invoices.schema.js";

const scope = (customerId: number): Prisma.InvoiceWhereInput => ({ customerId, status: { not: "DRAFT" } });

export const list = (customerId: number, q: ListInvoicesQuery) =>
  invoices.list({ ...q, customerId: undefined, status: q.status === "DRAFT" ? undefined : q.status }, scope(customerId));
export const stats = (customerId: number) => invoices.stats(scope(customerId));
export const detail = (customerId: number, id: number) => invoices.getDetail(id, scope(customerId));
export const pdf = (customerId: number, id: number) => invoices.pdf(id, scope(customerId));

// Mock online payment: pays the full outstanding balance.
export async function pay(customerId: number, id: number) {
  const inv = await detail(customerId, id);
  await registerPayment(
    { invoiceId: id, method: "ONLINE", amount: inv.balance, note: "Paid online via customer portal" },
    customerId,
    scope(customerId),
  );
  return detail(customerId, id);
}
