import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../config/env.js";

export type AuthUser = { id: number; role: Role; name: string; email: string };
declare global { namespace Express { interface Request { user?: AuthUser } } }

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: { message: "Not authenticated" } });
  try { req.user = jwt.verify(token, env.JWT_SECRET) as AuthUser; next(); }
  catch { res.status(401).json({ error: { message: "Session expired" } }); }
}

export const requireRole = (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) =>
    req.user && roles.includes(req.user.role)
      ? next() : res.status(403).json({ error: { message: "Forbidden" } });
