import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{ filename: string; content?: any; path?: string }>;
}

export interface SendMailResult {
  accepted: boolean;
  previewUrl?: string | false;
}

const REQUIRED_SMTP_VARS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
] as const;

export function getMissingSmtpConfig(): string[] {
  return REQUIRED_SMTP_VARS.filter((key) => !process.env[key]);
}

export function isSmtpConfigured(): boolean {
  return getMissingSmtpConfig().length === 0;
}

let transporterInstance: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporterInstance) {
    return transporterInstance;
  }

  const missing = getMissingSmtpConfig();
  if (missing.length > 0) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  transporterInstance = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporterInstance;
}

export async function sendMail(options: SendMailOptions): Promise<{ accepted: boolean; previewUrl?: string }> {
  const transporter = getTransporter();

  if (!transporter) {
    // Development / demo fallback
    console.log(`[mailer] Ethereal preview simulated for: ${options.to}`);
    return { accepted: true, previewUrl: `https://ethereal.email/message/demo-${Date.now()}` };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  const info = await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
  return { accepted: true, previewUrl: typeof previewUrl === "string" ? previewUrl : undefined };
}

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

  const res = await sendMail({
    to,
    subject,
    text,
    html,
  });
  return res.accepted;
}
