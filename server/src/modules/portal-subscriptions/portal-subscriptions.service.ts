import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/app-error";
import { PortalSubscriptionQueryParams } from "./portal-subscriptions.schema";

/**
 * Relation selection for customer portal subscription detail view.
 * Includes plan, lines (with product and variants), invoices, and lifecycle events.
 */
export const portalSubscriptionDetailInclude = {
  plan: true,
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
    select: {
      id: true,
      fromStatus: true,
      toStatus: true,
      note: true,
      createdAt: true,
    },
  },
  invoices: {
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      number: true,
      status: true,
      invoiceDate: true,
      dueDate: true,
      subtotal: true,
      taxTotal: true,
      total: true,
      amountPaid: true,
      createdAt: true,
    },
  },
} satisfies Prisma.SubscriptionInclude;

/**
 * Relation selection for customer portal subscription list view.
 */
export const portalSubscriptionListInclude = {
  plan: {
    select: {
      id: true,
      name: true,
      billingPeriod: true,
      price: true,
      pausable: true,
      closable: true,
      renewable: true,
    },
  },
  discount: {
    select: {
      id: true,
      name: true,
      type: true,
      value: true,
    },
  },
  lines: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          salesPrice: true,
        },
      },
      variant: {
        select: {
          id: true,
          attribute: true,
          value: true,
          extraPrice: true,
        },
      },
    },
  },
  _count: {
    select: {
      invoices: true,
      events: true,
    },
  },
} satisfies Prisma.SubscriptionInclude;

/**
 * Retrieves paginated subscriptions belonging strictly to the authenticated customer.
 */
export async function getPortalSubscriptions(
  customerId: number,
  query: PortalSubscriptionQueryParams
) {
  const where: Prisma.SubscriptionWhereInput = {
    customerId,
    ...(query.status ? { status: query.status } : {}),
  };

  const skip = (query.page - 1) * query.limit;
  const take = query.limit;

  const [total, subscriptions] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.subscription.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: portalSubscriptionListInclude,
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
 * Retrieves details for a specific subscription belonging strictly to the authenticated customer.
 * Throws 404 if the subscription does not exist or does not belong to the customer.
 */
export async function getPortalSubscriptionById(
  customerId: number,
  subscriptionId: number
) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      id: subscriptionId,
      customerId,
    },
    include: portalSubscriptionDetailInclude,
  });

  if (!subscription) {
    throw new AppError("Subscription not found", 404);
  }

  return subscription;
}
