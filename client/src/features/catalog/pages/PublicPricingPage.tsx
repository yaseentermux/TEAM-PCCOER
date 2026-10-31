import React, { useState } from 'react';
import { useAvailablePlans } from '../api';
import { Check, Sparkles, ArrowRight, Shield, Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export const PublicPricingPage: React.FC = () => {
  const { data: plansData, isLoading } = useAvailablePlans();
  const [selectedPeriod, setSelectedPeriod] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  const plans = plansData || [];
  const filteredPlans = plans.filter((p: any) => p.billingPeriod === selectedPeriod);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12 text-center">
        {/* Hero Banner */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Transparent Subscription Pricing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Flexible Plans Built for Growing Teams
          </h1>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Choose the right subscription cadence with zero hidden fees. Switch or cancel anytime directly from your customer portal.
          </p>

          {/* Billing Switcher */}
          <div className="inline-flex items-center p-1 bg-slate-200/60 rounded-xl border border-slate-300/70 shadow-inner mt-4">
            <button
              onClick={() => setSelectedPeriod('MONTHLY')}
              className={`px-5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedPeriod === 'MONTHLY' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setSelectedPeriod('YEARLY')}
              className={`px-5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedPeriod === 'YEARLY' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                Save 15%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        {isLoading ? (
          <div className="p-12 text-slate-400 text-xs font-medium">Loading pricing options...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {(filteredPlans.length > 0 ? filteredPlans : plans).map((plan: any, i: number) => {
              const isPopular = plan.billingPeriod === 'MONTHLY' && plan.price > 500;

              return (
                <div
                  key={plan.id}
                  className={`card-tactile p-6 flex flex-col justify-between relative transition-all ${
                    isPopular ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg' : ''
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                      Most Popular
                    </div>
                  )}

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">Full access to core suite with automatic renewals.</p>

                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {formatCurrency(plan.price)}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">/{plan.billingPeriod.toLowerCase()}</span>
                    </div>

                    <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Min Seats: <strong>{plan.minQuantity}</strong> user(s)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Customer Pause: <strong>{plan.pausable ? 'Supported' : 'Standard'}</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Contract auto-close: <strong>{plan.autoClose ? 'Automatic' : 'Rolling'}</strong></span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => alert(`Redirecting to portal subscribe for plan ${plan.name}`)}
                      className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isPopular ? 'btn-3d' : 'btn-3d-secondary'
                      }`}
                    >
                      <span>Subscribe to Plan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
