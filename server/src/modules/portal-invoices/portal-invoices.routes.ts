// [M4] /api/portal/invoices (CUSTOMER, own only): list, stats, :id, :id/pdf, :id/pay (mock ONLINE)
import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../lib/async-handler";
import { idParams, listInvoicesQuery } from "../invoices/invoices.schema";
import * as ctrl from "./portal-invoices.controller";

export const portalInvoicesRouter = Router();
portalInvoicesRouter.use(requireAuth, requireRole("CUSTOMER"));
portalInvoicesRouter.get("/", validate(listInvoicesQuery, "query"), asyncHandler(ctrl.list));
portalInvoicesRouter.get("/stats", asyncHandler(ctrl.stats));
portalInvoicesRouter.get("/:id", validate(idParams, "params"), asyncHandler(ctrl.detail));
portalInvoicesRouter.get("/:id/pdf", validate(idParams, "params"), asyncHandler(ctrl.pdf));
portalInvoicesRouter.post("/:id/pay", validate(idParams, "params"), asyncHandler(ctrl.pay));
