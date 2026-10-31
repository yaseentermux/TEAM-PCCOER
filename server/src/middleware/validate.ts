import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { AppError } from "../lib/app-error";

export function validate(schema: ZodSchema, target: "body" | "query" | "params" = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[target]);
      req[target] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(new AppError("Validation failed", 400, err.issues));
      }
      next(err);
    }
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: { message: "Not authenticated" } });
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || (!roles.includes(user.role) && user.role !== "ADMIN")) {
      return res.status(403).json({ error: { message: "Forbidden" } });
    }
    next();
  };
}
