import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/app-error";
import {
  CreateQuotationTemplateInput,
  UpdateQuotationTemplateInput,
  QuotationTemplateLineInput,
} from "./quotation-templates.schema";

/**
 * Standard include object for quotation templates, ensuring associated
 * plan, lines, products, and variants are retrieved consistently.
 */
const templateInclude = {
  plan: true,
  lines: {
    include: {
      product: true,
      variant: true,
    },
  },
} satisfies Prisma.QuotationTemplateInclude;

/**
 * Validates that all referenced products exist and that any specified variants
 * belong to their corresponding product.
 */
async function validateTemplateLines(
  lines: QuotationTemplateLineInput[],
  tx: Prisma.TransactionClient | typeof prisma = prisma
): Promise<void> {
  if (lines.length === 0) {
    throw new AppError("Quotation template must contain at least one line", 400);
  }

  // 1. Verify all products exist and are active
  const uniqueProductIds = Array.from(new Set(lines.map((l) => l.productId)));
  const products = await tx.product.findMany({
    where: { id: { in: uniqueProductIds } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));
  for (const productId of uniqueProductIds) {
    const product = productMap.get(productId);
    if (!product) {
      throw new AppError(`Product with ID ${productId} not found`, 404);
    }
    if (!product.isActive) {
      throw new AppError(`Product "${product.name}" is not active`, 400);
    }
  }

  // 2. Verify all variants exist and belong to the correct product
  const variantIds = lines
    .map((l) => l.variantId)
    .filter((id): id is number => typeof id === "number");

  if (variantIds.length > 0) {
    const uniqueVariantIds = Array.from(new Set(variantIds));
    const variants = await tx.productVariant.findMany({
      where: { id: { in: uniqueVariantIds } },
    });

    const variantMap = new Map(variants.map((v) => [v.id, v]));
    for (const line of lines) {
      if (line.variantId) {
        const variant = variantMap.get(line.variantId);
        if (!variant) {
          throw new AppError(`Product variant with ID ${line.variantId} not found`, 404);
        }
        if (variant.productId !== line.productId) {
          throw new AppError(
            `Variant with ID ${line.variantId} does not belong to product with ID ${line.productId}`,
            400
          );
        }
      }
    }
  }
}

/**
 * Creates a new quotation template with its product lines inside a transaction.
 */
export async function createQuotationTemplate(data: CreateQuotationTemplateInput) {
  // 1. Verify referenced Plan exists and is active
  const plan = await prisma.plan.findUnique({
    where: { id: data.planId },
  });

  if (!plan) {
    throw new AppError(`Plan with ID ${data.planId} not found`, 404);
  }
  if (!plan.isActive) {
    throw new AppError(`Plan "${plan.name}" is not active`, 400);
  }

  // 2. Validate products and variants
  await validateTemplateLines(data.lines, prisma);

  // 3. Create template and lines atomically inside a transaction
  return await prisma.$transaction(async (tx) => {
    return await tx.quotationTemplate.create({
      data: {
        name: data.name,
        validityDays: data.validityDays,
        planId: data.planId,
        notes: data.notes ?? null,
        lines: {
          create: data.lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId ?? null,
            quantity: line.quantity,
          })),
        },
      },
      include: templateInclude,
    });
  });
}

/**
 * Retrieves all quotation templates with associated plan and line items.
 */
export async function getQuotationTemplates() {
  return await prisma.quotationTemplate.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      ...templateInclude,
      _count: {
        select: {
          subscriptions: true,
        },
      },
    },
  });
}

/**
 * Retrieves a single quotation template by its unique ID.
 */
export async function getQuotationTemplateById(id: number) {
  const template = await prisma.quotationTemplate.findUnique({
    where: { id },
    include: templateInclude,
  });

  if (!template) {
    throw new AppError(`Quotation template with ID ${id} not found`, 404);
  }

  return template;
}

/**
 * Updates a quotation template and safely replaces its lines inside a transaction.
 */
export async function updateQuotationTemplate(
  id: number,
  data: UpdateQuotationTemplateInput
) {
  // 1. Verify template exists
  const existing = await prisma.quotationTemplate.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(`Quotation template with ID ${id} not found`, 404);
  }

  // 2. Verify new plan if provided
  if (data.planId !== undefined) {
    const plan = await prisma.plan.findUnique({
      where: { id: data.planId },
    });
    if (!plan) {
      throw new AppError(`Plan with ID ${data.planId} not found`, 404);
    }
    if (!plan.isActive) {
      throw new AppError(`Plan "${plan.name}" is not active`, 400);
    }
  }

  // 3. Validate lines if provided
  if (data.lines !== undefined) {
    await validateTemplateLines(data.lines, prisma);
  }

  // 4. Execute atomic update inside transaction
  return await prisma.$transaction(async (tx) => {
    // If lines are being updated, delete existing lines first
    if (data.lines !== undefined) {
      await tx.quotationTemplateLine.deleteMany({
        where: { templateId: id },
      });
    }

    return await tx.quotationTemplate.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.validityDays !== undefined ? { validityDays: data.validityDays } : {}),
        ...(data.planId !== undefined ? { planId: data.planId } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.lines !== undefined
          ? {
              lines: {
                create: data.lines.map((line) => ({
                  productId: line.productId,
                  variantId: line.variantId ?? null,
                  quantity: line.quantity,
                })),
              },
            }
          : {}),
      },
      include: templateInclude,
    });
  });
}

/**
 * Deletes a quotation template by ID if it is not associated with existing subscriptions.
 */
export async function deleteQuotationTemplate(id: number) {
  // 1. Verify template exists and check for linked subscriptions
  const template = await prisma.quotationTemplate.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          subscriptions: true,
        },
      },
    },
  });

  if (!template) {
    throw new AppError(`Quotation template with ID ${id} not found`, 404);
  }

  if (template._count.subscriptions > 0) {
    throw new AppError(
      `Cannot delete quotation template because it is associated with ${template._count.subscriptions} subscription(s)`,
      400
    );
  }

  // 2. Delete template (QuotationTemplateLine rows are removed automatically via onDelete: Cascade)
  return await prisma.quotationTemplate.delete({
    where: { id },
    include: templateInclude,
  });
}

