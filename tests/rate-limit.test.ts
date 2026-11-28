import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

process.env.PORTAL_DB_PATH = join(mkdtempSync(join(tmpdir(), "portal-rate-")), "data", "test.db");
const { allowAttempt, clearAttempts } = await import("../lib/rate-limit.ts");
const { db } = await import("../lib/db.ts");

test("allows up to the limit, then blocks", () => {
  for (let i = 0; i < 3; i++) assert.equal(allowAttempt("a", 3), true);
  assert.equal(allowAttempt("a", 3), false);
  assert.equal(allowAttempt("a", 3), false);
});

test("keys are independent", () => {
  assert.equal(allowAttempt("b1", 1), true);
  assert.equal(allowAttempt("b1", 1), false);
  assert.equal(allowAttempt("b2", 1), true);
});

test("clearAttempts resets a key", () => {
  allowAttempt("c", 1);
  assert.equal(allowAttempt("c", 1), false);
  clearAttempts("c");
  assert.equal(allowAttempt("c", 1), true);
});

test("attempts older than the window stop counting", () => {
  assert.equal(allowAttempt("old", 1), true);
  assert.equal(allowAttempt("old", 1), false);
  db().prepare("UPDATE rate_limits SET at = at - ? WHERE key = 'old'").run(16 * 60 * 1000);
  assert.equal(allowAttempt("old", 1), true);
});

test("attempts are stored in the database, so they survive a restart", () => {
  allowAttempt("persisted", 2);
  const row = db().prepare("SELECT COUNT(*) AS count FROM rate_limits WHERE key = 'persisted'").get() as { count: number };
  assert.equal(row.count, 1);
});

test("a flood of distinct keys stays bounded and recent keys still count", () => {
  for (let i = 0; i < 12_000; i++) allowAttempt(`flood-${i}`, 5);
  assert.equal(allowAttempt("recent", 1), true);
  assert.equal(allowAttempt("recent", 1), false);
  const total = db().prepare("SELECT COUNT(*) AS count FROM rate_limits").get() as { count: number };
  assert.ok(total.count <= 50_000);
});
