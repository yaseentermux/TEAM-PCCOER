import React from "react";
import { Receipt, CheckCircle2 } from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";

export const PortalInvoicesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Invoices"
        description="Inspect and download past invoices, payment receipts, and billing history"
        breadcrumbs={[
          { label: "Portal", path: "/portal" },
          { label: "My Invoices" },
        ]}
      />

      {/* Empty / Placeholder State for M4 Invoices */}
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <Receipt className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">
          No Invoices Generated Yet
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          Your account is all settled! As renewal cycles are processed and invoices are generated, you will be able to review line items, download PDF receipts, and make payments here.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          No outstanding balances due
        </div>
      </div>
    </div>
  );
};
