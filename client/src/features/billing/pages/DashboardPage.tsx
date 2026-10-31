// [M4] Finance dashboard: KPIs, revenue trend, subscriptions by status, top plans, overdue
import { useState } from "react";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOverdueReport, useReportSummary, useRevenueTrend, useRunBilling, useSubscriptionsByStatus, useTopPlans } from "../api";
import type { ReportFilters } from "../types";
import { DashboardFilters } from "../components/DashboardFilters";
import { KpiCards } from "../components/KpiCards";
import { RevenueTrendChart } from "../components/RevenueTrendChart";
import { SubscriptionsStatusChart } from "../components/SubscriptionsStatusChart";
import { TopPlansTable } from "../components/TopPlansTable";
import { OverdueTable } from "../components/OverdueTable";

export default function DashboardPage() {
  const [filters, setFilters] = useState<ReportFilters>({
    from: dayjs().startOf("month").format("YYYY-MM-DD"),
    to: dayjs().format("YYYY-MM-DD"),
  });
  // `to` is a date; include the whole day.
  const range = { ...filters, to: filters.to && dayjs(filters.to).endOf("day").toISOString() };
  const summary = useReportSummary(range);
  const trend = useRevenueTrend(filters.planId);
  const byStatus = useSubscriptionsByStatus(filters.planId);
  const topPlans = useTopPlans();
  const overdue = useOverdueReport(filters.planId);
  const run = useRunBilling();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500">Subscriptions, revenue, payments and overdue invoices in one place</p>
        </div>
        <div className="flex gap-2">
          <Link to="/app/billing/runs" className="self-center text-sm text-slate-600 hover:underline">Billing history</Link>
          <Button onClick={() => run.mutate(undefined)} disabled={run.isPending}>
            <PlayCircle /> {run.isPending ? "Running..." : "Run billing now"}
          </Button>
        </div>
      </div>
      <DashboardFilters value={filters} onChange={setFilters} plans={topPlans.data ?? []} />
      <KpiCards data={summary.data} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><RevenueTrendChart data={trend.data} /></div>
        <SubscriptionsStatusChart data={byStatus.data} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><OverdueTable data={overdue.data} /></div>
        <TopPlansTable data={topPlans.data} />
      </div>
    </div>
  );
}
