import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  createSubscriptionController,
  createSubscriptionFromTemplateController,
  getSubscriptionsController,
  getSubscriptionStatsController,
  previewSubscriptionPricingController,
  getSubscriptionByIdController,
  updateSubscriptionController,
  sendQuotationController,
  confirmSubscriptionController,
  activateSubscriptionController,
  pauseSubscriptionController,
  resumeSubscriptionController,
  closeSubscriptionController,
  renewSubscriptionController,
  autoCloseController,
} from "./subscriptions.controller";

export const subscriptionsRouter = Router();

// Protect all staff subscription routes
subscriptionsRouter.use(requireAuth, requireRole(Role.ADMIN, Role.INTERNAL));

// Core CRUD routes
subscriptionsRouter.post("/", createSubscriptionController);
subscriptionsRouter.post(
  "/from-template/:templateId",
  createSubscriptionFromTemplateController
);
subscriptionsRouter.get("/", getSubscriptionsController);

// Aggregate statistics route (must be BEFORE /:id route)
subscriptionsRouter.get("/stats", getSubscriptionStatsController);

// Pricing preview routes (calculates pricing without saving; must be BEFORE /:id route)
subscriptionsRouter.post("/preview-pricing", previewSubscriptionPricingController);
subscriptionsRouter.post("/preview", previewSubscriptionPricingController);

// Admin-only manual job trigger (must be BEFORE /:id routes)
subscriptionsRouter.post(
  "/jobs/auto-close",
  requireRole(Role.ADMIN),
  autoCloseController
);

subscriptionsRouter.get("/:id", getSubscriptionByIdController);
subscriptionsRouter.patch("/:id", updateSubscriptionController);

// Lifecycle Transition routes
subscriptionsRouter.post("/:id/send-quotation", sendQuotationController);
subscriptionsRouter.post("/:id/confirm", confirmSubscriptionController);
subscriptionsRouter.post("/:id/activate", activateSubscriptionController);
subscriptionsRouter.post("/:id/pause", pauseSubscriptionController);
subscriptionsRouter.post("/:id/resume", resumeSubscriptionController);
subscriptionsRouter.post("/:id/close", closeSubscriptionController);
subscriptionsRouter.post("/:id/renew", renewSubscriptionController);
