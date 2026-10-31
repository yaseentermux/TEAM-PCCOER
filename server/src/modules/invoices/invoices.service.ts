// [M4] list (filters, overdue), detail, confirm, cancel, send (mailer), create from subscription
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/app-error";
import { paged, parsePagination } from "../../lib/pagination";
import { sendMail } from "../../lib/mailer";
import { round2 } from "../../lib/pricing";
import { generateInvoice } from "../billing/billing.service";
import { releaseDiscount } from "../billing/discounts.apply";
import { daysBetween, endOfDay } from "../billing/period";
import { renderInvoicePdf } from "./invoice-pdf";
import type { ListInvoicesQuery } from "./invoices.schema";

const listSelect = {
  id: true, number: true, status: true, invoiceDate: true, dueDate: true, periodStart: true, periodEnd: true,
  total: true, amountPaid: true, sentAt: true,
  customer: { select: { id: true, name: true, email: true } },
  subscription: { select: { id: true, number: true } },
} satisfies Prisma.InvoiceSelect;

type ListRow = Prisma.InvoiceGetPayload<{ select: typeof listSelect }>;

export const isOverdue = (i: { status: string; dueDate: Date }, now = new Date()) => i.status === "CONFIRMED" && i.dueDate < now;

export function toListDto(i: ListRow) {
  const total = Number(i.total), amountPaid = Number(i.amountPaid);
  const overdue = isOverdue(i);
  return {
    ...i, total, amountPaid, balance: round2(total - amountPaid), isOverdue: overdue,
    daysOverdue: overdue ? daysBetween(i.dueDate, new Date()) : 0,
  };
}

export function buildWhere(q: Partial<ListInvoicesQuery>, extra: Prisma.InvoiceWhereInput = {}): Prisma.InvoiceWhereInput {
  const where: Prisma.InvoiceWhereInput = { ...extra };
  if (q.overdue) { where.status = "CONFIRMED"; where.dueDate = { lt: new Date() }; }
  else if (q.status) where.status = q.status;
  if (q.customerId) where.customerId = q.customerId;
  if (q.subscriptionId) where.subscriptionId = q.subscriptionId;
  if (q.from || q.to) where.invoiceDate = { ...(q.from && { gte: q.from }), ...(q.to && { lte: endOfDay(q.to) }) };
  if (q.search) {
    where.OR = [
      { number: { contains: q.search, mode: "insensitive" } },
      { customer: { name: { contains: q.search, mode: "insensitive" } } },
      { subscription: { number: { contains: q.search, mode: "insensitive" } } },
    ];
  }
  return where;
}

export async function list(q: ListInvoicesQuery, extra: Prisma.InvoiceWhereInput = {}) {
  const { page, limit, skip } = parsePagination(q);
  const where = buildWhere(q, extra);
  const [rows, total] = await Promise.all([
    prisma.invoice.findMany({ where, select: listSelect, orderBy: { invoiceDate: "desc" }, skip, take: limit }),
    prisma.invoice.count({ where }),
  ]);
  return paged(rows.map(toListDto), total, page, limit);
}

// Counts for the list tabs.
export async function stats(extra: Prisma.InvoiceWhereInput = {}) {
  const [groups, overdue] = await Promise.all([
    prisma.invoice.groupBy({ by: ["status"], where: extra, _count: { _all: true } }),
    prisma.invoice.count({ where: { ...extra, status: "CONFIRMED", dueDate: { lt: new Date() } } }),
  ]);
  const counts = { DRAFT: 0, CONFIRMED: 0, PAID: 0, CANCELLED: 0 } as Record<string, number>;
  for (const g of groups) counts[g.status] = g._count._all;
  return { ...counts, OVERDUE: overdue, ALL: Object.values(counts).reduce((a, b) => a + b, 0) };
}

const detailInclude = {
  customer: { select: { id: true, name: true, email: true, company: true, address: true, phone: true } },
  subscription: { select: { id: true, number: true, paymentTerms: true, plan: { select: { id: true, name: true, billingPeriod: true } } } },
  discount: { select: { id: true, name: true, type: true, value: true } },
  lines: { orderBy: { id: "asc" } },
  payments: { orderBy: { paymentDate: "desc" }, include: { createdBy: { select: { id: true, name: true } } } },
} satisfies Prisma.InvoiceInclude;

