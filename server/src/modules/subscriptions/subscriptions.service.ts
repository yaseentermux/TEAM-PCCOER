import { BillingPeriod, Prisma, Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/app-error";
import {
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  SubscriptionQueryParams,
  CreateFromTemplateBodyInput,
  SubscriptionLineInput,
} from "./subscriptions.schema";

/**
 * Standard sequential numbering format: SUB-00001
 */
export function formatNumber(prefix: string, id: number): string {
  return `${prefix}-${String(id).padStart(5, "0")}`;
}

/**
 * Helper to compute an updated date by extending one plan billing period.
 * Includes month-end clamping (e.g. Jan 31 + 1 month -> Feb 28/29, not March 3).
 */
function addBillingPeriod(baseDate: Date, period: BillingPeriod): Date {
  const d = new Date(baseDate);
  switch (period) {
    case "DAILY":
      d.setDate(d.getDate() + 1);
      break;
    case "WEEKLY":
      d.setDate(d.getDate() + 7);
      break;
    case "MONTHLY": {
      const expectedMonth = (d.getMonth() + 1) % 12;
      d.setMonth(d.getMonth() + 1);
      if (d.getMonth() !== expectedMonth) {
        d.setDate(0);
      }
      break;
    }
    case "YEARLY": {
      const currentMonth = d.getMonth();
      d.setFullYear(d.getFullYear() + 1);
      if (d.getMonth() !== currentMonth) {
        d.setDate(0);
      }
      break;
    }
  }
  return d;
}

/**
 * Complete include specification for Subscription queries.
 */
export const subscriptionInclude = {
  customer: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      company: true,
      address: true,
    },
  },
  salesperson: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  plan: true,
  template: true,
  discount: true,
  lines: {
    include: {
      product: {
        include: {
          taxes: true,
        },
      },
      variant: true,
      taxes: true,
    },
  },
  events: {
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  invoices: {
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.SubscriptionInclude;

interface PreparedLine {
  productId: number;
  variantId: number | null;
  description: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
  amount: Prisma.Decimal;
  taxIds: number[];
}

/**
 * Validates products, variants, and quantities against the plan rules,
 * then computes the unit price and amount for each line item.
 */
async function validateAndPrepareLines(
  lines: SubscriptionLineInput[],
  minQuantity: number,
  tx: Prisma.TransactionClient | typeof prisma = prisma
): Promise<PreparedLine[]> {
  if (lines.length === 0) {
    throw new AppError("Subscription must have at least one line item", 400);
  }

  // 1. Fetch all products and their associated taxes
  const productIds = Array.from(new Set(lines.map((l) => l.productId)));
  const products = await tx.product.findMany({
    where: { id: { in: productIds } },
    include: { taxes: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const pid of productIds) {
    const p = productMap.get(pid);
    if (!p) {
      throw new AppError(`Product with ID ${pid} not found`, 404);
    }
    if (!p.isActive) {
      throw new AppError(`Product "${p.name}" is not active`, 400);
    }
  }

  // 2. Fetch all variants if specified
  const variantIds = lines
    .map((l) => l.variantId)
    .filter((id): id is number => typeof id === "number");

  let variantMap = new Map<number, Prisma.ProductVariantGetPayload<object>>();
  if (variantIds.length > 0) {
    const variants = await tx.productVariant.findMany({
      where: { id: { in: Array.from(new Set(variantIds)) } },
    });
    variantMap = new Map(variants.map((v) => [v.id, v]));
  }

  // 3. Validate each line and compute prices
  const prepared: PreparedLine[] = [];

  for (const line of lines) {
    const product = productMap.get(line.productId)!;

    // Minimum quantity enforcement
    if (line.quantity < minQuantity) {
      throw new AppError(
        `Quantity for "${product.name}" (${line.quantity}) must be at least the plan minimum of ${minQuantity}`,
        400
      );
    }

    let variant: Prisma.ProductVariantGetPayload<object> | null = null;
    if (line.variantId) {
      const v = variantMap.get(line.variantId);
      if (!v) {
        throw new AppError(`Product variant with ID ${line.variantId} not found`, 404);
      }
      if (v.productId !== line.productId) {
        throw new AppError(
          `Variant with ID ${line.variantId} does not belong to product "${product.name}"`,
          400
        );
      }
      variant = v;
    }

    // Default unit price = product.salesPrice + variant.extraPrice
    // Staff may override unitPrice if provided
    const basePrice = Number(product.salesPrice) + (variant ? Number(variant.extraPrice) : 0);
    const unitPriceNum = line.unitPrice !== undefined ? line.unitPrice : basePrice;
    const amountNum = unitPriceNum * line.quantity;

    const description = variant
      ? `${product.name} (${variant.attribute}: ${variant.value})`
      : product.name;

    prepared.push({
      productId: line.productId,
      variantId: line.variantId ?? null,
      description,
      quantity: line.quantity,
      unitPrice: new Prisma.Decimal(unitPriceNum.toFixed(2)),
      amount: new Prisma.Decimal(amountNum.toFixed(2)),
      taxIds: product.taxes.map((t) => t.id),
    });
  }

  return prepared;
}

/**
 * Validates customer existence, role, and active status.
 */
async function validateCustomer(
  customerId: number,
  tx: Prisma.TransactionClient | typeof prisma = prisma
) {
  const customer = await tx.user.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    throw new AppError(`Customer with ID ${customerId} not found`, 404);
  }
  if (customer.role !== Role.CUSTOMER) {
    throw new AppError(`User with ID ${customerId} does not have the CUSTOMER role`, 400);
  }
  if (!customer.isActive) {
    throw new AppError(`Customer "${customer.name}" is inactive`, 400);
  }

  return customer;
}

/**
 * Validates plan existence and active status.
 */
async function validatePlan(
  planId: number,
  tx: Prisma.TransactionClient | typeof prisma = prisma
) {
  const plan = await tx.plan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new AppError(`Plan with ID ${planId} not found`, 404);
  }
  if (!plan.isActive) {
    throw new AppError(`Plan "${plan.name}" is not active`, 400);
  }

  return plan;
}

/**
 * Validates discount existence and active status if specified.
 */
async function validateDiscount(
  discountId?: number | null,
  tx: Prisma.TransactionClient | typeof prisma = prisma
) {
  if (!discountId) return null;

  const discount = await tx.discount.findUnique({
    where: { id: discountId },
  });

  if (!discount) {
    throw new AppError(`Discount with ID ${discountId} not found`, 404);
  }
  if (!discount.isActive) {
    throw new AppError(`Discount "${discount.name}" is not active`, 400);
  }

  return discount;
}

/**
 * Creates a new subscription in DRAFT status.
 * Generates sequential number (SUB-XXXXX) inside a Prisma transaction.
 */
export async function createSubscription(
  data: CreateSubscriptionInput,
  salespersonId?: number
) {
  await validateCustomer(data.customerId);
  const plan = await validatePlan(data.planId);
  await validateDiscount(data.discountId);

  // If a templateId is given, verify it exists
  if (data.templateId) {
    const template = await prisma.quotationTemplate.findUnique({
      where: { id: data.templateId },
    });
    if (!template) {
      throw new AppError(`Quotation template with ID ${data.templateId} not found`, 404);
    }
  }

  const preparedLines = await validateAndPrepareLines(data.lines, plan.minQuantity);

  return await prisma.$transaction(async (tx) => {
    // 1. Create subscription record
    const subscription = await tx.subscription.create({
      data: {
        customerId: data.customerId,
        planId: data.planId,
        templateId: data.templateId ?? null,
        salespersonId: salespersonId ?? null,
        status: "DRAFT",
        startDate: new Date(data.startDate),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        paymentTerms: data.paymentTerms,
        discountId: data.discountId ?? null,
        notes: data.notes ?? null,
        lines: {
          create: preparedLines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            amount: l.amount,
            taxes: l.taxIds.length > 0
              ? { connect: l.taxIds.map((id) => ({ id })) }
              : undefined,
          })),
        },
      },
    });

    // 2. Assign formatted number immediately inside the same transaction
    const formatted = formatNumber("SUB", subscription.id);
    const updated = await tx.subscription.update({
      where: { id: subscription.id },
      data: { number: formatted },
      include: subscriptionInclude,
    });

    // 3. Record creation audit event
    await tx.subscriptionEvent.create({
      data: {
        subscriptionId: subscription.id,
        fromStatus: null,
        toStatus: "DRAFT",
        userId: salespersonId ?? null,
        note: "Subscription created in draft status",
      },
    });

    return updated;
  });
}

