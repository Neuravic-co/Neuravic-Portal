"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { decoy, endSession, hashPassword, startSession, verifyPassword } from "@/lib/auth";
import { db, type UserRow } from "@/lib/db";
import { EMAIL_PATTERN, secret, text, type FormState } from "@/lib/form";
import { passwordProblem } from "@/lib/password-policy";
import { DEPARTMENTS, OFFICES } from "@/lib/profile";
import { allowAttempt, clearAttempts } from "@/lib/rate-limit";

/** Failed or successful sign-in attempts allowed per account in 15 minutes, from all addresses together. */
const ACCOUNT_ATTEMPTS = 15;

/**
 * Who is calling, for rate limiting. Forwarding headers are client-controlled unless a reverse proxy overwrites them,
 * so they are only trusted when PORTAL_TRUST_PROXY=true. Otherwise every caller shares one bucket, which can never be
 * dodged by sending a different header on each request.
 */
async function clientKey() {
  if (process.env.PORTAL_TRUST_PROXY !== "true") return "shared";
  const list = await headers();
  const forwarded = list.get("x-forwarded-for")?.split(",");
  // The last entry is the one our own proxy appended; earlier ones can be forged by the client.
  return forwarded?.at(-1)?.trim() || list.get("x-real-ip") || "shared";
}

/**
 * Who may create an account. Set PORTAL_ALLOWED_EMAIL_DOMAINS (for example "neuravic.com") to allow company
 * addresses only. In production, sign-up stays closed until that is set, or until PORTAL_ALLOW_OPEN_SIGNUP=true says
 * anyone may join; otherwise the first stranger to find a fresh deployment would become its admin.
 */
function signupPolicy(email: string): "ok" | "closed" | "domain" {
  const allowed = (process.env.PORTAL_ALLOWED_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length > 0) return allowed.includes(email.split("@")[1] ?? "") ? "ok" : "domain";
  const open = process.env.NODE_ENV !== "production" || process.env.PORTAL_ALLOW_OPEN_SIGNUP === "true";
  return open ? "ok" : "closed";
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
  if (!EMAIL_PATTERN.test(values.email)) fieldErrors.email = "Enter a valid work email.";
  else if (policy === "domain") fieldErrors.email = "Use your company email address.";
  if (values.job_title.length < 2) fieldErrors.job_title = "Enter your job title.";
  if (!DEPARTMENTS.includes(values.department)) fieldErrors.department = "Choose a department.";
  if (!OFFICES.some((office) => office.id === values.office)) fieldErrors.office = "Choose an office.";
  const problem = passwordProblem(password, { email: values.email, name: values.full_name });
  if (problem) fieldErrors.password = problem;
  if (confirm !== password) fieldErrors.confirm = "The passwords do not match.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  if (!allowAttempt(`signup:${await clientKey()}`, 10)) {
    return { error: "Too many sign-up attempts. Try again in 15 minutes.", values };
  }

  const database = db();
  if (database.prepare("SELECT 1 FROM users WHERE email = ?").get(values.email)) {
    return { fieldErrors: { email: "An account with this email already exists. Sign in instead." }, values };
  }

  const passwordHash = await hashPassword(password);
  const result = database
    .prepare(
      `INSERT INTO users (employee_id, full_name, email, password_hash, job_title, department, office)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(`pending-${randomBytes(8).toString("hex")}`, values.full_name, values.email, passwordHash, values.job_title, values.department, values.office);
  const id = Number(result.lastInsertRowid);
  database.prepare("UPDATE users SET employee_id = ? WHERE id = ?").run(`NV-${String(id).padStart(4, "0")}`, id);
  // The first account on a new portal becomes the admin, so someone can manage roles and teams.
  const promoted = database.prepare("UPDATE users SET role = 'admin' WHERE id = ? AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin')").run(id);
  if (Number(promoted.changes) > 0) audit({ id, email: values.email }, "signup.admin", "first account became admin");

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

  const user = db().prepare("SELECT id, password_hash FROM users WHERE email = ?").get(email) as Pick<UserRow, "id" | "password_hash"> | undefined;
  const valid = await verifyPassword(password, user?.password_hash ?? (await decoy()));
  if (!user || !valid) return { error: "The email or password is not right.", values };

  clearAttempts(key);
  clearAttempts(accountKey);
  await startSession(user.id);
  redirect("/");
}

export async function signOut() {
  await endSession();
  redirect("/login");
}
