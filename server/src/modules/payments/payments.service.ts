// [M4] registerPayment (CONFIRMED only, amount <= outstanding, set PAID), deletePayment (recalculate), list
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { endOfDay } from "../billing/period";
import { AppError } from "../../lib/app-error";
import { paged, parsePagination } from "../../lib/pagination";
import { round2 } from "../../lib/pricing";
import type { CreatePaymentBody, ListPaymentsQuery } from "./payments.schema";

export async function registerPayment(body: CreatePaymentBody, userId: number | null, scope: Prisma.InvoiceWhereInput = {}) {
  return prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.findFirst({ where: { id: body.invoiceId, ...scope }, select: { id: true, status: true, total: true, amountPaid: true } });
    if (!inv) throw new AppError("Invoice not found", 404);
    if (inv.status !== "CONFIRMED") throw new AppError(inv.status === "DRAFT" ? "Confirm the invoice before registering a payment" : `Invoice is ${inv.status.toLowerCase()}`, 409);

    const outstanding = round2(Number(inv.total) - Number(inv.amountPaid));
    if (body.amount > outstanding) throw new AppError(`Amount exceeds the outstanding balance of ${outstanding.toFixed(2)}`, 400);

    const newPaid = round2(Number(inv.amountPaid) + body.amount);
    // Optimistic check on amountPaid: two simultaneous payments can't both pass the outstanding check.
    const { count } = await tx.invoice.updateMany({
      where: { id: inv.id, amountPaid: inv.amountPaid },
      data: { amountPaid: newPaid, status: newPaid >= Number(inv.total) ? "PAID" : "CONFIRMED" },
    });
    if (!count) throw new AppError("Invoice was updated by someone else, please retry", 409);

    const payment = await tx.payment.create({
      data: { invoiceId: inv.id, method: body.method, amount: body.amount, paymentDate: body.paymentDate ?? new Date(), note: body.note, createdById: userId },
    });
    return { ...payment, amount: Number(payment.amount) };
  });
}

export async function deletePayment(id: number) {
  await prisma.$transaction(async (tx) => {
    const p = await tx.payment.findUnique({ where: { id }, include: { invoice: { select: { id: true, total: true, amountPaid: true } } } });
    if (!p) throw new AppError("Payment not found", 404);
    const newPaid = Math.max(0, round2(Number(p.invoice.amountPaid) - Number(p.amount)));
    await tx.payment.delete({ where: { id } });
    await tx.invoice.update({
      where: { id: p.invoiceId },
      data: { amountPaid: newPaid, status: newPaid >= Number(p.invoice.total) ? "PAID" : "CONFIRMED" },
    });
  });
}

export async function list(q: ListPaymentsQuery) {
  const { page, limit, skip } = parsePagination(q);
  const where: Prisma.PaymentWhereInput = {};
  if (q.method) where.method = q.method;
  if (q.invoiceId) where.invoiceId = q.invoiceId;
  if (q.customerId) where.invoice = { customerId: q.customerId };
  if (q.from || q.to) where.paymentDate = { ...(q.from && { gte: q.from }), ...(q.to && { lte: endOfDay(q.to) }) };
  if (q.search) {
    where.OR = [
      { invoice: { number: { contains: q.search, mode: "insensitive" } } },
      { invoice: { customer: { name: { contains: q.search, mode: "insensitive" } } } },
      { note: { contains: q.search, mode: "insensitive" } },
    ];
  }
  const [rows, total, sum] = await Promise.all([
    prisma.payment.findMany({
      where, orderBy: { paymentDate: "desc" }, skip, take: limit,
      include: {
        invoice: { select: { id: true, number: true, customer: { select: { id: true, name: true } } } },
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({ where, _sum: { amount: true } }),
  ]);
  return {
    ...paged(rows.map((p) => ({ ...p, amount: Number(p.amount) })), total, page, limit),
    summary: { totalAmount: Number(sum._sum.amount ?? 0) },
  };
}
