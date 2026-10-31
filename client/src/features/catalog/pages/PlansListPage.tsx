import React, { useState } from 'react';
import { usePlans, useCreatePlan, useUpdatePlan } from '../api';
import { Calendar, Plus, Check, Clock, AlertCircle, Sparkles, Repeat, ShieldCheck, PauseCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export const PlansListPage: React.FC = () => {
  const { data: plansData, isLoading } = usePlans();
  const createPlanMutation = useCreatePlan();
  const updatePlanMutation = useUpdatePlan(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(999);
  const [billingPeriod, setBillingPeriod] = useState('MONTHLY');
  const [minQuantity, setMinQuantity] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [autoClose, setAutoClose] = useState(false);
  const [closable, setClosable] = useState(true);
  const [pausable, setPausable] = useState(true);
  const [renewable, setRenewable] = useState(true);

  const plans = plansData || [];

  const handleOpenModal = (plan?: any) => {
    if (plan) {
      setEditingPlan(plan);
      setName(plan.name);
      setPrice(Number(plan.price));
      setBillingPeriod(plan.billingPeriod);
      setMinQuantity(plan.minQuantity);
      setStartDate(new Date(plan.startDate).toISOString().split('T')[0]);
      setEndDate(plan.endDate ? new Date(plan.endDate).toISOString().split('T')[0] : '');
      setAutoClose(plan.autoClose);
      setClosable(plan.closable);
      setPausable(plan.pausable);
      setRenewable(plan.renewable);
    } else {
      setEditingPlan(null);
      setName('');
      setPrice(999);
      setBillingPeriod('MONTHLY');
      setMinQuantity(1);
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setAutoClose(false);
      setClosable(true);
      setPausable(true);
      setRenewable(true);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      price: Number(price),
      billingPeriod,
      minQuantity: Number(minQuantity),
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : null,
      autoClose,
      closable,
      pausable,
      renewable,
    };

    if (editingPlan) {
      await updatePlanMutation.mutateAsync(payload);
    } else {
      await createPlanMutation.mutateAsync(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-xs">
            <Repeat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Subscription Plans & Cycles</h1>
            <p className="text-xs text-slate-500 font-medium">Daily, weekly, monthly and yearly recurring cadences with lifecycle flags</p>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl btn-3d cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Subscription Plan</span>
        </button>
      </div>

      {/* Plans 3D Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading plans...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan: any) => {
            const isAvailable = plan.availabilityState === 'Available';
            const isUpcoming = plan.availabilityState === 'Upcoming';
            const isEnded = plan.availabilityState === 'Ended';

            return (
              <div 
                key={plan.id}
                className="card-tactile p-5 flex flex-col justify-between relative overflow-hidden group"
              >
                {/* Subtle colored accent top border */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-80" />

                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {plan.billingPeriod}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2">{plan.name}</h3>
                    </div>

                    {/* Status Badge */}
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isAvailable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      isUpcoming ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {isAvailable && <Check className="w-3 h-3" />}
                      {isUpcoming && <Clock className="w-3 h-3" />}
                      {isEnded && <AlertCircle className="w-3 h-3" />}
                      {plan.availabilityState}
                    </span>
                  </div>

                  {/* Price Tag */}
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">/ {plan.billingPeriod.toLowerCase()}</span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-2">
                    Min Seats required: <span className="font-semibold text-slate-700">{plan.minQuantity}</span>
                  </p>

                  {/* Feature Flags Grid */}
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span className={`w-2 h-2 rounded-full ${plan.pausable ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span>{plan.pausable ? 'Pausable' : 'No Pause'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span className={`w-2 h-2 rounded-full ${plan.closable ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span>{plan.closable ? 'Closable' : 'Locked'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span className={`w-2 h-2 rounded-full ${plan.renewable ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span>{plan.renewable ? 'Auto-Renew' : 'Manual'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span className={`w-2 h-2 rounded-full ${plan.autoClose ? 'bg-rose-500' : 'bg-slate-300'}`} />
                      <span>{plan.autoClose ? 'Auto-Close on Expire' : 'Persistent'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {plan.endDate ? `Ends ${new Date(plan.endDate).toLocaleDateString()}` : 'No expiration date'}
                  </span>
                  <button
                    onClick={() => handleOpenModal(plan)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    Edit Rules →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                {editingPlan ? 'Edit Plan Configuration' : 'Create Subscription Plan'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plan Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Monthly"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Base Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Billing Period</label>
                  <select
                    value={billingPeriod}
                    onChange={(e) => setBillingPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* 4 Boolean Flags / Switches */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-700 block">Lifecycle Policy Controls</span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pausable}
                      onChange={(e) => setPausable(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Allow Customer Pause</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={closable}
                      onChange={(e) => setClosable(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Allow Early Closing</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={renewable}
                      onChange={(e) => setRenewable(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Allow Renewal</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoClose}
                      onChange={(e) => setAutoClose(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Auto-Close on Expiry</span>
                  </label>
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
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
