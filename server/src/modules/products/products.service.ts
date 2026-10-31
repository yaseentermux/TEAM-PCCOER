import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/app-error';
import { Prisma } from '@prisma/client';

export class ProductsService {
  static async list(query: { page?: number; limit?: number; search?: string; type?: any; active?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }
    if (query.type) {
      where.type = query.type;
    }
    if (query.active !== undefined) {
      where.isActive = query.active === 'true';
    }

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          variants: true,
          taxes: true,
          _count: {
            select: { variants: true },
          },
        },
      }),
    ]);

    const data = items.map((p) => ({
      ...p,
      salesPrice: Number(p.salesPrice),
      costPrice: Number(p.costPrice),
      marginPercent: Number(p.salesPrice) > 0 
        ? Math.round(((Number(p.salesPrice) - Number(p.costPrice)) / Number(p.salesPrice)) * 100) 
        : 0,
      variantsCount: p._count.variants,
      variants: p.variants.map((v) => ({
        ...v,
        extraPrice: Number(v.extraPrice),
        finalPrice: Number(p.salesPrice) + Number(v.extraPrice),
      })),
    }));

    return { data, meta: { page, limit, total } };
  }

  static async getById(id: number) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        taxes: true,
      },
    });

    if (!product) throw new AppError('Product not found', 404);

    return {
      ...product,
      salesPrice: Number(product.salesPrice),
      costPrice: Number(product.costPrice),
      variants: product.variants.map((v) => ({
        ...v,
        extraPrice: Number(v.extraPrice),
        finalPrice: Number(product.salesPrice) + Number(v.extraPrice),
      })),
    };
  }

  static async create(data: { name: string; type?: any; salesPrice: number; costPrice?: number; notes?: string | null; taxIds?: number[] }) {
    const { taxIds = [], ...rest } = data;
    const product = await prisma.product.create({
      data: {
        ...rest,
        salesPrice: new Prisma.Decimal(rest.salesPrice),
        costPrice: new Prisma.Decimal(rest.costPrice || 0),
        taxes: {
          connect: taxIds.map((id) => ({ id })),
        },
      },
      include: {
        variants: true,
        taxes: true,
      },
    });

    return {
      ...product,
      salesPrice: Number(product.salesPrice),
      costPrice: Number(product.costPrice),
    };
  }

  static async update(id: number, data: any) {
    const { taxIds, ...rest } = data;
    const updateData: Prisma.ProductUpdateInput = { ...rest };

    if (rest.salesPrice !== undefined) updateData.salesPrice = new Prisma.Decimal(rest.salesPrice);
    if (rest.costPrice !== undefined) updateData.costPrice = new Prisma.Decimal(rest.costPrice);
    if (taxIds !== undefined) {
      updateData.taxes = { set: taxIds.map((tid: number) => ({ id: tid })) };
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { variants: true, taxes: true },
    });

    return {
      ...updated,
      salesPrice: Number(updated.salesPrice),
      costPrice: Number(updated.costPrice),
    };
  }

  static async delete(id: number) {
    const subLinesCount = await prisma.subscriptionLine.count({
      where: { productId: id },
    });

    if (subLinesCount > 0) {
      await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
      return { message: 'Product is linked to subscriptions; marked as inactive.' };
    }

    await prisma.product.delete({ where: { id } });
    return { message: 'Product deleted successfully.' };
  }

  static async addVariant(productId: number, data: { attribute: string; value: string; extraPrice?: number }) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError('Product not found', 404);

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        attribute: data.attribute,
        value: data.value,
        extraPrice: new Prisma.Decimal(data.extraPrice || 0),
      },
    });

    return {
      ...variant,
      extraPrice: Number(variant.extraPrice),
      finalPrice: Number(product.salesPrice) + Number(variant.extraPrice),
    };
  }

  static async updateVariant(productId: number, variantId: number, data: any) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError('Product not found', 404);

    const updateData: any = { ...data };
    if (data.extraPrice !== undefined) {
      updateData.extraPrice = new Prisma.Decimal(data.extraPrice);
    }

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: updateData,
    });

    return {
      ...variant,
      extraPrice: Number(variant.extraPrice),
      finalPrice: Number(product.salesPrice) + Number(variant.extraPrice),
    };
  }

  static async deleteVariant(productId: number, variantId: number) {
    await prisma.productVariant.delete({
      where: { id: variantId },
    });
    return { message: 'Variant deleted successfully' };
  }
}
