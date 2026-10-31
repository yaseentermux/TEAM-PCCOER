// [M4] /api/reports: summary, revenue-trend, subscriptions-by-status, top-plans, overdue
import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/http.js";
import { reportFilter } from "./reports.schema.js";
import * as ctrl from "./reports.controller.js";

export const reportsRouter = Router();
reportsRouter.use(requireAuth, requireRole("ADMIN", "INTERNAL"), validate(reportFilter, "query"));
reportsRouter.get("/summary", asyncHandler(ctrl.summary));
reportsRouter.get("/revenue-trend", asyncHandler(ctrl.revenueTrend));
reportsRouter.get("/subscriptions-by-status", asyncHandler(ctrl.byStatus));
reportsRouter.get("/top-plans", asyncHandler(ctrl.topPlans));
reportsRouter.get("/overdue", asyncHandler(ctrl.overdue));
