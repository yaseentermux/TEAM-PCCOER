import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, Check, ArrowRight, Sparkles, Clock, RefreshCw } from "lucide-react";
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
  const [requestedPlan, setRequestedPlan] = useState<string | null>(null);

  const { data: plans = [], isLoading } = useQuery<PlanItem[]>({
    queryKey: ["portal", "plans"],
    queryFn: async () => {
      const res = await api.get<{ data: PlanItem[] }>("/plans");
      return Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Plans & Catalog"
        description="Choose a subscription plan tailored to your organization's business needs"
        breadcrumbs={[
          { label: "Portal", path: "/portal" },
          { label: "Plans" },
        ]}
      />

      {requestedPlan && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between animate-in fade-in">
          <span>
            ✓ Subscription request for <strong>{requestedPlan}</strong> registered! Our sales team will activate or send your quotation.
          </span>
          <button
            onClick={() => setRequestedPlan(null)}
            className="text-emerald-950 font-bold ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="h-6 w-24 bg-slate-100 rounded animate-pulse" />
              <div className="h-8 w-32 bg-slate-200 rounded animate-pulse" />
              <div className="h-16 w-full bg-slate-50 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => {
            return (
              <div
                key={plan.id}
                className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-2xs hover:border-indigo-400 hover:shadow-sm transition-all relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
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
                    <span className="text-2xl font-extrabold text-slate-900">
                      {formatMoney(Number(plan.price))}
                    </span>
                    <span className="text-xs text-slate-500 ml-1 font-medium">
                      / {plan.billingPeriod.toLowerCase()}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-600 mb-6">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Min. Quantity: {plan.minQuantity} seat(s)</span>
                    </div>
                    {plan.pausable && (
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Pause & Resume supported</span>
                      </div>
                    )}
                    {plan.closable && (
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Self-serve Cancellation</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setRequestedPlan(plan.name)}
                  className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>Select Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PortalPlansPage;
