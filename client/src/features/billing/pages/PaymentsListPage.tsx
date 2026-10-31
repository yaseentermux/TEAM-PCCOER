// [M4] All payments: method + date filters, search, total of the filtered set
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { usePayments } from "../api";
import { PAYMENT_METHODS, type PaymentMethod } from "../types";
import { PaymentsTable } from "../components/PaymentsTable";
import { Pager } from "../components/Pager";
import { useDebounced } from "./InvoicesListPage";

export default function PaymentsListPage() {
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search.trim());
  useEffect(() => setPage(1), [q, method, from, to]);

  const { data, isLoading } = usePayments({
    page, limit: 20, search: q || undefined, method: method || undefined, from: from || undefined, to: to ? `${to}T23:59:59` : undefined,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
          <p className="text-sm text-slate-500">Every payment recorded against an invoice</p>
        </div>
        {data && (
          <div className="text-right">
            <p className="text-xs text-slate-500">Total of filtered payments</p>
            <p className="text-xl font-semibold tabular-nums">{formatMoney(data.summary.totalAmount)}</p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2 size-4 text-slate-400" />
          <Input className="w-64 bg-white pl-8" placeholder="Search invoice, customer, note" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select aria-label="Method" className="h-8 rounded-lg border bg-white px-2.5 text-sm" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod | "")}>
          <option value="">All methods</option>
          {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <Input type="date" aria-label="From" className="w-36 bg-white" value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="text-slate-400">to</span>
        <Input type="date" aria-label="To" className="w-36 bg-white" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <Card>
        <CardContent>
          {isLoading && !data ? <Skeleton className="h-64 w-full" /> : <PaymentsTable rows={data?.data ?? []} showInvoice />}
        </CardContent>
      </Card>
      {data && <Pager {...data.meta} onPage={setPage} />}
    </div>
  );
}
