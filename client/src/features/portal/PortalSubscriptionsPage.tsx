import React from "react";
import { Link } from "react-router-dom";
import { Repeat, Clock, PlusCircle } from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";

export const PortalSubscriptionsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Subscriptions"
        description="View and manage your active software subscriptions and renewal cycles"
        breadcrumbs={[
          { label: "Portal", path: "/portal" },
          { label: "My Subscriptions" },
        ]}
      />

      {/* Empty / Placeholder State for M3 Subscriptions */}
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
        <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <Repeat className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">
          No Active Subscriptions Yet
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          You currently do not have any active subscriptions. When your subscription contracts or quotations are finalized, they will appear here with automated renewal details.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/portal/plans"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors shadow-2xs"
          >
            <PlusCircle className="w-4 h-4" />
            Explore Available Plans
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium">
            <Clock className="w-4 h-4" />
            Recurring billing cycle is active
          </div>
        </div>
      </div>
    </div>
  );
};
