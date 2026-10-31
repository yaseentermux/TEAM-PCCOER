// LOCAL ONLY stand-in for M1's lib/format.ts
import dayjs from "dayjs";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
export const formatMoney = (n: number | null | undefined) => inr.format(n ?? 0);
export const formatDate = (d: string | Date | null | undefined) => (d ? dayjs(d).format("DD MMM YYYY") : "-");
export const formatDateTime = (d: string | Date | null | undefined) => (d ? dayjs(d).format("DD MMM YYYY, HH:mm") : "-");
