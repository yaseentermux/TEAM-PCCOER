import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Building2,
  Repeat,
  Receipt,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { PageHeader } from "../../components/common/PageHeader";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const custRes = await api.get<{ meta: { total: number } }>("/customers?limit=1");
        setCustomerCount(custRes.data?.meta?.total ?? 0);
      } catch {
        // Ignored if permissions or network fail
      }

      if (user?.role === "ADMIN") {
        try {
          const userRes = await api.get<{ meta: { total: number } }>("/users?limit=1");
          setUserCount(userRes.data?.meta?.total ?? 0);
        } catch {
          // Ignored
        }
      }
    })();
  }, [user]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name || "Admin"}!`}
        description="Here's a summary of Brightloop Subscription Management activities"
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Customers
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {customerCount !== null ? customerCount : "—"}
            </h3>
            <span className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Active accounts
            </span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {user?.role === "ADMIN" && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Staff & Users
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {userCount !== null ? userCount : "—"}
              </h3>
              <span className="text-xs text-purple-600 font-medium mt-1 inline-block">
                Team members
              </span>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
        )}

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Subscriptions
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              Active
            </h3>
            <span className="text-xs text-slate-400 mt-1 inline-block">
              Managed by M3
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <Repeat className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Invoices & Billing
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              Recurring
            </h3>
            <span className="text-xs text-slate-400 mt-1 inline-block">
              Managed by M4
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Receipt className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Customer Directory
            </h3>
            <Link
              to="/app/customers"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Search, view profiles, create new customer accounts and inspect subscription history.
          </p>
          <div className="pt-2">
            <Link
              to="/app/customers"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
            >
              Manage Customers
            </Link>
          </div>
        </div>

        {user?.role === "ADMIN" && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Staff Administration
              </h3>
              <Link
                to="/app/users"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Add internal team members, assign administrator privileges and control user access states.
            </p>
            <div className="pt-2">
              <Link
                to="/app/users"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
              >
                Manage Staff
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
