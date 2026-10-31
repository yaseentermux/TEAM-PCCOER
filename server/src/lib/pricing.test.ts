// [M4] Pricing engine tests
import { describe, it, expect } from "vitest";
import { priceLines, isDiscountEligible, pickBestDiscount, type DiscountRule, type PricingLineInput } from "./pricing";

const gst18 = { type: "PERCENT" as const, amount: 18 };
const line = (o: Partial<PricingLineInput> = {}): PricingLineInput =>
  ({ productId: 1, description: "CRM", quantity: 1, unitPrice: 100, taxes: [], ...o });
const disc = (o: Partial<DiscountRule> = {}): DiscountRule => ({
  id: 1, type: "PERCENT", value: 10, scope: "PRODUCT", productIds: [1], minPurchase: null, minQuantity: null,
  startDate: new Date("2026-01-01"), endDate: null, usageLimit: null, usedCount: 0, isActive: true, ...o,
});
const today = new Date("2026-06-15");

describe("priceLines", () => {
  it("computes amounts and percent tax with no discount", () => {
    const r = priceLines([line({ quantity: 3, unitPrice: 1560, taxes: [gst18] })]);
    expect(r).toMatchObject({ subtotal: 4680, discountTotal: 0, taxTotal: 842.4, total: 5522.4, appliedDiscountId: null });
  });

  it("applies percent discount before tax, only to covered products", () => {
    const r = priceLines([line({ quantity: 10, taxes: [gst18] }), line({ productId: 2, unitPrice: 50 })], disc());
    expect(r.lines[0]).toMatchObject({ amount: 1000, discountAmount: 100, taxAmount: 162 });
    expect(r.lines[1]).toMatchObject({ amount: 50, discountAmount: 0 });
    expect(r).toMatchObject({ subtotal: 1050, discountTotal: 100, taxTotal: 162, total: 1112, appliedDiscountId: 1 });
  });

  it("splits a fixed subscription discount across lines and never exceeds the total", () => {
    const d = disc({ type: "FIXED", value: 100, scope: "SUBSCRIPTION" });
    const r = priceLines([line({ unitPrice: 300 }), line({ productId: 2, unitPrice: 100 })], d);
    expect(r.lines.map((l) => l.discountAmount)).toEqual([75, 25]);
    const big = priceLines([line({ unitPrice: 40 })], disc({ type: "FIXED", value: 500, scope: "SUBSCRIPTION" }));
    expect(big.total).toBe(0);
  });

  it("splits a fixed discount proportionally across three or more lines", () => {
    const d = disc({ type: "FIXED", value: 90, scope: "SUBSCRIPTION" });
    const r = priceLines([line(), line({ productId: 2 }), line({ productId: 3 })], d);
    expect(r.lines.map((l) => l.discountAmount)).toEqual([30, 30, 30]);
  });

  it("charges fixed tax per unit", () => {
    const r = priceLines([line({ quantity: 4, taxes: [{ type: "FIXED", amount: 2.5 }] })]);
    expect(r.taxTotal).toBe(10);
  });

  it("rounds to 2 decimals", () => {
    const r = priceLines([line({ quantity: 3, unitPrice: 33.33, taxes: [{ type: "PERCENT", amount: 5 }] })]);
    expect(r).toMatchObject({ subtotal: 99.99, taxTotal: 5, total: 104.99 });
  });
});

describe("isDiscountEligible", () => {
  it("rejects expired, not-started, inactive and exhausted discounts", () => {
    const l = [line()];
    expect(isDiscountEligible(disc({ endDate: new Date("2026-03-01") }), l, today)).toBe(false);
    expect(isDiscountEligible(disc({ startDate: new Date("2026-07-01") }), l, today)).toBe(false);
    expect(isDiscountEligible(disc({ isActive: false }), l, today)).toBe(false);
    expect(isDiscountEligible(disc({ usageLimit: 5, usedCount: 5 }), l, today)).toBe(false);
    expect(isDiscountEligible(disc({ usageLimit: 5, usedCount: 4 }), l, today)).toBe(true);
  });

  it("checks min quantity and min purchase on covered lines", () => {
    expect(isDiscountEligible(disc({ minQuantity: 10 }), [line({ quantity: 9 })], today)).toBe(false);
    expect(isDiscountEligible(disc({ minQuantity: 10 }), [line({ quantity: 10 })], today)).toBe(true);
    expect(isDiscountEligible(disc({ minPurchase: 500 }), [line({ quantity: 4 }), line({ productId: 2, unitPrice: 999 })], today)).toBe(false);
  });

  it("rejects product discounts when no line has the product", () => {
    expect(isDiscountEligible(disc({ productIds: [9] }), [line()], today)).toBe(false);
  });
});

describe("pickBestDiscount", () => {
  it("chooses the largest eligible saving", () => {
    const l = [line({ quantity: 10 })];
    const best = pickBestDiscount(
      [disc({ id: 1, value: 10 }), disc({ id: 2, type: "FIXED", value: 150, scope: "SUBSCRIPTION" }), disc({ id: 3, value: 50, isActive: false })],
      l, today);
    expect(best?.id).toBe(2);
    expect(pickBestDiscount([], l, today)).toBeNull();
  });
});
