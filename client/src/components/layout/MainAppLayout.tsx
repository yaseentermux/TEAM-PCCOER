import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  Package, Repeat, Percent, Receipt, Globe, 
  BarChart3, FileText, CreditCard, ShieldCheck, ChevronRight 
} from 'lucide-react';

export const MainAppLayout: React.FC = () => {
  const catalogNav = [
    { to: '/products', label: 'Products & Variants', icon: Package },
    { to: '/plans', label: 'Subscription Plans', icon: Repeat },
    { to: '/discounts', label: 'Discounts & Rules', icon: Percent },
    { to: '/taxes', label: 'Taxes', icon: Receipt },
  ];

  const billingNav = [
    { to: '/billing/dashboard', label: 'Finance Dashboard', icon: BarChart3 },
    { to: '/billing/invoices', label: 'Invoices & Billing', icon: FileText },
    { to: '/billing/payments', label: 'Recorded Payments', icon: CreditCard },
    { to: '/pricing', label: 'Public Portal View', icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Floating Glass Header */}
      <header className="sticky top-0 z-40 glass-panel shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black shadow-xs">
              BL
            </div>
            <div>
              <span className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
                Brightloop Software
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-1.5 py-0.2 rounded-md">
                  Unified Platform
                </span>
              </span>
              <p className="text-[11px] text-slate-400">Subscription Management & Recurring Billing</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin / Staff Workspace</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="card-tactile p-3 space-y-4 sticky top-22">
            <div>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Catalog & Pricing (M2)
              </div>
              <div className="space-y-1 mt-1">
                {catalogNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </NavLink>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Billing & Finance (M4)
              </div>
              <div className="space-y-1 mt-1">
                {billingNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
