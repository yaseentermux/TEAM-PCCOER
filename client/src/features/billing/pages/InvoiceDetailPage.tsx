// [M4] Invoice detail: status bar, actions, document, payments
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { useDeletePayment, useInvoice } from "../api";
import type { Payment } from "../types";
import { InvoiceStatusBar } from "../components/InvoiceStatusBar";
import { InvoiceActions } from "../components/InvoiceActions";
import { InvoicePrintView } from "../components/InvoicePrintView";
import { PaymentsTable } from "../components/PaymentsTable";
import { ConfirmActionDialog } from "../components/ConfirmActionDialog";

export default function InvoiceDetailPage() {
  const id = Number(useParams().id);
  const { data: invoice, isLoading, error } = useInvoice(id);
  const [toDelete, setToDelete] = useState<Payment | null>(null);
  const del = useDeletePayment();

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (error || !invoice) return <p className="text-slate-600">Invoice not found. <Link className="text-indigo-700" to="/app/invoices">Back to invoices</Link></p>;

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <Link to="/app/invoices" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="size-4" /> Invoices
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <InvoiceActions invoice={invoice} />
          <InvoiceStatusBar status={invoice.status} />
        </div>
        {invoice.sentAt && <p className="mt-2 text-xs text-slate-500">Emailed to {invoice.customer.email} on {formatDateTime(invoice.sentAt)}</p>}
      </div>

      <InvoicePrintView invoice={invoice} />

      <Card className="print:hidden">
        <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
        <CardContent>
          <PaymentsTable rows={invoice.payments} onDelete={setToDelete} />
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete this payment?" description="The invoice balance and status will be recalculated. Only admins can do this."
        confirmLabel="Delete payment" pending={del.isPending}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </div>
  );
}
