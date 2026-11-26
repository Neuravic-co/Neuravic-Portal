import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, type UserRow } from "@/lib/db";
import { hashPassword } from "@/lib/password-hash";

export { checkPassword, hashPassword, verifyPassword } from "@/lib/password-hash";

const PRODUCTION = process.env.NODE_ENV === "production";
/** In production the `__Host-` prefix makes browsers refuse the cookie unless it is Secure, path "/" and has no Domain. */
export const SESSION_COOKIE = PRODUCTION ? "__Host-nv_session" : "nv_session";
const SESSION_DAYS = 14;

export type User = Omit<UserRow, "password_hash">;

/** Replaces a stored hash with one at today's cost. Called after a successful sign-in with an older hash. */
export async function upgradeHash(userId: number, password: string) {
  db().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(await hashPassword(password), userId);
}

/** A fixed hash to compare against when the email is unknown, so both paths take the same time. */
let decoyHash: Promise<string> | undefined;
export function decoy() {
  decoyHash ??= hashPassword(randomBytes(16).toString("hex"));
  return decoyHash;
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function startSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const database = db();
  database.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
  database.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(hashToken(token), userId, expires);
  database.prepare("UPDATE users SET last_login_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?").run(userId);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: PRODUCTION,
    path: "/",
    expires: new Date(expires),
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  jar.delete(SESSION_COOKIE);
}

/** Signs a person out everywhere except the browser making this request, for example after a password change. */
export async function endOtherSessions(userId: number) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const keep = token ? hashToken(token) : "";
  db().prepare("DELETE FROM sessions WHERE user_id = ? AND token_hash != ?").run(userId, keep);
}

/** The signed-in user, or null. Cached for the length of one request. */
export const currentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = db()
    .prepare(
      `SELECT u.id, u.employee_id, u.full_name, u.email, u.job_title, u.department, u.office, u.phone, u.start_date,
              u.bio, u.role, u.created_at, u.last_login_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(hashToken(token), Date.now()) as User | undefined;
  // node:sqlite rows have no prototype; copy so the user can be passed to client components safely.
  return row ? { ...row } : null;
});

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
