import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

const PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Email is switched on by setting SMTP_HOST. Links in emails are built from PORTAL_BASE_URL, never from request
 * headers, which a caller controls. In production that address is required, so mail stays off without it.
 */
export function mailEnabled() {
  return Boolean(process.env.SMTP_HOST) && Boolean(baseUrl());
}

/** The public address of the portal without a trailing slash, or "" when it is unknown. */
export function baseUrl() {
  const configured = (process.env.PORTAL_BASE_URL ?? "").trim().replace(/\/+$/, "");
  if (configured) return configured;
  return PRODUCTION ? "" : "http://localhost:5174";
}

export const portalUrl = (path: string) => `${baseUrl()}${path}`;

let transport: Transporter | undefined;

function mailer() {
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    // true = TLS from the first byte (usually port 465). Otherwise the connection upgrades with STARTTLS.
    secure: process.env.SMTP_SECURE === "true",
    // Refuse to send over a connection that cannot be encrypted. Leave off only for a local test server.
    requireTLS: process.env.SMTP_REQUIRE_TLS === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return transport;
}

/** Sends a plain-text email. Returns false (and logs why) instead of throwing, so a mail outage cannot break sign-up. */
export async function sendMail(to: string, subject: string, text: string) {
  if (!mailEnabled()) return false;
  try {
    await mailer().sendMail({
      from: process.env.MAIL_FROM || "Neuravic Portal <no-reply@localhost>",
      to,
      // A header must never contain a line break, or a caller could add headers of their own.
      subject: subject.replace(/[\r\n]+/g, " "),
      text,
    });
    return true;
  } catch (error) {
    console.error("mail send failed:", error instanceof Error ? error.message : error);
    return false;
  }
}

const SIGN_OFF = "\n\nIf you did not expect this email, you can ignore it.\n— Neuravic Portal";

export const verifyEmailMessage = (name: string, token: string) => ({
  subject: "Confirm your Neuravic Portal email",
  text: `Hi ${name},\n\nConfirm your email address to finish setting up your account (the link works for 24 hours):\n\n${portalUrl(`/verify-email?token=${token}`)}${SIGN_OFF}`,
});

export const resetPasswordMessage = (name: string, token: string) => ({
  subject: "Reset your Neuravic Portal password",
  text: `Hi ${name},\n\nUse this link to choose a new password (it works for 1 hour and only once):\n\n${portalUrl(`/reset-password?token=${token}`)}\n\nResetting your password signs you out everywhere.${SIGN_OFF}`,
});

export const alreadyRegisteredMessage = (name: string) => ({
  subject: "You already have a Neuravic Portal account",
  text: `Hi ${name},\n\nSomeone tried to create a portal account with this email address, but you already have one.\n\nSign in: ${portalUrl("/login")}\nForgot your password? ${portalUrl("/forgot-password")}${SIGN_OFF}`,
});
