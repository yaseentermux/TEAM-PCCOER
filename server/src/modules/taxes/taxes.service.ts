import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/app-error';
import { Prisma } from '@prisma/client';

export class TaxesService {
  static async list() {
    const taxes = await prisma.tax.findMany({
      orderBy: { id: 'asc' },
    });
    return taxes.map((t) => ({
      ...t,
      amount: Number(t.amount),
    }));
  }

  static async getById(id: number) {
    const tax = await prisma.tax.findUnique({ where: { id } });
    if (!tax) throw new AppError('Tax not found', 404);
    return { ...tax, amount: Number(tax.amount) };
  }

  static async create(data: { name: string; type: any; amount: number; isActive?: boolean }) {
    const tax = await prisma.tax.create({
      data: {
        ...data,
        amount: new Prisma.Decimal(data.amount),
      },
    });
    return { ...tax, amount: Number(tax.amount) };
  }

  static async update(id: number, data: any) {
    const updateData: any = { ...data };
    if (data.amount !== undefined) updateData.amount = new Prisma.Decimal(data.amount);

    const tax = await prisma.tax.update({
      where: { id },
      data: updateData,
    });
    return { ...tax, amount: Number(tax.amount) };
  }

  static async delete(id: number) {
    await prisma.tax.delete({ where: { id } });
    return { message: 'Tax rule deleted successfully' };
  }
}
