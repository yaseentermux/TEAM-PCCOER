// [M4] STAND-IN for M1's auth module (login / logout / me), so the billing screens can be used before
// M1's modules/auth lands. Delete this file and its line in routes.ts once M1's auth router is mounted.
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { prisma } from "./lib/prisma";
import { env } from "./config/env";
import { asyncHandler } from "./lib/async-handler";
import { AppError } from "./lib/app-error";
import { requireAuth } from "./middleware/auth";

export const devAuthRouter = Router();

const publicUser = { id: true, name: true, email: true, role: true } as const;

devAuthRouter.post("/login", asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: String(req.body?.email ?? "").toLowerCase() } });
  if (!user || !(await bcrypt.compare(String(req.body?.password ?? ""), user.passwordHash)))
    throw new AppError("Invalid email or password", 401);
  const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] });
  res.cookie(env.COOKIE_NAME, token, { httpOnly: true, sameSite: "lax" });
  res.json({ data: { id: user.id, name: user.name, email: user.email, role: user.role } });
}));

devAuthRouter.post("/logout", (_req, res) => { res.clearCookie(env.COOKIE_NAME); res.json({ data: true }); });

devAuthRouter.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: publicUser });
  if (!user) throw new AppError("Not authenticated", 401);
  res.json({ data: user });
}));
