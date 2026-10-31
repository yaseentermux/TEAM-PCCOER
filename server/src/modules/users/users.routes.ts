import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as usersController from "./users.controller";

export const usersRouter = Router();

// All user management endpoints require ADMIN role
usersRouter.use(requireAuth, requireRole(Role.ADMIN));

usersRouter.get("/", usersController.listUsers);
usersRouter.post("/", usersController.createUser);
usersRouter.patch("/:id", usersController.updateUser);
usersRouter.patch("/:id/active", usersController.setUserActive);
