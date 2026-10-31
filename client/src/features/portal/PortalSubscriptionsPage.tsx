import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Repeat,
  Calendar,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight,
  PlusCircle,
  CreditCard,
  Receipt,
  FileText,
} from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/common/PageHeader";
import { usePortalSubscriptions } from "@/features/sales/api";
import { SubscriptionStatusBadge } from "@/features/sales/components/SubscriptionStatusBadge";

export const PortalSubscriptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = usePortalSubscriptions({ limit: 50 });

  const subscriptions = data?.data || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="My Subscriptions"
          description="View and inspect all your active recurring software subscriptions and contract lifecycle"
          breadcrumbs={[
            { label: "Portal", path: "/portal" },
            { label: "My Subscriptions" },
          ]}
        />
        <div className="flex items-center gap-3">
          <Link
            to="/portal/invoices"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-500" />
            <span>My Invoices</span>
          </Link>
          <Link
            to="/portal/subscribe"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Subscribe to Plan</span>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
          <div className="h-6 w-48 bg-slate-100 rounded-md animate-pulse" />
          <div className="h-20 w-full bg-slate-50 rounded-xl animate-pulse" />
          <div className="h-20 w-full bg-slate-50 rounded-xl animate-pulse" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Failed to load your subscriptions: {(error as any)?.message || "Network error"}</span>
          </div>
          <button
            onClick={() => refetch()}
            className="font-bold text-rose-700 hover:underline cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Repeat className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            No Active Subscriptions Found
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
            You currently do not have any software subscription agreements registered. You can choose from our available software licensing plans or request a proposal.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/portal/subscribe"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              Subscribe to Plan
            </Link>
            <Link
              to="/portal/plans"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub) => {
            const lines = sub.lines || [];
            const subtotal = lines.reduce((acc, l) => acc + Number(l.amount || 0), 0);
            const cycleCost = subtotal > 0 ? subtotal : Number(sub.plan?.price || 0);

            return (
              <div
                key={sub.id}
                onClick={() => navigate(`/portal/subscriptions/${sub.id}`)}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-5 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                      {sub.number || `SUB-${sub.id}`}
                    </span>
                    <SubscriptionStatusBadge status={sub.status} />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-900">
                    <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-bold">
                      {sub.plan?.name || "Standard Subscription Plan"}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {sub.plan?.billingPeriod || "MONTHLY"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-5 text-xs text-slate-500 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Started: <strong className="text-slate-700">{formatDate(sub.startDate)}</strong></span>
                    </div>
                    {sub.nextInvoiceDate && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Next Renewal: <strong className="text-indigo-700">{formatDate(sub.nextInvoiceDate)}</strong></span>
                      </div>
                    )}
                    {sub.expiryDate && (
                      <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                        <span>Expires: {formatDate(sub.expiryDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Cycle Cost
                    </div>
                    <div className="text-xl font-black text-slate-900 tracking-tight">
                      {formatMoney(cycleCost)}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      / {sub.plan?.billingPeriod?.toLowerCase() || "cycle"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/portal/subscriptions/${sub.id}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white group-hover:bg-indigo-600 transition-colors shadow-2xs"
                    >
                      <span>Manage</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
