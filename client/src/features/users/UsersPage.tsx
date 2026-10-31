import React, { useState, useEffect, useCallback } from "react";
import { Plus, UserCheck, UserX, Loader2, AlertCircle } from "lucide-react";
import { useAuth, type User, type UserRole } from "../../context/AuthContext";
import { api, getErrorMessage } from "../../lib/api";
import { PageHeader } from "../../components/common/PageHeader";
import { DataTable, type ColumnDef } from "../../components/common/DataTable";
import { formatDate } from "../../components/common/formatDate";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";

export const UsersPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Staff Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<"ADMIN" | "INTERNAL">("INTERNAL");
  const [createPhone, setCreatePhone] = useState("");
  const [createCompany, setCreateCompany] = useState("");
  const [createAddress, setCreateAddress] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Toggle Active Dialog State
  const [toggleTarget, setToggleTarget] = useState<User | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (roleFilter) {
        params.set("role", roleFilter);
      }

      const res = await api.get<{ data: User[]; meta: { total: number } }>(
        `/users?${params.toString()}`,
      );

      setUsers(res.data?.data || []);
      setTotal(res.data?.meta?.total || 0);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load users."));
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      await api.post("/users", {
        name: createName.trim(),
        email: createEmail.trim(),
        password: createPassword,
        role: createRole,
        phone: createPhone.trim() || null,
        company: createCompany.trim() || null,
        address: createAddress.trim() || null,
      });

      setCreateModalOpen(false);
      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("INTERNAL");
      setCreatePhone("");
      setCreateCompany("");
      setCreateAddress("");
      fetchUsers();
    } catch (err) {
      setCreateError(getErrorMessage(err, "Failed to create user."));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!toggleTarget) return;

    if (currentAdmin?.id === toggleTarget.id && toggleTarget.isActive) {
      alert("You cannot deactivate your own account.");
      setToggleTarget(null);
      return;
    }

    setToggleLoading(true);
    try {
      await api.patch(`/users/${toggleTarget.id}/active`, {
        isActive: !toggleTarget.isActive,
      });
      setToggleTarget(null);
      fetchUsers();
    } catch (err) {
      alert(getErrorMessage(err, "Failed to update user status."));
    } finally {
      setToggleLoading(false);
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      key: "name",
      header: "User Details",
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {u.name ? u.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{u.name}</div>
            <div className="text-xs text-slate-500">{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (u) => {
        const badgeColors: Record<UserRole, string> = {
          ADMIN: "bg-purple-50 text-purple-700 border-purple-200",
          INTERNAL: "bg-blue-50 text-blue-700 border-blue-200",
          CUSTOMER: "bg-slate-100 text-slate-700 border-slate-200",
        };
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              badgeColors[u.role] || badgeColors.CUSTOMER
            }`}
          >
            {u.role}
          </span>
        );
      },
    },
    {
      key: "phone",
      header: "Contact",
      render: (u) => (
        <div className="text-xs text-slate-600">
          <div>{u.phone || "—"}</div>
          {u.company && <div className="text-slate-400">{u.company}</div>}
        </div>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (u) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            u.isActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-500 border-slate-200"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              u.isActive ? "bg-emerald-500" : "bg-slate-400"
            }`}
          />
          {u.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Joined Date",
      render: (u) => (
        <span className="text-xs text-slate-500">{formatDate(u.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (u) => {
        const isSelf = currentAdmin?.id === u.id;
        return (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={isSelf}
              onClick={() => setToggleTarget(u)}
              title={
                isSelf
                  ? "Cannot deactivate your own account"
                  : u.isActive
                  ? "Deactivate user"
                  : "Activate user"
              }
              className={`p-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                isSelf
                  ? "opacity-30 cursor-not-allowed border-slate-200 text-slate-400"
                  : u.isActive
                  ? "border-red-200 text-red-600 hover:bg-red-50"
                  : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              }`}
            >
              {u.isActive ? (
                <UserX className="w-4 h-4" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Staff Management"
        description="View and administer company staff and users with role-based access"
        actions={
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Staff Member
          </button>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-sm">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Filter by Role:
        </label>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">ADMIN Only</option>
          <option value="INTERNAL">INTERNAL (Staff) Only</option>
          <option value="CUSTOMER">CUSTOMER Only</option>
        </select>
      </div>

      {/* Users DataTable */}
      <DataTable
        columns={columns}
        data={users}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        isLoading={loading}
        error={error}
        onRetry={fetchUsers}
        emptyTitle="No users found"
        emptyMessage="Try adjusting your role filter or create a new user."
      />

      {/* Add Staff Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg p-6 bg-white rounded-2xl shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Create New Staff Member
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Add an internal team member or administrator to Brightloop
            </p>

            {createError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="john@brightloop.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="Min 9 chars, upper, lower, special"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Role *
                  </label>
                  <select
                    value={createRole}
                    onChange={(e) =>
                      setCreateRole(e.target.value as "ADMIN" | "INTERNAL")
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="INTERNAL">INTERNAL (Sales / Support)</option>
                    <option value="ADMIN">ADMIN (Full Access)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Company
                  </label>
                  <input
                    type="text"
                    value={createCompany}
                    onChange={(e) => setCreateCompany(e.target.value)}
                    placeholder="Brightloop Software"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Address
                </label>
                <input
                  type="text"
                  value={createAddress}
                  onChange={(e) => setCreateAddress(e.target.value)}
                  placeholder="Office address"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {createLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {createLoading ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Active Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!toggleTarget}
        title={
          toggleTarget?.isActive
            ? `Deactivate ${toggleTarget?.name}?`
            : `Activate ${toggleTarget?.name}?`
        }
        message={
          toggleTarget?.isActive
            ? "Deactivating this user will revoke their login sessions and prevent them from accessing Brightloop."
            : "Activating this user will allow them to log in and access the system."
        }
        confirmLabel={toggleTarget?.isActive ? "Deactivate User" : "Activate User"}
        variant={toggleTarget?.isActive ? "danger" : "primary"}
        isLoading={toggleLoading}
        onConfirm={handleToggleActive}
        onCancel={() => setToggleTarget(null)}
      />
    </div>
  );
};