/**
 * Creates a subscription populated from a Quotation Template.
 */
export async function createSubscriptionFromTemplate(
  templateId: number,
  data: CreateFromTemplateBodyInput,
  salespersonId?: number
) {
  // 1. Fetch template with its lines, products and taxes
  const template = await prisma.quotationTemplate.findUnique({
    where: { id: templateId },
    include: {
      plan: true,
      lines: {
        include: {
          product: { include: { taxes: true } },
          variant: true,
        },
      },
    },
  });

  if (!template) {
    throw new AppError(`Quotation template with ID ${templateId} not found`, 404);
  }
  if (!template.plan.isActive) {
    throw new AppError(`Plan "${template.plan.name}" associated with this template is not active`, 400);
  }
  if (template.lines.length === 0) {
    throw new AppError("Quotation template contains no lines", 400);
  }

  // 2. Validate customer and optional discount
  await validateCustomer(data.customerId);
  await validateDiscount(data.discountId);

  // 3. Map template lines into subscription line input format
  const lineInputs: SubscriptionLineInput[] = template.lines.map((tl) => ({
    productId: tl.productId,
    variantId: tl.variantId ?? undefined,
    quantity: tl.quantity,
  }));

  const preparedLines = await validateAndPrepareLines(lineInputs, template.plan.minQuantity);

  return await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.create({
      data: {
        customerId: data.customerId,
        planId: template.planId,
        templateId: template.id,
        salespersonId: salespersonId ?? null,
        status: "DRAFT",
        startDate: new Date(data.startDate),
        paymentTerms: data.paymentTerms ?? "IMMEDIATE",
        discountId: data.discountId ?? null,
        notes: data.notes ?? template.notes,
        lines: {
          create: preparedLines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            amount: l.amount,
            taxes: l.taxIds.length > 0
              ? { connect: l.taxIds.map((id) => ({ id })) }
              : undefined,
          })),
        },
      },
    });

    const formatted = formatNumber("SUB", subscription.id);
    const updated = await tx.subscription.update({
      where: { id: subscription.id },
      data: { number: formatted },
      include: subscriptionInclude,
    });

    await tx.subscriptionEvent.create({
      data: {
        subscriptionId: subscription.id,
        fromStatus: null,
        toStatus: "DRAFT",
        userId: salespersonId ?? null,
        note: `Subscription created from template "${template.name}"`,
      },
    });

    return updated;
  });
}

