import { Router } from "express";
import { Role } from "@prisma/client";
import { asyncHandler } from "./lib/async-handler";
import { requireAuth, requireRole } from "./middleware/auth";

// M1: Platform & Auth
import { authRouter } from "./modules/auth/auth.routes";
import { customersRouter } from "./modules/customers/customers.routes";
import { usersRouter } from "./modules/users/users.routes";

// M2: Catalog & Pricing
import { productsRouter } from "./modules/products/products.routes";
import { plansRouter } from "./modules/plans/plans.routes";
import { taxesRouter } from "./modules/taxes/taxes.routes";
import { discountsRouter } from "./modules/discounts/discounts.routes";

// M3: Sales & Contracts
import { quotationTemplatesRouter } from "./modules/quotation-templates/quotation-templates.routes";
import { subscriptionsRouter } from "./modules/subscriptions/subscriptions.routes";
import { portalSubscriptionsRouter } from "./modules/portal-subscriptions/portal-subscriptions.routes";

// M4: Billing, Payments & Analytics
import { billingRouter } from "./modules/billing/billing.routes";
import { invoicesRouter } from "./modules/invoices/invoices.routes";
import { paymentsRouter } from "./modules/payments/payments.routes";
import { portalInvoicesRouter } from "./modules/portal-invoices/portal-invoices.routes";
import { reportsRouter } from "./modules/reports/reports.routes";

export const apiRouter = Router();

// Health
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

// M1 Routes
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", requireAuth, requireRole(Role.ADMIN), usersRouter);
apiRouter.use(
  "/customers",
  requireAuth,
  requireRole(Role.ADMIN, Role.INTERNAL),
  customersRouter,
);

// M2 Routes (Catalog)
apiRouter.use("/products", productsRouter);
apiRouter.use("/plans", plansRouter);
apiRouter.use("/taxes", taxesRouter);
apiRouter.use("/discounts", discountsRouter);

// M3 Routes (Sales & Subscriptions)
apiRouter.use("/quotation-templates", quotationTemplatesRouter);
apiRouter.use("/subscriptions", subscriptionsRouter);
apiRouter.use("/portal/subscriptions", portalSubscriptionsRouter);

// M4 Routes (Billing, Invoices, Payments, Reports)
apiRouter.use("/billing", billingRouter);
apiRouter.use("/invoices", invoicesRouter);
apiRouter.use("/payments", paymentsRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/portal/invoices", portalInvoicesRouter);
