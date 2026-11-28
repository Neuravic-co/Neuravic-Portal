"use server";

import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { clientKey } from "@/lib/client-key";
import { db } from "@/lib/db";
import { consumeToken, createToken, findToken } from "@/lib/email-tokens";
import { EMAIL_PATTERN, secret, text, type FormState } from "@/lib/form";
import { hashPassword } from "@/lib/auth";
import { mailEnabled, resetPasswordMessage, sendMail, verifyEmailMessage } from "@/lib/mail";
import { passwordProblem } from "@/lib/password-policy";
import { allowAttempt, clearAttempts } from "@/lib/rate-limit";

type Person = { id: number; full_name: string; email: string; email_verified_at: string | null };

const SENT = "If an account exists for that address, we have emailed it a link. Check your inbox.";
const TOO_MANY: FormState = { error: "Too many requests. Try again in 15 minutes." };
const BAD_LINK = "This link is invalid or has expired. Ask for a new one.";

function findPerson(email: string) {
  return db().prepare("SELECT id, full_name, email, email_verified_at FROM users WHERE email = ?").get(email) as Person | undefined;
}

/** Limits per caller and for everyone together, so the form cannot be used to flood anybody's inbox. */
async function allowRequest(kind: string) {
  return allowAttempt(`${kind}:${await clientKey()}`, 5) && allowAttempt(`${kind}-all`, 300);
}

/** Asks for a new confirmation email. The answer is the same whether or not the address has an account. */
export async function requestVerification(_previous: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email", 200).toLowerCase();
  const values = { email };
  if (!EMAIL_PATTERN.test(email)) return { error: "Enter a valid email address.", values };
  if (!mailEnabled()) return { error: "Email is not set up on this portal. Ask an administrator.", values };
  if (!(await allowRequest("verify-request"))) return { ...TOO_MANY, values };

  const person = findPerson(email);
  if (person && !person.email_verified_at && allowAttempt(`mail:${email}`, 3)) {
    const message = verifyEmailMessage(person.full_name, createToken(person.id, "verify"));
    await sendMail(person.email, message.subject, message.text);
  }
  return { success: SENT, values };
}

/** Uses the link from the confirmation email. It is a button press, not a plain link visit, so mail scanners cannot use it up. */
export async function verifyEmail(_previous: FormState, form: FormData): Promise<FormState> {
  const userId = consumeToken(text(form, "token", 100), "verify");
  if (userId === null) return { error: BAD_LINK };
  const person = db().prepare("SELECT email FROM users WHERE id = ?").get(userId) as { email: string } | undefined;
  db().prepare("UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?").run(new Date().toISOString(), userId);
  audit({ id: userId, email: person?.email }, "email.verified");
  redirect("/login?notice=verified");
}

/** Sends a password reset link. The answer is the same whether or not the address has an account. */
export async function requestReset(_previous: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email", 200).toLowerCase();
  const values = { email };
  if (!EMAIL_PATTERN.test(email)) return { error: "Enter a valid email address.", values };
  if (!mailEnabled()) {
    return { error: "Resetting by email is not set up on this portal. Ask an administrator to reset your password.", values };
  }
  if (!(await allowRequest("reset-request"))) return { ...TOO_MANY, values };

  const person = findPerson(email);
  if (person && allowAttempt(`mail:${email}`, 3)) {
    const message = resetPasswordMessage(person.full_name, createToken(person.id, "reset"));
    await sendMail(person.email, message.subject, message.text);
    audit({ id: person.id, email }, "password.reset.requested");
  }
  return { success: SENT, values };
}

/** Sets a new password from a reset link, signs the account out everywhere, and lifts any sign-in lock on it. */
export async function resetPassword(_previous: FormState, form: FormData): Promise<FormState> {
  const token = text(form, "token", 100);
  const userId = findToken(token, "reset");
  if (userId === null) return { error: BAD_LINK };
  const person = db().prepare("SELECT full_name, email FROM users WHERE id = ?").get(userId) as { full_name: string; email: string } | undefined;
  if (!person) return { error: BAD_LINK };

  const password = secret(form, "password");
  const confirm = secret(form, "confirm");
  const fieldErrors: Record<string, string> = {};
  const problem = passwordProblem(password, { email: person.email, name: person.full_name });
  if (problem) fieldErrors.password = problem;
  if (confirm !== password) fieldErrors.confirm = "The passwords do not match.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  // Used up only now, so a typo in the new password does not waste the link. A second use of it fails here.
  if (consumeToken(token, "reset") === null) return { error: BAD_LINK };

  const database = db();
  database
    .prepare("UPDATE users SET password_hash = ?, email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?")
    .run(await hashPassword(password), new Date().toISOString(), userId);
  // Whoever held the old password, or a stolen session, is signed out.
  database.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  clearAttempts(`signin-account:${person.email}`);
  audit({ id: userId, email: person.email }, "password.reset");
  redirect("/login?notice=password-reset");
}