/**
 * Retrieves paginated subscriptions with optional filters.
 */
export async function getSubscriptions(query: SubscriptionQueryParams) {
  const where: Prisma.SubscriptionWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }
  if (query.customerId) {
    where.customerId = query.customerId;
  }
  if (query.planId) {
    where.planId = query.planId;
  }
  if (query.search && query.search.trim().length > 0) {
    const searchTerm = query.search.trim();
    where.OR = [
      { number: { contains: searchTerm, mode: "insensitive" } },
      { customer: { name: { contains: searchTerm, mode: "insensitive" } } },
      { customer: { email: { contains: searchTerm, mode: "insensitive" } } },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const take = query.limit;

  const [total, subscriptions] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.subscription.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        plan: true,
        discount: true,
        lines: {
          include: {
            product: true,
            variant: true,
          },
        },
        _count: {
          select: {
            invoices: true,
            events: true,
          },
        },
      },
    }),
  ]);

  return {
    data: subscriptions,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
    },
  };
}

/**
 * Retrieves a single subscription by ID with all relations.
 */
export async function getSubscriptionById(id: number) {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: subscriptionInclude,
  });

  if (!subscription) {
    throw new AppError(`Subscription with ID ${id} not found`, 404);
  }

  return subscription;
}

/**
 * Updates an existing subscription.
 * Strictly allowed only when status is DRAFT or QUOTATION; returns 409 otherwise.
 */
