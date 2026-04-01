import nodemailer from "nodemailer";
import { env } from "../config/env";

function hasSmtpConfig() {
  return Boolean(env.smtpHost && env.smtpPort && env.smtpUser && env.smtpPass && env.smtpFrom);
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!hasSmtpConfig()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass
      }
    });
  }

  return transporter;
}

export async function sendPasswordResetEmail(input: {
  to: string;
  firstName?: string | null;
  resetToken: string;
}) {
  const transport = getTransporter();
  const resetUrl = `${env.adminDashboardUrl.replace(/\/$/, "")}/forgot-password?token=${encodeURIComponent(input.resetToken)}`;

  if (!transport) {
    return {
      delivered: false,
      reason: "SMTP is not configured.",
      resetUrl
    };
  }

  await transport.sendMail({
    from: env.smtpFrom,
    to: input.to,
    subject: "Reset your BiteHub password",
    text: [
      `Hello ${input.firstName || "there"},`,
      "",
      "A password reset was requested for your BiteHub account.",
      `Reset your password here: ${resetUrl}`,
      "",
      "If you did not request this change, you can ignore this email."
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111827;">
        <h2 style="margin: 0 0 12px; color: #f97316;">BiteHub Password Reset</h2>
        <p style="margin: 0 0 12px;">Hello ${input.firstName || "there"},</p>
        <p style="margin: 0 0 18px;">A password reset was requested for your BiteHub account.</p>
        <p style="margin: 0 0 18px;">
          <a href="${resetUrl}" style="display: inline-block; background: #f97316; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 700;">
            Reset password
          </a>
        </p>
        <p style="margin: 0 0 10px; color: #4b5563;">If the button does not work, use this link:</p>
        <p style="margin: 0 0 18px; word-break: break-all; color: #2563eb;">${resetUrl}</p>
        <p style="margin: 0; color: #6b7280;">If you did not request this change, you can ignore this email.</p>
      </div>
    `
  });

  return {
    delivered: true,
    resetUrl
  };
}
