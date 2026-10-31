// [M4] Register a payment against a confirmed invoice (amount prefilled with the balance)
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/format";
import { useRegisterPayment } from "../api";
import { PAYMENT_METHODS, type InvoiceDetail } from "../types";

const nativeSelect = "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function RegisterPaymentDialog({ invoice, open, onOpenChange }: { invoice: InvoiceDetail; open: boolean; onOpenChange: (o: boolean) => void }) {
  const schema = z.object({
    method: z.enum(["BANK_TRANSFER", "UPI", "CARD", "CASH", "ONLINE"]),
    amount: z.coerce.number()
      .positive("Amount must be greater than 0")
      .max(invoice.balance, `Cannot exceed the balance of ${formatMoney(invoice.balance)}`),
    paymentDate: z.string().min(1, "Pick a date"),
    note: z.string().max(500).optional(),
  });
  type Form = z.infer<typeof schema>;

  const defaults = { method: "BANK_TRANSFER" as const, amount: invoice.balance, paymentDate: dayjs().format("YYYY-MM-DD"), note: "" };
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) as any, defaultValues: defaults });
  useEffect(() => { if (open) reset(defaults); }, [open, invoice.balance]); // eslint-disable-line react-hooks/exhaustive-deps

  const pay = useRegisterPayment();
  const submit = handleSubmit((v) =>
    pay.mutate(
      { invoiceId: invoice.id, method: v.method, amount: v.amount, paymentDate: v.paymentDate, note: v.note || undefined },
      { onSuccess: () => onOpenChange(false) },
    ));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Register payment</DialogTitle>
            <DialogDescription>{invoice.number} · balance {formatMoney(invoice.balance)}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pm-method">Method</Label>
              <select id="pm-method" className={nativeSelect} {...register("method")}>
                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pm-date">Payment date</Label>
              <Input id="pm-date" type="date" max={dayjs().format("YYYY-MM-DD")} {...register("paymentDate")} />
              {errors.paymentDate && <p className="text-xs text-red-600">{errors.paymentDate.message}</p>}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pm-amount">Amount</Label>
              <Input id="pm-amount" type="number" step="0.01" min="0.01" {...register("amount")} />
              {errors.amount && <p className="text-xs text-red-600">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pm-note">Note</Label>
              <Textarea id="pm-note" rows={2} placeholder="Transaction reference, cheque no..." {...register("note")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pay.isPending}>{pay.isPending ? "Saving..." : "Register payment"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
