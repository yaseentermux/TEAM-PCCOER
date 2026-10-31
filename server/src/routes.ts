import { Router } from "express";
import { Role } from "@prisma/client";
import { asyncHandler } from "./lib/async-handler";
import { requireAuth, requireRole } from "./middleware/auth";
import { authRouter } from "./modules/auth/auth.routes";
import { customersRouter } from "./modules/customers/customers.routes";
import { usersRouter } from "./modules/users/users.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", requireAuth, requireRole(Role.ADMIN), usersRouter);
apiRouter.use(
  "/customers",
  requireAuth,
  requireRole(Role.ADMIN, Role.INTERNAL),
  customersRouter,
);

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
