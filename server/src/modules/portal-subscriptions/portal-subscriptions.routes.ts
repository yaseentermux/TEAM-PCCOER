import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  getPortalSubscriptionsController,
  getPortalSubscriptionByIdController,
  portalSubscribeController,
  portalAcceptQuotationController,
  portalPauseSubscriptionController,
  portalResumeSubscriptionController,
  portalCloseSubscriptionController,
  portalRenewSubscriptionController,
} from "./portal-subscriptions.controller";

export const portalSubscriptionsRouter = Router();

// Protect all portal subscription routes strictly for authenticated CUSTOMER users
portalSubscriptionsRouter.use(requireAuth, requireRole(Role.CUSTOMER));

// Portal subscription endpoints
portalSubscriptionsRouter.get("/", getPortalSubscriptionsController);
portalSubscriptionsRouter.post("/subscribe", portalSubscribeController);
portalSubscriptionsRouter.post("/", portalSubscribeController);
portalSubscriptionsRouter.get("/:id", getPortalSubscriptionByIdController);
portalSubscriptionsRouter.post("/:id/accept", portalAcceptQuotationController);
portalSubscriptionsRouter.post("/:id/pause", portalPauseSubscriptionController);
portalSubscriptionsRouter.post("/:id/resume", portalResumeSubscriptionController);
portalSubscriptionsRouter.post("/:id/close", portalCloseSubscriptionController);
portalSubscriptionsRouter.post("/:id/renew", portalRenewSubscriptionController);



