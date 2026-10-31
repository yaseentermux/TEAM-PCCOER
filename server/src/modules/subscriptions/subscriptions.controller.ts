import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { autoCloseExpiredSubscriptions } from "../../jobs/subscriptions.jobs";
import {
  createSubscription,
  createSubscriptionFromTemplate,
  getSubscriptions,
  getSubscriptionById,
  updateSubscription,
  sendQuotation,
  confirmSubscription,
  activateSubscription,
  pauseSubscription,
  resumeSubscription,
  closeSubscription,
  renewSubscription,
} from "./subscriptions.service";
import {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  subscriptionQuerySchema,
  subscriptionIdParamSchema,
  createFromTemplateParamSchema,
  createFromTemplateBodySchema,
  sendQuotationSchema,
  closeSubscriptionSchema,
} from "./subscriptions.schema";

/**
 * POST /api/subscriptions
 * Creates a new subscription in DRAFT status.
 */
export const createSubscriptionController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const validatedData = createSubscriptionSchema.parse(req.body);
    const subscription = await createSubscription(validatedData, req.user?.id);
    res.status(201).json({ data: subscription });
  }
);

/**
 * POST /api/subscriptions/from-template/:templateId
 * Creates a subscription pre-populated from a quotation template.
 */
export const createSubscriptionFromTemplateController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { templateId } = createFromTemplateParamSchema.parse(req.params);
    const validatedBody = createFromTemplateBodySchema.parse(req.body);
    const subscription = await createSubscriptionFromTemplate(
      templateId,
      validatedBody,
      req.user?.id
    );
    res.status(201).json({ data: subscription });
  }
);

/**
 * GET /api/subscriptions
 * Retrieves paginated subscriptions with status, customer, plan, and search filters.
 */
export const getSubscriptionsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const query = subscriptionQuerySchema.parse(req.query);
    const result = await getSubscriptions(query);
    res.status(200).json(result);
  }
);

/**
 * GET /api/subscriptions/:id
 * Retrieves a single subscription with lines, plan, customer, events, and invoices.
 */
export const getSubscriptionByIdController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = subscriptionIdParamSchema.parse(req.params);
    const subscription = await getSubscriptionById(id);
    res.status(200).json({ data: subscription });
  }
);

/**
 * PATCH /api/subscriptions/:id
 * Updates subscription details (strictly allowed only in DRAFT or QUOTATION status).
 */
export const updateSubscriptionController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = subscriptionIdParamSchema.parse(req.params);
    const validatedData = updateSubscriptionSchema.parse(req.body);
    const subscription = await updateSubscription(id, validatedData);
    res.status(200).json({ data: subscription });
  }
);

// ============================================================================
// LIFECYCLE TRANSITION CONTROLLERS
// ============================================================================

/**
 * POST /api/subscriptions/:id/send-quotation
 * Transitions DRAFT -> QUOTATION
 */
export const sendQuotationController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = subscriptionIdParamSchema.parse(req.params);
    const { notes } = sendQuotationSchema.parse(req.body);
    const subscription = await sendQuotation(id, notes, req.user?.id);
    res.status(200).json({ data: subscription });
  }
);

/**
 * POST /api/subscriptions/:id/confirm
 * Transitions QUOTATION -> CONFIRMED
 */
export const confirmSubscriptionController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = subscriptionIdParamSchema.parse(req.params);
    const notes = typeof req.body?.notes === "string" ? req.body.notes.trim() : undefined;
    const subscription = await confirmSubscription(id, notes, req.user?.id);
    res.status(200).json({ data: subscription });
  }
);

/**
 * POST /api/subscriptions/:id/activate
 * Transitions CONFIRMED -> ACTIVE
 */
export const activateSubscriptionController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = subscriptionIdParamSchema.parse(req.params);
    const notes = typeof req.body?.notes === "string" ? req.body.notes.trim() : undefined;
    const subscription = await activateSubscription(id, notes, req.user?.id);
    res.status(200).json({ data: subscription });
  }
);

/**
 * POST /api/subscriptions/:id/pause
 * Transitions ACTIVE -> PAUSED
 */
export const pauseSubscriptionController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = subscriptionIdParamSchema.parse(req.params);
    const notes = typeof req.body?.notes === "string" ? req.body.notes.trim() : undefined;
    const subscription = await pauseSubscription(id, notes, req.user?.id);
    res.status(200).json({ data: subscription });
  }
);

/**
 * POST /api/subscriptions/:id/resume
 * Transitions PAUSED -> ACTIVE
 */
export const resumeSubscriptionController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = subscriptionIdParamSchema.parse(req.params);
    const notes = typeof req.body?.notes === "string" ? req.body.notes.trim() : undefined;
    const subscription = await resumeSubscription(id, notes, req.user?.id);
    res.status(200).json({ data: subscription });
  }
);

/**
 * POST /api/subscriptions/:id/close
 * Transitions ACTIVE / PAUSED / QUOTATION -> CLOSED
 */
export const closeSubscriptionController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = subscriptionIdParamSchema.parse(req.params);
    const { reason } = closeSubscriptionSchema.parse(req.body);
    const subscription = await closeSubscription(id, reason, req.user?.id);
    res.status(200).json({ data: subscription });
  }
);

/**
 * POST /api/subscriptions/:id/renew
 * Transitions CLOSED / ACTIVE -> ACTIVE
 */
export const renewSubscriptionController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = subscriptionIdParamSchema.parse(req.params);
    const notes = typeof req.body?.notes === "string" ? req.body.notes.trim() : undefined;
    const subscription = await renewSubscription(id, notes, req.user?.id);
    res.status(200).json({ data: subscription });
  }
);


// ============================================================================
// ADMIN JOB CONTROLLERS
// ============================================================================

/**
 * POST /api/subscriptions/jobs/auto-close
 * Manually triggers the auto-close expired subscriptions job (ADMIN only).
 */
export const autoCloseController = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const result = await autoCloseExpiredSubscriptions();
    res.status(200).json({ data: result });
  }
);
