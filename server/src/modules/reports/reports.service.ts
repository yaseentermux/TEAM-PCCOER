// [M4] Dashboard aggregates: MRR, revenue, outstanding, overdue, trends. SQL aggregates only, never row loops.
import { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { prisma } from "../../lib/prisma";
import { round2 } from "../../lib/pricing";
import { MONTHLY_FACTOR, daysBetween, endOfDay } from "../billing/period";
import type { ReportFilter } from "./reports.schema";

dayjs.extend(utc);

const planFilter = (planId?: number, alias = "s") =>
  planId ? Prisma.sql`AND ${Prisma.raw(`${alias}."planId"`)} = ${planId}` : Prisma.empty;

// Recurring amount per active subscription = plan fee + sum of line amounts, normalised to a month.
async function mrrByPlan(planId?: number) {
  const rows = await prisma.$queryRaw<{ planId: number; name: string; billingPeriod: keyof typeof MONTHLY_FACTOR; subs: number; amount: number }[]>`
    SELECT p.id AS "planId", p.name, p."billingPeriod", COUNT(s.id)::int AS subs,
           COALESCE(SUM(p.price + COALESCE(l.total, 0)), 0)::float AS amount
    FROM "Subscription" s
    JOIN "Plan" p ON p.id = s."planId"
    LEFT JOIN (SELECT "subscriptionId", SUM(amount) AS total FROM "SubscriptionLine" GROUP BY "subscriptionId") l
      ON l."subscriptionId" = s.id
    WHERE s.status = 'ACTIVE' ${planFilter(planId)}
    GROUP BY p.id, p.name, p."billingPeriod"`;
  return rows.map((r) => ({ ...r, mrr: round2(r.amount * MONTHLY_FACTOR[r.billingPeriod]) }));
}

export async function summary(f: ReportFilter) {
  const from = f.from ?? dayjs.utc().startOf("month").toDate();
  const to = f.to ? endOfDay(f.to) : new Date();
  const now = new Date();
  const bySub: Prisma.InvoiceWhereInput = f.planId ? { subscription: { planId: f.planId } } : {};

  const [plans, activeSubscriptions, collected, invoiced, outstanding, overdue, paymentsCount] = await Promise.all([
    mrrByPlan(f.planId),
    prisma.subscription.count({ where: { status: "ACTIVE", ...(f.planId && { planId: f.planId }) } }),
    prisma.payment.aggregate({ where: { paymentDate: { gte: from, lte: to }, invoice: bySub }, _sum: { amount: true } }),
    prisma.invoice.aggregate({ where: { ...bySub, status: { in: ["CONFIRMED", "PAID"] }, invoiceDate: { gte: from, lte: to } }, _sum: { total: true }, _count: true }),
    prisma.invoice.aggregate({ where: { ...bySub, status: "CONFIRMED" }, _sum: { total: true, amountPaid: true }, _count: true }),
    prisma.invoice.aggregate({ where: { ...bySub, status: "CONFIRMED", dueDate: { lt: now } }, _sum: { total: true, amountPaid: true }, _count: true }),
    prisma.payment.count({ where: { paymentDate: { gte: from, lte: to }, invoice: bySub } }),
  ]);
  const n = (d: Prisma.Decimal | null) => Number(d ?? 0);

  return {
    range: { from, to },
    activeSubscriptions,
    mrr: round2(plans.reduce((a, p) => a + p.mrr, 0)),
    revenueCollected: n(collected._sum.amount),
    paymentsCount,
    invoicedAmount: n(invoiced._sum.total),
    invoicesCount: invoiced._count,
    outstandingAmount: round2(n(outstanding._sum.total) - n(outstanding._sum.amountPaid)),
    outstandingCount: outstanding._count,
    overdueAmount: round2(n(overdue._sum.total) - n(overdue._sum.amountPaid)),
    overdueCount: overdue._count,
  };
}

// Last N months of invoiced vs collected, zero-filled.
export async function revenueTrend(months: number, planId?: number) {
  return prisma.$queryRaw<{ month: string; invoiced: number; collected: number }[]>`
    WITH months AS (
      SELECT generate_series(date_trunc('month', now()) - make_interval(months => ${months - 1}::int),
                             date_trunc('month', now()), interval '1 month') AS m
    )
    SELECT to_char(m, 'YYYY-MM') AS month,
      COALESCE((SELECT SUM(i.total) FROM "Invoice" i JOIN "Subscription" s ON s.id = i."subscriptionId"
                WHERE i.status IN ('CONFIRMED', 'PAID') AND i."invoiceDate" >= m AND i."invoiceDate" < m + interval '1 month'
                ${planFilter(planId)}), 0)::float AS invoiced,
      COALESCE((SELECT SUM(py.amount) FROM "Payment" py JOIN "Invoice" i ON i.id = py."invoiceId"
                JOIN "Subscription" s ON s.id = i."subscriptionId"
                WHERE py."paymentDate" >= m AND py."paymentDate" < m + interval '1 month'
                ${planFilter(planId)}), 0)::float AS collected
    FROM months ORDER BY m`;
}

export async function subscriptionsByStatus(planId?: number) {
  const groups = await prisma.subscription.groupBy({
    by: ["status"], where: planId ? { planId } : {}, _count: { _all: true },
  });
  const order = ["DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "PAUSED", "CLOSED"] as const;
  return order.map((status) => ({ status, count: groups.find((g) => g.status === status)?._count._all ?? 0 }));
}

export async function topPlans(limit: number) {
  const plans = await mrrByPlan();
  return plans.sort((a, b) => b.mrr - a.mrr).slice(0, limit)
    .map(({ planId, name, billingPeriod, subs, mrr }) => ({ planId, name, billingPeriod, activeSubscriptions: subs, mrr }));
}

export async function overdue(limit: number, planId?: number) {
  const now = new Date();
  const rows = await prisma.invoice.findMany({
    where: { status: "CONFIRMED", dueDate: { lt: now }, ...(planId && { subscription: { planId } }) },
    orderBy: { dueDate: "asc" },
    take: limit,
    select: {
      id: true, number: true, dueDate: true, total: true, amountPaid: true,
      customer: { select: { id: true, name: true, email: true } },
      subscription: { select: { id: true, number: true } },
    },
  });
  return rows.map((r) => ({
    ...r, total: Number(r.total), amountPaid: Number(r.amountPaid),
    balance: round2(Number(r.total) - Number(r.amountPaid)), daysOverdue: daysBetween(r.dueDate, now),
  }));
}