export async function updateSubscription(
  id: number,
  data: UpdateSubscriptionInput
) {
  // 1. Verify subscription exists and check status
  const existing = await prisma.subscription.findUnique({
    where: { id },
    include: { plan: true },
  });

  if (!existing) {
    throw new AppError(`Subscription with ID ${id} not found`, 404);
  }

  if (existing.status !== "DRAFT" && existing.status !== "QUOTATION") {
    throw new AppError(
      `Cannot update subscription with status "${existing.status}". Only DRAFT and QUOTATION subscriptions can be updated.`,
      409
    );
  }

  // 2. Validate optional updates
  if (data.customerId !== undefined) {
    await validateCustomer(data.customerId);
  }

  let activePlan = existing.plan;
  if (data.planId !== undefined) {
    activePlan = await validatePlan(data.planId);
  }

  if (data.discountId !== undefined) {
    await validateDiscount(data.discountId);
  }

  let preparedLines: PreparedLine[] | null = null;
  if (data.lines !== undefined) {
    preparedLines = await validateAndPrepareLines(data.lines, activePlan.minQuantity);
  }

  // 3. Atomically update within transaction
  return await prisma.$transaction(async (tx) => {
    if (preparedLines !== null) {
      // Delete existing lines
      await tx.subscriptionLine.deleteMany({
        where: { subscriptionId: id },
      });
    }

    return await tx.subscription.update({
      where: { id },
      data: {
        ...(data.customerId !== undefined ? { customerId: data.customerId } : {}),
        ...(data.planId !== undefined ? { planId: data.planId } : {}),
        ...(data.startDate !== undefined ? { startDate: new Date(data.startDate) } : {}),
        ...(data.expiryDate !== undefined
          ? { expiryDate: data.expiryDate ? new Date(data.expiryDate) : null }
          : {}),
        ...(data.paymentTerms !== undefined ? { paymentTerms: data.paymentTerms } : {}),
        ...(data.discountId !== undefined ? { discountId: data.discountId } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(preparedLines !== null
          ? {
              lines: {
                create: preparedLines.map((l) => ({
                  productId: l.productId,
                  variantId: l.variantId,
                  description: l.description,
                  quantity: l.quantity,
                  unitPrice: l.unitPrice,
                  amount: l.amount,
                  taxes: l.taxIds.length > 0
                    ? { connect: l.taxIds.map((taxId) => ({ id: taxId })) }
                    : undefined,
                })),
              },
            }
          : {}),
      },
      include: subscriptionInclude,
    });
  });
}

// ============================================================================
// SUBSCRIPTION LIFECYCLE STATE MACHINE
// ============================================================================

/**
 * 1. DRAFT -> QUOTATION
 * - Require at least one subscription line.
 * - Set quoteValidUntil based on template.validityDays (default 30 days).
 */
export async function sendQuotation(
  id: number,
  notes?: string,
  userId?: number
) {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: {
      template: true,
      lines: true,
    },
  });

  if (!subscription) {
    throw new AppError(`Subscription with ID ${id} not found`, 404);
  }

  if (subscription.status !== "DRAFT") {
    throw new AppError(
      `Cannot send quotation for subscription with status "${subscription.status}". Current status must be DRAFT.`,
      409
    );
  }

  if (subscription.lines.length === 0) {
    throw new AppError("Cannot send quotation for a subscription with no lines", 400);
  }

  const validityDays = subscription.template?.validityDays ?? 30;
  const quoteValidUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.subscription.update({
      where: { id },
      data: {
        status: "QUOTATION",
        quoteValidUntil,
        ...(notes ? { notes } : {}),
      },
      include: subscriptionInclude,
    });

    await tx.subscriptionEvent.create({
      data: {
        subscriptionId: id,
        fromStatus: "DRAFT",
        toStatus: "QUOTATION",
        userId: userId ?? null,
        note: notes ?? `Quotation sent (valid for ${validityDays} days)`,
      },
    });

    return updated;
  });
}

/**
 * 2. QUOTATION -> CONFIRMED
 * - Reject expired quotations.
 * - Allow authorized staff to confirm.
 */
export async function confirmSubscription(
  id: number,
  notes?: string,
  userId?: number
) {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
  });

  if (!subscription) {
    throw new AppError(`Subscription with ID ${id} not found`, 404);
  }

  if (subscription.status !== "QUOTATION") {
    throw new AppError(
      `Cannot confirm subscription with status "${subscription.status}". Current status must be QUOTATION.`,
      409
    );
  }

  if (subscription.quoteValidUntil && new Date(subscription.quoteValidUntil) < new Date()) {
    throw new AppError(
      `Quotation expired on ${subscription.quoteValidUntil.toISOString().split("T")[0]}. Please send an updated quotation.`,
      400
    );
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.subscription.update({
      where: { id },
      data: {
        status: "CONFIRMED",
      },
      include: subscriptionInclude,
    });

    await tx.subscriptionEvent.create({
      data: {
        subscriptionId: id,
        fromStatus: "QUOTATION",
        toStatus: "CONFIRMED",
        userId: userId ?? null,
        note: notes ?? "Quotation confirmed by staff",
      },
    });

    return updated;
  });
}

