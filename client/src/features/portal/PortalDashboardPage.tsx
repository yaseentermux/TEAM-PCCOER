import React from "react";
import { Link } from "react-router-dom";
import {
  Repeat,
  Receipt,
  Package,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CreditCard,
  CalendarCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const PortalDashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name || "Customer"} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Brightloop Customer Portal ?" Monitor your software licenses, billing cycles and invoices.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Active Account</span>
        </div>
      </div>

      {/* TOP ROW (CENTERED): Explore Plans Feature Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Catalog & Licensing</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Explore Available Subscription Plans
            </h2>
            <p className="text-xs text-indigo-200 leading-relaxed">
              Discover software licenses, seat upgrades, add-ons and automated recurring cadences tailored to your organization.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/portal/subscribe"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Subscribe Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/portal/plans"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-700/60 hover:bg-indigo-700 text-white font-semibold text-xs border border-indigo-500/30 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Browse Catalog</span>
            </Link>
          </div>
        </div>

        {/* Ambient subtle glow ring */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
      </div>

      {/* BOTTOM ROW: My Subscriptions & My Invoices Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: My Subscriptions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                <Repeat className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                Contract Engine
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                My Subscriptions
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Review active software agreements, pause/resume services, and track renewal cycles with full audit history.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              <span>Continuous recurring contracts & status tracking</span>
            </div>
          </div>

          <div className="pt-6">
            <Link
              to="/portal/subscriptions"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <span>Manage Subscriptions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 2: My Invoices */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <Receipt className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                Billing & Pay
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                My Invoices
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Download PDF tax invoices, review payments ledger, and settle outstanding balances instantly online.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Instant online checkout & PDF downloads</span>
            </div>
          </div>

          <div className="pt-6">
            <Link
              to="/portal/invoices"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <span>View & Pay Invoices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalDashboardPage;
