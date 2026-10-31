// [M4] Invoice list table shared by staff list, portal list and the customer tab
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatMoney } from "@/lib/format";
import type { InvoiceListItem } from "../types";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";

type Props = { rows?: InvoiceListItem[]; loading?: boolean; linkTo: (id: number) => string; showCustomer?: boolean };

export function InvoicesTable({ rows, loading, linkTo, showCustomer = true }: Props) {
  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            {showCustomer && <TableHead>Customer</TableHead>}
            <TableHead>Subscription</TableHead>
            <TableHead>Invoice date</TableHead>
            <TableHead>Due date</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && !rows
            ? Array.from({ length: 6 }, (_, i) => (
                <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
              ))
            : rows?.map((r) => (
                <TableRow key={r.id} className="cursor-pointer">
                  <TableCell className="font-medium text-indigo-700"><Link to={linkTo(r.id)}>{r.number ?? `#${r.id}`}</Link></TableCell>
                  {showCustomer && <TableCell>{r.customer.name}</TableCell>}
                  <TableCell className="text-slate-600">{r.subscription.number}</TableCell>
                  <TableCell>{formatDate(r.invoiceDate)}</TableCell>
                  <TableCell className={r.isOverdue ? "font-medium text-amber-700" : ""}>
                    {formatDate(r.dueDate)}{r.isOverdue && <span className="ml-1 text-xs">({r.daysOverdue}d)</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(r.total)}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.balance > 0 ? formatMoney(r.balance) : "-"}</TableCell>
                  <TableCell><InvoiceStatusBadge status={r.status} overdue={r.isOverdue} /></TableCell>
                </TableRow>
              ))}
          {rows?.length === 0 && (
            <TableRow><TableCell colSpan={8} className="py-10 text-center text-slate-500">No invoices found</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
