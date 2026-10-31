// LOCAL ONLY stand-in for M1's auth module, so M4 can test role-protected endpoints. Do not commit.
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./lib/prisma.js";
import { env } from "./config/env.js";
import { requireAuth } from "./middleware/auth.js";

export const devAuthRouter = Router();

devAuthRouter.post("/login", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: String(req.body?.email ?? "").toLowerCase() } });
  if (!user || !(await bcrypt.compare(String(req.body?.password ?? ""), user.passwordHash)))
    return res.status(401).json({ error: { message: "Invalid email or password" } });
  const payload = { id: user.id, role: user.role, name: user.name, email: user.email };
  res.cookie("token", jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" }), { httpOnly: true, sameSite: "lax" });
  res.json({ data: payload });
});
devAuthRouter.post("/logout", (_req, res) => { res.clearCookie("token"); res.json({ data: true }); });
devAuthRouter.get("/me", requireAuth, (req, res) => { res.json({ data: req.user }); });
