import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/app-error';
import { Prisma } from '@prisma/client';

export type DiscountState = 'SCHEDULED' | 'ACTIVE' | 'EXPIRED' | 'EXHAUSTED' | 'INACTIVE';

export function computeDiscountState(discount: {
  isActive: boolean;
  startDate: Date;
  endDate: Date | null;
  usageLimit: number | null;
  usedCount: number;
}): DiscountState {
  if (!discount.isActive) return 'INACTIVE';
  const now = new Date();
  if (discount.usageLimit !== null && discount.usedCount >= discount.usageLimit) {
    return 'EXHAUSTED';
  }
  if (now < new Date(discount.startDate)) {
    return 'SCHEDULED';
  }
  if (discount.endDate && now > new Date(discount.endDate)) {
    return 'EXPIRED';
  }
  return 'ACTIVE';
}

export class DiscountsService {
  static async list(query: { state?: DiscountState; scope?: any }) {
    const discounts = await prisma.discount.findMany({
      where: {
        ...(query.scope ? { scope: query.scope } : {}),
      },
      include: {
        products: {
          select: { id: true, name: true },
        },
      },
      orderBy: { id: 'desc' },
    });

    const enriched = discounts.map((d) => ({
      ...d,
      value: Number(d.value),
      minPurchase: d.minPurchase ? Number(d.minPurchase) : null,
      computedState: computeDiscountState(d),
    }));

    if (query.state) {
      return enriched.filter((d) => d.computedState === query.state);
    }

    return enriched;
  }

  static async getById(id: number) {
    const discount = await prisma.discount.findUnique({
      where: { id },
      include: { products: true },
    });
    if (!discount) throw new AppError('Discount not found', 404);

    return {
      ...discount,
      value: Number(discount.value),
      minPurchase: discount.minPurchase ? Number(discount.minPurchase) : null,
      computedState: computeDiscountState(discount),
    };
  }

  static async create(data: any) {
    const { productIds = [], ...rest } = data;
    const discount = await prisma.discount.create({
      data: {
        ...rest,
        value: new Prisma.Decimal(rest.value),
        minPurchase: rest.minPurchase ? new Prisma.Decimal(rest.minPurchase) : null,
        startDate: new Date(rest.startDate),
        endDate: rest.endDate ? new Date(rest.endDate) : null,
        products: {
          connect: productIds.map((pid: number) => ({ id: pid })),
        },
      },
      include: { products: true },
    });

    return {
      ...discount,
      value: Number(discount.value),
      minPurchase: discount.minPurchase ? Number(discount.minPurchase) : null,
      computedState: computeDiscountState(discount),
    };
  }

  static async update(id: number, data: any) {
    const { productIds, ...rest } = data;
    const updateData: any = { ...rest };
    if (rest.value !== undefined) updateData.value = new Prisma.Decimal(rest.value);
    if (rest.minPurchase !== undefined) updateData.minPurchase = rest.minPurchase ? new Prisma.Decimal(rest.minPurchase) : null;
    if (rest.startDate) updateData.startDate = new Date(rest.startDate);
    if (rest.endDate !== undefined) updateData.endDate = rest.endDate ? new Date(rest.endDate) : null;
    if (productIds !== undefined) {
      updateData.products = { set: productIds.map((pid: number) => ({ id: pid })) };
    }

    const discount = await prisma.discount.update({
      where: { id },
      data: updateData,
      include: { products: true },
    });

    return {
      ...discount,
      value: Number(discount.value),
      minPurchase: discount.minPurchase ? Number(discount.minPurchase) : null,
      computedState: computeDiscountState(discount),
    };
  }

  static async delete(id: number) {
    await prisma.discount.delete({ where: { id } });
    return { message: 'Discount deleted successfully' };
  }
}
