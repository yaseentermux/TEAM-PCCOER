import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { AppError } from "../../lib/app-error";
import {
  portalSubscriptionQuerySchema,
  portalSubscriptionIdParamSchema,
} from "./portal-subscriptions.schema";
import {
  getPortalSubscriptions,
  getPortalSubscriptionById,
} from "./portal-subscriptions.service";

/**
 * GET /api/portal/subscriptions
 * Retrieves paginated list of subscriptions for the authenticated customer.
 */
export const getPortalSubscriptionsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const query = portalSubscriptionQuerySchema.parse(req.query);
    const result = await getPortalSubscriptions(req.user.id, query);
    res.status(200).json(result);
  }
);

/**
 * GET /api/portal/subscriptions/:id
 * Retrieves detailed subscription information for a specific subscription owned by the authenticated customer.
 */
export const getPortalSubscriptionByIdController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const { id } = portalSubscriptionIdParamSchema.parse(req.params);
    const subscription = await getPortalSubscriptionById(req.user.id, id);
    res.status(200).json({ data: subscription });
  }
);

