import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

process.env.PORTAL_DB_PATH = join(mkdtempSync(join(tmpdir(), "portal-tokens-")), "data", "test.db");
const { db } = await import("../lib/db.ts");
const { consumeToken, createToken, findToken } = await import("../lib/email-tokens.ts");

const userId = Number(
  db().prepare("INSERT INTO users (employee_id, full_name, email, password_hash) VALUES ('NV-T', 'T', 't@example.com', 'x')").run().lastInsertRowid,
);

test("a token is found for its own purpose and user, and only the hash is stored", () => {
  const token = createToken(userId, "reset");
  assert.equal(findToken(token, "reset"), userId);
  assert.equal(findToken(token, "verify"), null);
  const stored = db().prepare("SELECT token_hash FROM email_tokens").all() as { token_hash: string }[];
  assert.ok(stored.every((row) => row.token_hash !== token));
});

test("a token works once", () => {
  const token = createToken(userId, "verify");
  assert.equal(consumeToken(token, "verify"), userId);
  assert.equal(consumeToken(token, "verify"), null);
  assert.equal(findToken(token, "verify"), null);
});

test("a new token replaces the older one of the same kind", () => {
  const first = createToken(userId, "reset");
  const second = createToken(userId, "reset");
  assert.equal(findToken(first, "reset"), null);
  assert.equal(findToken(second, "reset"), userId);
});

test("expired, empty, oversized and made-up tokens are refused", () => {
  const token = createToken(userId, "reset");
  db().prepare("UPDATE email_tokens SET expires_at = ?").run(Date.now() - 1);
  assert.equal(findToken(token, "reset"), null);
  assert.equal(consumeToken("", "reset"), null);
  assert.equal(consumeToken("x".repeat(500), "reset"), null);
  assert.equal(consumeToken("not-a-real-token", "reset"), null);
});

test("deleting the user removes their tokens", () => {
  const token = createToken(userId, "verify");
  db().prepare("DELETE FROM users WHERE id = ?").run(userId);
  assert.equal(findToken(token, "verify"), null);
});
