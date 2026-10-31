// [M4] /api/billing: POST /run, GET /runs
import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/http.js";
import { runsQuery } from "./billing.schema.js";
import * as ctrl from "./billing.controller.js";

export const billingRouter = Router();
billingRouter.use(requireAuth, requireRole("ADMIN", "INTERNAL"));
billingRouter.post("/run", asyncHandler(ctrl.run));
billingRouter.get("/runs", validate(runsQuery, "query"), asyncHandler(ctrl.runs));
