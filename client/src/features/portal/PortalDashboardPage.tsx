import React from "react";
import { Link } from "react-router-dom";
import { Repeat, Receipt, Package, ShieldCheck, ArrowRight, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const PortalDashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Welcome, {user?.name?.split(" ")[0] || "there"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your subscriptions, invoices, and account from one place.
        </p>
      </div>

      {/* Account Status */}
      <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <span className="text-emerald-800 flex-1">
          Your account is <strong>Active</strong> — all subscription services are operational.
        </span>
        <Link
          to="/portal/profile"
          className="text-xs font-semibold text-emerald-900 hover:underline whitespace-nowrap"
        >
          View Profile
        </Link>
      </div>

      {/* Navigation Links — list style, not 3-card grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs divide-y divide-slate-100">
        {[
          {
            icon: Repeat,
            iconBg: "bg-indigo-50",
            iconColor: "text-indigo-600",
            title: "My Subscriptions",
            desc: "View active recurring contracts, renewal dates, and subscription status.",
            to: "/portal/subscriptions",
          },
          {
            icon: Receipt,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            title: "My Invoices",
            desc: "Download payment invoices, check outstanding dues, and billing history.",
            to: "/portal/invoices",
          },
          {
            icon: Package,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            title: "Explore Plans",
            desc: "Browse available subscription plans and upgrade options.",
            to: "/portal/plans",
          },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group"
          >
            <div className={`p-2.5 rounded-xl ${item.iconBg} ${item.iconColor} shrink-0`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                {item.title}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
};
