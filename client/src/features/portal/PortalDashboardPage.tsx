import React from "react";
import { Link } from "react-router-dom";
import { Repeat, Receipt, Package, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { PageHeader } from "../../components/common/PageHeader";

export const PortalDashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.name || "Customer"}`}
        description="Manage your software subscriptions, view billing history and explore available plans"
      />

      {/* Account Status Banner */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            Your account is currently <strong>Active</strong>. All subscription services are operational.
          </span>
        </div>
        <Link
          to="/portal/profile"
          className="text-xs font-semibold text-emerald-900 underline hover:text-emerald-950"
        >
          View Profile &rarr;
        </Link>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="p-3 w-fit rounded-lg bg-blue-50 text-blue-600">
            <Repeat className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              My Subscriptions
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Inspect active recurring contracts, renewal cycles, and renewal dates.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/portal/subscriptions"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
            >
              View Subscriptions <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="p-3 w-fit rounded-lg bg-emerald-50 text-emerald-600">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              My Invoices
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Download payment invoices, check outstanding dues, and payment history.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/portal/invoices"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
            >
              View Invoices <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="p-3 w-fit rounded-lg bg-indigo-50 text-indigo-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Explore Plans
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Explore available subscription plans, upgrades, and add-on services.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/portal/plans"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
            >
              Browse Plans <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
