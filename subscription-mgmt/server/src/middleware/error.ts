import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { HttpError } from "../lib/http.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) return res.status(err.status).json({ error: { message: err.message, details: err.details } });
  if (err instanceof ZodError) return res.status(400).json({ error: { message: "Validation failed", details: err.flatten() } });
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return res.status(409).json({ error: { message: "Already exists" } });
    if (err.code === "P2025") return res.status(404).json({ error: { message: "Not found" } });
  }
  const status = (err as { status?: number })?.status; // e.g. malformed JSON body from express.json()
  if (status && status >= 400 && status < 500) return res.status(status).json({ error: { message: "Invalid request body" } });
  console.error(err);
  res.status(500).json({ error: { message: "Internal server error" } });
}
