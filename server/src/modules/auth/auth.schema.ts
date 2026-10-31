import { z } from "zod";

/**
 * Password complexity rule:
 * - At least 9 characters
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one non-alphanumeric special character
 */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{9,}$/;

export const PASSWORD_ERROR_MESSAGE =
  "Password must be at least 9 characters long and contain at least one uppercase letter, one lowercase letter, and one special character";

/**
 * Normalized email schema:
 * Trims leading/trailing whitespace, converts to lowercase, and validates email format.
 */
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .toLowerCase()
  .email("Invalid email address");

/**
 * Password schema for new passwords:
 * Requires non-empty string and validates against the password complexity regex.
 */
export const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .regex(PASSWORD_REGEX, PASSWORD_ERROR_MESSAGE);

/**
 * 1. Signup schema: name, email, password
 */
export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: emailSchema,
  password: passwordSchema,
});
export const registerSchema = signupSchema;

/**
 * 2. Login schema: email, password
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

/**
 * 3. Forgot-password schema: email
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * 4. Reset-password schema: token, new password
 */
export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Token is required"),
  newPassword: passwordSchema,
});

/**
 * 5. Change-password schema: currentPassword, newPassword
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

// ---------- Inferred TypeScript Types ----------
export type SignupInput = z.infer<typeof signupSchema>;
export type SignupBody = SignupInput;
export type RegisterInput = SignupInput;

export type LoginInput = z.infer<typeof loginSchema>;
export type LoginBody = LoginInput;

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ForgotPasswordBody = ForgotPasswordInput;

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ResetPasswordBody = ResetPasswordInput;

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ChangePasswordBody = ChangePasswordInput;
