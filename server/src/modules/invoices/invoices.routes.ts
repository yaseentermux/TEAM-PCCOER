// [M4] /api/invoices: list, stats, :id, from-subscription/:subscriptionId, :id/confirm|cancel|send|remind, :id/pdf
import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../lib/async-handler";
import { idParams, listInvoicesQuery, subscriptionIdParams } from "./invoices.schema";
import * as ctrl from "./invoices.controller";

export const invoicesRouter = Router();
invoicesRouter.use(requireAuth, requireRole("ADMIN", "INTERNAL"));

invoicesRouter.get("/", validate(listInvoicesQuery, "query"), asyncHandler(ctrl.list));
invoicesRouter.get("/stats", asyncHandler(ctrl.stats));
invoicesRouter.post("/from-subscription/:subscriptionId", validate(subscriptionIdParams, "params"), asyncHandler(ctrl.fromSubscription));
invoicesRouter.get("/:id", validate(idParams, "params"), asyncHandler(ctrl.detail));
invoicesRouter.get("/:id/pdf", validate(idParams, "params"), asyncHandler(ctrl.pdf));
invoicesRouter.post("/:id/confirm", validate(idParams, "params"), asyncHandler(ctrl.confirm));
invoicesRouter.post("/:id/cancel", validate(idParams, "params"), asyncHandler(ctrl.cancel));
invoicesRouter.post("/:id/send", validate(idParams, "params"), asyncHandler(ctrl.send));
invoicesRouter.post("/:id/remind", validate(idParams, "params"), asyncHandler(ctrl.remind));
