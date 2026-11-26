import assert from "node:assert/strict";
import { mkdtempSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

process.env.PORTAL_DB_PATH = join(mkdtempSync(join(tmpdir(), "portal-db-")), "data", "test.db");
const { db, transaction, databaseReady } = await import("../lib/db.ts");
const { audit } = await import("../lib/audit.ts");

const addUser = (email: string) =>
  db()
    .prepare("INSERT INTO users (employee_id, full_name, email, password_hash) VALUES (?, ?, ?, 'x')")
    .run(`NV-${email}`, email, email);

test("schema is created and the database reports ready", () => {
  const tables = (db().prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]).map((t) => t.name);
  for (const name of ["users", "sessions", "entities", "teams", "team_members", "audit_log"]) assert.ok(tables.includes(name), name);
  assert.equal(databaseReady(), true);
});

test("foreign keys are enforced and WAL is on", () => {
  assert.equal((db().prepare("PRAGMA foreign_keys").get() as { foreign_keys: number }).foreign_keys, 1);
  assert.equal((db().prepare("PRAGMA journal_mode").get() as { journal_mode: string }).journal_mode, "wal");
  assert.throws(() => db().prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ('t', 9999, 1)").run());
});

test("emails are unique", () => {
  addUser("dup@example.com");
  assert.throws(() => addUser("dup@example.com"), /UNIQUE/i);
});

test("transaction commits on success and rolls back on error", () => {
  transaction(() => addUser("kept@example.com"));
  assert.ok(db().prepare("SELECT 1 FROM users WHERE email = 'kept@example.com'").get());
  assert.throws(
    () =>
      transaction(() => {
        addUser("lost@example.com");
        throw new Error("boom");
      }),
    /boom/,
  );
  assert.equal(db().prepare("SELECT 1 FROM users WHERE email = 'lost@example.com'").get(), undefined);
  // The connection is usable afterwards.
  assert.equal(databaseReady(), true);
});

test("deleting a user removes their sessions and memberships but keeps teams", () => {
  const user = Number(addUser("cascade@example.com").lastInsertRowid);
  const team = Number(db().prepare("INSERT INTO teams (name, lead_id) VALUES ('Cascade', ?)").run(user).lastInsertRowid);
  db().prepare("INSERT INTO team_members (team_id, user_id) VALUES (?, ?)").run(team, user);
  db().prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ('s', ?, 1)").run(user);
  db().prepare("DELETE FROM users WHERE id = ?").run(user);
  assert.equal(db().prepare("SELECT 1 FROM sessions WHERE token_hash = 's'").get(), undefined);
  assert.equal(db().prepare("SELECT 1 FROM team_members WHERE team_id = ?").get(team), undefined);
  assert.equal((db().prepare("SELECT lead_id FROM teams WHERE id = ?").get(team) as { lead_id: number | null }).lead_id, null);
});

test("audit rows are written and long details are cut", () => {
  audit({ id: 1, email: "a@b.co" }, "role.changed", "x".repeat(1000));
  const row = db().prepare("SELECT action, actor_email, detail FROM audit_log ORDER BY id DESC LIMIT 1").get() as {
    action: string;
    actor_email: string;
    detail: string;
  };
  assert.equal(row.action, "role.changed");
  assert.equal(row.actor_email, "a@b.co");
  assert.equal(row.detail.length, 300);
});

test("the database file is owner-only on POSIX systems", { skip: process.platform === "win32" }, () => {
  assert.equal(statSync(process.env.PORTAL_DB_PATH!).mode & 0o077, 0);
});
