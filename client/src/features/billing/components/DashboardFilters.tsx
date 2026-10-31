// [M4] One-row filter bar: date range presets + custom dates + plan
import dayjs from "dayjs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ReportFilters, TopPlan } from "../types";

const PRESETS = [
  { key: "month", label: "This month", from: () => dayjs().startOf("month") },
  { key: "quarter", label: "Last 3 months", from: () => dayjs().subtract(3, "month").startOf("day") },
  { key: "year", label: "Last 12 months", from: () => dayjs().subtract(12, "month").startOf("day") },
] as const;

const fmt = (d: dayjs.Dayjs) => d.format("YYYY-MM-DD");

type Props = { value: ReportFilters; onChange: (f: ReportFilters) => void; plans: TopPlan[] };

export function DashboardFilters({ value, onChange, plans }: Props) {
  const today = fmt(dayjs());
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-lg border bg-white p-0.5" role="group" aria-label="Date range">
        {PRESETS.map((p) => {
          const active = value.from === fmt(p.from()) && value.to === today;
          return (
            <button
              key={p.key} type="button" aria-pressed={active}
              onClick={() => onChange({ ...value, from: fmt(p.from()), to: today })}
              className={cn("rounded-md px-3 py-1 text-sm", active ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100")}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <Input type="date" aria-label="From" className="w-36 bg-white" value={value.from ?? ""} max={value.to}
        onChange={(e) => onChange({ ...value, from: e.target.value || undefined })} />
      <span className="text-slate-400">to</span>
      <Input type="date" aria-label="To" className="w-36 bg-white" value={value.to ?? ""} min={value.from}
        onChange={(e) => onChange({ ...value, to: e.target.value || undefined })} />
      <select
        aria-label="Plan"
        className="h-8 rounded-lg border bg-white px-2.5 text-sm"
        value={value.planId ?? ""}
        onChange={(e) => onChange({ ...value, planId: e.target.value ? Number(e.target.value) : undefined })}
      >
        <option value="">All plans</option>
        {plans.map((p) => <option key={p.planId} value={p.planId}>{p.name}</option>)}
      </select>
    </div>
  );
}
