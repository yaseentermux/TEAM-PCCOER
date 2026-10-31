import type { CookieOptions, Request, Response } from "express";
import { env } from "../../config/env";
import { AppError } from "../../lib/app-error";
import { asyncHandler } from "../../lib/async-handler";
import { prisma } from "../../lib/prisma";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "./auth.schema";
import { authService, safeUserSelect } from "./auth.service";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getAuthCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SEVEN_DAYS_MS,
  };
}

/**
 * POST /api/auth/signup
 * Validates input, calls signup service, and returns 201 with created user.
 */
export const signup = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const input = signupSchema.parse(req.body);
    const user = await authService.signup(input);

    res.status(201).json({
      data: user,
    });
  },
);

/**
 * POST /api/auth/login
 * Validates input, calls login service, and sets JWT in an HTTP-only cookie with sameSite: "lax" and 7-day expiry.
 */
export const login = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const input = loginSchema.parse(req.body);
    const { user, token } = await authService.login(input);

    res.cookie(env.COOKIE_NAME, token, getAuthCookieOptions());

    res.json({
      data: {
        user,
        token,
      },
    });
  },
);

/**
 * POST /api/auth/logout
 * Clears the auth cookie.
 */
export const logout = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    res.clearCookie(env.COOKIE_NAME, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.json({
      data: {
        message: "Logged out successfully",
      },
    });
  },
);

/**
 * GET /api/auth/me
 * Protected with requireAuth, returns current authenticated user.
 */
export const getMe = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: safeUserSelect,
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json({
      data: user,
    });
  },
);

/**
 * POST /api/auth/forgot-password
 * Validates input and calls forgot-password service; always returns generic success.
 */
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const input = forgotPasswordSchema.parse(req.body);
    const result = await authService.forgotPassword(input);

    res.json({
      data: result,
    });
  },
);

/**
 * POST /api/auth/reset-password
 * Validates input and calls reset-password service.
 */
export const resetPassword = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const input = resetPasswordSchema.parse(req.body);
    const result = await authService.resetPassword(input);

    res.json({
      data: result,
    });
  },
);

/**
 * POST /api/auth/change-password
 * Protected with requireAuth, validates input and calls change-password service.
 */
export const changePassword = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const input = changePasswordSchema.parse(req.body);
    const result = await authService.changePassword(req.user.id, input);

    res.json({
      data: result,
    });
  },
);
