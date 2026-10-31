import { Router } from "express";
import { asyncHandler } from "./lib/async-handler";
import { productsRouter } from "./modules/products/products.routes";
import { plansRouter } from "./modules/plans/plans.routes";
import { taxesRouter } from "./modules/taxes/taxes.routes";
import { discountsRouter } from "./modules/discounts/discounts.routes";

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

// Member 2 routes
apiRouter.use("/products", productsRouter);
apiRouter.use("/plans", plansRouter);
apiRouter.use("/taxes", taxesRouter);
apiRouter.use("/discounts", discountsRouter);
