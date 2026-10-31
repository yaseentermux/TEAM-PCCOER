import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  getPortalSubscriptionsController,
  getPortalSubscriptionByIdController,
} from "./portal-subscriptions.controller";

export const portalSubscriptionsRouter = Router();

// Protect all portal subscription routes strictly for authenticated CUSTOMER users
portalSubscriptionsRouter.use(requireAuth, requireRole(Role.CUSTOMER));

// Portal subscription endpoints
portalSubscriptionsRouter.get("/", getPortalSubscriptionsController);
portalSubscriptionsRouter.get("/:id", getPortalSubscriptionByIdController);

