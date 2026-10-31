import { Router } from "express";
import { asyncHandler } from "./lib/async-handler";
import { devAuthRouter } from "./dev-auth"; // [M4] STAND-IN until M1's auth router is mounted here
import { invoicesRouter } from "./modules/invoices/invoices.routes";
import { paymentsRouter } from "./modules/payments/payments.routes";
import { billingRouter } from "./modules/billing/billing.routes";
import { reportsRouter } from "./modules/reports/reports.routes";
import { portalInvoicesRouter } from "./modules/portal-invoices/portal-invoices.routes";

export const apiRouter = Router();

apiRouter.get(
  "/health",
  asyncHandler(async (_req, res) => {
    res.json({
      data: {
        status: "ok",
        service: "brightloop-server",
        timestamp: new Date().toISOString(),
      },
    });
  }),
);

apiRouter.use("/auth", devAuthRouter);

// [M4] Billing, payments and analytics
apiRouter.use("/invoices", invoicesRouter);
apiRouter.use("/payments", paymentsRouter);
apiRouter.use("/billing", billingRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/portal/invoices", portalInvoicesRouter);