/**
 * 3. CONFIRMED -> ACTIVE
 * - Set nextInvoiceDate = startDate.
 */
export async function activateSubscription(
  id: number,
  notes?: string,
  userId?: number
) {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
  });

  if (!subscription) {
    throw new AppError(`Subscription with ID ${id} not found`, 404);
  }

  if (subscription.status !== "CONFIRMED") {
    throw new AppError(
      `Cannot activate subscription with status "${subscription.status}". Current status must be CONFIRMED.`,
      409
    );
  }

  // Set nextInvoiceDate = startDate
  const nextInvoiceDate = subscription.startDate;

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.subscription.update({
      where: { id },
      data: {
        status: "ACTIVE",
        nextInvoiceDate,
      },
      include: subscriptionInclude,
    });

    await tx.subscriptionEvent.create({
      data: {
        subscriptionId: id,
        fromStatus: "CONFIRMED",
        toStatus: "ACTIVE",
        userId: userId ?? null,
        note: notes ?? "Subscription activated",
      },
    });

    return updated;
  });
}

/**
 * 4. ACTIVE -> PAUSED
 * - Only if plan.pausable is true.
 */
export async function pauseSubscription(
  id: number,
  notes?: string,
  userId?: number
) {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: { plan: true },
  });

  if (!subscription) {
    throw new AppError(`Subscription with ID ${id} not found`, 404);
  }

  if (subscription.status !== "ACTIVE") {
    throw new AppError(
      `Cannot pause subscription with status "${subscription.status}". Current status must be ACTIVE.`,
      409
    );
  }

  if (!subscription.plan.pausable) {
    throw new AppError(`Plan "${subscription.plan.name}" does not allow pausing`, 400);
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.subscription.update({
      where: { id },
      data: {
        status: "PAUSED",
      },
      include: subscriptionInclude,
    });

    await tx.subscriptionEvent.create({
      data: {
        subscriptionId: id,
        fromStatus: "ACTIVE",
        toStatus: "PAUSED",
        userId: userId ?? null,
        note: notes ?? "Subscription paused",
      },
    });

    return updated;
  });
}

/**
 * 5. PAUSED -> ACTIVE
 * - If nextInvoiceDate is in the past, set it to today.
 * - Do not generate backdated invoices.
 */
export async function resumeSubscription(
  id: number,
  notes?: string,
  userId?: number
) {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
  });

  if (!subscription) {
    throw new AppError(`Subscription with ID ${id} not found`, 404);
  }

  if (subscription.status !== "PAUSED") {
    throw new AppError(
      `Cannot resume subscription with status "${subscription.status}". Current status must be PAUSED.`,
      409
    );
  }

  // If nextInvoiceDate is in the past, reset to today so we do not generate backdated invoices
  const now = new Date();
  let nextInvoiceDate = subscription.nextInvoiceDate;
  if (nextInvoiceDate && new Date(nextInvoiceDate) < now) {
    nextInvoiceDate = now;
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.subscription.update({
      where: { id },
      data: {
        status: "ACTIVE",
        nextInvoiceDate,
      },
      include: subscriptionInclude,
    });

    await tx.subscriptionEvent.create({
      data: {
        subscriptionId: id,
        fromStatus: "PAUSED",
        toStatus: "ACTIVE",
        userId: userId ?? null,
        note: notes ?? "Subscription resumed",
      },
    });

    return updated;
  });
}

/**
 * 6. ACTIVE / PAUSED / QUOTATION -> CLOSED
 * - Check plan.closable for ACTIVE and PAUSED subscriptions.
 * - QUOTATION can always be closed.
 * - Require a closure reason/note.
 */
