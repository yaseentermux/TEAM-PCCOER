import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Layers,
  CreditCard,
  AlertCircle,
  Receipt,
  History,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Pause,
  Play,
  RotateCcw,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import {
  usePortalSubscription,
  usePortalAcceptQuotation,
  usePortalPauseSubscription,
  usePortalResumeSubscription,
  usePortalCloseSubscription,
  usePortalRenewSubscription,
} from "../../api";
import { SubscriptionStatusBadge } from "../../components/SubscriptionStatusBadge";
import { CloseSubscriptionDialog } from "../../components/CloseSubscriptionDialog";
import { InvoiceStatusBadge } from "@/features/billing/components/InvoiceStatusBadge";
import type { InvoiceStatus } from "@/features/billing/types";

export default function MySubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const subId = Number(id);

  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);

  // Queries & Mutations
  const { data: subscription, isLoading, isError, error, refetch } = usePortalSubscription(subId);
  const acceptMutation = usePortalAcceptQuotation();
  const pauseMutation = usePortalPauseSubscription();
  const resumeMutation = usePortalResumeSubscription();
  const closeMutation = usePortalCloseSubscription();
  const renewMutation = usePortalRenewSubscription();

  const isActionPending =
    acceptMutation.isPending ||
    pauseMutation.isPending ||
    resumeMutation.isPending ||
    closeMutation.isPending ||
    renewMutation.isPending;

  const handleAcceptConfirm = (notes?: string) => {
    acceptMutation.mutate(
      { id: subId, notes },
      {
        onSuccess: () => {
          setAcceptDialogOpen(false);
        },
      }
    );
  };

  const handlePause = () => {
    pauseMutation.mutate({ id: subId });
  };

  const handleResume = () => {
    resumeMutation.mutate({ id: subId });
  };

  const handleRenew = () => {
    renewMutation.mutate({ id: subId });
  };

  const handleCloseConfirm = (reason: string) => {
    closeMutation.mutate(
      { id: subId, reason },
      {
        onSuccess: () => {
          setCloseDialogOpen(false);
        },
      }
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-md" />
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  // Error state
  if (isError || !subscription) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/portal/subscriptions")}
          className="gap-1.5 text-xs text-slate-600"
        >
          <ArrowLeft className="size-3.5" /> Back to My Subscriptions
        </Button>
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="size-5 shrink-0 text-rose-500" />
          <div className="flex-1">
            <p className="font-semibold">Subscription not found</p>
            <p className="text-xs text-rose-700">
              {error instanceof Error
                ? error.message
                : "The requested subscription could not be retrieved or is not linked to your account."}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const lines = subscription.lines ?? [];
  const linesTotal = lines.reduce((acc, line) => acc + Number(line.amount || 0), 0);
  const displayTotal = linesTotal > 0 ? linesTotal : Number(subscription.plan?.price || 0);

  const events = subscription.events ?? [];
  const invoices = subscription.invoices ?? [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/portal/subscriptions")}
            className="size-8 p-0 text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {subscription.number ?? `SUB-${String(subscription.id).padStart(5, "0")}`}
              </h1>
              <SubscriptionStatusBadge status={subscription.status} />
            </div>
            <p className="text-xs text-slate-500">
              Plan: <span className="font-medium text-slate-800">{subscription.plan?.name}</span>{" "}
              &bull; Started {formatDate(subscription.startDate)}
            </p>
          </div>
        </div>

        {/* Customer Lifecycle Action Controls & Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Accept Quotation Action: only when status is QUOTATION */}
          {subscription.status === "QUOTATION" && (
            <Button
              size="sm"
              onClick={() => setAcceptDialogOpen(true)}
              disabled={isActionPending}
              className="h-8 gap-1.5 bg-emerald-600 text-xs font-medium text-white hover:bg-emerald-700 shadow-xs"
            >
              {acceptMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              Accept Quotation
            </Button>
          )}

          {/* Pause Action: ACTIVE and plan.pausable */}
          {subscription.status === "ACTIVE" && subscription.plan?.pausable && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePause}
              disabled={isActionPending}
              className="h-8 gap-1.5 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
            >
              {pauseMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Pause className="size-3.5" />
              )}
              Pause Plan
            </Button>
          )}

          {/* Resume Action: PAUSED */}
          {subscription.status === "PAUSED" && (
            <Button
              size="sm"
              onClick={handleResume}
              disabled={isActionPending}
              className="h-8 gap-1.5 bg-emerald-600 text-xs text-white hover:bg-emerald-700 shadow-xs"
            >
              {resumeMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Play className="size-3.5" />
              )}
              Resume Subscription
            </Button>
          )}

          {/* Renew Action: ACTIVE or CLOSED and plan.renewable */}
          {["ACTIVE", "CLOSED"].includes(subscription.status) && subscription.plan?.renewable && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRenew}
              disabled={isActionPending}
              className="h-8 gap-1.5 text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            >
              {renewMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RotateCcw className="size-3.5" />
              )}
              {subscription.status === "CLOSED" ? "Reactivate Plan" : "Renew Period"}
            </Button>
          )}

          {/* Cancel / Close Action */}
          {["ACTIVE", "PAUSED", "QUOTATION"].includes(subscription.status) &&
            (subscription.status === "QUOTATION" || subscription.plan?.closable) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCloseDialogOpen(true)}
                disabled={isActionPending}
                className="h-8 gap-1.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                <XCircle className="size-3.5" />
                {subscription.status === "QUOTATION" ? "Decline Quote" : "Cancel Subscription"}
              </Button>
            )}

          {/* Invoices Shortcut button */}
          {invoices.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/portal/invoices")}
              className="h-8 gap-1.5 text-xs text-slate-700 hover:text-indigo-600 border-slate-200"
            >
              <Receipt className="size-3.5" />
              Invoices ({invoices.length})
            </Button>
          )}
        </div>
      </div>

      {/* Customer Status Context Banner */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-xs text-indigo-950">
        <div className="flex items-start gap-3">
          {subscription.status === "ACTIVE" ? (
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600 mt-0.5" />
          ) : subscription.status === "PAUSED" ? (
            <Clock className="size-5 shrink-0 text-amber-600 mt-0.5" />
          ) : (
            <ShieldCheck className="size-5 shrink-0 text-indigo-600 mt-0.5" />
          )}
          <div className="space-y-1 flex-1">
            <p className="font-semibold text-slate-900 text-sm">
              {subscription.status === "ACTIVE"
                ? "Active Recurring Subscription"
                : subscription.status === "PAUSED"
                ? "Subscription Currently Paused"
                : subscription.status === "QUOTATION"
                ? "Official Quotation Available"
                : subscription.status === "CONFIRMED"
                ? "Subscription Confirmed"
                : subscription.status === "DRAFT"
                ? "Subscription Request Submitted"
                : `Subscription Status: ${subscription.status}`}
            </p>
            <p className="text-slate-600">
              {subscription.status === "ACTIVE"
                ? `Your subscription is active and billed on a ${subscription.plan?.billingPeriod.toLowerCase()} cycle. Invoices are automatically recorded under your portal account.`
                : subscription.status === "PAUSED"
                ? "Your recurring billing cycles and active service access are temporarily on hold. Click 'Resume Subscription' anytime to reactivate."
                : subscription.status === "QUOTATION"
                ? "An official quotation has been generated for your order. Review the line items and click 'Accept Quotation' to confirm your subscription."
                : subscription.status === "CONFIRMED"
                ? "Your quotation has been accepted and confirmed. Automated recurring billing will begin on your start date."
                : subscription.status === "DRAFT"
                ? "Your subscription order has been submitted as a draft. Our sales team is reviewing your requested plan and lines to issue an official quotation."
                : "This subscription contract is closed. You can reactivate or renew it whenever you need to resume services."}
            </p>
          </div>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Plan */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Service Plan</span>
            <Layers className="size-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-base font-bold text-slate-900">{subscription.plan?.name}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] uppercase font-semibold">
              {subscription.plan?.billingPeriod}
            </Badge>
            <span className="text-xs text-slate-500">
              Base {formatMoney(Number(subscription.plan?.price))}
            </span>
          </div>
        </div>

        {/* Card 2: Billing Cycle */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Effective Dates</span>
            <Calendar className="size-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            From {formatDate(subscription.startDate)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {subscription.expiryDate ? (
              <span>Until {formatDate(subscription.expiryDate)}</span>
            ) : (
              <span className="text-emerald-700 font-medium">Automatic renewal</span>
            )}
          </p>
        </div>

        {/* Card 3: Recurring Amount */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Recurring Amount</span>
            <CreditCard className="size-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-lg font-bold text-indigo-700">{formatMoney(displayTotal)}</p>
          <p className="mt-1 text-xs text-slate-500">Per {subscription.plan?.billingPeriod.toLowerCase()}</p>
        </div>

        {/* Card 4: Payment Terms */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Payment Terms</span>
            <Receipt className="size-4 text-slate-400" />
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {subscription.paymentTerms === "IMMEDIATE"
              ? "Immediate Payment"
              : subscription.paymentTerms === "NET_7"
              ? "Net 7 Days"
              : subscription.paymentTerms === "NET_15"
              ? "Net 15 Days"
              : subscription.paymentTerms === "NET_30"
              ? "Net 30 Days"
              : subscription.paymentTerms}
          </p>
          <p className="mt-1 text-xs text-slate-500">Standard customer invoice terms</p>
        </div>
      </div>

      {/* Tabs: Order Lines, Invoices, Timeline */}
      <Tabs defaultValue="lines" className="space-y-4">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="lines" className="text-xs">
            Included Services & Lines ({lines.length})
          </TabsTrigger>
          <TabsTrigger value="invoices" className="text-xs">
            Linked Invoices ({invoices.length})
          </TabsTrigger>
          {events.length > 0 && (
            <TabsTrigger value="history" className="text-xs">
              Subscription Events ({events.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab 1: Order Lines & Financials */}
        <TabsContent value="lines" className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold text-slate-700">Product</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-700">
                    Quantity
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-700">
                    Unit Price
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-700">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-28 text-center text-xs text-slate-500">
                      Standard package lines as defined by plan {subscription.plan?.name}.
                    </TableCell>
                  </TableRow>
                ) : (
                  lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-slate-900">
                            {line.product?.name ?? line.description ?? `Item #${line.id}`}
                          </p>
                          {line.variant && (
                            <p className="text-[11px] text-slate-500">
                              {line.variant.attribute}: {line.variant.value}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-xs text-slate-700">
                        {line.quantity}
                      </TableCell>
                      <TableCell className="text-right text-xs text-slate-700">
                        {formatMoney(Number(line.unitPrice))}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium text-slate-900">
                        {formatMoney(Number(line.amount))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Financial Summary Box */}
            <div className="border-t border-slate-100 bg-slate-50/50 p-4">
              <div className="ml-auto max-w-xs space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Lines Subtotal</span>
                  <span className="font-medium text-slate-900">{formatMoney(linesTotal)}</span>
                </div>
                {subscription.discount && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount ({subscription.discount.name})</span>
                    <span>
                      {subscription.discount.type === "PERCENT"
                        ? `-${subscription.discount.value}%`
                        : `-${formatMoney(Number(subscription.discount.value))}`}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-1.5 flex justify-between text-sm font-bold text-slate-900">
                  <span>Total Per Cycle</span>
                  <span className="text-indigo-600">{formatMoney(displayTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Linked Invoices */}
        <TabsContent value="invoices" className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold text-slate-700">Invoice</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">Date</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">Due Date</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-700">
                    Total
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-700">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center space-y-1.5 text-slate-500 text-xs">
                        <Receipt className="size-6 text-slate-300" />
                        <p className="font-medium">No invoices generated yet</p>
                        <p className="text-[11px] text-slate-400">
                          Invoices are automatically created during scheduled billing cycles.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs font-semibold text-indigo-700">
                        {inv.number ?? `INV-${inv.id}`}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {formatDate(inv.invoiceDate)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {formatDate(inv.dueDate)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium text-slate-900">
                        {formatMoney(Number(inv.total))}
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={inv.status as InvoiceStatus} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/portal/invoices/${inv.id}`)}
                          className="h-7 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                        >
                          View Invoice
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab 3: Timeline & Audit Events */}
        {events.length > 0 && (
          <TabsContent value="history" className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <h3 className="text-xs font-semibold text-slate-800 mb-4 flex items-center gap-1.5">
                <History className="size-4 text-indigo-500" />
                Lifecycle Audit Timeline
              </h3>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {events.map((evt) => (
                  <div key={evt.id} className="relative text-xs">
                    <div className="absolute -left-6 top-0.5 size-2.5 rounded-full border-2 border-white bg-indigo-600" />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="font-medium text-slate-900">
                        {evt.fromStatus ? `${evt.fromStatus} → ${evt.toStatus}` : evt.toStatus}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatDateTime(evt.createdAt)}
                      </div>
                    </div>
                    {evt.note && <p className="mt-1 text-slate-600">{evt.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Accept Quotation Confirmation Dialog */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="size-5" />
              <DialogTitle>Accept Quotation</DialogTitle>
            </div>
            <DialogDescription className="text-slate-600 pt-2 text-xs leading-relaxed">
              Are you sure you want to accept this quotation? By confirming, you approve the agreed order
              specifications and recurring pricing. Your subscription will be confirmed immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-emerald-50/70 border border-emerald-200/60 p-3.5 text-xs text-emerald-950 space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span>Quotation Ref:</span>
              <span>{subscription.number ?? `#${subscription.id}`}</span>
            </div>
            <div className="flex justify-between text-emerald-800">
              <span>Selected Plan:</span>
              <span>{subscription.plan?.name} ({subscription.plan?.billingPeriod})</span>
            </div>
            <div className="flex justify-between text-emerald-800">
              <span>Order Lines:</span>
              <span>{lines.length} item{lines.length === 1 ? "" : "s"}</span>
            </div>
            <div className="border-t border-emerald-200/80 pt-1.5 flex justify-between font-bold text-emerald-900 text-sm">
              <span>Recurring Total:</span>
              <span>{formatMoney(displayTotal)}</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAcceptDialogOpen(false)}
              disabled={acceptMutation.isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleAcceptConfirm()}
              disabled={acceptMutation.isPending}
              className="gap-1.5 bg-emerald-600 text-xs font-medium text-white hover:bg-emerald-700 shadow-xs"
            >
              {acceptMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              Confirm & Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Cancellation Reason Dialog */}
      <CloseSubscriptionDialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        onConfirm={handleCloseConfirm}
        pending={closeMutation.isPending}
        subscriptionNumber={subscription.number}
      />
    </div>
  );
}
