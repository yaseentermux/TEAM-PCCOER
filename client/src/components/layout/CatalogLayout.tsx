import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  Package, Repeat, Percent, Receipt, Globe, 
  Sparkles, ShieldCheck, ChevronRight 
} from 'lucide-react';

export const CatalogLayout: React.FC = () => {
  const navItems = [
    { to: '/products', label: 'Products & Variants', icon: Package },
    { to: '/plans', label: 'Subscription Plans', icon: Repeat },
    { to: '/discounts', label: 'Discounts & Rules', icon: Percent },
    { to: '/taxes', label: 'Taxes', icon: Receipt },
    { to: '/pricing', label: 'Customer Portal View', icon: Globe },
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
                  M2 Catalog
                </span>
              </span>
              <p className="text-[11px] text-slate-400">Subscription Management & Pricing Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Mode</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-60 shrink-0">
          <div className="card-tactile p-3 space-y-1 sticky top-22">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Catalog Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
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
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
