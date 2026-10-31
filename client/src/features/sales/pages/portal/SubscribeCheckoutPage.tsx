import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  Info,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  usePlans,
  useProducts,
  useQuotationTemplates,
  useSubscriptions,
  usePortalSubscribe,
} from "../../api";
import type { PlanRef, ProductRef, PortalSubscriptionLineInput } from "../../types";

interface CheckoutLineItem {
  id: string; // client temporary key
  productId: number;
  variantId: number | null;
  quantity: number;
}

const nativeSelectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

export default function SubscribeCheckoutPage() {
  const navigate = useNavigate();

  // Queries
  const { data: apiPlans = [], isLoading: isPlansLoading } = usePlans();
  const { data: apiProducts = [], isLoading: isProductsLoading } = useProducts();
  const { data: templates = [] } = useQuotationTemplates();
  const { data: recentSubsData } = useSubscriptions({ limit: 50 });

  // Mutation
  const subscribeMutation = usePortalSubscribe();
  const isSubmitting = subscribeMutation.isPending;

  // Fallback options
  const plans = useMemo(() => {
    if (apiPlans.length > 0) return apiPlans;
    const map = new Map<number, PlanRef>();
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
  }, [apiPlans, templates, recentSubsData]);

  const products = useMemo(() => {
    if (apiProducts.length > 0) return apiProducts;
    const map = new Map<number, ProductRef>();
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
  }, [apiProducts, templates, recentSubsData]);

  // Form State
  const [selectedPlanId, setSelectedPlanId] = useState<number>(0);
  const [lines, setLines] = useState<CheckoutLineItem[]>([
    {
      id: "line-1",
      productId: 0,
      variantId: null,
      quantity: 1,
    },
  ]);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Auto-select first plan when available
  useEffect(() => {
    if (plans.length > 0 && selectedPlanId === 0) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  // Auto-select first product when available
  useEffect(() => {
    if (products.length > 0 && lines.length === 1 && lines[0].productId === 0) {
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
  }, [products, lines]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

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
      toast.warning("Your subscription package must include at least one item");
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

  // Pricing calculations (live estimate based on catalog)
  const lineDetails = useMemo(() => {
    return lines.map((l) => {
      const product = products.find((p) => p.id === l.productId);
      const variant = product?.variants?.find((v) => v.id === l.variantId);
      const basePrice = product ? Number(product.salesPrice) : 0;
      const extraPrice = variant ? Number(variant.extraPrice) : 0;
      const unitPrice = basePrice + extraPrice;
      const subtotal = l.quantity * unitPrice;
      return {
        ...l,
        product,
        variant,
        unitPrice,
        subtotal,
      };
    });
  }, [lines, products]);

  const linesSubtotal = lineDetails.reduce((acc, l) => acc + l.subtotal, 0);
  const planBasePrice = selectedPlan ? Number(selectedPlan.price) : 0;
  const grandTotal = linesSubtotal > 0 ? linesSubtotal : planBasePrice;

  // Validation
  const validate = (): boolean => {
    const errors: string[] = [];

    if (!selectedPlanId || selectedPlanId <= 0) {
      errors.push("Please select a subscription service plan");
    }

    if (lines.length === 0) {
      errors.push("Please select at least one product line item");
    }

    lines.forEach((l, idx) => {
      if (!l.productId || l.productId <= 0) {
        errors.push(`Line #${idx + 1}: Please select a product`);
      }
      if (!l.quantity || l.quantity < 1) {
        errors.push(`Line #${idx + 1}: Quantity must be at least 1`);
      }
      if (selectedPlan && l.quantity < selectedPlan.minQuantity) {
        errors.push(
          `Line #${idx + 1}: Quantity must meet the plan minimum of ${selectedPlan.minQuantity}`
        );
      }
    });

    setFormErrors(errors);
    return errors.length === 0;
  };

  // Submit Handler
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please resolve validation errors before continuing");
      return;
    }

    const payloadLines: PortalSubscriptionLineInput[] = lines.map((l) => ({
      productId: Number(l.productId),
      variantId: l.variantId ? Number(l.variantId) : null,
      quantity: Number(l.quantity),
    }));

    subscribeMutation.mutate(
      {
        planId: Number(selectedPlanId),
        lines: payloadLines,
      },
      {
        onSuccess: (sub) => {
          navigate(`/portal/subscriptions/${sub.id}`);
        },
      }
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 mb-1">
          <Sparkles className="size-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Self-Service Checkout
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Subscribe to a Service Plan
        </h1>
        <p className="text-xs text-slate-500">
          Choose your recurring service tier, customize package addons, and confirm your subscription.
        </p>
      </div>

      {/* Validation Errors Summary */}
      {formErrors.length > 0 && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="size-4 text-rose-600" />
            Please fix the following:
          </div>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-rose-700">
            {formErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleCheckout} className="space-y-6">
        {/* STEP 1: Available Plans Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                1
              </span>
              Select Your Plan
            </h2>
            <span className="text-xs text-slate-500">
              {plans.length} available service tier(s)
            </span>
          </div>

          {isPlansLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {plans.map((p) => {
                const isSelected = selectedPlanId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    className={cn(
                      "relative cursor-pointer rounded-xl border p-4 transition-all",
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{p.name}</h3>
                          <Badge
                            variant={isSelected ? "default" : "outline"}
                            className={cn(
                              "text-[10px] uppercase font-semibold",
                              isSelected && "bg-indigo-600"
                            )}
                          >
                            {p.billingPeriod}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          Billed on a {p.billingPeriod.toLowerCase()} recurring schedule
                        </p>
                      </div>

                      <div
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border",
                          isSelected
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-slate-300 bg-white"
                        )}
                      >
                        {isSelected && <Check className="size-3.5" />}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between text-xs">
                      <span className="text-slate-500">Base Commitment</span>
                      <span className="text-base font-bold text-slate-900">
                        {formatMoney(Number(p.price))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* STEP 2: Configure Package & Addons */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                  2
                </span>
                Included Services & Addons
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Configure your licenses, product addons, and user quantities.
              </CardDescription>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLine}
              className="gap-1.5 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            >
              <Plus className="size-3.5" />
              Add Item
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
                {lineDetails.map((line, index) => {
                  const availableVariants = line.product?.variants ?? [];

                  return (
                    <div
                      key={line.id}
                      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3 sm:flex-row sm:items-center"
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
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({formatMoney(Number(p.salesPrice))})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Variant Selector */}
                      {availableVariants.length > 0 && (
                        <div className="w-full sm:w-44 space-y-1">
                          <Label className="text-[11px] font-medium text-slate-600 sm:hidden">
                            Option / Tier
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
                            <option value="">Standard Base</option>
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
                          min={selectedPlan?.minQuantity || 1}
                          value={line.quantity}
                          onChange={(e) =>
                            handleQuantityChange(index, parseInt(e.target.value, 10))
                          }
                          className="h-9 text-right text-xs"
                        />
                      </div>

                      {/* Line Subtotal Preview */}
                      <div className="w-full sm:w-28 text-right text-xs text-slate-700">
                        <span className="text-[11px] text-slate-400 sm:hidden mr-2">Subtotal:</span>
                        <div className="font-semibold text-slate-900">
                          {formatMoney(line.subtotal)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatMoney(line.unitPrice)} ea
                        </div>
                      </div>

                      {/* Remove Line */}
                      <div className="flex justify-end sm:justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLine(index)}
                          disabled={lines.length <= 1}
                          className="size-8 p-0 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                          title="Remove item"
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

        {/* STEP 3: Order Summary & Confirmation Box */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Terms & Security Assurance */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-600" />
              Subscription Terms & Invoicing Schedule
            </h3>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar className="size-3.5 text-slate-400 shrink-0" />
                <span>
                  <strong>Billing Schedule:</strong> Invoices generated automatically on a{" "}
                  <span className="font-semibold text-slate-800">
                    {selectedPlan?.billingPeriod.toLowerCase() ?? "monthly"}
                  </span>{" "}
                  basis.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="size-3.5 text-slate-400 shrink-0" />
                <span>
                  <strong>Payment Terms:</strong> Immediate / Standard customer invoice settlement.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Info className="size-3.5 text-slate-400 shrink-0" />
                <span>
                  <strong>Identity & Ownership:</strong> Registered directly under your customer account.
                </span>
              </div>
            </div>
          </div>

          {/* Checkout Financial Summary */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold tracking-wide uppercase text-slate-500">
              Order Total
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Selected Plan</span>
                <span className="font-medium text-slate-900">
                  {selectedPlan?.name ?? "Base Plan"}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Services & Items</span>
                <span className="font-medium text-slate-900">{formatMoney(linesSubtotal)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline text-sm">
                <span className="font-bold text-slate-900">Total Per Cycle</span>
                <span className="text-xl font-bold text-indigo-600">
                  {formatMoney(grandTotal)}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full gap-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm mt-3"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Confirm & Subscribe
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
