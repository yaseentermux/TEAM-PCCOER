import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env";
import { AppError } from "../lib/app-error";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: "Validation error",
        details: err.flatten(),
      },
    });
    return;
  }

  const message = err instanceof Error ? err.message : "Internal server error";

  res.status(500).json({
    error: {
      message: env.NODE_ENV === "production" ? "Internal server error" : message,
      details: null,
    },
  });
}
