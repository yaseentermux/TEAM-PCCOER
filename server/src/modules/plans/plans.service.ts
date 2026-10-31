import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/app-error';
import { Prisma } from '@prisma/client';

export class PlansService {
  static async list() {
    const plans = await prisma.plan.findMany({
      orderBy: { id: 'asc' },
    });

    const today = new Date();
    return plans.map((plan) => {
      let availabilityState: 'Available' | 'Upcoming' | 'Ended' = 'Available';
      if (plan.startDate && new Date(plan.startDate) > today) {
        availabilityState = 'Upcoming';
      } else if (plan.endDate && new Date(plan.endDate) < today) {
        availabilityState = 'Ended';
      } else if (!plan.isActive) {
        availabilityState = 'Ended';
      }

      return {
        ...plan,
        price: Number(plan.price),
        availabilityState,
      };
    });
  }

  static async getAvailable() {
    const today = new Date();
    const plans = await prisma.plan.findMany({
      where: {
        isActive: true,
        startDate: { lte: today },
        OR: [
          { endDate: null },
          { endDate: { gte: today } },
        ],
      },
      orderBy: { price: 'asc' },
    });

    return plans.map((p) => ({
      ...p,
      price: Number(p.price),
    }));
  }

  static async getById(id: number) {
    const plan = await prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new AppError('Plan not found', 404);
    return {
      ...plan,
      price: Number(plan.price),
    };
  }

  static async create(data: any) {
    const plan = await prisma.plan.create({
      data: {
        ...data,
        price: new Prisma.Decimal(data.price || 0),
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
    return { ...plan, price: Number(plan.price) };
  }

  static async update(id: number, data: any) {
    const updateData: any = { ...data };
    if (data.price !== undefined) updateData.price = new Prisma.Decimal(data.price);
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;

    const plan = await prisma.plan.update({
      where: { id },
      data: updateData,
    });
    return { ...plan, price: Number(plan.price) };
  }

  static async delete(id: number) {
    const subCount = await prisma.subscription.count({
      where: { planId: id },
    });

    if (subCount > 0) {
      await prisma.plan.update({
        where: { id },
        data: { isActive: false },
      });
      return { message: 'Plan has subscriptions; deactivated instead of deletion.' };
    }

    await prisma.plan.delete({ where: { id } });
    return { message: 'Plan deleted successfully' };
  }
}
