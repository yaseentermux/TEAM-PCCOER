import type { Request, Response } from "express";
import { AppError } from "../../lib/app-error";
import { asyncHandler } from "../../lib/async-handler";
import {
  createUserSchema,
  listUsersQuerySchema,
  setUserActiveSchema,
  updateUserSchema,
  userIdParamSchema,
} from "./users.schema";
import { usersService } from "./users.service";

/**
 * GET /api/users?role=
 * List users with optional role filtering and pagination.
 */
export const listUsers = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const query = listUsersQuerySchema.parse(req.query);
    const result = await usersService.listUsers(query);
    res.json(result);
  },
);

/**
 * POST /api/users
 * Create an INTERNAL or ADMIN user.
 */
export const createUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const input = createUserSchema.parse(req.body);
    const user = await usersService.createUser(input);
    res.status(201).json({ data: user });
  },
);

/**
 * PATCH /api/users/:id
 * Update permitted user details.
 */
export const updateUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = userIdParamSchema.parse(req.params);
    const input = updateUserSchema.parse(req.body);
    const user = await usersService.updateUser(id, input);
    res.json({ data: user });
  },
);

/**
 * PATCH /api/users/:id/active
 * Activate or deactivate a user (prevents self-deactivation).
 */
export const setUserActive = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }
    const { id } = userIdParamSchema.parse(req.params);
    const input = setUserActiveSchema.parse(req.body);
    const user = await usersService.setUserActive(req.user.id, id, input);
    res.json({ data: user });
  },
);
