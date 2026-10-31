// [M4] /api/billing: POST /run, GET /runs
import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../lib/async-handler";
import { runsQuery } from "./billing.schema";
import * as ctrl from "./billing.controller";

export const billingRouter = Router();
billingRouter.use(requireAuth, requireRole("ADMIN", "INTERNAL"));
billingRouter.post("/run", asyncHandler(ctrl.run));
billingRouter.get("/runs", validate(runsQuery, "query"), asyncHandler(ctrl.runs));
