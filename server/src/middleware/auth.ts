// [M4] STAND-IN for M1's auth middleware (modules/auth is not built yet). Same names the plan uses
// (requireAuth, requireRole); reads M1's COOKIE_NAME and fills M1's req.user type. Replace with M1's version.
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../config/env";

type AuthUser = NonNullable<Request["user"]>;

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[env.COOKIE_NAME];
  if (!token) return res.status(401).json({ error: { message: "Not authenticated" } });
  try {
    const { id, role } = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    req.user = { id, role };
    next();
  } catch {
    res.status(401).json({ error: { message: "Session expired" } });
  }
}

export const requireRole = (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) =>
    req.user && roles.includes(req.user.role)
      ? next() : res.status(403).json({ error: { message: "Forbidden" } });
