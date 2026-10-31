import React, { useState, useEffect } from 'react';
import { useCreateProduct, useUpdateProduct, useAddVariant, useDeleteVariant, useTaxes } from '../api';
import { X, Layers, Tag, Percent, Sparkles } from 'lucide-react';
import { VariantsEditor, VariantItem } from './VariantsEditor';

interface ProductModalProps {
  product: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose }) => {
  if (!isOpen) return null;

  const isEdit = !!product;
  const { data: taxesData } = useTaxes();
  const availableTaxes = taxesData || [];

  const [name, setName] = useState(product?.name || '');
  const [type, setType] = useState(product?.type || 'SERVICE');
  const [salesPrice, setSalesPrice] = useState<number>(product ? Number(product.salesPrice) : 1000);
  const [costPrice, setCostPrice] = useState<number>(product ? Number(product.costPrice) : 400);
  const [notes, setNotes] = useState(product?.notes || '');
  const [selectedTaxIds, setSelectedTaxIds] = useState<number[]>(
    product?.taxes ? product.taxes.map((t: any) => t.id) : []
  );
  const [variants, setVariants] = useState<VariantItem[]>(
    product?.variants ? product.variants.map((v: any) => ({
      id: v.id,
      attribute: v.attribute,
      value: v.value,
      extraPrice: Number(v.extraPrice),
    })) : []
  );

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct(product?.id);
  const addVariantMutation = useAddVariant(product?.id);
  const deleteVariantMutation = useDeleteVariant(product?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name,
      type,
      salesPrice: Number(salesPrice),
      costPrice: Number(costPrice),
      notes: notes || null,
      taxIds: selectedTaxIds,
    };

    if (isEdit) {
      await updateMutation.mutateAsync(payload);
    } else {
      const created = await createMutation.mutateAsync(payload);
      // If new variants were drafted, add them to the created product
      for (const v of variants) {
        await addVariantMutation.mutateAsync({
          attribute: v.attribute,
          value: v.value,
          extraPrice: v.extraPrice,
        });
      }
    }

    onClose();
  };

  const handleVariantChange = async (updatedVariants: VariantItem[]) => {
    if (isEdit) {
      // If adding a new one in edit mode
      if (updatedVariants.length > variants.length) {
        const added = updatedVariants[updatedVariants.length - 1];
        await addVariantMutation.mutateAsync({
          attribute: added.attribute,
          value: added.value,
          extraPrice: added.extraPrice,
        });
      } else if (updatedVariants.length < variants.length) {
        // Find deleted variant
        const remainingIds = updatedVariants.map((v) => v.id).filter(Boolean);
        const removed = variants.find((v) => v.id && !remainingIds.includes(v.id));
        if (removed && removed.id) {
          await deleteVariantMutation.mutateAsync(removed.id);
        }
      }
    }
    setVariants(updatedVariants);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isEdit ? 'Edit Product & Variant Surcharges' : 'Launch New Subscription Product'}
            </h2>
            <p className="text-xs text-slate-500">Configure catalog properties, margin calculations and variants</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Brightloop CRM"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product Classification</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="SERVICE">Service (SaaS Software)</option>
                <option value="GOODS">Goods</option>
                <option value="ADDON">Add-on Module</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sales Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={salesPrice}
                onChange={(e) => setSalesPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Taxes Multi-Select Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Applicable Tax Rules</label>
            <div className="flex flex-wrap gap-2">
              {availableTaxes.map((tax: any) => {
                const isSelected = selectedTaxIds.includes(tax.id);
                return (
                  <button
                    key={tax.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTaxIds(selectedTaxIds.filter((id) => id !== tax.id));
                      } else {
                        setSelectedTaxIds([...selectedTaxIds, tax.id]);
                      }
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs font-bold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {tax.name} ({tax.amount}%)
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Notes & Description</label>
            <textarea
              rows={2}
              placeholder="Features, contract terms, or SLA details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Variants Matrix Section */}
          <div className="pt-2 border-t border-slate-100">
            <VariantsEditor
              basePrice={salesPrice}
              variants={variants}
              onChange={handleVariantChange}
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl btn-3d cursor-pointer"
            >
              {isEdit ? 'Update Product' : 'Save & Launch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
