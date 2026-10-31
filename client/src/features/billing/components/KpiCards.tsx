// [M4] Headline numbers for the finance lead
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import type { ReportSummary } from "../types";

export function KpiCards({ data }: { data?: ReportSummary }) {
  const cards = data && [
    { label: "Active subscriptions", value: data.activeSubscriptions.toLocaleString("en-IN"), hint: "right now" },
    { label: "Monthly recurring revenue", value: formatMoney(data.mrr), hint: "MRR, all billing periods normalised" },
    { label: "Revenue collected", value: formatMoney(data.revenueCollected), hint: `${data.paymentsCount} payments in range` },
    { label: "Outstanding", value: formatMoney(data.outstandingAmount), hint: `${data.outstandingCount} confirmed invoices unpaid` },
    { label: "Overdue", value: formatMoney(data.overdueAmount), hint: `${data.overdueCount} invoices past due`, alert: data.overdueCount > 0 },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards
        ? cards.map((c) => (
            <Card key={c.label} className={c.alert ? "ring-amber-300" : ""}>
              <CardContent>
                <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  {c.alert && <AlertTriangle className="size-3.5 text-amber-600" aria-label="Needs attention" />}
                  {c.label}
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-slate-900">{c.value}</p>
                <p className="mt-0.5 text-xs text-slate-500">{c.hint}</p>
              </CardContent>
            </Card>
          ))
        : Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
    </div>
  );
}
