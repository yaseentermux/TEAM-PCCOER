import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Repeat,
  Calendar,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight,
  PlusCircle,
} from "lucide-react";
import { api } from "../../lib/api";
import { formatDate, formatMoney } from "../../lib/format";
import { PageHeader } from "../../components/common/PageHeader";
import { SubscriptionStatusBadge } from "../sales/components/SubscriptionStatusBadge";
import type { SubscriptionStatus } from "../sales/types";

interface PortalSubscriptionItem {
  id: number;
  number: string;
  status: SubscriptionStatus;
  startDate: string;
  expiryDate?: string | null;
  nextInvoiceDate?: string | null;
  total?: number;
  plan?: {
    id: number;
    name: string;
    billingPeriod: string;
    price: number;
  };
  lines?: Array<{
    id: number;
    quantity: number;
    unitPrice: number;
    amount: number;
    product?: {
      id: number;
      name: string;
    };
  }>;
}

export const PortalSubscriptionsPage: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useQuery<{
    data: PortalSubscriptionItem[];
    meta: { total: number };
  }>({
    queryKey: ["portal", "subscriptions"],
    queryFn: async () => {
      const res = await api.get("/portal/subscriptions?limit=50");
      return res.data;
    },
  });

  const subscriptions = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="My Subscriptions"
          description="View and inspect all your active recurring software subscriptions and contract lifecycle"
          breadcrumbs={[
            { label: "Portal", path: "/portal" },
            { label: "My Subscriptions" },
          ]}
        />
        <Link
          to="/portal/plans"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Browse More Plans
        </Link>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-4">
          <div className="h-6 w-48 bg-slate-100 rounded animate-pulse" />
          <div className="h-20 w-full bg-slate-50 rounded animate-pulse" />
          <div className="h-20 w-full bg-slate-50 rounded animate-pulse" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Failed to load your subscriptions: {(error as any)?.message || "Unknown error"}</span>
          </div>
          <button
            onClick={() => refetch()}
            className="font-semibold text-rose-700 hover:underline"
          >
            Try Again
          </button>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Repeat className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            No Active Subscriptions Found
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            You currently do not have any subscription contracts registered. You can choose from our available software licensing plans.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/portal/plans"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-2xs"
            >
              <PlusCircle className="w-4 h-4" />
              Explore Available Plans
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub) => {
            const subtotal = (sub.lines || []).reduce((acc, l) => acc + Number(l.amount || 0), 0);
            return (
              <div
                key={sub.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      {sub.number}
                    </span>
                    <SubscriptionStatusBadge status={sub.status} />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-semibold">
                      {sub.plan?.name || "Standard Subscription Plan"}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">
                      Cadence: {sub.plan?.billingPeriod || "MONTHLY"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Started: {formatDate(sub.startDate)}</span>
                    </div>
                    {sub.nextInvoiceDate && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Next billing: {formatDate(sub.nextInvoiceDate)}</span>
                      </div>
                    )}
                    {sub.expiryDate && (
                      <div className="flex items-center gap-1.5 text-amber-600 font-medium">
                        <span>Expires: {formatDate(sub.expiryDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Cycle Cost
                    </div>
                    <div className="text-base font-bold text-slate-900">
                      {subtotal > 0 ? formatMoney(subtotal) : formatMoney(Number(sub.plan?.price || 0))}
                    </div>
                  </div>

                  <Link
                    to="/portal/invoices"
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    View Invoices
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PortalSubscriptionsPage;
