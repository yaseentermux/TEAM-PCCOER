// [M4] Invoice status pill; CONFIRMED + past due shows as Overdue
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "../types";

const STYLES: Record<InvoiceStatus | "OVERDUE", string> = {
  DRAFT: "bg-slate-100 text-slate-700 ring-slate-200",
  CONFIRMED: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200",
  OVERDUE: "bg-amber-50 text-amber-800 ring-amber-300",
};
const LABEL: Record<InvoiceStatus | "OVERDUE", string> = {
  DRAFT: "Draft", CONFIRMED: "Confirmed", PAID: "Paid", CANCELLED: "Cancelled", OVERDUE: "Overdue",
};

export function InvoiceStatusBadge({ status, overdue, className }: { status: InvoiceStatus; overdue?: boolean; className?: string }) {
  const key = overdue && status === "CONFIRMED" ? "OVERDUE" : status;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", STYLES[key], className)}>
      {LABEL[key]}
    </span>
  );
}
