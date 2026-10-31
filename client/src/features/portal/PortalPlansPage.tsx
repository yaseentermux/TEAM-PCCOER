import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  Check,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Zap,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { api } from "../../lib/api";
import { formatMoney } from "../../lib/format";
import { PageHeader } from "../../components/common/PageHeader";

interface PlanItem {
  id: number;
  name: string;
  price: number | string;
  billingPeriod: string;
  minQuantity: number;
  pausable: boolean;
  closable: boolean;
  renewable: boolean;
  autoClose: boolean;
  description?: string;
}

export const PortalPlansPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: plans = [], isLoading } = useQuery<PlanItem[]>({
    queryKey: ["portal", "plans"],
    queryFn: async () => {
      const res = await api.get("/plans");
      const body = res.data;
      if (Array.isArray(body)) return body as PlanItem[];
      if (body && Array.isArray((body as any).data)) return (body as any).data as PlanItem[];
      return [];
    },
    staleTime: 30_000,
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Subscription Plans & Catalog"
          description="Select recurring subscription licenses with automated billing cadences"
          breadcrumbs={[
            { label: "Portal", path: "/portal" },
            { label: "Plans" },
          ]}
        />

        <Link
          to="/portal/subscribe"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Zap className="w-4 h-4" />
          Quick Subscribe
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="h-6 w-24 bg-slate-100 rounded-md animate-pulse" />
              <div className="h-8 w-32 bg-slate-200 rounded-md animate-pulse" />
              <div className="h-20 w-full bg-slate-50 rounded-md animate-pulse" />
            </div>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No active plans available</h3>
          <p className="text-xs text-slate-500 mt-1">Please check back later or contact customer support.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => {
            const isMonthly = plan.billingPeriod === "MONTHLY";
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all relative ${
                  isMonthly ? "border-indigo-500 ring-2 ring-indigo-500/10" : "border-slate-200"
                }`}
              >
                {isMonthly && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-2xs tracking-wider uppercase">
                    Recommended
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                      {plan.billingPeriod}
                    </span>
                    {plan.renewable && (
                      <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" /> Auto-Renew
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{plan.name}</h3>

                  <div className="my-4">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {formatMoney(Number(plan.price))}
                    </span>
                    <span className="text-xs text-slate-500 ml-1 font-medium">
                      / {plan.billingPeriod.toLowerCase()}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-600 mb-6">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Minimum {plan.minQuantity} seat(s)</span>
                    </div>
                    {plan.pausable && (
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Self-serve pause & resume</span>
                      </div>
                    )}
                    {plan.closable && (
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Flexible cancellation</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>Online payment & automated invoicing</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => navigate("/portal/subscribe")}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>Subscribe & Pay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PortalPlansPage;
