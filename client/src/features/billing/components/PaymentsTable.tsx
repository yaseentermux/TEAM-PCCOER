// [M4] Payments table (invoice detail + payments page)
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/format";
import { methodLabel, type Payment } from "../types";

type Props = { rows: Payment[]; showInvoice?: boolean; onDelete?: (p: Payment) => void };

export function PaymentsTable({ rows, showInvoice, onDelete }: Props) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-slate-500">No payments yet</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          {showInvoice && <TableHead>Invoice</TableHead>}
          {showInvoice && <TableHead>Customer</TableHead>}
          <TableHead>Method</TableHead>
          <TableHead>Note</TableHead>
          <TableHead>Recorded by</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          {onDelete && <TableHead className="w-10" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((p) => (
          <TableRow key={p.id}>
            <TableCell>{formatDate(p.paymentDate)}</TableCell>
            {showInvoice && (
              <TableCell className="font-medium text-indigo-700">
                <Link to={`/app/invoices/${p.invoiceId}`}>{p.invoice?.number}</Link>
              </TableCell>
            )}
            {showInvoice && <TableCell>{p.invoice?.customer.name}</TableCell>}
            <TableCell>{methodLabel(p.method)}</TableCell>
            <TableCell className="max-w-56 truncate text-slate-600">{p.note ?? "-"}</TableCell>
            <TableCell className="text-slate-600">{p.createdBy?.name ?? "Customer portal"}</TableCell>
            <TableCell className="text-right font-medium tabular-nums">{formatMoney(p.amount)}</TableCell>
            {onDelete && (
              <TableCell>
                <Button variant="ghost" size="icon" aria-label="Delete payment" onClick={() => onDelete(p)}>
                  <Trash2 className="size-4 text-slate-500" />
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
