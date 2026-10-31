// [M4] Plans ranked by MRR
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import type { TopPlan } from "../types";

const PERIOD: Record<string, string> = { DAILY: "Daily", WEEKLY: "Weekly", MONTHLY: "Monthly", YEARLY: "Yearly" };

export function TopPlansTable({ data }: { data?: TopPlan[] }) {
  const max = Math.max(1, ...(data ?? []).map((p) => p.mrr));
  return (
    <Card>
      <CardHeader><CardTitle>Top plans by MRR</CardTitle></CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr><th className="pb-2 font-medium">Plan</th><th className="pb-2 text-right font-medium">Active</th><th className="pb-2 text-right font-medium">MRR</th></tr>
          </thead>
          <tbody>
            {data?.map((p) => (
              <tr key={p.planId} className="border-t">
                <td className="py-2">
                  <p className="font-medium">{p.name}</p>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full bg-[#2a78d6]" style={{ width: `${(p.mrr / max) * 100}%` }} />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{PERIOD[p.billingPeriod]}</p>
                </td>
                <td className="py-2 text-right tabular-nums">{p.activeSubscriptions.toLocaleString("en-IN")}</td>
                <td className="py-2 text-right font-medium tabular-nums">{formatMoney(p.mrr)}</td>
              </tr>
            ))}
            {data?.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-slate-500">No active subscriptions</td></tr>}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