export async function closeSubscription(
  id: number,
  reason: string,
  userId?: number
) {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: { plan: true },
  });

  if (!subscription) {
    throw new AppError(`Subscription with ID ${id} not found`, 404);
  }

  const allowedStatuses = ["ACTIVE", "PAUSED", "QUOTATION"];
  if (!allowedStatuses.includes(subscription.status)) {
    throw new AppError(
      `Cannot close subscription with status "${subscription.status}". Closing is allowed only from ACTIVE, PAUSED, or QUOTATION.`,
      409
    );
  }

  // Check plan.closable for ACTIVE and PAUSED (QUOTATION can always be closed)
  if (
    (subscription.status === "ACTIVE" || subscription.status === "PAUSED") &&
    !subscription.plan.closable
  ) {
    throw new AppError(`Plan "${subscription.plan.name}" does not allow closing`, 400);
  }

  if (!reason || reason.trim().length < 3) {
    throw new AppError("A cancellation reason of at least 3 characters is required", 400);
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.subscription.update({
      where: { id },
      data: {
        status: "CLOSED",
      },
      include: subscriptionInclude,
    });

    await tx.subscriptionEvent.create({
      data: {
        subscriptionId: id,
        fromStatus: subscription.status,
        toStatus: "CLOSED",
        userId: userId ?? null,
        note: reason.trim(),
      },
    });

    return updated;
  });
}

/**
 * 7. CLOSED / ACTIVE -> ACTIVE (Renewal)
 * - Only if plan.renewable is true.
 * - CLOSED -> ACTIVE starts a fresh period:
 *   - Sets startDate = now (today)
 *   - Sets nextInvoiceDate = now (today, ready for fresh billing)
 *   - Sets expiryDate = addBillingPeriod(now, plan.billingPeriod) (guaranteed valid future date based on plan)
 * - ACTIVE -> ACTIVE extends the existing period:
 *   - Preserves original startDate
 *   - Extends expiryDate by one billing period from current expiryDate (or now if past)
 *   - Ensures nextInvoiceDate is not stuck in the past
 * - Records SubscriptionEvent inside the atomic transaction.
 */
export async function renewSubscription(
  id: number,
  notes?: string,
  userId?: number
) {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: { plan: true },
  });

  if (!subscription) {
    throw new AppError(`Subscription with ID ${id} not found`, 404);
  }

  if (subscription.status !== "CLOSED" && subscription.status !== "ACTIVE") {
    throw new AppError(
      `Cannot renew subscription with status "${subscription.status}". Only CLOSED or ACTIVE subscriptions can be renewed.`,
      409
    );
  }

  if (!subscription.plan.renewable) {
    throw new AppError(`Plan "${subscription.plan.name}" does not allow renewal`, 400);
  }

  const now = new Date();
  let newExpiryDate: Date;
  let newStartDate: Date;
  let newNextInvoiceDate: Date;

  if (subscription.status === "CLOSED") {
    // When reactivating from CLOSED, start a fresh subscription period starting today.
    // Ignores old expired dates from months ago.
    newStartDate = now;
    newNextInvoiceDate = now;
    newExpiryDate = addBillingPeriod(now, subscription.plan.billingPeriod);
  } else {
    // When renewing an ACTIVE subscription, extend expiry from current expiryDate or now
    newStartDate = subscription.startDate;
    const baseDate =
      subscription.expiryDate && new Date(subscription.expiryDate) > now
        ? new Date(subscription.expiryDate)
        : now;
    newExpiryDate = addBillingPeriod(baseDate, subscription.plan.billingPeriod);

    // Keep scheduled next invoice date if in the future; otherwise align to now
    newNextInvoiceDate =
      subscription.nextInvoiceDate && new Date(subscription.nextInvoiceDate) >= now
        ? subscription.nextInvoiceDate
        : now;
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.subscription.update({
      where: { id },
      data: {
        status: "ACTIVE",
        startDate: newStartDate,
        nextInvoiceDate: newNextInvoiceDate,
        expiryDate: newExpiryDate,
      },
      include: subscriptionInclude,
    });

    await tx.subscriptionEvent.create({
      data: {
        subscriptionId: id,
        fromStatus: subscription.status,
        toStatus: "ACTIVE",
        userId: userId ?? null,
        note:
          notes ??
          (subscription.status === "CLOSED"
            ? "Subscription renewed: started fresh period"
            : "Subscription renewed: period extended"),
      },
    });

    return updated;
  });
}
