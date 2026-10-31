import { Router } from "express";
import { productsRouter } from "./products/products.routes";
import { plansRouter } from "./plans/plans.routes";
import { taxesRouter } from "./taxes/taxes.routes";
import { discountsRouter } from "./discounts/discounts.routes";

export const catalogRoutes = (api: Router) => {
  api.use("/products", productsRouter);
  api.use("/plans", plansRouter);
  api.use("/taxes", taxesRouter);
  api.use("/discounts", discountsRouter);
};

export { productsRouter, plansRouter, taxesRouter, discountsRouter };
