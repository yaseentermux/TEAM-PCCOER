import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useCreateFromTemplate, useCustomers, useSubscriptions } from "../api";
import type { QuotationTemplateItem, PaymentTerms, CustomerRef } from "../types";

interface Props {
  template: QuotationTemplateItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAYMENT_TERMS_OPTIONS: { label: string; value: PaymentTerms }[] = [
  { label: "Immediate Payment", value: "IMMEDIATE" },
  { label: "Net 7 Days", value: "NET_7" },
  { label: "Net 15 Days", value: "NET_15" },
  { label: "Net 30 Days", value: "NET_30" },
];

const nativeSelectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

export function CreateFromTemplateDialog({ template, open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const createFromTemplateMutation = useCreateFromTemplate();

  const { data: apiCustomers = [], isLoading: isCustomersLoading } = useCustomers();
  const { data: recentSubsData } = useSubscriptions({ limit: 50 });

  // Resolve customers with fallback from recent subscriptions if /customers not yet seeded/routed
  const customers = useMemo(() => {
    if (apiCustomers.length > 0) return apiCustomers;
    const map = new Map<number, CustomerRef>();
    recentSubsData?.data?.forEach((s) => {
      if (s.customer && !map.has(s.customer.id)) {
        map.set(s.customer.id, s.customer);
      }
    });
    return Array.from(map.values());
  }, [apiCustomers, recentSubsData]);

  const [customerId, setCustomerId] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>("IMMEDIATE");
  const [notes, setNotes] = useState<string>("");

  const isSubmitting = createFromTemplateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;

    if (!customerId || customerId <= 0) {
      toast.error("Please select a customer");
      return;
    }
    if (!startDate) {
      toast.error("Please select a valid start date");
      return;
    }

    createFromTemplateMutation.mutate(
      {
        templateId: template.id,
        data: {
          customerId: Number(customerId),
          startDate: new Date(startDate).toISOString(),
          paymentTerms,
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: (sub) => {
          onOpenChange(false);
          navigate(`/app/subscriptions/${sub.id}`);
        },
      }
    );
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2 text-indigo-600">
              <Sparkles className="size-5" />
              <DialogTitle className="text-slate-900">
                Create Subscription from Template
              </DialogTitle>
            </div>
            <DialogDescription>
              Generate a draft subscription using the pre-configured plan and line items from{" "}
              <strong className="text-slate-800">{template.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {/* Template Details Summary Box */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Layers className="size-3.5 text-indigo-500" />
                {template.plan?.name ?? "Base Plan"}
              </span>
              <Badge variant="outline" className="text-[10px] font-semibold">
                {template.plan?.billingPeriod ?? "MONTHLY"}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Validity: {template.validityDays} days</span>
              <span>{template.lines?.length || 0} line item(s)</span>
            </div>
            {template.lines && template.lines.length > 0 && (
              <div className="border-t border-slate-200/70 pt-2 space-y-1">
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  Included Items
                </span>
                <ul className="space-y-0.5">
                  {template.lines.map((l, i) => (
                    <li key={i} className="flex justify-between text-slate-600">
                      <span>
                        {l.product?.name ?? `Product #${l.productId}`}
                        {l.variant ? ` (${l.variant.attribute}: ${l.variant.value})` : ""}
                      </span>
                      <span className="font-medium">Qty: {l.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Form Inputs */}
          <div className="space-y-3 pt-1">
            {/* Customer Select */}
            <div className="space-y-1.5">
              <Label htmlFor="tpl-customer" className="text-xs font-medium text-slate-700">
                Customer <span className="text-rose-500">*</span>
              </Label>
              {isCustomersLoading ? (
                <div className="h-9 w-full animate-pulse rounded-lg bg-slate-100" />
              ) : (
                <select
                  id="tpl-customer"
                  className={nativeSelectClass}
                  value={customerId}
                  onChange={(e) => setCustomerId(Number(e.target.value))}
                  required
                >
                  <option value={0}>-- Select Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ""} - {c.email}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Start Date */}
              <div className="space-y-1.5">
                <Label htmlFor="tpl-start-date" className="text-xs font-medium text-slate-700">
                  Start Date <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="tpl-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              {/* Payment Terms */}
              <div className="space-y-1.5">
                <Label htmlFor="tpl-payment-terms" className="text-xs font-medium text-slate-700">
                  Payment Terms
                </Label>
                <select
                  id="tpl-payment-terms"
                  className={nativeSelectClass}
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)}
                >
                  {PAYMENT_TERMS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="tpl-notes" className="text-xs font-medium text-slate-700">
                Notes <span className="text-slate-400 font-normal">(Optional)</span>
              </Label>
              <Textarea
                id="tpl-notes"
                rows={2}
                placeholder="Optional notes or customer reference..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {isSubmitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              Create Subscription
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
