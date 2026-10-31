// [M4] Customer portal: invoice detail with Pay now (mock online payment) and PDF
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CreditCard, Download, Printer } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { myInvoicePdfUrl, useMyInvoice, usePayMyInvoice } from "../../api";
import { InvoicePrintView } from "../../components/InvoicePrintView";
import { PaymentsTable } from "../../components/PaymentsTable";

export default function MyInvoiceDetailPage() {
  const id = Number(useParams().id);
  const { data: invoice, isLoading, error } = useMyInvoice(id);
  const pay = usePayMyInvoice();

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (error || !invoice) return <p className="text-slate-600">Invoice not found. <Link className="text-indigo-700" to="/portal/invoices">Back</Link></p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to="/portal/invoices" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="size-4" /> My invoices
        </Link>
        <div className="flex flex-wrap gap-2">
          {invoice.status === "CONFIRMED" && invoice.balance > 0 && (
            <Button onClick={() => pay.mutate(invoice.id)} disabled={pay.isPending}>
              <CreditCard /> {pay.isPending ? "Processing..." : `Pay ${formatMoney(invoice.balance)}`}
            </Button>
          )}
          <Button variant="outline" onClick={() => window.print()}><Printer /> Print</Button>
          <a className={buttonVariants({ variant: "outline" })} href={myInvoicePdfUrl(invoice.id, true)}><Download /> PDF</a>
        </div>
      </div>
      <InvoicePrintView invoice={invoice} />
      {invoice.payments.length > 0 && (
        <div className="rounded-lg border bg-white p-4 print:hidden">
          <h2 className="mb-2 font-medium">Payments</h2>
          <PaymentsTable rows={invoice.payments} />
        </div>
      )}
    </div>
  );
}
