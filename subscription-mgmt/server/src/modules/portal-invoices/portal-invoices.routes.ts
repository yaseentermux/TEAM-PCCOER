// [M4] /api/portal/invoices (CUSTOMER, own only): list, stats, :id, :id/pdf, :id/pay (mock ONLINE)
import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/http.js";
import { idParams, listInvoicesQuery } from "../invoices/invoices.schema.js";
import * as ctrl from "./portal-invoices.controller.js";

export const portalInvoicesRouter = Router();
portalInvoicesRouter.use(requireAuth, requireRole("CUSTOMER"));
portalInvoicesRouter.get("/", validate(listInvoicesQuery, "query"), asyncHandler(ctrl.list));
portalInvoicesRouter.get("/stats", asyncHandler(ctrl.stats));
portalInvoicesRouter.get("/:id", validate(idParams, "params"), asyncHandler(ctrl.detail));
portalInvoicesRouter.get("/:id/pdf", validate(idParams, "params"), asyncHandler(ctrl.pdf));
portalInvoicesRouter.post("/:id/pay", validate(idParams, "params"), asyncHandler(ctrl.pay));
