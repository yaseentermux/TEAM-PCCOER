import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  ChevronDown,
  User as UserIcon,
  LogOut,
  Search,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getFilteredMenuGroups } from "./menu";

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const menuGroups = getFilteredMenuGroups(user?.role);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Desktop & Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-100 transition-all duration-300 ease-in-out lg:static lg:z-auto ${
          sidebarCollapsed ? "w-20" : "w-64"
        } ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          <Link
            to="/app/dashboard"
            className="flex items-center gap-2.5 overflow-hidden font-bold tracking-tight text-white"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white shadow-xs">
              <Layers className="h-5 w-5" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-lg truncate">Brightloop</span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {group.heading && !sidebarCollapsed && (
                <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  {group.heading}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-brand-600 text-white shadow-xs"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      } ${sidebarCollapsed ? "justify-center" : ""}`
                    }
                    title={sidebarCollapsed ? item.title : undefined}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {!sidebarCollapsed && <span>{item.title}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-3 border-t border-slate-800">
          <div
            className={`flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-800/60 ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center font-semibold text-xs text-white shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.name}
                </p>
                <p className="text-[10px] text-slate-400 capitalize">
                  {user?.role?.toLowerCase()}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Placeholder */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search subscriptions, customers, invoices... (Press /)"
                className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-slate-100/70 border border-transparent rounded-lg focus:bg-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-none">
                  {user?.name}
                </p>
                <span className="text-[10px] font-medium text-slate-500 capitalize">
                  {user?.role?.toLowerCase()}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-sm animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-semibold text-slate-900 truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {user?.email}
                    </p>
                  </div>

                  <Link
                    to="/app/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    My Profile
                  </Link>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
