// [M4] /api/payments: POST, GET list, DELETE /:id (admin)
import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../lib/async-handler";
import { createPaymentBody, idParams, listPaymentsQuery } from "./payments.schema";
import * as ctrl from "./payments.controller";

export const paymentsRouter = Router();
paymentsRouter.use(requireAuth, requireRole("ADMIN", "INTERNAL"));
paymentsRouter.get("/", validate(listPaymentsQuery, "query"), asyncHandler(ctrl.list));
paymentsRouter.post("/", validate(createPaymentBody), asyncHandler(ctrl.create));
paymentsRouter.delete("/:id", requireRole("ADMIN"), validate(idParams, "params"), asyncHandler(ctrl.remove));
