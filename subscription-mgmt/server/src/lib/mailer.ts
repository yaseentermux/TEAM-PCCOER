import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env.js";

type Mail = { to: string; subject: string; html: string; attachments?: { filename: string; content: Buffer }[] };
let transporter: Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;
  if (env.SMTP_HOST && env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST, port: env.SMTP_PORT, auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  } else {
    const acc = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({ host: "smtp.ethereal.email", port: 587, auth: { user: acc.user, pass: acc.pass } });
  }
  return transporter;
}

export async function sendMail(mail: Mail) {
  const info = await (await getTransporter()).sendMail({ from: env.MAIL_FROM, ...mail });
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log(`[mail] preview: ${preview}`);
  return { messageId: info.messageId, previewUrl: preview || null };
}
