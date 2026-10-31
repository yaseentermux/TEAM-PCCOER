// [M3] Subscriptions of one customer, for Member 1's customer detail page:
// Usage: <CustomerSubscriptionsTab customerId={id} />
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  Calendar,
  AlertCircle,
  Eye,
  Plus,
  RefreshCw,
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
import { Pager } from "@/features/billing/components/Pager";
import { useSubscriptions } from "../api";
import { SubscriptionStatusBadge } from "./SubscriptionStatusBadge";

interface CustomerSubscriptionsTabProps {
  customerId: number;
  showCreateButton?: boolean;
}

export function CustomerSubscriptionsTab({
  customerId,
  showCreateButton = true,
}: CustomerSubscriptionsTabProps) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError, error, refetch } = useSubscriptions({
    customerId,
    page,
    limit,
  });

  const subscriptions = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-3">
      {/* Tab Header Controls */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-800">
            {meta?.total ?? subscriptions.length}
          </span>{" "}
          subscription(s)
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="h-8 gap-1 text-xs text-slate-500 hover:text-slate-800"
          >
            <RefreshCw className="size-3" />
            Refresh
          </Button>

          {showCreateButton && (
            <Button
              size="sm"
              onClick={() => navigate("/app/subscriptions/new")}
              className="h-8 gap-1.5 bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700 shadow-xs"
            >
              <Plus className="size-3.5" />
              New Subscription
            </Button>
          )}
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertCircle className="size-4 shrink-0 text-rose-500" />
          <div className="flex-1">
            <p className="font-semibold">Unable to load customer subscriptions</p>
            <p className="text-rose-600">
              {error instanceof Error ? error.message : "A network or server error occurred."}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-slate-700">
                Subscription Number
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Plan</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Start Date</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Expiry Date</TableHead>
              <TableHead className="text-right text-xs font-semibold text-slate-700">
                Recurring Amount
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Status</TableHead>
              <TableHead className="text-right text-xs font-semibold text-slate-700">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Loading Skeletons */}
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-6 w-16" />
                  </TableCell>
                </TableRow>
              ))}

            {/* Empty State */}
            {!isLoading && !isError && subscriptions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Layers className="size-6 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-700">
                      No subscriptions found for this customer
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Create a new subscription draft or quote from an existing template.
                    </p>
                    {showCreateButton && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/app/subscriptions/new")}
                        className="mt-1 h-7 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      >
                        <Plus className="size-3 mr-1" />
                        Create Subscription
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
                    onClick={() => navigate(`/app/subscriptions/${sub.id}`)}
                  >
                    {/* Number */}
                    <TableCell>
                      <span className="font-mono text-xs font-medium text-indigo-700">
                        {subNumber}
                      </span>
                    </TableCell>

                    {/* Plan */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-medium text-slate-900">
                          {sub.plan?.name ?? "Custom Plan"}
                        </span>
                        {sub.plan?.billingPeriod && (
                          <Badge variant="outline" className="text-[10px] uppercase font-normal">
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
                    <TableCell className="text-right text-xs font-medium text-slate-900">
                      {formatMoney(displayTotal)}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <SubscriptionStatusBadge status={sub.status} />
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/app/subscriptions/${sub.id}`)}
                        className="h-7 gap-1 px-2 text-xs text-slate-600 hover:text-indigo-600"
                        title="View Subscription"
                      >
                        <Eye className="size-3.5" />
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
export default CustomerSubscriptionsTab;

