import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  Calendar,
  AlertCircle,
  Eye,
  RefreshCw,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Pager } from "@/features/billing/components/Pager";
import { usePortalSubscriptions } from "../../api";
import { SubscriptionStatusBadge } from "../../components/SubscriptionStatusBadge";
import type { SubscriptionStatus } from "../../types";

const STATUS_TABS: { label: string; value: SubscriptionStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Paused", value: "PAUSED" },
  { label: "Quotation", value: "QUOTATION" },
  { label: "Closed", value: "CLOSED" },
];

export default function MySubscriptionsListPage() {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<SubscriptionStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Query
  const statusParam = selectedStatus === "ALL" ? undefined : selectedStatus;
  const { data, isLoading, isError, error, refetch } = usePortalSubscriptions({
    status: statusParam,
    page,
    limit,
  });

  const subscriptions = data?.data ?? [];
  const meta = data?.meta;

  const handleStatusChange = (status: SubscriptionStatus | "ALL") => {
    setSelectedStatus(status);
    setPage(1);
  };

  // Active subscriptions count for header badge
  const activeSubs = subscriptions.filter((s) => s.status === "ACTIVE");

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Subscriptions
          </h1>
          <p className="text-xs text-slate-500">
            View and monitor your recurring service plans, contract terms, and subscription status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-9 gap-1.5 text-xs text-slate-600 hover:text-slate-900"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => navigate("/portal/subscribe")}
            className="h-9 gap-1.5 bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700 shadow-sm"
          >
            <Plus className="size-3.5" />
            Subscribe to Plan
          </Button>

          <div className="rounded-xl border border-indigo-100 bg-white px-4 py-2 shadow-xs text-right">
            <span className="text-[11px] font-medium text-slate-500">Active Services</span>
            <p className="text-lg font-bold text-indigo-600">
              {isLoading ? "-" : activeSubs.length} Active
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-2">
        {STATUS_TABS.map((tab) => {
          const isActive = selectedStatus === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleStatusChange(tab.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Error Banner */}
      {isError && (
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="size-5 shrink-0 text-rose-500" />
          <div className="flex-1">
            <p className="font-semibold">Unable to retrieve subscriptions</p>
            <p className="text-xs text-rose-700">
              {error instanceof Error ? error.message : "A network or server error occurred."}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-slate-700">
                Subscription Number
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Plan</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Start Date</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">
                Expiry / Next Cycle
              </TableHead>
              <TableHead className="text-right text-xs font-semibold text-slate-700">
                Amount
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Status</TableHead>
              <TableHead className="text-right text-xs font-semibold text-slate-700">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Loading Skeleton */}
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-36" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-7 w-20" />
                  </TableCell>
                </TableRow>
              ))}

            {/* Empty State */}
            {!isLoading && !isError && subscriptions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center justify-center space-y-3">
                    <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Layers className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900">No subscriptions found</p>
                      <p className="text-xs text-slate-500">
                        {selectedStatus !== "ALL"
                          ? `You do not have any subscriptions currently in ${selectedStatus} status.`
                          : "You do not have any active subscriptions or quotations linked to your account."}
                      </p>
                    </div>
                    {selectedStatus === "ALL" ? (
                      <Button
                        size="sm"
                        onClick={() => navigate("/portal/subscribe")}
                        className="bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        <Plus className="size-3.5 mr-1.5" />
                        Explore & Subscribe
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedStatus("ALL")}
                      >
                        Show All Subscriptions
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Subscription Rows */}
            {!isLoading &&
              !isError &&
              subscriptions.map((sub) => {
                const subNumber = sub.number ?? `SUB-${String(sub.id).padStart(5, "0")}`;
                const linesTotal = sub.lines?.reduce(
                  (acc, l) => acc + Number(l.amount || 0),
                  0
                );
                const displayTotal = linesTotal > 0 ? linesTotal : Number(sub.plan?.price || 0);

                return (
                  <TableRow
                    key={sub.id}
                    className="cursor-pointer transition-colors hover:bg-slate-50/80"
                    onClick={() => navigate(`/portal/subscriptions/${sub.id}`)}
                  >
                    {/* Subscription Number */}
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-indigo-700">
                        {subNumber}
                      </span>
                    </TableCell>

                    {/* Plan */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-slate-900">
                          {sub.plan?.name ?? "Custom Plan"}
                        </span>
                        {sub.plan?.billingPeriod && (
                          <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                            {sub.plan.billingPeriod}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Start Date */}
                    <TableCell className="text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3 text-slate-400" />
                        <span>{formatDate(sub.startDate)}</span>
                      </div>
                    </TableCell>

                    {/* Expiry Date */}
                    <TableCell className="text-xs text-slate-600">
                      {sub.expiryDate ? (
                        formatDate(sub.expiryDate)
                      ) : (
                        <span className="text-slate-400">Continuous / Auto-renew</span>
                      )}
                    </TableCell>

                    {/* Recurring Amount */}
                    <TableCell className="text-right font-medium text-xs text-slate-900">
                      {formatMoney(displayTotal)}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <SubscriptionStatusBadge status={sub.status} />
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/portal/subscriptions/${sub.id}`)}
                        className="h-7 gap-1 px-2.5 text-xs text-slate-700 hover:text-indigo-600 hover:border-indigo-300"
                      >
                        <Eye className="size-3" />
                        <span>View</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta && meta.total > limit && (
        <Pager
          page={meta.page}
          limit={meta.limit}
          total={meta.total}
          onPage={setPage}
        />
      )}
    </div>
  );
}
