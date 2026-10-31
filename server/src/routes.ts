import { Router } from "express";
import { asyncHandler } from "./lib/async-handler";

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
