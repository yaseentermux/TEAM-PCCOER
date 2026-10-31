import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Repeat,
  Receipt,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { User } from "../../context/AuthContext";
import { api, getErrorMessage } from "../../lib/api";
import { PageHeader } from "../../components/common/PageHeader";
import { formatDate } from "../../components/common/formatDate";

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [customer, setCustomer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "subscriptions" | "invoices">("overview");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<{ data: User }>(`/customers/${id}`);
        setCustomer(res.data.data);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load customer details."));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-8 text-center space-y-4 bg-white rounded-xl border border-slate-200">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-semibold text-slate-900">
          {error || "Customer Not Found"}
        </h2>
        <Link
          to="/app/customers"
          className="inline-flex items-center gap-2 text-sm text-brand-600 font-semibold hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customers List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.name}
        description={customer.company || "Customer Account Profile"}
        breadcrumbs={[
          { label: "Dashboard", href: "/app/dashboard" },
          { label: "Customers", href: "/app/customers" },
          { label: customer.name },
        ]}
        actions={
          <Link
            to="/app/customers"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to List
          </Link>
        }
      />

      {/* Profile Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-brand-600 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-xs">
              {customer.name ? customer.name.charAt(0).toUpperCase() : "C"}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900">
                  {customer.name}
                </h2>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    customer.isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  {customer.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-sm text-slate-500">{customer.company || "Individual Customer"}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-6 border-b border-slate-200 pt-4 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-brand-600 text-brand-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("subscriptions")}
            className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "subscriptions"
                ? "border-brand-600 text-brand-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Repeat className="w-4 h-4" />
            Subscriptions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("invoices")}
            className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "invoices"
                ? "border-brand-600 text-brand-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Receipt className="w-4 h-4" />
            Invoices
          </button>
        </div>

        {/* Tab Content */}
        <div className="pt-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Contact Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-slate-700">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{customer.phone || "No phone provided"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{customer.company || "No company listed"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Address & Account History
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3 text-slate-700">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{customer.address || "No address on record"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Customer since {formatDate(customer.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "subscriptions" && (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
              <Repeat className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-semibold text-slate-700">No active subscriptions</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Subscription details will appear here once configured by Sales (M3).
              </p>
            </div>
          )}

          {activeTab === "invoices" && (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
              <Receipt className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-semibold text-slate-700">No invoices generated</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Invoice details will appear here once generated by Billing (M4).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
