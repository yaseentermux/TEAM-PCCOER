import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  Layers,
  User,
  Info,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  useCreateSubscription,
  useUpdateSubscription,
  useSubscription,
  useCustomers,
  usePlans,
  useProducts,
  useQuotationTemplates,
  useSubscriptions,
} from "../api";
import { SubscriptionStatusBadge } from "../components/SubscriptionStatusBadge";
import type {
  PaymentTerms,
  CustomerRef,
  PlanRef,
  ProductRef,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
} from "../types";

interface FormLineItem {
  id: string; // client temporary key
  productId: number;
  variantId: number | null;
  quantity: number;
  unitPrice: number;
}

const PAYMENT_TERMS_OPTIONS: { label: string; value: PaymentTerms }[] = [
  { label: "Immediate Payment", value: "IMMEDIATE" },
  { label: "Net 7 Days", value: "NET_7" },
  { label: "Net 15 Days", value: "NET_15" },
  { label: "Net 30 Days", value: "NET_30" },
];

const nativeSelectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

export default function NewSubscriptionPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const subId = Number(id);

  // Queries
  const {
    data: existingSub,
    isLoading: isSubLoading,
    isError: isSubError,
    error: subError,
  } = useSubscription(subId);

  const { data: apiCustomers = [], isLoading: isCustomersLoading } = useCustomers();
  const { data: apiPlans = [], isLoading: isPlansLoading } = usePlans();
  const { data: apiProducts = [], isLoading: isProductsLoading } = useProducts();
  const { data: templates = [] } = useQuotationTemplates();
  const { data: recentSubsData } = useSubscriptions({ limit: 50 });

  // Mutations
  const createMutation = useCreateSubscription();
  const updateMutation = useUpdateSubscription();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Fallback options extracted from existing subscriptions/templates if dedicated endpoints return empty
  const customers = useMemo(() => {
    if (apiCustomers.length > 0) return apiCustomers;
    const map = new Map<number, CustomerRef>();
    if (existingSub?.customer) {
      map.set(existingSub.customer.id, existingSub.customer);
    }
    recentSubsData?.data?.forEach((s) => {
      if (s.customer && !map.has(s.customer.id)) {
        map.set(s.customer.id, s.customer);
      }
    });
    return Array.from(map.values());
  }, [apiCustomers, existingSub, recentSubsData]);

  const plans = useMemo(() => {
    if (apiPlans.length > 0) return apiPlans;
    const map = new Map<number, PlanRef>();
    if (existingSub?.plan) {
      map.set(existingSub.plan.id, existingSub.plan);
    }
    templates.forEach((t) => {
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
  }, [apiPlans, existingSub, templates, recentSubsData]);

  const products = useMemo(() => {
    if (apiProducts.length > 0) return apiProducts;
    const map = new Map<number, ProductRef>();
    if (existingSub?.lines) {
      existingSub.lines.forEach((l) => {
        if (l.product && !map.has(l.product.id)) {
          map.set(l.product.id, l.product);
        }
      });
    }
    templates.forEach((t) => {
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
  }, [apiProducts, existingSub, templates, recentSubsData]);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0);
  const [selectedPlanId, setSelectedPlanId] = useState<number>(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>("IMMEDIATE");
  const [notes, setNotes] = useState<string>("");
  const [lines, setLines] = useState<FormLineItem[]>([
    {
      id: "line-1",
      productId: 0,
      variantId: null,
      quantity: 1,
      unitPrice: 0,
    },
  ]);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Prepopulate form when in Edit mode
  useEffect(() => {
    if (isEditMode && existingSub) {
      setSelectedCustomerId(existingSub.customerId);
      setSelectedPlanId(existingSub.planId);
      if (existingSub.templateId) {
        setSelectedTemplateId(existingSub.templateId);
      }
      if (existingSub.startDate) {
        setStartDate(existingSub.startDate.split("T")[0]);
      }
      if (existingSub.expiryDate) {
        setExpiryDate(existingSub.expiryDate.split("T")[0]);
      }
      if (existingSub.paymentTerms) {
        setPaymentTerms(existingSub.paymentTerms);
      }
      if (existingSub.notes) {
        setNotes(existingSub.notes);
      }
      if (existingSub.lines && existingSub.lines.length > 0) {
        setLines(
          existingSub.lines.map((l, index) => ({
            id: `line-${l.id || index + 1}`,
            productId: l.productId,
            variantId: l.variantId ?? null,
            quantity: l.quantity,
            unitPrice: Number(l.unitPrice) || 0,
          }))
        );
      }
    }
  }, [isEditMode, existingSub]);

  // If in Create mode and products become available, set default product for first row if not set
  useEffect(() => {
    if (!isEditMode && products.length > 0 && lines.length === 1 && lines[0].productId === 0) {
      const defaultProduct = products[0];
      setLines([
        {
          id: "line-1",
          productId: defaultProduct.id,
          variantId: defaultProduct.variants?.[0]?.id ?? null,
          quantity: 1,
          unitPrice: Number(defaultProduct.salesPrice) || 0,
        },
      ]);
    }
  }, [isEditMode, products, lines]);

  // Handle template selection in Create mode
  const handleTemplateChange = (templateId: number) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;

    if (tpl.planId) {
      setSelectedPlanId(tpl.planId);
    }
    if (tpl.notes && !notes) {
      setNotes(tpl.notes);
    }

    if (tpl.lines && tpl.lines.length > 0) {
      setLines(
        tpl.lines.map((tl, idx) => {
          const product = products.find((p) => p.id === tl.productId) || tl.product;
          const variant = product?.variants?.find((v) => v.id === tl.variantId) || tl.variant;
          const basePrice = product ? Number(product.salesPrice) : 0;
          const extraPrice = variant ? Number(variant.extraPrice) : 0;

          return {
            id: `tpl-line-${idx + 1}`,
            productId: tl.productId,
            variantId: tl.variantId ?? null,
            quantity: tl.quantity || 1,
            unitPrice: basePrice + extraPrice,
          };
        })
      );
      toast.info(`Loaded ${tpl.lines.length} lines from template "${tpl.name}"`);
    }
  };

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
        unitPrice: defaultProduct ? Number(defaultProduct.salesPrice) : 0,
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) {
      toast.warning("Subscription must have at least one order line");
      return;
    }
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, productId: number) => {
    const product = products.find((p) => p.id === productId);
    const defaultVariant = product?.variants?.[0] ?? null;
    const basePrice = product ? Number(product.salesPrice) : 0;
    const extraPrice = defaultVariant ? Number(defaultVariant.extraPrice) : 0;

    setLines((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              productId,
              variantId: defaultVariant?.id ?? null,
              unitPrice: basePrice + extraPrice,
            }
          : item
      )
    );
  };

  const handleVariantChange = (index: number, variantId: number | null) => {
    setLines((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const product = products.find((p) => p.id === item.productId);
        const variant = product?.variants?.find((v) => v.id === variantId);
        const basePrice = product ? Number(product.salesPrice) : 0;
        const extraPrice = variant ? Number(variant.extraPrice) : 0;
        return {
          ...item,
          variantId,
          unitPrice: basePrice + extraPrice,
        };
      })
    );
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const safeQty = Math.max(1, Math.floor(qty) || 1);
    setLines((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: safeQty } : item))
    );
  };

  const handleUnitPriceChange = (index: number, price: number) => {
    const safePrice = Math.max(0, price || 0);
    setLines((prev) =>
      prev.map((item, i) => (i === index ? { ...item, unitPrice: safePrice } : item))
    );
  };

  // Selected entities
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // Financial calculations
  const subtotal = lines.reduce((acc, l) => acc + l.quantity * l.unitPrice, 0);

  // Estimated Taxes (if products define tax percentages)
  const estimatedTax = useMemo(() => {
    let taxTotal = 0;
    lines.forEach((l) => {
      const product = products.find((p) => p.id === l.productId);
      if (product?.taxes && product.taxes.length > 0) {
        const lineTotal = l.quantity * l.unitPrice;
        product.taxes.forEach((t) => {
          const rate = Number(t.amount) || 0;
          taxTotal += lineTotal * (rate / 100);
        });
      }
    });
    return taxTotal;
  }, [lines, products]);

  const grandTotal = subtotal + estimatedTax;

  // Validation
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!selectedCustomerId || selectedCustomerId <= 0) {
      errors.push("Customer is required");
    }
    if (!selectedPlanId || selectedPlanId <= 0) {
      errors.push("Subscription Plan is required");
    }
    if (!startDate) {
      errors.push("Start Date is required");
    }
    if (lines.length === 0) {
      errors.push("At least one order line is required");
    }

    lines.forEach((line, idx) => {
      if (!line.productId || line.productId <= 0) {
        errors.push(`Order line #${idx + 1}: Product must be selected`);
      }
      if (!line.quantity || line.quantity < 1) {
        errors.push(`Order line #${idx + 1}: Quantity must be at least 1`);
      }
      if (selectedPlan && line.quantity < selectedPlan.minQuantity) {
        errors.push(
          `Order line #${idx + 1}: Quantity (${line.quantity}) must be at least the plan minimum (${selectedPlan.minQuantity})`
        );
      }
      if (line.unitPrice < 0) {
        errors.push(`Order line #${idx + 1}: Unit price cannot be negative`);
      }
    });

    setFormErrors(errors);
    return errors.length === 0;
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please resolve the validation errors before saving");
      return;
    }

    const isoStartDate = new Date(startDate).toISOString();
    const isoExpiryDate = expiryDate ? new Date(expiryDate).toISOString() : null;

    const formattedLines = lines.map((l) => ({
      productId: Number(l.productId),
      variantId: l.variantId ? Number(l.variantId) : null,
      quantity: Number(l.quantity),
      unitPrice: Number(Number(l.unitPrice).toFixed(2)),
    }));

    if (isEditMode) {
      const updatePayload: UpdateSubscriptionInput = {
        customerId: Number(selectedCustomerId),
        planId: Number(selectedPlanId),
        startDate: isoStartDate,
        expiryDate: isoExpiryDate,
        paymentTerms,
        notes: notes.trim() || null,
        lines: formattedLines,
      };

      updateMutation.mutate(
        { id: subId, data: updatePayload },
        {
          onSuccess: () => {
            navigate(`/app/subscriptions/${subId}`);
          },
        }
      );
    } else {
      const createPayload: CreateSubscriptionInput = {
        customerId: Number(selectedCustomerId),
        planId: Number(selectedPlanId),
        templateId: selectedTemplateId ? Number(selectedTemplateId) : null,
        startDate: isoStartDate,
        expiryDate: isoExpiryDate,
        paymentTerms,
        notes: notes.trim() || null,
        lines: formattedLines,
      };

      createMutation.mutate(createPayload, {
        onSuccess: (res) => {
          navigate(`/app/subscriptions/${res.id}`);
        },
      });
    }
  };

  // Loading state for Edit mode
  if (isEditMode && isSubLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-md" />
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  // Error state for Edit mode
  if (isEditMode && (isSubError || !existingSub)) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/app/subscriptions")}
          className="gap-1.5 text-xs text-slate-600"
        >
          <ArrowLeft className="size-3.5" /> Back to Subscriptions
        </Button>
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="size-5 shrink-0 text-rose-500" />
          <div className="flex-1">
            <p className="font-semibold">Subscription not found</p>
            <p className="text-xs text-rose-700">
              {subError instanceof Error
                ? subError.message
                : "The requested subscription could not be loaded for editing."}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/app/subscriptions")}>
            View All Subscriptions
          </Button>
        </div>
      </div>
    );
  }

  // Non-editable status guard for Edit mode
  if (isEditMode && existingSub && !["DRAFT", "QUOTATION"].includes(existingSub.status)) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/app/subscriptions/${subId}`)}
          className="gap-1.5 text-xs text-slate-600"
        >
          <ArrowLeft className="size-3.5" /> Back to Subscription Details
        </Button>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 text-amber-600" />
            <div className="space-y-2">
              <h2 className="text-base font-semibold">Subscription cannot be edited</h2>
              <p className="text-sm text-amber-800">
                Subscription{" "}
                <span className="font-mono font-medium">
                  {existingSub.number ?? `SUB-${String(existingSub.id).padStart(5, "0")}`}
                </span>{" "}
                is currently in{" "}
                <Badge variant="outline" className="border-amber-400 bg-amber-100 font-semibold text-amber-900">
                  {existingSub.status}
                </Badge>{" "}
                status. Only subscriptions in <strong>DRAFT</strong> or <strong>QUOTATION</strong> status can be
                modified by staff.
              </p>
              <div className="pt-2">
                <Button
                  size="sm"
                  onClick={() => navigate(`/app/subscriptions/${subId}`)}
                  className="bg-amber-700 text-white hover:bg-amber-800"
                >
                  View Subscription Overview
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate(isEditMode ? `/app/subscriptions/${subId}` : "/app/subscriptions")
            }
            className="size-8 p-0 text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {isEditMode
                  ? `Edit Subscription ${existingSub?.number ?? `SUB-${String(subId).padStart(5, "0")}`}`
                  : "New Subscription"}
              </h1>
              {isEditMode && existingSub && (
                <SubscriptionStatusBadge status={existingSub.status} />
              )}
            </div>
            <p className="text-xs text-slate-500">
              {isEditMode
                ? "Update subscription terms, customer plan, and line items."
                : "Create a subscription draft with recurring terms and order items."}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(isEditMode ? `/app/subscriptions/${subId}` : "/app/subscriptions")
            }
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
            {isEditMode ? "Save Changes" : "Save as Draft"}
          </Button>
        </div>
      </div>

      {/* Validation Errors Summary Banner */}
      {formErrors.length > 0 && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="size-4 text-rose-600" />
            Please fix the following errors:
          </div>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-rose-700">
            {formErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Customer & Plan Selection */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              1. Customer & Plan
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Assign the customer account and primary recurring billing plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {/* Optional Quotation Template Pre-filler (only in Create mode) */}
            {!isEditMode && templates.length > 0 && (
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-indigo-900">
                    <Sparkles className="size-4 text-indigo-600" />
                    <span>Quick-fill from Quotation Template:</span>
                  </div>
                  <select
                    className="h-8 max-w-xs rounded-md border border-indigo-200 bg-white px-2.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400"
                    value={selectedTemplateId}
                    onChange={(e) => handleTemplateChange(Number(e.target.value))}
                  >
                    <option value={0}>-- Select a Template (Optional) --</option>
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name} ({tpl.plan?.name ?? "Plan"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Customer Dropdown */}
              <div className="space-y-1.5">
                <Label htmlFor="customer-select" className="text-xs font-medium text-slate-700">
                  Customer <span className="text-rose-500">*</span>
                </Label>
                {isCustomersLoading ? (
                  <Skeleton className="h-9 w-full rounded-lg" />
                ) : (
                  <select
                    id="customer-select"
                    className={nativeSelectClass}
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                  >
                    <option value={0}>-- Select Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ""} - {c.email}
                      </option>
                    ))}
                  </select>
                )}

                {/* Selected Customer Preview Pill */}
                {selectedCustomer && (
                  <div className="flex items-center gap-2 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                    <User className="size-3.5 text-slate-400" />
                    <span className="font-medium text-slate-800">{selectedCustomer.name}</span>
                    <span className="text-slate-400">&bull;</span>
                    <span>{selectedCustomer.email}</span>
                    {selectedCustomer.company && (
                      <>
                        <span className="text-slate-400">&bull;</span>
                        <span className="text-slate-500">{selectedCustomer.company}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Plan Dropdown */}
              <div className="space-y-1.5">
                <Label htmlFor="plan-select" className="text-xs font-medium text-slate-700">
                  Subscription Plan <span className="text-rose-500">*</span>
                </Label>
                {isPlansLoading ? (
                  <Skeleton className="h-9 w-full rounded-lg" />
                ) : (
                  <select
                    id="plan-select"
                    className={nativeSelectClass}
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(Number(e.target.value))}
                  >
                    <option value={0}>-- Select Plan --</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.billingPeriod}) - {formatMoney(Number(p.price))}
                      </option>
                    ))}
                  </select>
                )}

                {/* Selected Plan Details Banner */}
                {selectedPlan && (
                  <div className="flex flex-wrap items-center gap-2 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                    <Layers className="size-3.5 text-indigo-500" />
                    <span className="font-medium text-slate-800">{selectedPlan.name}</span>
                    <span className="text-slate-400">&bull;</span>
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                      {selectedPlan.billingPeriod}
                    </Badge>
                    <span className="text-slate-400">&bull;</span>
                    <span>Base {formatMoney(Number(selectedPlan.price))}</span>
                    {selectedPlan.minQuantity > 1 && (
                      <>
                        <span className="text-slate-400">&bull;</span>
                        <span className="text-amber-700">
                          Min. Qty: {selectedPlan.minQuantity}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: Subscription Terms & Dates */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              2. Subscription Terms & Schedule
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Configure activation dates, billing period terms, and optional payment conditions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Start Date */}
              <div className="space-y-1.5">
                <Label htmlFor="start-date" className="text-xs font-medium text-slate-700">
                  Start Date <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div className="space-y-1.5">
                <Label htmlFor="expiry-date" className="text-xs font-medium text-slate-700">
                  Expiry Date <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <Input
                  id="expiry-date"
                  type="date"
                  value={expiryDate}
                  min={startDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Payment Terms */}
              <div className="space-y-1.5">
                <Label htmlFor="payment-terms" className="text-xs font-medium text-slate-700">
                  Payment Terms
                </Label>
                <select
                  id="payment-terms"
                  className={nativeSelectClass}
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)}
                >
                  {PAYMENT_TERMS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5 pt-1">
              <Label htmlFor="sub-notes" className="text-xs font-medium text-slate-700">
                Notes & Terms Summary
              </Label>
              <Textarea
                id="sub-notes"
                rows={2}
                placeholder="Specific customer agreement details, quotation terms, or internal notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: Dynamic Order Lines */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                3. Order Line Items
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Specify subscription items, quantities, and price overrides.
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
              Add Line Item
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
                  const lineTotal = line.quantity * line.unitPrice;

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
                      <div className="w-full sm:w-24 space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 sm:hidden">
                          Quantity
                        </Label>
                        <Input
                          type="number"
                          min={selectedPlan?.minQuantity || 1}
                          value={line.quantity}
                          onChange={(e) =>
                            handleQuantityChange(index, parseInt(e.target.value, 10))
                          }
                          className="h-9 text-right text-xs"
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="w-full sm:w-32 space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600 sm:hidden">
                          Unit Price
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.unitPrice}
                          onChange={(e) =>
                            handleUnitPriceChange(index, parseFloat(e.target.value))
                          }
                          className="h-9 text-right text-xs"
                        />
                      </div>

                      {/* Line Subtotal */}
                      <div className="w-full sm:w-28 text-right font-medium text-slate-800 text-sm">
                        <span className="text-[11px] font-normal text-slate-400 sm:hidden mr-2">
                          Subtotal:
                        </span>
                        {formatMoney(lineTotal)}
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
                          title="Remove line"
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

        {/* SECTION 4: Live Financial Summary */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Information & Billing Advice Note */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-start gap-3 text-xs text-slate-600">
              <Info className="size-4 shrink-0 text-indigo-500 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-slate-800">Sequential Lifecycle Flow</p>
                <p>
                  Subscriptions are initially saved in <strong>DRAFT</strong> status. Once created, you
                  can send an official Quotation to the customer, confirm their order, and activate
                  automated recurring billing cycles.
                </p>
                <p className="text-[11px] text-slate-400 pt-1">
                  Sequential numbers (e.g. <code>SUB-00001</code>) and next recurring invoice dates are
                  assigned and calculated automatically by the server.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Totals Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold tracking-wide uppercase text-slate-500">
              Order Financial Summary
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Lines Subtotal</span>
                <span className="font-medium text-slate-900">{formatMoney(subtotal)}</span>
              </div>
              {estimatedTax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Estimated Taxes</span>
                  <span className="font-medium text-slate-900">{formatMoney(estimatedTax)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline text-sm">
                <span className="font-bold text-slate-900">Grand Total</span>
                <span className="text-lg font-bold text-indigo-600">
                  {formatMoney(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate(isEditMode ? `/app/subscriptions/${subId}` : "/app/subscriptions")
            }
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
            {isEditMode ? "Save Changes" : "Save as Draft"}
          </Button>
        </div>
      </form>
    </div>
  );
}
