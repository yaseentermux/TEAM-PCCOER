// [M4] Pricing engine: line amounts, discount (before tax), taxes, totals. Pure functions, no DB access.

export type TaxRule = { type: "PERCENT" | "FIXED"; amount: number };

export type DiscountRule = {
  id: number;
  type: "PERCENT" | "FIXED";
  value: number;
  scope: "PRODUCT" | "SUBSCRIPTION";
  productIds: number[];
  minPurchase: number | null;
  minQuantity: number | null;
  startDate: Date;
  endDate: Date | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
};

export type PricingLineInput = {
  productId: number | null;
  description: string;
  quantity: number;
  unitPrice: number;
  taxes: TaxRule[];
};

export type PricedLine = PricingLineInput & { amount: number; discountAmount: number; taxAmount: number };

export type PricingResult = {
  lines: PricedLine[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  appliedDiscountId: number | null;
};

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const sum = (xs: number[]) => round2(xs.reduce((a, b) => a + b, 0));

// SUBSCRIPTION-scope discounts cover every line; PRODUCT-scope only lines whose product is listed.
export function discountCoversLine(d: DiscountRule, line: PricingLineInput) {
  return d.scope === "SUBSCRIPTION" || (line.productId !== null && d.productIds.includes(line.productId));
}

// Rule checks (active, dates, usage, minimums). Minimums are measured on the lines the discount covers.
export function isDiscountEligible(d: DiscountRule, lines: PricingLineInput[], on: Date) {
  if (!d.isActive) return false;
  if (on < d.startDate) return false;
  if (d.endDate && on > d.endDate) return false;
  if (d.usageLimit !== null && d.usedCount >= d.usageLimit) return false;
  const covered = lines.filter((l) => discountCoversLine(d, l));
  if (covered.length === 0) return false;
  if (d.minQuantity !== null && covered.reduce((q, l) => q + l.quantity, 0) < d.minQuantity) return false;
  if (d.minPurchase !== null && sum(covered.map((l) => l.quantity * l.unitPrice)) < d.minPurchase) return false;
  return true;
}

// Applies one discount (assumed eligible) and the line taxes.
// PERCENT: value% off each covered line. FIXED: value off the covered total, split across lines by amount.
export function priceLines(lines: PricingLineInput[], discount?: DiscountRule | null): PricingResult {
  const amounts = lines.map((l) => round2(l.quantity * l.unitPrice));
  const discounts = lines.map(() => 0);

  if (discount) {
    const covered = lines.map((l, i) => (discountCoversLine(discount, l) ? i : -1)).filter((i) => i >= 0);
    if (discount.type === "PERCENT") {
      const rate = Math.min(Math.max(discount.value, 0), 100) / 100;
      for (const i of covered) discounts[i] = round2(amounts[i] * rate);
    } else {
      const coveredTotal = sum(covered.map((i) => amounts[i]));
      let remaining = round2(Math.min(Math.max(discount.value, 0), coveredTotal));
      covered.forEach((i, k) => {
        const share = k === covered.length - 1 ? remaining : round2((amounts[i] / coveredTotal) * remaining);
        discounts[i] = share;
        remaining = round2(remaining - share);
      });
    }
  }

  const priced: PricedLine[] = lines.map((l, i) => {
    const net = amounts[i] - discounts[i];
    const taxAmount = sum(l.taxes.map((t) => (t.type === "PERCENT" ? (net * t.amount) / 100 : t.amount * l.quantity)));
    return { ...l, amount: amounts[i], discountAmount: discounts[i], taxAmount };
  });

  const subtotal = sum(priced.map((l) => l.amount));
  const discountTotal = sum(priced.map((l) => l.discountAmount));
  const taxTotal = sum(priced.map((l) => l.taxAmount));
  return {
    lines: priced,
    subtotal,
    discountTotal,
    taxTotal,
    total: round2(subtotal - discountTotal + taxTotal),
    appliedDiscountId: discount && discountTotal > 0 ? discount.id : null,
  };
}

// Picks the eligible discount that saves the customer the most.
export function pickBestDiscount(candidates: DiscountRule[], lines: PricingLineInput[], on: Date) {
  let best: DiscountRule | null = null;
  let bestSaving = 0;
  for (const d of candidates) {
    if (!isDiscountEligible(d, lines, on)) continue;
    const saving = priceLines(lines, d).discountTotal;
    if (saving > bestSaving) { best = d; bestSaving = saving; }
  }
  return best;
}
