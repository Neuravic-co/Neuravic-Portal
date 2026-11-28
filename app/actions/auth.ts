"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { checkPassword, decoy, endSession, hashPassword, startSession, upgradeHash } from "@/lib/auth";
import { clientKey } from "@/lib/client-key";
import { createToken } from "@/lib/email-tokens";
import { alreadyRegisteredMessage, mailEnabled, sendMail, verifyEmailMessage } from "@/lib/mail";
import { db, transaction, type UserRow } from "@/lib/db";
import { EMAIL_PATTERN, secret, text, type FormState } from "@/lib/form";
import { passwordProblem } from "@/lib/password-policy";
import { DEPARTMENTS, OFFICES } from "@/lib/profile";
import { allowAttempt, clearAttempts } from "@/lib/rate-limit";

/**
 * Failed or successful sign-in attempts allowed per account in 15 minutes, from all addresses together. Generous
 * enough that a stranger needs real effort to lock someone out, and a password reset clears it.
 */
const ACCOUNT_ATTEMPTS = 30;
/** Sign-ups allowed per caller, and from everyone together, in 15 minutes. */
const SIGNUP_ATTEMPTS = 10;
const SIGNUP_ATTEMPTS_ALL = 300;

/**
 * Who may create an account. Set PORTAL_ALLOWED_EMAIL_DOMAINS (for example "neuravic.com") to allow company
 * addresses only. In production, sign-up stays closed until that is set, or until PORTAL_ALLOW_OPEN_SIGNUP=true says
 * anyone may join; otherwise the first stranger to find a fresh deployment would become its admin.
 */
function signupPolicy(email: string): "ok" | "closed" | "domain" | "unverifiable" {
  const allowed = (process.env.PORTAL_ALLOWED_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length > 0) {
    if (!allowed.includes(email.split("@")[1] ?? "")) return "domain";
    // A company domain only means something if the person owns that mailbox, which takes a confirmation email.
    const unverified = process.env.NODE_ENV === "production" && !mailEnabled() && process.env.PORTAL_ALLOW_UNVERIFIED_EMAIL !== "true";
    return unverified ? "unverifiable" : "ok";
  }
  const open = process.env.NODE_ENV !== "production" || process.env.PORTAL_ALLOW_OPEN_SIGNUP === "true";
  return open ? "ok" : "closed";
}

/** Tells the owner of an existing address that someone tried to register it, instead of telling the stranger. */
async function noticeForExisting(email: string, name: string): Promise<never> {
  if (allowAttempt(`mail:${email}`, 3)) {
    const message = alreadyRegisteredMessage(name);
    await sendMail(email, message.subject, message.text);
  }
  redirect("/login?notice=check-email");
}

