import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { AppError } from "../../lib/app-error";
import {
  portalSubscriptionQuerySchema,
  portalSubscriptionIdParamSchema,
  portalSubscribeSchema,
  portalCloseSubscriptionSchema,
  portalLifecycleNotesSchema,
  portalAcceptQuotationSchema,
} from "./portal-subscriptions.schema";
import {
  getPortalSubscriptions,
  getPortalSubscriptionById,
  portalSubscribe,
  portalAcceptQuotation,
  portalPauseSubscription,
  portalResumeSubscription,
  portalCloseSubscription,
  portalRenewSubscription,
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

/**
 * POST /api/portal/subscriptions/subscribe
 * Customer self-service subscription creation and checkout.
 */
export const portalSubscribeController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const validatedData = portalSubscribeSchema.parse(req.body);
    const subscription = await portalSubscribe(req.user.id, validatedData);
    res.status(201).json({ data: subscription });
  }
);

/**
 * POST /api/portal/subscriptions/:id/accept
 * Customer accepts an official quotation assigned to them.
 * Transitions QUOTATION -> CONFIRMED.
 */
export const portalAcceptQuotationController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const { id } = portalSubscriptionIdParamSchema.parse(req.params);
    const { notes } = portalAcceptQuotationSchema.parse(req.body || {});
    const subscription = await portalAcceptQuotation(req.user.id, id, notes);
    res.status(200).json({ data: subscription });
  }
);

/**
 * POST /api/portal/subscriptions/:id/pause
 * Customer pauses an active subscription.
 */
export const portalPauseSubscriptionController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const { id } = portalSubscriptionIdParamSchema.parse(req.params);
    const { notes } = portalLifecycleNotesSchema.parse(req.body || {});
    const subscription = await portalPauseSubscription(req.user.id, id, notes);
    res.status(200).json({ data: subscription });
  }
);

/**
 * POST /api/portal/subscriptions/:id/resume
 * Customer resumes a paused subscription.
 */
export const portalResumeSubscriptionController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const { id } = portalSubscriptionIdParamSchema.parse(req.params);
    const { notes } = portalLifecycleNotesSchema.parse(req.body || {});
    const subscription = await portalResumeSubscription(req.user.id, id, notes);
    res.status(200).json({ data: subscription });
  }
);

/**
 * POST /api/portal/subscriptions/:id/close
 * Customer cancels/closes a subscription.
 */
export const portalCloseSubscriptionController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const { id } = portalSubscriptionIdParamSchema.parse(req.params);
    const { reason } = portalCloseSubscriptionSchema.parse(req.body);
    const subscription = await portalCloseSubscription(req.user.id, id, reason);
    res.status(200).json({ data: subscription });
  }
);

/**
 * POST /api/portal/subscriptions/:id/renew
 * Customer renews an active or closed subscription.
 */
export const portalRenewSubscriptionController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const { id } = portalSubscriptionIdParamSchema.parse(req.params);
    const { notes } = portalLifecycleNotesSchema.parse(req.body || {});
    const subscription = await portalRenewSubscription(req.user.id, id, notes);
    res.status(200).json({ data: subscription });
  }
);



