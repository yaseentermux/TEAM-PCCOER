import React, { useState } from 'react';
import { useDiscounts, useCreateDiscount, useProducts } from '../api';
import { Percent, Plus, Tag, Calendar, CheckCircle2, AlertTriangle, Layers, XCircle, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export const DiscountsPage: React.FC = () => {
  const { data: discountsData, isLoading } = useDiscounts();
  const { data: productsData } = useProducts();
  const createDiscountMutation = useCreateDiscount();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [value, setValue] = useState<number>(10);
  const [scope, setScope] = useState<'PRODUCT' | 'SUBSCRIPTION'>('PRODUCT');
  const [productIds, setProductIds] = useState<number[]>([]);
  const [minPurchase, setMinPurchase] = useState<number | ''>('');
  const [minQuantity, setMinQuantity] = useState<number | ''>(10);
  const [usageLimit, setUsageLimit] = useState<number | ''>(50);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  const discounts = discountsData || [];
  const products = productsData?.data || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createDiscountMutation.mutateAsync({
      name,
      code: code || null,
      type,
      value: Number(value),
      scope,
      productIds: scope === 'PRODUCT' ? productIds : [],
      minPurchase: minPurchase === '' ? null : Number(minPurchase),
      minQuantity: minQuantity === '' ? null : Number(minQuantity),
      usageLimit: usageLimit === '' ? null : Number(usageLimit),
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : null,
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-xs">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Discount & Promotion Rules</h1>
            <p className="text-xs text-slate-500 font-medium">Automatic tiered discounts for bulk seats and contract commitments (Admin Only)</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl btn-3d cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Discount Rule</span>
        </button>
      </div>

      {/* Discounts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading discounts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Rule Name & Code</th>
                  <th className="py-3 px-4">Discount Value</th>
                  <th className="py-3 px-4">Scope</th>
                  <th className="py-3 px-4">Eligibility Thresholds</th>
                  <th className="py-3 px-4">Usage Quota Meter</th>
                  <th className="py-3 px-4">Computed State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {discounts.map((d: any) => {
                  const used = d.usedCount || 0;
                  const limit = d.usageLimit;
                  const percentUsed = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-bold text-slate-900">{d.name}</span>
                          {d.code && (
                            <span className="ml-2 font-mono text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                              {d.code}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          {d.type === 'PERCENT' ? `${d.value}% OFF` : `Flat ₹${d.value} OFF`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {d.scope}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 space-y-0.5">
                        {d.minQuantity && <div>Min Qty: <strong className="text-slate-800">{d.minQuantity} seats</strong></div>}
                        {d.minPurchase && <div>Min Spend: <strong className="text-slate-800">{formatCurrency(d.minPurchase)}</strong></div>}
                        {!d.minQuantity && !d.minPurchase && <span className="text-slate-400">None</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        {limit ? (
                          <div className="w-36">
                            <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                              <span>Used {used} of {limit}</span>
                              <span>{percentUsed}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                              <div 
                                className={`h-full transition-all rounded-full ${
                                  percentUsed >= 100 ? 'bg-rose-500' : percentUsed > 75 ? 'bg-amber-500' : 'bg-blue-600'
                                }`} 
                                style={{ width: `${percentUsed}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">Unlimited ({used} claimed)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          d.computedState === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          d.computedState === 'SCHEDULED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          d.computedState === 'EXHAUSTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {d.computedState}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Discount Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Define Pricing Discount Rule</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bulk 10+ seats 10%"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Coupon Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. BULK10"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Value ({type === 'PERCENT' ? '%' : '₹'})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Application Scope</label>
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="PRODUCT">Specific Products</option>
                    <option value="SUBSCRIPTION">Whole Subscription Order</option>
                  </select>
                </div>
              </div>

              {scope === 'PRODUCT' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Products</label>
                  <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2 border border-slate-200 rounded-lg">
                    {products.map((p: any) => {
                      const isChecked = productIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setProductIds(isChecked ? productIds.filter(id => id !== p.id) : [...productIds, p.id]);
                          }}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                            isChecked ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Quantity (Seats)</label>
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Usage Limit (Max claims)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl btn-3d font-semibold">
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