export async function signUp(_previous: FormState, form: FormData): Promise<FormState> {
  const values = {
    full_name: text(form, "full_name", 120),
    email: text(form, "email", 200).toLowerCase(),
    job_title: text(form, "job_title", 120),
    department: text(form, "department", 60),
    office: text(form, "office", 20),
  };
  const password = secret(form, "password");
  const confirm = secret(form, "confirm");

  const fieldErrors: Record<string, string> = {};
  if (values.full_name.length < 2) fieldErrors.full_name = "Enter your full name.";
  const policy = signupPolicy(values.email);
  if (policy === "closed") return { error: "Sign-up is closed. Ask an administrator to open it.", values };
  if (policy === "unverifiable") {
    return { error: "Sign-up needs email confirmation, which is not set up yet. Ask an administrator.", values };
  }
  if (!EMAIL_PATTERN.test(values.email)) fieldErrors.email = "Enter a valid work email.";
  else if (policy === "domain") fieldErrors.email = "Use your company email address.";
  if (values.job_title.length < 2) fieldErrors.job_title = "Enter your job title.";
  if (!DEPARTMENTS.includes(values.department)) fieldErrors.department = "Choose a department.";
  if (!OFFICES.some((office) => office.id === values.office)) fieldErrors.office = "Choose an office.";
  const problem = passwordProblem(password, { email: values.email, name: values.full_name });
  if (problem) fieldErrors.password = problem;
  if (confirm !== password) fieldErrors.confirm = "The passwords do not match.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  if (!allowAttempt(`signup:${await clientKey()}`, SIGNUP_ATTEMPTS) || !allowAttempt("signup-all", SIGNUP_ATTEMPTS_ALL)) {
    return { error: "Too many sign-up attempts. Try again in 15 minutes.", values };
  }

  // With email on, a new account must confirm its address first, and the response is the same whether or not the
  // address is already registered, so sign-up cannot be used to find out who has an account.
  const confirmByMail = mailEnabled();
  const database = db();
  // Hash first so a new address and a known one take about the same time.
  const passwordHash = await hashPassword(password);
  const existing = database.prepare("SELECT full_name FROM users WHERE email = ?").get(values.email) as { full_name: string } | undefined;
  if (existing) {
    if (!confirmByMail) return { fieldErrors: { email: "An account with this email already exists. Sign in instead." }, values };
    return noticeForExisting(values.email, existing.full_name);
  }

  let id: number;
  let becameAdmin = false;
  try {
    // One transaction, so a crash cannot leave a half-made account, and two sign-ups cannot both become the first admin.
    ({ id, becameAdmin } = transaction(() => {
      const result = database
        .prepare(
          `INSERT INTO users (employee_id, full_name, email, password_hash, job_title, department, office, email_verified_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          `pending-${randomBytes(8).toString("hex")}`,
          values.full_name,
          values.email,
          passwordHash,
          values.job_title,
          values.department,
          values.office,
          confirmByMail ? null : new Date().toISOString(),
        );
      const newId = Number(result.lastInsertRowid);
      database.prepare("UPDATE users SET employee_id = ? WHERE id = ?").run(`NV-${String(newId).padStart(4, "0")}`, newId);
      // The first account on a new portal becomes the admin, so someone can manage roles and teams.
      const promoted = database
        .prepare("UPDATE users SET role = 'admin' WHERE id = ? AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin')")
        .run(newId);
      return { id: newId, becameAdmin: Number(promoted.changes) > 0 };
    }));
  } catch (error) {
    // Two sign-ups with the same email at the same moment: the second hits the UNIQUE constraint.
    if (error instanceof Error && /UNIQUE/i.test(error.message)) {
      if (confirmByMail) redirect("/login?notice=check-email");
      return { fieldErrors: { email: "An account with this email already exists. Sign in instead." }, values };
    }
    throw error;
  }
  audit({ id, email: values.email }, "signup");
  if (becameAdmin) audit({ id, email: values.email }, "signup.admin", "first account became admin");

  if (confirmByMail) {
    const message = verifyEmailMessage(values.full_name, createToken(id, "verify"));
    await sendMail(values.email, message.subject, message.text);
    redirect("/login?notice=check-email");
  }

  await startSession(id);
  redirect("/pims?welcome=1");
}

export async function signIn(_previous: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email", 200).toLowerCase();
  const password = secret(form, "password");
  const values = { email };

  if (!EMAIL_PATTERN.test(email) || password === "") {
    return { error: "Enter your email and password.", values };
  }

  // Two limits: a tight one per caller and account, and a looser one per account alone, so guesses spread across many
  // addresses still run out. Checked in this order so a blocked caller does not use up the account's allowance.
  const key = `signin:${await clientKey()}:${email}`;
  const accountKey = `signin-account:${email}`;
  if (!allowAttempt(key, 5) || !allowAttempt(accountKey, ACCOUNT_ATTEMPTS)) {
    // Once per email per window, so a flood of blocked attempts cannot flood the log as well.
    if (allowAttempt(`audit:${email}`, 1)) audit(null, "signin.blocked", email);
    return { error: "Too many attempts. Wait 15 minutes and try again.", values };
  }

  const user = db().prepare("SELECT id, password_hash, email_verified_at FROM users WHERE email = ?").get(email) as
    | Pick<UserRow, "id" | "password_hash" | "email_verified_at">
    | undefined;
  const { valid, rehash } = await checkPassword(password, user?.password_hash ?? (await decoy()));
  if (!user || !valid) {
    // Only for real accounts, and only as often as the limits allow, so made-up emails cannot fill the log.
    if (user) audit({ id: user.id, email }, "signin.failed", "wrong password");
    return { error: "The email or password is not right.", values };
  }

  clearAttempts(key);
  clearAttempts(accountKey);
  // Hashes made with older, cheaper settings are replaced now, while the real password is at hand.
  if (rehash) await upgradeHash(user.id, password);
  if (!user.email_verified_at) {
    return { error: "Confirm your email address first. Use the link we emailed you, or ask for a new one below.", values };
  }
  await startSession(user.id);
  audit({ id: user.id, email }, "signin.success");
  redirect("/");
}

export async function signOut() {
  await endSession();
  redirect("/login");
}
