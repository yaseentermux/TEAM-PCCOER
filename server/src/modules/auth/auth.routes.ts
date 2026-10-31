import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../../middleware/auth";
import * as authController from "./auth.controller";

/**
 * Rate limiter applied to sensitive endpoints (login, forgot-password):
 * Maximum 10 requests per 15 minutes.
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: {
      message: "Too many attempts. Please try again after 15 minutes.",
      details: null,
    },
  },
});

export const authRouter = Router();

// Public routes
authRouter.post("/signup", authController.signup);
authRouter.post("/login", authRateLimiter, authController.login);
authRouter.post("/logout", authController.logout);
authRouter.post("/forgot-password", authRateLimiter, authController.forgotPassword);
authRouter.post("/reset-password", authController.resetPassword);

// Protected routes (requireAuth)
authRouter.get("/me", requireAuth, authController.getMe);
authRouter.post("/change-password", requireAuth, authController.changePassword);
