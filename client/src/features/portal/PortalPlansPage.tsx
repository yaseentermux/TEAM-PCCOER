import React from "react";
import { Package, Check, ArrowRight } from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";

export const PortalPlansPage: React.FC = () => {
  const samplePlans = [
    {
      name: "Starter",
      description: "Ideal for small teams launching their first subscription workflows.",
      price: "₹4,999",
      billing: "/ month",
      popular: false,
      features: [
        "Up to 5 team members",
        "Standard recurring billing",
        "Email notifications & receipts",
        "Standard customer support",
      ],
    },
    {
      name: "Professional",
      description: "Comprehensive software subscription management for scaling teams.",
      price: "₹14,999",
      billing: "/ month",
      popular: true,
      features: [
        "Up to 25 team members",
        "Automated recurring invoices",
        "Multi-tier pricing & discounts",
        "Priority email & chat support",
        "Custom quotation templates",
      ],
    },
    {
      name: "Enterprise",
      description: "Dedicated infrastructure, advanced compliance, and custom terms.",
      price: "₹39,999",
      billing: "/ month",
      popular: false,
      features: [
        "Unlimited team members",
        "Custom billing cycles & terms",
        "Dedicated account manager",
        "SLA & 99.9% uptime guarantee",
        "Audit logs & custom reports",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Plans"
        description="Choose a subscription plan tailored to your organization's business needs"
        breadcrumbs={[
          { label: "Portal", path: "/portal" },
          { label: "Plans" },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {samplePlans.map((plan) => (
          <div
            key={plan.name}
            className={`bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-2xs relative transition-all ${
              plan.popular
                ? "border-brand-600 ring-2 ring-brand-600/20"
                : "border-slate-200"
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold bg-brand-600 text-white shadow-xs">
                Most Popular
              </span>
            )}

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-blue-50 text-brand-600">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-3xl font-extrabold text-slate-900">
                  {plan.price}
                </span>
                <span className="text-xs text-slate-500 ml-1 font-medium">
                  {plan.billing}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-4 mb-6">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
                  Included Features
                </p>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <button
                type="button"
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs ${
                  plan.popular
                    ? "bg-brand-600 text-white hover:bg-brand-700"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                onClick={() => alert(`Inquiry submitted for ${plan.name} plan! Our sales team will contact you shortly.`)}
              >
                <span>Request Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
