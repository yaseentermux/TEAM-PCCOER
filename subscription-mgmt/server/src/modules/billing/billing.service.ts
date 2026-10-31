// [M4] Invoice generation from subscriptions + batch billing run.
import { Prisma, type BillingRun } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../lib/http.js";
import { formatNumber } from "../../lib/sequence.js";
import { priceLines, type PricingLineInput } from "../../lib/pricing.js";
import { addPeriod, dueDateFor, endOfDay, periodEndFor } from "./period.js";
import { consumeDiscount, findApplicableDiscount } from "./discounts.apply.js";

export type GenerateResult =
  | { status: "created"; invoiceId: number; number: string; nextInvoiceDate: Date | null }
  | { status: "skipped"; reason: string; nextInvoiceDate: Date | null };

// Bills the subscription's next period (periodStart = nextInvoiceDate). The invoice is dated at periodStart,
// so catching up on missed periods produces correctly dated (and correctly overdue) invoices.
export async function generateInvoice(subscriptionId: number): Promise<GenerateResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.findUnique({
        where: { id: subscriptionId },
        include: {
          plan: true,
          lines: { include: { taxes: true, product: { select: { name: true } }, variant: true }, orderBy: { id: "asc" } },
        },
      });
      if (!sub) throw new HttpError(404, "Subscription not found");
      if (sub.status !== "ACTIVE") throw new HttpError(409, "Only active subscriptions can be invoiced");
      if (!sub.nextInvoiceDate) throw new HttpError(409, "Subscription has no next invoice date");

      const periodStart = sub.nextInvoiceDate;
      if (sub.expiryDate && periodStart > sub.expiryDate) {
        await tx.subscription.update({ where: { id: sub.id }, data: { nextInvoiceDate: null } });
        return { status: "skipped", reason: "Subscription expired", nextInvoiceDate: null } as const;
      }

      const inputs: PricingLineInput[] = [];
      if (Number(sub.plan.price) > 0) {
        inputs.push({ productId: null, description: `${sub.plan.name} - recurring fee`, quantity: 1, unitPrice: Number(sub.plan.price), taxes: [] });
      }
      for (const l of sub.lines) {
        const variant = l.variant ? ` (${l.variant.attribute}: ${l.variant.value})` : "";
        inputs.push({
          productId: l.productId,
          description: l.description || `${l.product.name}${variant}`,
          quantity: l.quantity,
          unitPrice: Number(l.unitPrice),
          taxes: l.taxes.map((t) => ({ type: t.type, amount: Number(t.amount) })),
        });
      }
      if (inputs.length === 0) throw new HttpError(409, "Subscription has nothing to bill");

      const discount = await findApplicableDiscount(tx, { subscriptionDiscountId: sub.discountId, lines: inputs, on: periodStart });
      const priced = priceLines(inputs, discount);

      const created = await tx.invoice.create({
        data: {
          subscriptionId: sub.id,
          customerId: sub.customerId,
          discountId: priced.appliedDiscountId,
          invoiceDate: periodStart,
          dueDate: dueDateFor(periodStart, sub.paymentTerms),
          periodStart,
          periodEnd: periodEndFor(periodStart, sub.plan.billingPeriod),
          subtotal: priced.subtotal,
          discountTotal: priced.discountTotal,
          taxTotal: priced.taxTotal,
          total: priced.total,
          lines: {
            create: priced.lines.map((l) => ({
              productId: l.productId,
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              discountAmount: l.discountAmount,
              taxAmount: l.taxAmount,
              amount: l.amount - l.discountAmount,
            })),
          },
        },
      });
      const number = formatNumber("INV", created.id);
      await tx.invoice.update({ where: { id: created.id }, data: { number } });
      if (priced.appliedDiscountId) await consumeDiscount(tx, priced.appliedDiscountId);

      const nextInvoiceDate = addPeriod(periodStart, sub.plan.billingPeriod);
      await tx.subscription.update({ where: { id: sub.id }, data: { nextInvoiceDate } });
      return { status: "created", invoiceId: created.id, number, nextInvoiceDate } as const;
    });
  } catch (e) {
    // Unique (subscriptionId, periodStart): this period is already billed. The "never bill twice" guarantee.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { status: "skipped", reason: "Period already invoiced", nextInvoiceDate: null };
    }
    throw e;
  }
}

const BATCH = 200;
const MAX_CATCH_UP = 400; // safety cap on periods billed per subscription per run

// Bills every ACTIVE subscription that is due, catching up missed periods so nothing is skipped.
export async function runBilling(trigger: "CRON" | "MANUAL", today = new Date()): Promise<BillingRun> {
  const run = await prisma.billingRun.create({ data: { trigger } });
  const cutoff = endOfDay(today);
  let created = 0, skipped = 0, failed = 0, lastId = 0;
  const log: string[] = [];

  for (;;) {
    const due = await prisma.subscription.findMany({
      where: { id: { gt: lastId }, status: "ACTIVE", nextInvoiceDate: { lte: cutoff } },
      select: { id: true, number: true },
      orderBy: { id: "asc" },
      take: BATCH,
    });
    if (due.length === 0) break;
    lastId = due[due.length - 1].id;

    for (const sub of due) {
      for (let i = 0; i < MAX_CATCH_UP; i++) {
        try {
          const r = await generateInvoice(sub.id);
          if (r.status === "skipped") { skipped++; break; }
          created++;
          if (!r.nextInvoiceDate || r.nextInvoiceDate > cutoff) break;
        } catch (e) {
          failed++;
          log.push(`${sub.number ?? sub.id}: ${e instanceof Error ? e.message : String(e)}`);
          break;
        }
      }
    }
  }

  return prisma.billingRun.update({
    where: { id: run.id },
    data: { finishedAt: new Date(), created, skipped, failed, log: log.join("\n") || null },
  });
}

export async function listRuns(limit = 20) {
  return prisma.billingRun.findMany({ orderBy: { startedAt: "desc" }, take: limit });
}
