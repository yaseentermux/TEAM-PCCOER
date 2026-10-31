import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  Layers,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";
import {
  useQuotationTemplate,
  useCreateQuotationTemplate,
  useUpdateQuotationTemplate,
  useDeleteQuotationTemplate,
  usePlans,
  useProducts,
  useQuotationTemplates,
  useSubscriptions,
} from "../api";
import { CreateFromTemplateDialog } from "../components/CreateFromTemplateDialog";
import type {
  PlanRef,
  ProductRef,
  CreateQuotationTemplateInput,
  UpdateQuotationTemplateInput,
} from "../types";

interface FormTemplateLine {
  id: string; // client key
  productId: number;
  variantId: number | null;
  quantity: number;
}

const nativeSelectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

export default function QuotationTemplateDetailPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id && id !== "new");
  const templateId = Number(id);

  // Queries
  const {
    data: existingTemplate,
    isLoading: isTemplateLoading,
    isError: isTemplateError,
    error: templateError,
  } = useQuotationTemplate(templateId);

  const { data: apiPlans = [], isLoading: isPlansLoading } = usePlans();
  const { data: apiProducts = [], isLoading: isProductsLoading } = useProducts();
  const { data: otherTemplates = [] } = useQuotationTemplates();
  const { data: recentSubsData } = useSubscriptions({ limit: 50 });

  // Mutations
  const createMutation = useCreateQuotationTemplate();
  const updateMutation = useUpdateQuotationTemplate();
  const deleteMutation = useDeleteQuotationTemplate();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Dialog State
  const [useTemplateDialogOpen, setUseTemplateDialogOpen] = useState(false);

  // Fallback options
  const plans = useMemo(() => {
    if (apiPlans.length > 0) return apiPlans;
    const map = new Map<number, PlanRef>();
    if (existingTemplate?.plan) {
      map.set(existingTemplate.plan.id, existingTemplate.plan);
    }
    otherTemplates.forEach((t) => {
      if (t.plan && !map.has(t.plan.id)) {
        map.set(t.plan.id, t.plan);
      }
    });
    recentSubsData?.data?.forEach((s) => {
      if (s.plan && !map.has(s.plan.id)) {
        map.set(s.plan.id, s.plan);
      }
    });
    return Array.from(map.values());
  }, [apiPlans, existingTemplate, otherTemplates, recentSubsData]);

  const products = useMemo(() => {
    if (apiProducts.length > 0) return apiProducts;
    const map = new Map<number, ProductRef>();
    if (existingTemplate?.lines) {
      existingTemplate.lines.forEach((l) => {
        if (l.product && !map.has(l.product.id)) {
          map.set(l.product.id, l.product);
        }
      });
    }
    otherTemplates.forEach((t) => {
      t.lines?.forEach((tl) => {
        if (tl.product && !map.has(tl.product.id)) {
          map.set(tl.product.id, tl.product);
        }
      });
    });
    recentSubsData?.data?.forEach((s) => {
      s.lines?.forEach((l) => {
        if (l.product && !map.has(l.product.id)) {
          map.set(l.product.id, l.product);
        }
      });
    });
    return Array.from(map.values());
  }, [apiProducts, existingTemplate, otherTemplates, recentSubsData]);

  // Form State
  const [name, setName] = useState<string>("");
  const [validityDays, setValidityDays] = useState<number>(30);
  const [selectedPlanId, setSelectedPlanId] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [lines, setLines] = useState<FormTemplateLine[]>([
    {
      id: "line-1",
      productId: 0,
      variantId: null,
      quantity: 1,
    },
  ]);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Prepopulate form when in Edit mode
  useEffect(() => {
    if (isEditMode && existingTemplate) {
      setName(existingTemplate.name);
      setValidityDays(existingTemplate.validityDays);
      setSelectedPlanId(existingTemplate.planId);
      setNotes(existingTemplate.notes ?? "");
      if (existingTemplate.lines && existingTemplate.lines.length > 0) {
        setLines(
          existingTemplate.lines.map((l, index) => ({
            id: `line-${l.id || index + 1}`,
            productId: l.productId,
            variantId: l.variantId ?? null,
            quantity: l.quantity,
          }))
        );
      }
    }
  }, [isEditMode, existingTemplate]);

  // Set default product if new and products are ready
  useEffect(() => {
    if (!isEditMode && products.length > 0 && lines.length === 1 && lines[0].productId === 0) {
      const defaultProduct = products[0];
      setLines([
        {
          id: "line-1",
          productId: defaultProduct.id,
          variantId: defaultProduct.variants?.[0]?.id ?? null,
          quantity: 1,
        },
      ]);
    }
  }, [isEditMode, products, lines]);

  // Line item handlers
  const handleAddLine = () => {
    const defaultProduct = products[0];
    const newId = `line-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setLines((prev) => [
      ...prev,
      {
        id: newId,
        productId: defaultProduct ? defaultProduct.id : 0,
        variantId: defaultProduct?.variants?.[0]?.id ?? null,
        quantity: 1,
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) {
      toast.warning("Quotation template must contain at least one line item");
      return;
    }
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, productId: number) => {
    const product = products.find((p) => p.id === productId);
    const defaultVariant = product?.variants?.[0] ?? null;

    setLines((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              productId,
              variantId: defaultVariant?.id ?? null,
            }
          : item
      )
    );
  };

  const handleVariantChange = (index: number, variantId: number | null) => {
    setLines((prev) =>
      prev.map((item, i) => (i === index ? { ...item, variantId } : item))
    );
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const safeQty = Math.max(1, Math.floor(qty) || 1);
    setLines((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: safeQty } : item))
    );
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // Form Validation
  const validateForm = (): boolean => {
    const errors: string[] = [];
    if (!name.trim() || name.trim().length < 2) {
      errors.push("Template name must be at least 2 characters long");
    }
    if (!selectedPlanId || selectedPlanId <= 0) {
      errors.push("Please select an associated subscription plan");
    }
    if (!validityDays || validityDays <= 0) {
      errors.push("Validity days must be greater than 0");
    }
    if (lines.length === 0) {
      errors.push("At least one product line is required");
    }

    lines.forEach((line, idx) => {
      if (!line.productId || line.productId <= 0) {
        errors.push(`Line #${idx + 1}: Product must be selected`);
      }
      if (!line.quantity || line.quantity < 1) {
        errors.push(`Line #${idx + 1}: Quantity must be at least 1`);
      }
    });

    setFormErrors(errors);
    return errors.length === 0;
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please resolve all validation errors before saving");
      return;
    }

    const formattedLines = lines.map((l) => ({
      productId: Number(l.productId),
      variantId: l.variantId ? Number(l.variantId) : null,
      quantity: Number(l.quantity),
    }));

    if (isEditMode) {
      const payload: UpdateQuotationTemplateInput = {
        name: name.trim(),
        validityDays: Number(validityDays),
        planId: Number(selectedPlanId),
        notes: notes.trim() || null,
        lines: formattedLines,
      };

      updateMutation.mutate(
        { id: templateId, data: payload },
        {
          onSuccess: () => {
            navigate("/app/quotation-templates");
          },
        }
      );
    } else {
      const payload: CreateQuotationTemplateInput = {
        name: name.trim(),
        validityDays: Number(validityDays),
        planId: Number(selectedPlanId),
        notes: notes.trim() || null,
        lines: formattedLines,
      };

      createMutation.mutate(payload, {
        onSuccess: () => {
          navigate("/app/quotation-templates");
        },
      });
    }
  };

  // Delete Handler (for edit mode)
  const handleDelete = () => {
    if (!isEditMode) return;
    deleteMutation.mutate(templateId, {
      onSuccess: () => {
        navigate("/app/quotation-templates");
      },
    });
  };

  // Loading state in edit mode
  if (isEditMode && isTemplateLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-md" />
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  // Error state in edit mode
  if (isEditMode && (isTemplateError || !existingTemplate)) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/app/quotation-templates")}
          className="gap-1.5 text-xs text-slate-600"
        >
          <ArrowLeft className="size-3.5" /> Back to Templates
        </Button>
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="size-5 shrink-0 text-rose-500" />
          <div className="flex-1">
            <p className="font-semibold">Template not found</p>
            <p className="text-xs text-rose-700">
              {templateError instanceof Error
                ? templateError.message
                : "The requested quotation template could not be loaded."}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/app/quotation-templates")}>
            View All Templates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate("/app/quotation-templates")}
            className="size-8 p-0 text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {isEditMode ? `Edit Template: ${existingTemplate?.name}` : "New Quotation Template"}
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              {isEditMode
                ? "Update template specifications, plan associations, and default package line items."
                : "Define reusable package lines and validity rules for rapid quotation generation."}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isEditMode && existingTemplate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUseTemplateDialogOpen(true)}
              className="gap-1.5 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            >
              <Sparkles className="size-3.5" />
              Use Template
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate("/app/quotation-templates")}
            disabled={isSaving}
            className="text-xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isSaving}
            className="gap-1.5 bg-indigo-600 text-xs text-white hover:bg-indigo-700 shadow-sm"
          >
            {isSaving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            {isEditMode ? "Save Changes" : "Create Template"}
          </Button>
        </div>
      </div>

      {/* Validation Errors Summary Banner */}
      {formErrors.length > 0 && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="size-4 text-rose-600" />
            Please correct the following errors:
          </div>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-rose-700">
            {formErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: General Details & Plan */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              1. Template Information
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Standard contract designation and recurring plan link.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Template Name */}
              <div className="space-y-1.5">
                <Label htmlFor="tpl-name" className="text-xs font-medium text-slate-700">
                  Template Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="tpl-name"
                  placeholder="e.g. Starter Package, Enterprise Deployment"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              {/* Plan Selection */}
              <div className="space-y-1.5">
                <Label htmlFor="tpl-plan" className="text-xs font-medium text-slate-700">
                  Associated Plan <span className="text-rose-500">*</span>
                </Label>
                {isPlansLoading ? (
                  <Skeleton className="h-9 w-full rounded-lg" />
                ) : (
                  <select
                    id="tpl-plan"
                    className={nativeSelectClass}
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(Number(e.target.value))}
                    required
                  >
                    <option value={0}>-- Select Plan --</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.billingPeriod}) - {formatMoney(Number(p.price))}
                      </option>
                    ))}
                  </select>
                )}
                {selectedPlan && (
                  <div className="flex items-center gap-2 pt-0.5 text-[11px] text-slate-500">
                    <Layers className="size-3 text-indigo-500" />
                    <span>Billing: {selectedPlan.billingPeriod}</span>
                    <span>&bull;</span>
                    <span>Base: {formatMoney(Number(selectedPlan.price))}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Validity Days */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tpl-validity" className="text-xs font-medium text-slate-700">
                  Validity Period (Days) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="tpl-validity"
                  type="number"
                  min={1}
                  value={validityDays}
                  onChange={(e) => setValidityDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="h-9 text-xs"
                  required
                />
                <p className="text-[11px] text-slate-400">
                  Quotations generated with this template will expire after this many days.
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="tpl-notes" className="text-xs font-medium text-slate-700">
                  Description / Terms Notes
                </Label>
                <Textarea
                  id="tpl-notes"
                  rows={2}
                  placeholder="Terms summary, target customer profile, or standard package conditions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: Default Order Line Items */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                2. Default Package Lines
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Products and quantities bundled automatically when this template is selected.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLine}
              className="gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            >
              <Plus className="size-3.5" />
              Add Product Line
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {isProductsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                {lines.map((line, index) => {
                  const selectedProduct = products.find((p) => p.id === line.productId);
                  const availableVariants = selectedProduct?.variants ?? [];
                  const basePrice = selectedProduct ? Number(selectedProduct.salesPrice) : 0;
                  const selectedVariant = availableVariants.find((v) => v.id === line.variantId);
                  const extraPrice = selectedVariant ? Number(selectedVariant.extraPrice) : 0;
                  const unitPrice = basePrice + extraPrice;
                  const lineTotal = line.quantity * unitPrice;

                  return (
                    <div
                      key={line.id}
                      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3 transition-colors hover:border-slate-300 sm:flex-row sm:items-center"
                    >
                      {/* Product Selector */}
                      <div className="flex-1 space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 sm:hidden">
                          Product
                        </Label>
                        <select
                          className={nativeSelectClass}
                          value={line.productId}
                          onChange={(e) => handleProductChange(index, Number(e.target.value))}
                        >
                          <option value={0}>-- Select Product --</option>
                          {products.map((prod) => (
                            <option key={prod.id} value={prod.id}>
                              {prod.name} ({formatMoney(Number(prod.salesPrice))})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Variant Selector (if product has variants) */}
                      {availableVariants.length > 0 && (
                        <div className="w-full sm:w-44 space-y-1">
                          <Label className="text-[11px] font-medium text-slate-600 sm:hidden">
                            Variant
                          </Label>
                          <select
                            className={nativeSelectClass}
                            value={line.variantId ?? ""}
                            onChange={(e) =>
                              handleVariantChange(
                                index,
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                          >
                            <option value="">Default / Base</option>
                            {availableVariants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.attribute}: {v.value} (+{formatMoney(Number(v.extraPrice))})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Quantity */}
                      <div className="w-full sm:w-28 space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 sm:hidden">
                          Quantity
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) =>
                            handleQuantityChange(index, parseInt(e.target.value, 10))
                          }
                          className="h-9 text-right text-xs"
                        />
                      </div>

                      {/* Price / Subtotal Estimate */}
                      <div className="w-full sm:w-32 text-right text-xs text-slate-600">
                        <span className="text-[11px] text-slate-400 sm:hidden mr-2">Est. Price:</span>
                        <div className="font-medium text-slate-900">{formatMoney(lineTotal)}</div>
                        <div className="text-[10px] text-slate-400">{formatMoney(unitPrice)} ea</div>
                      </div>

                      {/* Remove Line Button */}
                      <div className="flex justify-end sm:justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLine(index)}
                          disabled={lines.length <= 1}
                          className="size-8 p-0 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                          title="Remove line item"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          {isEditMode ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending || (existingTemplate?._count?.subscriptions ?? 0) > 0}
              className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              <Trash2 className="size-3.5 mr-1" />
              Delete Template
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/app/quotation-templates")}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="gap-2 bg-indigo-600 px-5 text-white hover:bg-indigo-700 shadow-sm"
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {isEditMode ? "Save Changes" : "Create Template"}
            </Button>
          </div>
        </div>
      </form>

      {/* Create Subscription Dialog when accessed from Edit mode */}
      {existingTemplate && (
        <CreateFromTemplateDialog
          template={existingTemplate}
          open={useTemplateDialogOpen}
          onOpenChange={setUseTemplateDialogOpen}
        />
      )}
    </div>
  );
}
