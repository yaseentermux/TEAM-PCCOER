import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Building2,
  Repeat,
  Receipt,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { formatMoney } from "../../lib/format";

interface DashboardStats {
  customers: number;
  users: number;
  activeSubscriptions: number;
  draftSubscriptions: number;
  overdueInvoices: number;
  outstandingAmount: number;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    customers: 0,
    users: 0,
    activeSubscriptions: 0,
    draftSubscriptions: 0,
    overdueInvoices: 0,
    outstandingAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const results = await Promise.allSettled([
          api.get<{ meta: { total: number } }>("/customers?limit=1"),
          user?.role === "ADMIN"
            ? api.get<{ meta: { total: number } }>("/users?limit=1")
            : Promise.resolve(null),
          api.get<{ meta: { total: number } }>("/subscriptions?status=ACTIVE&limit=1"),
          api.get<{ meta: { total: number } }>("/subscriptions?status=DRAFT&limit=1"),
          api.get<{ meta: { total: number } }>("/invoices?status=OVERDUE&limit=1"),
        ]);

        setStats({
          customers:
            results[0].status === "fulfilled" && results[0].value
              ? results[0].value.data?.meta?.total ?? 0
              : 0,
          users:
            results[1].status === "fulfilled" && results[1].value
              ? (results[1].value as any)?.data?.meta?.total ?? 0
              : 0,
          activeSubscriptions:
            results[2].status === "fulfilled" && results[2].value
              ? results[2].value.data?.meta?.total ?? 0
              : 0,
          draftSubscriptions:
            results[3].status === "fulfilled" && results[3].value
              ? results[3].value.data?.meta?.total ?? 0
              : 0,
          overdueInvoices:
            results[4].status === "fulfilled" && results[4].value
              ? results[4].value.data?.meta?.total ?? 0
              : 0,
          outstandingAmount: 0,
        });
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const StatCard = ({
    label,
    value,
    sub,
    icon: Icon,
    iconBg,
    iconColor,
    to,
  }: {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    to?: string;
  }) => (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {loading ? <span className="inline-block w-12 h-7 bg-slate-100 rounded animate-pulse" /> : value}
          </h3>
          {sub && (
            <span className="text-xs text-slate-400 mt-1 inline-block">{sub}</span>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconBg} ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {to && (
        <Link
          to={to}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name?.split(" ")[0] || "Admin"} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here's what's happening across your subscription platform today.
          </p>
        </div>
        <Link
          to="/app/subscriptions/new"
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New Subscription
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Customers"
          value={stats.customers}
          sub="Total accounts"
          icon={Building2}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          to="/app/customers"
        />
        <StatCard
          label="Active Subscriptions"
          value={stats.activeSubscriptions}
          sub="Currently running"
          icon={Repeat}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          to="/app/subscriptions"
        />
        <StatCard
          label="Pending Drafts"
          value={stats.draftSubscriptions}
          sub="Awaiting confirmation"
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          to="/app/subscriptions"
        />
        <StatCard
          label="Overdue Invoices"
          value={stats.overdueInvoices}
          sub="Requires attention"
          icon={AlertTriangle}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          to="/app/invoices"
        />
      </div>

      {/* Quick Actions Row */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              title: "Manage Customers",
              desc: "View accounts, contact info & subscription history",
              to: "/app/customers",
              icon: Building2,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              title: "Subscriptions",
              desc: "Create, activate, pause or renew subscription contracts",
              to: "/app/subscriptions",
              icon: Repeat,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              title: "Invoice Management",
              desc: "Issue invoices, record payments and track overdue balance",
              to: "/app/invoices",
              icon: Receipt,
              color: "text-indigo-600",
              bg: "bg-indigo-50",
            },
            ...(user?.role === "ADMIN"
              ? [
                  {
                    title: "Staff & Users",
                    desc: "Add team members, assign roles and manage access",
                    to: "/app/users",
                    icon: Users,
                    color: "text-purple-600",
                    bg: "bg-purple-50",
                  },
                ]
              : [
                  {
                    title: "Quotation Templates",
                    desc: "Create reusable subscription packages for quick quoting",
                    to: "/app/quotation-templates",
                    icon: CheckCircle2,
                    color: "text-teal-600",
                    bg: "bg-teal-50",
                  },
                ]),
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-brand-300 hover:shadow-sm transition-all flex items-start gap-3"
            >
              <div className={`p-2 rounded-lg ${item.bg} ${item.color} shrink-0 mt-0.5`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
                  {item.title}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Credentials panel — only shown in dev */}
      {import.meta.env.DEV && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
            Dev Login Credentials
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs text-slate-700">
            <div className="bg-white border border-slate-200 rounded-lg p-2.5">
              <span className="font-bold text-indigo-700">Admin</span><br />
              admin@brightloop.io<br />
              <span className="text-slate-400">Password@123</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-2.5">
              <span className="font-bold text-emerald-700">Staff</span><br />
              staff@brightloop.io<br />
              <span className="text-slate-400">Password@123</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-2.5">
              <span className="font-bold text-blue-700">Customer</span><br />
              customer@acme.com<br />
              <span className="text-slate-400">Password@123</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
