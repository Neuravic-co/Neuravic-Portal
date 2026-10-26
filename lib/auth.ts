import "server-only";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, type UserRow } from "@/lib/db";

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export const SESSION_COOKIE = "nv_session";
const SESSION_DAYS = 14;
const KEY_LENGTH = 64;

export type User = Omit<UserRow, "password_hash">;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, salt, key] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !key) return false;
  const expected = Buffer.from(key, "base64");
  const actual = await scryptAsync(password, Buffer.from(salt, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
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
    secure: process.env.NODE_ENV === "production",
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

/** The signed-in user, or null. Cached for the length of one request. */
export const currentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = db()
    .prepare(
      `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(hashToken(token), Date.now()) as UserRow | undefined;
  if (!row) return null;
  const { password_hash: _hash, ...user } = row;
  void _hash;
  return user;
});

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
