import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db, transaction } from "./db.ts";

export type TokenPurpose = "verify" | "reset";

/** How long each kind of link works. Reset links are short-lived because they grant account access. */
const LIFETIME_MS: Record<TokenPurpose, number> = {
  verify: 24 * 60 * 60 * 1000,
  reset: 60 * 60 * 1000,
};

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Makes a single-use link token. Only its SHA-256 is stored, and any older token of the same kind is dropped. */
export function createToken(userId: number, purpose: TokenPurpose) {
  const token = randomBytes(32).toString("base64url");
  const database = db();
  transaction(() => {
    database.prepare("DELETE FROM email_tokens WHERE expires_at < ?").run(Date.now());
    database.prepare("DELETE FROM email_tokens WHERE user_id = ? AND purpose = ?").run(userId, purpose);
    database
      .prepare("INSERT INTO email_tokens (token_hash, user_id, purpose, expires_at) VALUES (?, ?, ?, ?)")
      .run(hashToken(token), userId, purpose, Date.now() + LIFETIME_MS[purpose]);
  });
  return token;
}

/** Who a token belongs to, without using it up. Null if it is unknown, expired or for another purpose. */
export function findToken(token: string, purpose: TokenPurpose) {
  if (!token || token.length > 100) return null;
  const row = db()
    .prepare("SELECT user_id FROM email_tokens WHERE token_hash = ? AND purpose = ? AND expires_at > ?")
    .get(hashToken(token), purpose, Date.now()) as { user_id: number } | undefined;
  return row ? row.user_id : null;
}

/** Uses a token up. Returns the user id once, and null for every later attempt, so a link works only one time. */
export function consumeToken(token: string, purpose: TokenPurpose) {
  if (!token || token.length > 100) return null;
  return transaction(() => {
    const userId = findToken(token, purpose);
    if (userId === null) return null;
    db().prepare("DELETE FROM email_tokens WHERE token_hash = ?").run(hashToken(token));
    return userId;
  });
}
