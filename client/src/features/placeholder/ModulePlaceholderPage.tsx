import React from "react";
import { PageHeader } from "../../components/common/PageHeader";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface ModulePlaceholderPageProps {
  title: string;
  moduleName: string;
  description: string;
}

export const ModulePlaceholderPage: React.FC<ModulePlaceholderPageProps> = ({
  title,
  moduleName,
  description,
}) => {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={[
          { label: "Dashboard", path: "/app/dashboard" },
          { label: title },
        ]}
      />

      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4 border border-brand-100">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-brand-700 mb-3 border border-blue-200">
          Brightloop {moduleName}
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          {title} Module
        </h3>
        <p className="text-sm text-slate-500 max-w-lg mx-auto mb-8 leading-relaxed">
          The foundation and role-based access for this section are established in M1. The full operational features of {title} will be enabled in {moduleName}.
        </p>

        <div className="flex justify-center">
          <Link
            to="/app/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
