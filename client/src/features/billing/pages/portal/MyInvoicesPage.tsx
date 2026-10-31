// [M4] Customer portal: my invoices with outstanding balance highlighted
import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/format";
import { useMyInvoiceStats, useMyInvoices } from "../../api";
import type { InvoiceStats } from "../../types";
import { InvoicesTable } from "../../components/InvoicesTable";
import { Pager } from "../../components/Pager";
import { StatusTabs, tabToFilter } from "../InvoicesListPage";

export default function MyInvoicesPage() {
  const [tab, setTab] = useState<keyof InvoiceStats>("ALL");
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [tab]);
  const stats = useMyInvoiceStats();
  const { data, isLoading } = useMyInvoices({ ...tabToFilter(tab), page, limit: 10 });
  const open = useMyInvoices({ status: "CONFIRMED", limit: 100 });
  const outstanding = (open.data?.data ?? []).reduce((a, i) => a + i.balance, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My invoices</h1>
          <p className="text-sm text-slate-500">Download, print or pay your invoices</p>
        </div>
        <div className="rounded-lg border bg-white px-4 py-2 text-right">
          <p className="text-xs text-slate-500">Outstanding</p>
          <p className={`text-xl font-semibold tabular-nums ${outstanding > 0 ? "text-amber-700" : "text-emerald-700"}`}>{formatMoney(outstanding)}</p>
        </div>
      </div>
      <StatusTabs tab={tab} stats={stats.data && { ...stats.data, DRAFT: 0 }} onTab={setTab} />
      <InvoicesTable rows={data?.data} loading={isLoading} showCustomer={false} linkTo={(id) => `/portal/invoices/${id}`} />
      {data && <Pager {...data.meta} onPage={setPage} />}
    </div>
  );
}
