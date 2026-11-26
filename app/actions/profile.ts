"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { endOtherSessions, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { secret, text, type FormState } from "@/lib/form";
import { passwordProblem } from "@/lib/password-policy";
import { DEPARTMENTS, OFFICES } from "@/lib/profile";
import { allowAttempt, clearAttempts } from "@/lib/rate-limit";

const PHONE_PATTERN = /^[+()\d\s-]{6,20}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function updateProfile(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const values = {
    full_name: text(form, "full_name", 120),
    job_title: text(form, "job_title", 120),
    department: text(form, "department", 60),
    office: text(form, "office", 20),
    phone: text(form, "phone", 20),
    start_date: text(form, "start_date", 10),
    bio: text(form, "bio", 600),
  };

  const fieldErrors: Record<string, string> = {};
  if (values.full_name.length < 2) fieldErrors.full_name = "Enter your full name.";
  if (values.job_title.length < 2) fieldErrors.job_title = "Enter your job title.";
  if (!DEPARTMENTS.includes(values.department)) fieldErrors.department = "Choose a department.";
  if (!OFFICES.some((office) => office.id === values.office)) fieldErrors.office = "Choose an office.";
  if (values.phone && !PHONE_PATTERN.test(values.phone)) fieldErrors.phone = "Use digits, spaces, + or -.";
  if (values.start_date && !DATE_PATTERN.test(values.start_date)) fieldErrors.start_date = "Pick a valid date.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  db()
    .prepare(
      `UPDATE users SET full_name = ?, job_title = ?, department = ?, office = ?, phone = ?, start_date = ?, bio = ?
       WHERE id = ?`,
    )
    .run(values.full_name, values.job_title, values.department, values.office, values.phone, values.start_date, values.bio, user.id);

  revalidatePath("/", "layout");
  return { success: "Your details are saved.", values };
}

export async function changePassword(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const current = secret(form, "current");
  const next = secret(form, "password");
  const confirm = secret(form, "confirm");

  const fieldErrors: Record<string, string> = {};
  const problem = passwordProblem(next, { email: user.email, name: user.full_name });
  if (problem) fieldErrors.password = problem;
  else if (next === current) fieldErrors.password = "Choose a password you have not used before.";
  if (confirm !== next) fieldErrors.confirm = "The passwords do not match.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  // Someone holding a stolen session must not be able to guess the current password without limit.
  if (!allowAttempt(`password-change:${user.id}`, 5)) {
    return { error: "Too many attempts. Wait 15 minutes and try again." };
  }
  const row = db().prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string };
  if (!(await verifyPassword(current, row.password_hash))) {
    return { fieldErrors: { current: "Your current password is not right." } };
  }
  clearAttempts(`password-change:${user.id}`);

  db().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(await hashPassword(next), user.id);
  // A changed password must also end any session someone else may be holding.
  await endOtherSessions(user.id);
  audit(user, "password.changed");
  return { success: "Your password is changed." };
}
