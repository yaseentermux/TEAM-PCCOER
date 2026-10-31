// [M4] Loads candidate discount rules (owned by M2) and picks the one to apply; tracks usage.
import type { Prisma } from "@prisma/client";
import { pickBestDiscount, type DiscountRule, type PricingLineInput } from "../../lib/pricing";

type Tx = Prisma.TransactionClient;

export async function findApplicableDiscount(
  tx: Tx,
  ctx: { subscriptionDiscountId: number | null; lines: PricingLineInput[]; on: Date },
): Promise<DiscountRule | null> {
  const productIds = ctx.lines.map((l) => l.productId).filter((id): id is number => id !== null);
  const rows = await tx.discount.findMany({
    where: {
      isActive: true,
      startDate: { lte: ctx.on },
      OR: [{ endDate: null }, { endDate: { gte: ctx.on } }],
      AND: [{
        OR: [
          ...(ctx.subscriptionDiscountId ? [{ id: ctx.subscriptionDiscountId, scope: "SUBSCRIPTION" as const }] : []),
          { scope: "PRODUCT" as const, products: { some: { id: { in: productIds } } } },
        ],
      }],
    },
    include: { products: { select: { id: true } } },
  });

  const candidates: DiscountRule[] = rows.map((d) => ({
    id: d.id,
    type: d.type,
    value: Number(d.value),
    scope: d.scope,
    productIds: d.products.map((p) => p.id),
    minPurchase: d.minPurchase === null ? null : Number(d.minPurchase),
    minQuantity: d.minQuantity,
    startDate: d.startDate,
    endDate: d.endDate,
    usageLimit: d.usageLimit,
    usedCount: d.usedCount,
    isActive: d.isActive,
  }));
  return pickBestDiscount(candidates, ctx.lines, ctx.on);
}

export async function consumeDiscount(tx: Tx, discountId: number) {
  await tx.discount.update({ where: { id: discountId }, data: { usedCount: { increment: 1 } } });
}

// Give a use back when an invoice that used the discount is cancelled.
export async function releaseDiscount(tx: Tx, discountId: number) {
  await tx.discount.updateMany({ where: { id: discountId, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
}