export async function getDetail(id: number, extra: Prisma.InvoiceWhereInput = {}) {
  const inv = await prisma.invoice.findFirst({ where: { id, ...extra }, include: detailInclude });
  if (!inv) throw new AppError("Invoice not found", 404);
  const n = (d: Prisma.Decimal) => Number(d);
  const total = n(inv.total), amountPaid = n(inv.amountPaid);
  const overdue = isOverdue(inv);
  return {
    ...inv,
    subtotal: n(inv.subtotal), discountTotal: n(inv.discountTotal), taxTotal: n(inv.taxTotal),
    total, amountPaid, balance: round2(total - amountPaid), isOverdue: overdue,
    daysOverdue: overdue ? daysBetween(inv.dueDate, new Date()) : 0,
    discount: inv.discount && { ...inv.discount, value: n(inv.discount.value) },
    lines: inv.lines.map((l) => ({
      ...l, unitPrice: n(l.unitPrice), discountAmount: n(l.discountAmount), taxAmount: n(l.taxAmount), amount: n(l.amount),
    })),
    payments: inv.payments.map((p) => ({ ...p, amount: n(p.amount) })),
  };
}

export type InvoiceDetail = Awaited<ReturnType<typeof getDetail>>;

export async function createFromSubscription(subscriptionId: number) {
  const r = await generateInvoice(subscriptionId);
  if (r.status === "skipped") throw new AppError(r.reason, 409);
  return getDetail(r.invoiceId);
}

export async function confirm(id: number) {
  const { count } = await prisma.invoice.updateMany({ where: { id, status: "DRAFT" }, data: { status: "CONFIRMED" } });
  if (!count) throw new AppError("Only draft invoices can be confirmed", 409);
  return getDetail(id);
}

export async function cancel(id: number) {
  await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.findUnique({ where: { id }, select: { status: true, amountPaid: true, discountId: true } });
    if (!inv) throw new AppError("Invoice not found", 404);
    if (inv.status !== "DRAFT" && inv.status !== "CONFIRMED") throw new AppError(`A ${inv.status.toLowerCase()} invoice cannot be cancelled`, 409);
    if (Number(inv.amountPaid) > 0) throw new AppError("Invoice has payments; delete them before cancelling", 409);
    await tx.invoice.update({ where: { id }, data: { status: "CANCELLED" } });
    if (inv.discountId) await releaseDiscount(tx, inv.discountId);
  });
  return getDetail(id);
}

export async function pdf(id: number, extra: Prisma.InvoiceWhereInput = {}) {
  const inv = await getDetail(id, extra);
  return { filename: `${inv.number ?? `invoice-${inv.id}`}.pdf`, buffer: await renderInvoicePdf(inv) };
}

export async function send(id: number) {
  const inv = await getDetail(id);
  if (inv.status === "DRAFT") throw new AppError("Confirm the invoice before sending it", 409);
  if (inv.status === "CANCELLED") throw new AppError("Cancelled invoices cannot be sent", 409);
  const { filename, buffer } = await pdf(id);
  const mail = await sendMail({
    to: inv.customer.email,
    subject: `Invoice ${inv.number} from Brightloop Software`,
    html: `<p>Hello ${inv.customer.name},</p>
      <p>Please find attached invoice <b>${inv.number}</b> for <b>${inv.total.toFixed(2)}</b>,
      due on <b>${inv.dueDate.toISOString().slice(0, 10)}</b>.</p>
      <p>Amount outstanding: <b>${inv.balance.toFixed(2)}</b></p><p>Thank you,<br/>Brightloop Billing</p>`,
    attachments: [{ filename, content: buffer }],
  });
  await prisma.invoice.update({ where: { id }, data: { sentAt: new Date() } });
  return { ...(await getDetail(id)), mailPreviewUrl: mail.previewUrl };
}

// Overdue payment reminder (dashboard "Chase" action).
export async function remind(id: number) {
  const inv = await getDetail(id);
  if (!inv.isOverdue) throw new AppError("Invoice is not overdue", 409);
  const mail = await sendMail({
    to: inv.customer.email,
    subject: `Reminder: invoice ${inv.number} is overdue`,
    html: `<p>Hello ${inv.customer.name},</p><p>Invoice <b>${inv.number}</b> was due on
      <b>${inv.dueDate.toISOString().slice(0, 10)}</b> (${inv.daysOverdue} days ago).
      Outstanding: <b>${inv.balance.toFixed(2)}</b>.</p><p>Brightloop Billing</p>`,
  });
  return { sent: true, mailPreviewUrl: mail.previewUrl };
}
