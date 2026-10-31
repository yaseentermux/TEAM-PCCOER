import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  User,
  Building,
  Mail,
  Phone,
  Layers,
  FileText,
  CreditCard,
  AlertCircle,
  Tag,
  Receipt,
  History,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  useSubscription,
  useSendQuotation,
  useConfirmSubscription,
  useActivateSubscription,
  usePauseSubscription,
  useResumeSubscription,
  useCloseSubscription,
  useRenewSubscription,
} from "../api";
import { SubscriptionStatusBadge } from "../components/SubscriptionStatusBadge";
import { SubscriptionStatusBar } from "../components/SubscriptionStatusBar";
import { CloseSubscriptionDialog } from "../components/CloseSubscriptionDialog";

export default function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const subId = Number(id);

  const [closeDialogOpen, setCloseDialogOpen] = useState(false);

  // Queries & Mutations
  const { data: subscription, isLoading, isError, error, refetch } = useSubscription(subId);

  const sendQuotationMutation = useSendQuotation();
  const confirmMutation = useConfirmSubscription();
  const activateMutation = useActivateSubscription();
  const pauseMutation = usePauseSubscription();
  const resumeMutation = useResumeSubscription();
  const closeMutation = useCloseSubscription();
  const renewMutation = useRenewSubscription();

  const isPending =
    sendQuotationMutation.isPending ||
    confirmMutation.isPending ||
    activateMutation.isPending ||
    pauseMutation.isPending ||
    resumeMutation.isPending ||
    closeMutation.isPending ||
    renewMutation.isPending;

  // Lifecycle Action Handlers
  const handleSendQuotation = () => {
    sendQuotationMutation.mutate({ id: subId });
  };

  const handleConfirm = () => {
    confirmMutation.mutate({ id: subId });
  };

  const handleActivate = () => {
    activateMutation.mutate({ id: subId });
  };

  const handlePause = () => {
    pauseMutation.mutate({ id: subId });
  };

  const handleResume = () => {
    resumeMutation.mutate({ id: subId });
  };

  const handleClose = (reason: string) => {
    closeMutation.mutate(
      { id: subId, reason },
      {
        onSuccess: () => {
          setCloseDialogOpen(false);
        },
      }
    );
  };

  const handleRenew = () => {
    renewMutation.mutate({ id: subId });
  };

  // Calculations
  const lines = subscription?.lines ?? [];
  const subtotal = lines.reduce((acc, line) => acc + Number(line.amount || 0), 0);
  const events = subscription?.events ?? [];
  const invoices = subscription?.invoices ?? [];

  // Loading State
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
        <Skeleton className="h-16 w-full rounded-xl" />
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

  // Error State
  if (isError || !subscription) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/app/subscriptions")}
          className="gap-1.5 text-xs text-slate-600"
        >
          <ArrowLeft className="size-3.5" /> Back to Subscriptions
        </Button>
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="size-5 shrink-0 text-rose-500" />
          <div className="flex-1">
            <p className="font-semibold">Subscription not found</p>
            <p className="text-xs text-rose-700">
              {error instanceof Error ? error.message : "The requested subscription could not be retrieved."}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/app/subscriptions")}
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
              Customer:{" "}
              <span className="font-medium text-slate-800">
                {subscription.customer?.name ?? "Customer"}
              </span>{" "}
              &bull; Created {formatDate(subscription.createdAt)}
            </p>
          </div>
        </div>

        {["DRAFT", "QUOTATION"].includes(subscription.status) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/app/subscriptions/${subscription.id}/edit`)}
            className="gap-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            <Edit3 className="size-3.5" />
            Edit Subscription
          </Button>
        )}
      </div>

      {/* Visual Lifecycle Status Bar & Action Controls */}
      <SubscriptionStatusBar
        subscription={subscription}
        onSendQuotation={handleSendQuotation}
        onConfirm={handleConfirm}
        onActivate={handleActivate}
        onPause={handlePause}
        onResume={handleResume}
        onCloseClick={() => setCloseDialogOpen(true)}
        onRenew={handleRenew}
        isPending={isPending}
      />

      {/* Key Overview Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Customer Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <User className="size-3.5" />
            <span>Customer</span>
          </div>
          <div className="mt-2 space-y-1">
            <p className="font-semibold text-slate-900">{subscription.customer?.name}</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Mail className="size-3 text-slate-400 shrink-0" />
              <span className="truncate">{subscription.customer?.email}</span>
            </div>
            {subscription.customer?.company && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Building className="size-3 text-slate-400 shrink-0" />
                <span className="truncate">{subscription.customer.company}</span>
              </div>
            )}
            {subscription.customer?.phone && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Phone className="size-3 text-slate-400 shrink-0" />
                <span>{subscription.customer.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Plan Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Layers className="size-3.5" />
            <span>Subscription Plan</span>
          </div>
          <div className="mt-2 space-y-1">
            <p className="font-semibold text-slate-900">{subscription.plan?.name}</p>
            <p className="text-xs text-slate-500">
              Billing:{" "}
              <span className="font-medium text-slate-700">
                {subscription.plan?.billingPeriod}
              </span>
            </p>
            <p className="text-xs text-slate-500">
              Base Price:{" "}
              <span className="font-medium text-slate-700">
                {formatMoney(Number(subscription.plan?.price ?? 0))}
              </span>
            </p>
            <div className="flex flex-wrap gap-1 pt-1">
              {subscription.plan?.pausable && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                  Pausable
                </span>
              )}
              {subscription.plan?.closable && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                  Closable
                </span>
              )}
              {subscription.plan?.autoClose && (
                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">
                  Auto-Close
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Schedule & Terms Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Calendar className="size-3.5" />
            <span>Schedule & Terms</span>
          </div>
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Start Date:</span>
              <span className="font-medium text-slate-800">{formatDate(subscription.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Expiry Date:</span>
              <span className="font-medium text-slate-800">
                {subscription.expiryDate ? formatDate(subscription.expiryDate) : "Auto-renews"}
              </span>
            </div>
            {subscription.nextInvoiceDate && (
              <div className="flex justify-between">
                <span className="text-slate-500">Next Invoice:</span>
                <span className="font-medium text-indigo-600">
                  {formatDate(subscription.nextInvoiceDate)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Terms:</span>
              <span className="font-medium text-slate-800">{subscription.paymentTerms}</span>
            </div>
            {subscription.template && (
              <div className="flex justify-between pt-0.5">
                <span className="text-slate-500">Template:</span>
                <span className="font-medium text-slate-800 truncate max-w-[120px]">
                  {subscription.template.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 4. Financial Total Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <CreditCard className="size-3.5" />
            <span>Recurring Total</span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              {formatMoney(subtotal)}
            </div>
            <p className="text-xs text-slate-500">
              {lines.length} line item(s) &bull; billed {subscription.plan?.billingPeriod.toLowerCase()}
            </p>
            {subscription.discount && (
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <Tag className="size-3" />
                <span>
                  {subscription.discount.name} ({subscription.discount.type === "PERCENT" ? `${subscription.discount.value}%` : formatMoney(Number(subscription.discount.value))})
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Section: Order Lines, History Timeline, Invoices */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <Tabs defaultValue="lines" className="w-full">
          <div className="border-b border-slate-200 px-6 pt-2">
            <TabsList variant="line" className="gap-6">
              <TabsTrigger value="lines" className="gap-2 py-3">
                <FileText className="size-4" />
                Order Lines ({lines.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2 py-3">
                <History className="size-4" />
                History & Audit ({events.length})
              </TabsTrigger>
              <TabsTrigger value="invoices" className="gap-2 py-3">
                <Receipt className="size-4" />
                Invoices ({invoices.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: Order Lines */}
          <TabsContent value="lines" className="p-6">
            {lines.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No line items added to this subscription.
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader className="bg-slate-50/75">
                    <TableRow>
                      <TableHead className="font-semibold text-slate-700">Product</TableHead>
                      <TableHead className="w-[120px] text-right font-semibold text-slate-700">
                        Quantity
                      </TableHead>
                      <TableHead className="w-[140px] text-right font-semibold text-slate-700">
                        Unit Price
                      </TableHead>
                      <TableHead className="w-[140px] text-right font-semibold text-slate-700">
                        Subtotal
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line) => {
                      const unitPriceNum = Number(line.unitPrice || 0);
                      const amountNum = Number(line.amount || 0);

                      return (
                        <TableRow key={line.id}>
                          <TableCell>
                            <div className="font-medium text-slate-900">
                              {line.product?.name ?? line.description ?? `Product #${line.productId}`}
                            </div>
                            {line.variant && (
                              <div className="text-xs text-slate-500">
                                Variant: {line.variant.attribute} - {line.variant.value}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium text-slate-700">
                            {line.quantity}
                          </TableCell>
                          <TableCell className="text-right text-slate-600">
                            {formatMoney(unitPriceNum)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-slate-900">
                            {formatMoney(amountNum)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Subtotal summary card */}
                <div className="flex justify-end pt-2">
                  <div className="w-72 space-y-2 rounded-lg bg-slate-50 p-4 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Order Subtotal:</span>
                      <span className="font-medium text-slate-800">{formatMoney(subtotal)}</span>
                    </div>
                    {subscription.discount && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Discount ({subscription.discount.name}):</span>
                        <span>
                          {subscription.discount.type === "PERCENT"
                            ? `-${subscription.discount.value}%`
                            : `-${formatMoney(Number(subscription.discount.value))}`}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                      <span>Total:</span>
                      <span>{formatMoney(subtotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: History & Audit Timeline */}
          <TabsContent value="history" className="p-6">
            {events.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No lifecycle events recorded for this subscription.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {events.map((ev) => (
                  <div key={ev.id} className="relative flex items-start gap-4">
                    <div className="absolute -left-6 mt-1 flex size-5 items-center justify-center rounded-full bg-white ring-4 ring-white">
                      <div className="size-2 rounded-full bg-indigo-600" />
                    </div>

                    <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          {ev.fromStatus ? (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                              <SubscriptionStatusBadge status={ev.fromStatus} />
                              <span className="text-slate-400">&rarr;</span>
                              <SubscriptionStatusBadge status={ev.toStatus} />
                            </div>
                          ) : (
                            <SubscriptionStatusBadge status={ev.toStatus} />
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {formatDateTime(ev.createdAt)}
                        </span>
                      </div>

                      {ev.note && (
                        <p className="mt-2 text-xs text-slate-700 font-medium">
                          {ev.note}
                        </p>
                      )}

                      <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                        <User className="size-3" />
                        <span>Recorded by: {ev.user?.name ?? "System Automation"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 3: Invoices */}
          <TabsContent value="invoices" className="p-6">
            {invoices.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No billing invoices have been generated for this subscription yet.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/75">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">Invoice #</TableHead>
                    <TableHead className="font-semibold text-slate-700">Invoice Date</TableHead>
                    <TableHead className="font-semibold text-slate-700">Due Date</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Total</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Paid</TableHead>
                    <TableHead className="text-center font-semibold text-slate-700">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow
                      key={inv.id}
                      onClick={() => navigate(`/app/invoices/${inv.id}`)}
                      className="cursor-pointer hover:bg-slate-50"
                    >
                      <TableCell className="font-semibold text-indigo-600">
                        {inv.number ?? `INV-${inv.id}`}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {formatDate(inv.invoiceDate)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {formatDate(inv.dueDate)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-900">
                        {formatMoney(Number(inv.total || 0))}
                      </TableCell>
                      <TableCell className="text-right text-xs text-slate-600">
                        {formatMoney(Number(inv.amountPaid || 0))}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700">
                          {inv.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Close Subscription Modal Dialog */}
      <CloseSubscriptionDialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        onConfirm={handleClose}
        pending={closeMutation.isPending}
        subscriptionNumber={subscription.number}
      />
    </div>
  );
}
