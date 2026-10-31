import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  FileText,
  Calendar,
  ArrowRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useSubscriptions, usePlans } from "../api";
import { SubscriptionStatusBadge } from "../components/SubscriptionStatusBadge";
import type { SubscriptionStatus, SubscriptionListItem } from "../types";

const STATUS_TABS: { label: string; value: SubscriptionStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Quotation", value: "QUOTATION" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Active", value: "ACTIVE" },
  { label: "Paused", value: "PAUSED" },
  { label: "Closed", value: "CLOSED" },
];

export default function SubscriptionsListPage() {
  const navigate = useNavigate();

  // Filters state
  const [selectedStatus, setSelectedStatus] = useState<SubscriptionStatus | "ALL">("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Query hook
  const { data, isLoading, isError, error, refetch, isFetching } = useSubscriptions({
    page,
    limit: pageSize,
    status: selectedStatus === "ALL" ? undefined : selectedStatus,
    planId: selectedPlanId,
    search: searchInput.trim().length > 0 ? searchInput.trim() : undefined,
  });

  const { data: plans } = usePlans();

  const subscriptions = data?.data ?? [];
  const meta = data?.meta;
  const totalCount = meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Compute total line amount for a subscription
  const calculateTotalAmount = (sub: SubscriptionListItem) => {
    return sub.lines.reduce((acc, line) => acc + Number(line.amount || 0), 0);
  };

  const handleStatusChange = (status: SubscriptionStatus | "ALL") => {
    setSelectedStatus(status);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setPage(1);
  };

  const handlePlanFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : undefined;
    setSelectedPlanId(val);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Subscriptions
          </h1>
          <p className="text-sm text-slate-500">
            Manage recurring subscriptions, quotations, and contract lifecycles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 gap-1.5 text-xs text-slate-600"
          >
            <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => navigate("/app/subscriptions/new")}
            className="h-9 gap-1.5 bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700 shadow-sm"
          >
            <Plus className="size-4" />
            Create Subscription
          </Button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-2 overflow-x-auto pb-1 sm:pb-0" aria-label="Tabs">
          {STATUS_TABS.map((tab) => {
            const isActive = selectedStatus === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => handleStatusChange(tab.value)}
                className={cn(
                  "whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-indigo-600 text-indigo-600 font-semibold"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by subscription #, customer or email..."
            value={searchInput}
            onChange={handleSearchChange}
            className="h-9 pl-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          {plans && plans.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Filter className="size-3.5 text-slate-400" />
              <select
                value={selectedPlanId ?? ""}
                onChange={handlePlanFilterChange}
                className="h-9 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Plans</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Data Table Card */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Error Alert */}
        {isError && (
          <div className="m-4 flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertCircle className="size-5 shrink-0 text-rose-500" />
            <div className="flex-1">
              <p className="font-semibold">Unable to load subscriptions</p>
              <p className="text-xs text-rose-700">
                {error instanceof Error ? error.message : "Network error occurred."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="border-rose-300 bg-white text-rose-800 hover:bg-rose-100"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="space-y-3 p-6">
            <div className="flex justify-between gap-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-6 w-24" />
            </div>
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="h-12 w-full rounded-md" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && subscriptions.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FileText className="size-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No subscriptions found
            </h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              {searchInput || selectedStatus !== "ALL" || selectedPlanId
                ? "No matching subscriptions found for your current filter criteria."
                : "Get started by creating your first subscription or converting a quotation."}
            </p>
            <div className="mt-6 flex justify-center gap-2">
              {(searchInput || selectedStatus !== "ALL" || selectedPlanId) ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedStatus("ALL");
                    setSearchInput("");
                    setSelectedPlanId(undefined);
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => navigate("/app/subscriptions/new")}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="mr-1.5 size-4" />
                  New Subscription
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Subscriptions Table */}
        {!isLoading && !isError && subscriptions.length > 0 && (
          <Table>
            <TableHeader className="bg-slate-50/75">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[140px] font-semibold text-slate-700">Number</TableHead>
                <TableHead className="font-semibold text-slate-700">Customer</TableHead>
                <TableHead className="font-semibold text-slate-700">Plan</TableHead>
                <TableHead className="font-semibold text-slate-700">Start Date</TableHead>
                <TableHead className="font-semibold text-slate-700">Expiry Date</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Amount</TableHead>
                <TableHead className="text-center font-semibold text-slate-700">Status</TableHead>
                <TableHead className="w-[80px] text-right font-semibold text-slate-700">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => {
                const totalAmount = calculateTotalAmount(sub);
                return (
                  <TableRow
                    key={sub.id}
                    onClick={() => navigate(`/app/subscriptions/${sub.id}`)}
                    className="cursor-pointer transition-colors hover:bg-slate-50/80"
                  >
                    {/* Number */}
                    <TableCell className="font-semibold text-indigo-600">
                      {sub.number ?? `SUB-${String(sub.id).padStart(5, "0")}`}
                    </TableCell>

                    {/* Customer */}
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {sub.customer?.name ?? "Unknown Customer"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {sub.customer?.email}
                      </div>
                    </TableCell>

                    {/* Plan */}
                    <TableCell>
                      <div className="font-medium text-slate-800">
                        {sub.plan?.name ?? "—"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {sub.plan?.billingPeriod}
                      </div>
                    </TableCell>

                    {/* Start Date */}
                    <TableCell className="text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-slate-400" />
                        {formatDate(sub.startDate)}
                      </div>
                    </TableCell>

                    {/* Expiry Date */}
                    <TableCell className="text-sm text-slate-600">
                      {sub.expiryDate ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-slate-400" />
                          {formatDate(sub.expiryDate)}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Auto-renews</span>
                      )}
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="text-right font-medium text-slate-900">
                      {formatMoney(totalAmount)}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className="text-center">
                      <SubscriptionStatusBadge status={sub.status} />
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/app/subscriptions/${sub.id}`);
                        }}
                        className="size-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                      >
                        <ArrowRight className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Server-Side Pagination Bar */}
        {!isLoading && !isError && totalCount > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-medium text-slate-700">
                {(page - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-slate-700">
                {Math.min(page * pageSize, totalCount)}
              </span>{" "}
              of <span className="font-medium text-slate-700">{totalCount}</span>{" "}
              subscriptions
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 text-xs"
              >
                Previous
              </Button>
              <span className="text-xs text-slate-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
