import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../config/env";
import { AppError } from "../lib/app-error";
import { asyncHandler } from "../lib/async-handler";
import { prisma } from "../lib/prisma";

export interface JwtUserPayload {
  userId?: number;
  id?: number;
  sub?: string | number;
  role?: Role;
  email?: string;
  [key: string]: unknown;
}

/**
 * Authentication middleware:
 * - Reads JWT from configured HTTP-only cookie (fallback to Bearer header)
 * - Verifies JWT against JWT_SECRET
 * - Fetches user from PostgreSQL via Prisma
 * - Rejects missing, invalid, expired tokens or inactive users with 401
 * - Attaches { id, email, name, role } to req.user
 */
export const requireAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const cookieToken = req.cookies?.[env.COOKIE_NAME];
    const headerToken =
      typeof req.headers.authorization === "string" &&
      req.headers.authorization.startsWith("Bearer ")
        ? req.headers.authorization.slice(7).trim()
        : undefined;

    const token =
      typeof cookieToken === "string" && cookieToken.length > 0
        ? cookieToken
        : headerToken;

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    let payload: JwtUserPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as JwtUserPayload;
    } catch {
      throw new AppError("Invalid or expired token", 401);
    }

    const rawId = payload.userId ?? payload.id ?? payload.sub;
    const userId = typeof rawId === "number" ? rawId : Number(rawId);

    if (!userId || Number.isNaN(userId)) {
      throw new AppError("Invalid token payload", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 401);
    }

    if (!user.isActive) {
      throw new AppError("User account is inactive", 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    next();
  },
);

/**
 * Role-based authorization middleware:
 * - Must be placed after requireAuth
 * - Allows request if user's database role matches any allowed role
 * - Otherwise throws 403 Forbidden
 */
export function requireRole(...roles: (Role | Role[])[]) {
  const allowedRoles = roles.flat();

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError("Forbidden: insufficient permissions", 403);
    }

    next();
  };
}
