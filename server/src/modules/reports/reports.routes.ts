// [M4] /api/reports: summary, revenue-trend, subscriptions-by-status, top-plans, overdue
import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../lib/async-handler";
import { reportFilter } from "./reports.schema";
import * as ctrl from "./reports.controller";

export const reportsRouter = Router();
reportsRouter.use(requireAuth, requireRole("ADMIN", "INTERNAL"), validate(reportFilter, "query"));
reportsRouter.get("/summary", asyncHandler(ctrl.summary));
reportsRouter.get("/revenue-trend", asyncHandler(ctrl.revenueTrend));
reportsRouter.get("/subscriptions-by-status", asyncHandler(ctrl.byStatus));
reportsRouter.get("/top-plans", asyncHandler(ctrl.topPlans));
reportsRouter.get("/overdue", asyncHandler(ctrl.overdue));
