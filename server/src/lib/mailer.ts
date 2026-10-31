import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../config/env";

export interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

const REQUIRED_SMTP_VARS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
] as const;

/**
 * Returns any missing SMTP environment variable names.
 */
export function getMissingSmtpConfig(): string[] {
  const missing: string[] = [];
  if (!env.SMTP_HOST) missing.push("SMTP_HOST");
  if (!env.SMTP_USER) missing.push("SMTP_USER");
  if (!env.SMTP_PASS) missing.push("SMTP_PASS");
  return missing;
}

/**
 * Check if all required SMTP environment variables are present.
 */
export function isSmtpConfigured(): boolean {
  return getMissingSmtpConfig().length === 0;
}

let transporterInstance: Transporter | null = null;

export function getTransporter(): Transporter | null {
  if (transporterInstance) {
    return transporterInstance;
  }

  if (!isSmtpConfigured()) {
    return null;
  }

  const port = env.SMTP_PORT || 587;
  const secure = env.SMTP_SECURE === "true" || port === 465;

  transporterInstance = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  return transporterInstance;
}

export function setTransporterInstance(transporter: Transporter | null): void {
  transporterInstance = transporter;
}

export function resetTransporterInstance(): void {
  transporterInstance = null;
}

/**
 * Send an email using Nodemailer.
 * If SMTP configuration is missing, logs a warning and returns false.
 * If SMTP is configured and delivery fails, it throws an error.
 */
export async function sendMail(options: SendMailOptions): Promise<boolean> {
  const transporter = getTransporter();

  if (!transporter) {
    const missing = getMissingSmtpConfig();
    console.warn(
      `[mailer] Cannot send email. Missing SMTP configuration variables: ${missing.join(", ")}`,
    );
    return false;
  }

  const from = env.SMTP_FROM || env.SMTP_USER || "noreply@brightloop.com";

  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });

  return true;
}

/**
 * Send a password reset email containing the reset link.
 * Note: Never logs or stores the raw reset token.
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<boolean> {
  const subject = "Password Reset Request - Brightloop";
  const text = `You requested a password reset for your Brightloop account.\n\nPlease use the following link to reset your password (valid for 30 minutes):\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your Brightloop account.</p>
      <p>Click the button below to reset your password. This link is valid for 30 minutes:</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
      </p>
      <p>Or copy and paste this URL into your browser:</p>
      <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0;" />
      <p style="font-size: 12px; color: #666;">If you did not request this password reset, please ignore this email.</p>
    </div>
  `;

  return sendMail({
    to,
    subject,
    text,
    html,
  });
}
