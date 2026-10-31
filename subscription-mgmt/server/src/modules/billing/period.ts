// [M4] Date helpers: billing periods, due dates, MRR normalisation. All math in UTC.
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import type { BillingPeriod, PaymentTerms } from "@prisma/client";

dayjs.extend(utc);

const PERIOD_UNIT: Record<BillingPeriod, [number, dayjs.ManipulateType]> = {
  DAILY: [1, "day"],
  WEEKLY: [7, "day"],
  MONTHLY: [1, "month"],
  YEARLY: [1, "year"],
};

const TERMS_DAYS: Record<PaymentTerms, number> = { IMMEDIATE: 0, NET_7: 7, NET_15: 15, NET_30: 30 };

// Recurring amount per period -> per month.
export const MONTHLY_FACTOR: Record<BillingPeriod, number> = {
  DAILY: 365 / 12,
  WEEKLY: 52 / 12,
  MONTHLY: 1,
  YEARLY: 1 / 12,
};

export const startOfDay = (d: Date) => dayjs.utc(d).startOf("day").toDate();
export const endOfDay = (d: Date) => dayjs.utc(d).endOf("day").toDate();

export function addPeriod(date: Date, period: BillingPeriod, times = 1) {
  const [n, unit] = PERIOD_UNIT[period];
  return dayjs.utc(date).add(n * times, unit).toDate();
}

// Last day covered by a period that starts on `start`.
export const periodEndFor = (start: Date, period: BillingPeriod) =>
  dayjs.utc(addPeriod(start, period)).subtract(1, "day").endOf("day").toDate();

export const dueDateFor = (invoiceDate: Date, terms: PaymentTerms) =>
  dayjs.utc(invoiceDate).add(TERMS_DAYS[terms], "day").endOf("day").toDate();

export const daysBetween = (from: Date, to: Date) => Math.floor((to.getTime() - from.getTime()) / 86_400_000);
