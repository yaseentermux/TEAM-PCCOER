import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as customersController from "./customers.controller";

export const customersRouter = Router();

// Accessible by both ADMIN and INTERNAL roles
customersRouter.use(requireAuth, requireRole(Role.ADMIN, Role.INTERNAL));

customersRouter.get("/", customersController.listCustomers);
customersRouter.get("/:id", customersController.getCustomer);
customersRouter.post("/", customersController.createCustomer);
customersRouter.patch("/:id", customersController.updateCustomer);
