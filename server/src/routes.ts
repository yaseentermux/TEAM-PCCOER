import { Router } from "express";
import { asyncHandler } from "./lib/async-handler";
import { quotationTemplatesRouter } from "./modules/quotation-templates/quotation-templates.routes";
import { subscriptionsRouter } from "./modules/subscriptions/subscriptions.routes";
import { portalSubscriptionsRouter } from "./modules/portal-subscriptions/portal-subscriptions.routes";

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

apiRouter.use("/quotation-templates", quotationTemplatesRouter);
apiRouter.use("/subscriptions", subscriptionsRouter);
apiRouter.use("/portal/subscriptions", portalSubscriptionsRouter);
