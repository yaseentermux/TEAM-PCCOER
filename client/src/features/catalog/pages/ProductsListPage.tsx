import React, { useState } from 'react';
import { useProducts, useDeleteProduct } from '../api';
import { 
  Package, Search, Plus, Filter, ArrowUpDown, 
  Trash2, Layers, Percent, Sparkles, CheckCircle2, XCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ProductModal } from '../components/ProductModal';

export const ProductsListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useProducts({ search, type: typeFilter || undefined });
  const deleteMutation = useDeleteProduct();

  const products = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-xs">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Products & Catalog</h1>
              <p className="text-xs text-slate-500 font-medium">Manage SaaS products, variant surcharge tiers & tax assignments</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => { setSelectedProduct(null); setIsModalOpen(true); }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl btn-3d cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Launch New Product</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/70 backdrop-blur-md p-3 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Product Types</option>
            <option value="SERVICE">Service (Software / SaaS)</option>
            <option value="GOODS">Goods</option>
            <option value="ADDON">Add-on Module</option>
          </select>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">Loading catalog products...</div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No products found</p>
            <p className="text-xs text-slate-400 mt-1">Get started by launching your first SaaS product or plan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Sales Price</th>
                  <th className="py-3 px-4">Cost Price</th>
                  <th className="py-3 px-4">Gross Margin</th>
                  <th className="py-3 px-4">Configured Variants</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {p.name}
                        </span>
                        {p.notes && <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">{p.notes}</p>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {p.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatCurrency(p.salesPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {formatCurrency(p.costPrice)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                        <Percent className="w-3 h-3 text-emerald-600" />
                        {p.marginPercent}%
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.variants && p.variants.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {p.variants.map((v: any) => (
                            <span 
                              key={v.id} 
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                            >
                              <span>{v.attribute}: {v.value}</span>
                              {v.extraPrice > 0 && <span className="text-emerald-700 font-bold">(+{v.extraPrice})</span>}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">None (Base only)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setSelectedProduct(p); setIsModalOpen(true); }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete or deactivate "${p.name}"?`)) {
                              deleteMutation.mutate(p.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Create / Edit Modal */}
      {isModalOpen && (
        <ProductModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
