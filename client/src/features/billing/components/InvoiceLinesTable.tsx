// [M4] Invoice lines + totals block
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/format";
import type { InvoiceDetail } from "../types";

export function InvoiceLinesTable({ invoice }: { invoice: InvoiceDetail }) {
  const totals: [string, number, boolean?][] = [
    ["Subtotal", invoice.subtotal],
    ...(invoice.discountTotal ? [[`Discount${invoice.discount ? ` (${invoice.discount.name})` : ""}`, -invoice.discountTotal] as [string, number]] : []),
    ["Tax", invoice.taxTotal],
    ["Total", invoice.total, true],
    ["Paid", -invoice.amountPaid],
    ["Balance due", invoice.balance, true],
  ];
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit price</TableHead>
            <TableHead className="text-right">Discount</TableHead>
            <TableHead className="text-right">Tax</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoice.lines.map((l) => (
            <TableRow key={l.id}>
              <TableCell className="whitespace-normal">{l.description}</TableCell>
              <TableCell className="text-right tabular-nums">{l.quantity}</TableCell>
              <TableCell className="text-right tabular-nums">{formatMoney(l.unitPrice)}</TableCell>
              <TableCell className="text-right tabular-nums">{l.discountAmount ? `-${formatMoney(l.discountAmount)}` : "-"}</TableCell>
              <TableCell className="text-right tabular-nums">{formatMoney(l.taxAmount)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatMoney(l.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <dl className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm">
        {totals.map(([label, value, strong]) => (
          <div key={label} className={`flex justify-between ${strong ? "border-t pt-1 font-semibold text-slate-900" : "text-slate-600"}`}>
            <dt>{label}</dt>
            <dd className="tabular-nums">{value < 0 ? `-${formatMoney(-value)}` : formatMoney(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
