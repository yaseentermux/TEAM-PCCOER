import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit2, Eye, AlertCircle, Loader2 } from "lucide-react";
import type { User } from "../../context/AuthContext";
import { api, getErrorMessage } from "../../lib/api";
import { PageHeader } from "../../components/common/PageHeader";
import { DataTable, type ColumnDef } from "../../components/common/DataTable";
import { formatDate } from "../../components/common/formatDate";

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Customer Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Customer Modal State
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search.trim()) {
        params.set("search", search.trim());
      }

      const res = await api.get<{ data: User[]; meta: { total: number } }>(
        `/customers?${params.toString()}`,
      );

      setCustomers(res.data?.data || []);
      setTotal(res.data?.meta?.total || 0);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load customers."));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      await api.post("/customers", {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        company: company.trim() || null,
        address: address.trim() || null,
      });

      setCreateModalOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      setCompany("");
      setAddress("");
      fetchCustomers();
    } catch (err) {
      setCreateError(getErrorMessage(err, "Failed to create customer."));
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditModal = (c: User) => {
    setEditTarget(c);
    setEditName(c.name);
    setEditPhone(c.phone || "");
    setEditCompany(c.company || "");
    setEditAddress(c.address || "");
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    setEditError(null);
    setEditLoading(true);

    try {
      await api.patch(`/customers/${editTarget.id}`, {
        name: editName.trim(),
        phone: editPhone.trim() || null,
        company: editCompany.trim() || null,
        address: editAddress.trim() || null,
      });

      setEditTarget(null);
      fetchCustomers();
    } catch (err) {
      setEditError(getErrorMessage(err, "Failed to update customer."));
    } finally {
      setEditLoading(false);
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      key: "name",
      header: "Customer Name & Email",
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {c.name ? c.name.charAt(0).toUpperCase() : "C"}
          </div>
          <div>
            <Link
              to={`/app/customers/${c.id}`}
              className="font-semibold text-slate-900 hover:text-brand-600 transition-colors"
            >
              {c.name}
            </Link>
            <div className="text-xs text-slate-500">{c.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "company",
      header: "Company",
      render: (c) => (
        <span className="font-medium text-slate-800">{c.company || "—"}</span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (c) => <span className="text-xs text-slate-600">{c.phone || "—"}</span>,
    },
    {
      key: "isActive",
      header: "Status",
      render: (c) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            c.isActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-500 border-slate-200"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              c.isActive ? "bg-emerald-500" : "bg-slate-400"
            }`}
          />
          {c.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Joined Date",
      render: (c) => (
        <span className="text-xs text-slate-500">{formatDate(c.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (c) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/app/customers/${c.id}`}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-brand-600 transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => openEditModal(c)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-brand-600 transition-colors cursor-pointer"
            title="Edit Customer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers Management"
        description="View, search and manage customer accounts, subscriptions and profiles"
        actions={
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={customers}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        isLoading={loading}
        error={error}
        onRetry={fetchCustomers}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search customers by name, email, or company..."
        emptyTitle="No customers found"
        emptyMessage="Try a different search term or add a new customer."
      />

      {/* Create Customer Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg p-6 bg-white rounded-2xl shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Create New Customer
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Add a customer profile. An invitation with a secure password setup link
              will be sent automatically.
            </p>

            {createError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Customer / Contact Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Corporation or Jane Doe"
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="billing@acme.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Global Ltd."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
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
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, City, Postal Code"
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
                  {createLoading ? "Creating Customer..." : "Create Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg p-6 bg-white rounded-2xl shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Edit Customer Profile
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Update company, contact or address details for {editTarget.name}
            </p>

            {editError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Email (read-only)
                </label>
                <input
                  type="email"
                  disabled
                  value={editTarget.email}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg text-sm cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Company
                  </label>
                  <input
                    type="text"
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
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
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {editLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
