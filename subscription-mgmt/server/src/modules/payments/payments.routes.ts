// [M4] /api/payments: POST, GET list, DELETE /:id (admin)
import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/http.js";
import { createPaymentBody, idParams, listPaymentsQuery } from "./payments.schema.js";
import * as ctrl from "./payments.controller.js";

export const paymentsRouter = Router();
paymentsRouter.use(requireAuth, requireRole("ADMIN", "INTERNAL"));
paymentsRouter.get("/", validate(listPaymentsQuery, "query"), asyncHandler(ctrl.list));
paymentsRouter.post("/", validate(createPaymentBody), asyncHandler(ctrl.create));
paymentsRouter.delete("/:id", requireRole("ADMIN"), validate(idParams, "params"), asyncHandler(ctrl.remove));
