// [M4] Invoices list: status tabs with counts, search, date range, server pagination
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useInvoiceStats, useInvoices } from "../api";
import type { InvoiceFilters, InvoiceStats, InvoiceStatus } from "../types";
import { InvoicesTable } from "../components/InvoicesTable";
import { Pager } from "../components/Pager";

export const TABS: { key: keyof InvoiceStats; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "DRAFT", label: "Draft" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "OVERDUE", label: "Overdue" },
  { key: "PAID", label: "Paid" },
  { key: "CANCELLED", label: "Cancelled" },
];

export function tabToFilter(tab: keyof InvoiceStats): Pick<InvoiceFilters, "status" | "overdue"> {
  if (tab === "ALL") return {};
  if (tab === "OVERDUE") return { overdue: true };
  return { status: tab as InvoiceStatus };
}

export function StatusTabs({ tab, stats, onTab }: { tab: keyof InvoiceStats; stats?: InvoiceStats; onTab: (t: keyof InvoiceStats) => void }) {
  return (
    <div className="flex flex-wrap gap-1 border-b" role="tablist">
      {TABS.map((t) => (
        <button
          key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => onTab(t.key)}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-sm font-medium",
            tab === t.key ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800",
          )}
        >
          {t.label}
          {stats && <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 text-xs text-slate-600">{stats[t.key].toLocaleString("en-IN")}</span>}
        </button>
      ))}
    </div>
  );
}

export function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export default function InvoicesListPage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as keyof InvoiceStats) || "ALL";
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search.trim());
  useEffect(() => setPage(1), [tab, q, from, to]);

  const stats = useInvoiceStats();
  const { data, isLoading } = useInvoices({
    ...tabToFilter(tab), page, limit: 20, search: q || undefined, from: from || undefined, to: to ? `${to}T23:59:59` : undefined,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p className="text-sm text-slate-500">Generated automatically from subscriptions on billing day</p>
      </div>
      <StatusTabs tab={tab} stats={stats.data} onTab={(t) => setParams(t === "ALL" ? {} : { tab: t })} />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2 size-4 text-slate-400" />
          <Input className="w-72 bg-white pl-8" placeholder="Search number, customer, subscription" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Input type="date" aria-label="Invoice date from" className="w-36 bg-white" value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="text-slate-400">to</span>
        <Input type="date" aria-label="Invoice date to" className="w-36 bg-white" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <InvoicesTable rows={data?.data} loading={isLoading} linkTo={(id) => `/app/invoices/${id}`} />
      {data && <Pager {...data.meta} onPage={setPage} />}
    </div>
  );
}
