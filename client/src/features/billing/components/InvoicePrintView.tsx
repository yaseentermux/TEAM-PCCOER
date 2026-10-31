// [M4] The invoice "document": bill-to, meta, lines, totals. Used by staff and portal detail pages and for printing.
import { formatDate } from "@/lib/format";
import type { InvoiceDetail } from "../types";
import { InvoiceLinesTable } from "./InvoiceLinesTable";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";

export function InvoicePrintView({ invoice }: { invoice: InvoiceDetail }) {
  const meta: [string, string][] = [
    ["Invoice date", formatDate(invoice.invoiceDate)],
    ["Due date", formatDate(invoice.dueDate)],
    ["Period", `${formatDate(invoice.periodStart)} - ${formatDate(invoice.periodEnd)}`],
    ["Subscription", invoice.subscription.number ?? `#${invoice.subscription.id}`],
    ["Plan", invoice.subscription.plan.name],
    ["Payment terms", invoice.subscription.paymentTerms.replace("_", " ")],
  ];
  return (
    <article className="rounded-lg border bg-white p-6 print:border-0 print:p-0">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
        <div>
          <p className="text-lg font-bold text-indigo-700">Brightloop Software</p>
          <p className="text-xs text-slate-500">Subscription billing</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold tracking-tight">INVOICE {invoice.number}</p>
          <InvoiceStatusBadge status={invoice.status} overdue={invoice.isOverdue} className="mt-1" />
          {invoice.isOverdue && <p className="mt-1 text-xs font-medium text-amber-700">{invoice.daysOverdue} days overdue</p>}
        </div>
      </header>
      <section className="grid gap-6 py-4 sm:grid-cols-2">
        <div className="text-sm">
          <p className="text-xs font-medium uppercase text-slate-500">Bill to</p>
          <p className="mt-1 font-semibold">{invoice.customer.name}</p>
          {[invoice.customer.company, invoice.customer.email, invoice.customer.phone, invoice.customer.address]
            .filter(Boolean).map((t) => <p key={t} className="text-slate-600">{t}</p>)}
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {meta.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-slate-500">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
      <InvoiceLinesTable invoice={invoice} />
    </article>
  );
}
