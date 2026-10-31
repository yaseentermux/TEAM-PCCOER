import { Router } from "express";
import { devAuthRouter } from "./dev-auth.js";
import { invoicesRouter } from "./modules/invoices/invoices.routes.js";
import { paymentsRouter } from "./modules/payments/payments.routes.js";
import { billingRouter } from "./modules/billing/billing.routes.js";
import { reportsRouter } from "./modules/reports/reports.routes.js";
import { portalInvoicesRouter } from "./modules/portal-invoices/portal-invoices.routes.js";

export const api = Router();
api.use("/auth", devAuthRouter); // LOCAL ONLY: replaced by M1's auth module
api.use("/invoices", invoicesRouter);
api.use("/payments", paymentsRouter);
api.use("/billing", billingRouter);
api.use("/reports", reportsRouter);
api.use("/portal/invoices", portalInvoicesRouter);
