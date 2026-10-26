"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { decoy, endSession, hashPassword, startSession, verifyPassword } from "@/lib/auth";
import { db, type UserRow } from "@/lib/db";
import { EMAIL_PATTERN, secret, text, type FormState } from "@/lib/form";
import { DEPARTMENTS, OFFICES, PASSWORD_MIN } from "@/lib/profile";
import { allowAttempt, clearAttempts } from "@/lib/rate-limit";

async function clientKey() {
  const list = await headers();
  return list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || "local";
}

/** Optional allow-list, for example "neuravic.com". Empty means any address can sign up. */
function emailDomainAllowed(email: string) {
  const allowed = (process.env.PORTAL_ALLOWED_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
  return allowed.length === 0 || allowed.includes(email.split("@")[1] ?? "");
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
  if (!EMAIL_PATTERN.test(values.email)) fieldErrors.email = "Enter a valid work email.";
  else if (!emailDomainAllowed(values.email)) fieldErrors.email = "Use your company email address.";
  if (values.job_title.length < 2) fieldErrors.job_title = "Enter your job title.";
  if (!DEPARTMENTS.includes(values.department)) fieldErrors.department = "Choose a department.";
  if (!OFFICES.some((office) => office.id === values.office)) fieldErrors.office = "Choose an office.";
  if (password.length < PASSWORD_MIN) fieldErrors.password = `Use at least ${PASSWORD_MIN} characters.`;
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

  const key = `signin:${await clientKey()}:${email}`;
  if (!allowAttempt(key, 5)) {
    return { error: "Too many attempts. Wait 15 minutes and try again.", values };
  }

  const user = db().prepare("SELECT id, password_hash FROM users WHERE email = ?").get(email) as Pick<UserRow, "id" | "password_hash"> | undefined;
  const valid = await verifyPassword(password, user?.password_hash ?? (await decoy()));
  if (!user || !valid) return { error: "The email or password is not right.", values };

  clearAttempts(key);
  await startSession(user.id);
  redirect("/");
}

export async function signOut() {
  await endSession();
  redirect("/login");
}
