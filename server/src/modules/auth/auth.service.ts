import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../../config/env";
import { AppError } from "../../lib/app-error";
import { isSmtpConfigured, sendPasswordResetEmail } from "../../lib/mailer";
import { prisma } from "../../lib/prisma";
import {
  PASSWORD_ERROR_MESSAGE,
  PASSWORD_REGEX,
  type ChangePasswordInput,
  type ForgotPasswordInput,
  type LoginInput,
  type ResetPasswordInput,
  type SignupInput,
} from "./auth.schema";

export interface SafeUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  company: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginResult {
  user: SafeUser;
  token: string;
}

export interface ChangePasswordResult {
  success: boolean;
  message: string;
}

export interface ForgotPasswordResult {
  success: boolean;
  message: string;
  emailSent?: boolean;
}

export interface ResetPasswordResult {
  success: boolean;
  message: string;
}

export const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  company: true,
  address: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * 1. signup:
 * - Normalize email to lowercase and trim it.
 * - Check whether email already exists (throw HTTP 409 if duplicate).
 * - Hash password using bcryptjs.
 * - Create user with role CUSTOMER (never accepts role from input).
 * - Return safe user details without passwordHash.
 */
export async function signup(input: SignupInput): Promise<SafeUser> {
  const email = input.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError("Email is already in use", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      passwordHash,
      role: Role.CUSTOMER,
    },
    select: safeUserSelect,
  });

  return user;
}

/**
 * 2. login:
 * - Find user by normalized email.
 * - Compare password using bcryptjs.
 * - Return generic invalid credentials error (HTTP 401) on mismatch or missing user.
 * - Reject inactive users with HTTP 401.
 * - Generate JWT containing userId using env.JWT_SECRET and env.JWT_EXPIRES_IN.
 * - Return { user, token } without passwordHash.
 */
export async function login(input: LoginInput): Promise<LoginResult> {
  const email = input.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("User account is inactive", 401);
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    },
  );

  const { passwordHash: _passwordHash, ...safeUser } = user;

  return {
    user: safeUser,
    token,
  };
}

/**
 * 3. changePassword:
 * - Fetch user from database.
 * - Verify current password using bcryptjs.
 * - Hash and save new password.
 * - Return a success result without exposing password hashes.
 */
export async function changePassword(
  userId: number,
  input: ChangePasswordInput,
): Promise<ChangePasswordResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.isActive) {
    throw new AppError("User account is inactive", 401);
  }

  const isPasswordValid = await bcrypt.compare(
    input.currentPassword,
    user.passwordHash,
  );
  if (!isPasswordValid) {
    throw new AppError("Current password is incorrect", 400);
  }

  const newPasswordHash = await bcrypt.hash(input.newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newPasswordHash,
    },
  });

  return {
    success: true,
    message: "Password changed successfully",
  };
}

/**
 * 4. forgotPassword:
 * - Always allow the controller to return a generic success response.
 * - Find user by normalized email.
 * - If user does not exist or is inactive, do not reveal that.
 * - Generate a cryptographically secure 32-byte random token.
 * - Store only its SHA-256 hash in PasswordResetToken.
 * - Set expiration to 30 minutes.
 * - Send reset link: CLIENT_URL/reset-password?token=...
 * - Never store or log the raw token.
 */
export async function forgotPassword(
  emailOrInput: string | ForgotPasswordInput,
): Promise<ForgotPasswordResult> {
  const rawEmail =
    typeof emailOrInput === "string" ? emailOrInput : emailOrInput.email;
  const email = rawEmail.trim().toLowerCase();

  const genericResponse: ForgotPasswordResult = {
    success: true,
    message: "If an account with that email exists, a password reset link has been sent.",
    emailSent: false,
  };

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, isActive: true },
  });

  // If user does not exist or is inactive, return generic success without revealing status
  if (!user || !user.isActive) {
    return genericResponse;
  }

  // Generate cryptographically secure 32-byte random token
  const rawToken = crypto.randomBytes(32).toString("hex");

  // Hash token using SHA-256 for database storage
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  // Set expiration to 30 minutes
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  // Store only the token hash in PasswordResetToken
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  // Construct reset link using CLIENT_ORIGIN: CLIENT_URL/reset-password?token=...
  const resetUrl = `${env.CLIENT_ORIGIN}/reset-password?token=${rawToken}`;

  // If SMTP is not configured, record working token logic but do not attempt delivery
  if (!isSmtpConfigured()) {
    console.warn(
      `[auth.service] Password reset token generated for user ${user.id}, but SMTP is not configured. Email delivery unverified.`,
    );
    return {
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
      emailSent: false,
    };
  }

  // When SMTP is configured, attempt delivery and handle failure properly
  try {
    const sent = await sendPasswordResetEmail(user.email, resetUrl);
    if (!sent) {
      throw new AppError("Failed to deliver password reset email. Please try again later.", 500);
    }
  } catch (error) {
    console.error("[auth.service] Failed to send password reset email:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      "Failed to deliver password reset email. Please try again later.",
      500,
      error instanceof Error ? error.message : null,
    );
  }

  return {
    success: true,
    message: "If an account with that email exists, a password reset link has been sent.",
    emailSent: true,
  };
}

/**
 * 5. resetPassword:
 * - Hash incoming token using SHA-256.
 * - Find matching PasswordResetToken.
 * - Reject missing, expired or already-used tokens with HTTP 400.
 * - Validate new password against complexity regex.
 * - Hash new password using bcryptjs.
 * - Update user password.
 * - Mark token used by setting usedAt, and invalidate any other active tokens for this user.
 * - Perform related database updates safely in a Prisma transaction.
 */
export async function resetPassword(
  tokenOrInput: string | ResetPasswordInput,
  maybeNewPassword?: string,
): Promise<ResetPasswordResult> {
  let token: string;
  let newPassword: string;

  if (typeof tokenOrInput === "object" && tokenOrInput !== null) {
    token = tokenOrInput.token;
    newPassword = tokenOrInput.newPassword;
  } else {
    token = tokenOrInput;
    newPassword = maybeNewPassword || "";
  }

  if (!token || !newPassword) {
    throw new AppError("Token and new password are required", 400);
  }

  // Validate new password complexity
  if (!PASSWORD_REGEX.test(newPassword)) {
    throw new AppError(PASSWORD_ERROR_MESSAGE, 400);
  }

  // Hash incoming token using SHA-256
  const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");

  // Find matching PasswordResetToken
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: { id: true, isActive: true },
      },
    },
  });

  // Reject missing token
  if (!resetToken) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  // Reject already-used token
  if (resetToken.usedAt !== null) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  // Reject expired token
  if (resetToken.expiresAt < new Date()) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  // Reject inactive user
  if (!resetToken.user || !resetToken.user.isActive) {
    throw new AppError("User account is inactive or not found", 400);
  }

  // Hash new password using bcryptjs
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Perform related database updates safely in a Prisma transaction
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });
    // Invalidate all active reset tokens for this user so none can be reused
    await tx.passwordResetToken.updateMany({
      where: {
        userId: resetToken.userId,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });
  });

  return {
    success: true,
    message: "Password has been reset successfully",
  };
}

export const authService = {
  signup,
  login,
  changePassword,
  forgotPassword,
  resetPassword,
};
