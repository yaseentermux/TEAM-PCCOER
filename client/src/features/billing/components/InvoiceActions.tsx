// [M4] Context buttons for an invoice: Confirm / Register payment / Send / Print / PDF / Cancel
import { useState } from "react";
import { CheckCircle2, Download, Mail, Printer, Wallet, XCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { invoicePdfUrl, useCancelInvoice, useConfirmInvoice, useSendInvoice } from "../api";
import type { InvoiceDetail } from "../types";
import { ConfirmActionDialog } from "./ConfirmActionDialog";
import { RegisterPaymentDialog } from "./RegisterPaymentDialog";

export function InvoiceActions({ invoice }: { invoice: InvoiceDetail }) {
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const confirm = useConfirmInvoice();
  const send = useSendInvoice();
  const cancel = useCancelInvoice();
  const s = invoice.status;

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      {s === "DRAFT" && (
        <Button onClick={() => confirm.mutate(invoice.id)} disabled={confirm.isPending}><CheckCircle2 /> Confirm</Button>
      )}
      {s === "CONFIRMED" && <Button onClick={() => setPaying(true)}><Wallet /> Register payment</Button>}
      {(s === "CONFIRMED" || s === "PAID") && (
        <Button variant="outline" onClick={() => send.mutate(invoice.id)} disabled={send.isPending}>
          <Mail /> {send.isPending ? "Sending..." : invoice.sentAt ? "Resend" : "Send"}
        </Button>
      )}
      <Button variant="outline" onClick={() => window.print()}><Printer /> Print</Button>
      <a className={buttonVariants({ variant: "outline" })} href={invoicePdfUrl(invoice.id, true)}><Download /> PDF</a>
      {(s === "DRAFT" || (s === "CONFIRMED" && invoice.amountPaid === 0)) && (
        <Button variant="ghost" className="text-red-600" onClick={() => setCancelling(true)}><XCircle /> Cancel invoice</Button>
      )}

      {s === "CONFIRMED" && <RegisterPaymentDialog invoice={invoice} open={paying} onOpenChange={setPaying} />}
      <ConfirmActionDialog
        open={cancelling} onOpenChange={setCancelling}
        title={`Cancel ${invoice.number}?`}
        description="The invoice will no longer be payable, and any discount it used becomes available again."
        confirmLabel="Cancel invoice" pending={cancel.isPending}
        onConfirm={() => cancel.mutate(invoice.id, { onSuccess: () => setCancelling(false) })}
      />
    </div>
  );
}
