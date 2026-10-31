// [M4] Odoo-style lifecycle bar: Draft > Confirmed > Paid (Cancelled replaces the flow)
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "../types";

const STEPS: { key: InvoiceStatus; label: string }[] = [
  { key: "DRAFT", label: "Draft" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "PAID", label: "Paid" },
];

export function InvoiceStatusBar({ status }: { status: InvoiceStatus }) {
  if (status === "CANCELLED") {
    return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700">Cancelled</div>;
  }
  const current = STEPS.findIndex((s) => s.key === status);
  return (
    <ol className="flex overflow-hidden rounded-md border text-sm" aria-label="Invoice status">
      {STEPS.map((s, i) => (
        <li
          key={s.key}
          aria-current={i === current ? "step" : undefined}
          className={cn(
            "px-4 py-1.5 font-medium",
            i > 0 && "border-l",
            i === current ? "bg-indigo-600 text-white" : i < current ? "bg-indigo-50 text-indigo-700" : "bg-white text-slate-500",
          )}
        >
          {s.label}
        </li>
      ))}
    </ol>
  );
}
