import React, { useState } from 'react';
import { Plus, Trash2, Tag, Layers, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface VariantItem {
  id?: number;
  attribute: string;
  value: string;
  extraPrice: number;
}

interface VariantsEditorProps {
  basePrice: number;
  variants: VariantItem[];
  onChange: (variants: VariantItem[]) => void;
  disabled?: boolean;
}

export const VariantsEditor: React.FC<VariantsEditorProps> = ({
  basePrice,
  variants,
  onChange,
  disabled = false,
}) => {
  const [newAttr, setNewAttr] = useState('Brand');
  const [newValue, setNewValue] = useState('');
  const [newExtra, setNewExtra] = useState<number | ''>('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttr.trim() || !newValue.trim()) return;

    const extra = Number(newExtra) || 0;
    onChange([...variants, { attribute: newAttr.trim(), value: newValue.trim(), extraPrice: extra }]);
    setNewValue('');
    setNewExtra('');
  };

  const handleRemove = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-slate-800 text-sm tracking-tight">
            Product Variants & Dynamic Pricing
          </h3>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          Base: {formatCurrency(basePrice || 0)}
        </span>
      </div>

      {/* Variant matrix list */}
      {variants.length === 0 ? (
        <div className="text-center py-6 px-4 border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
          <p className="text-xs text-slate-500 font-medium">No variants added yet. E.g. Add Brand: Odoo with extra ₹560</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-xs bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="py-2.5 px-3">Attribute</th>
                <th className="py-2.5 px-3">Value</th>
                <th className="py-2.5 px-3">Extra Surcharge</th>
                <th className="py-2.5 px-3">Effective Final Price</th>
                {!disabled && <th className="py-2.5 px-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {variants.map((v, i) => {
                const final = Number(basePrice || 0) + Number(v.extraPrice || 0);
                return (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-700">{v.attribute}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-900 bg-blue-50/80 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-md">
                        <Tag className="w-3 h-3" />
                        {v.value}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-600">
                      +{formatCurrency(v.extraPrice || 0)}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="inline-flex items-center gap-1 font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 badge-3d">
                        <span>{formatCurrency(final)}</span>
                        <ArrowUpRight className="w-3 h-3 text-slate-400" />
                      </div>
                    </td>
                    {!disabled && (
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemove(i)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add new variant quick inline row */}
      {!disabled && (
        <form onSubmit={handleAdd} className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-1">
          <input
            type="text"
            placeholder="Attr (e.g. Brand)"
            value={newAttr}
            onChange={(e) => setNewAttr(e.target.value)}
            className="w-full sm:w-1/3 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
          />
          <input
            type="text"
            placeholder="Value (e.g. Odoo)"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="w-full sm:w-1/3 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
          />
          <input
            type="number"
            placeholder="Extra ₹ (e.g. 560)"
            value={newExtra}
            onChange={(e) => setNewExtra(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full sm:w-1/4 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
          />
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg btn-3d shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </form>
      )}
    </div>
  );
};
