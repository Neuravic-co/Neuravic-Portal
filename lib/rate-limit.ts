import "server-only";
import { db, transaction } from "./db.ts";

const WINDOW_MS = 15 * 60 * 1000;
/** Upper bound on stored attempts, so a flood of made-up emails cannot grow the database without limit. */
const MAX_ROWS = 50_000;
const SWEEP_EVERY = 500;
let inserts = 0;
let lastSweep = 0;

/** Drops attempts older than the window; if the table is still too big, drops the oldest rows. */
function sweep(now: number) {
  const database = db();
  database.prepare("DELETE FROM rate_limits WHERE at <= ?").run(now - WINDOW_MS);
  const { count } = database.prepare("SELECT COUNT(*) AS count FROM rate_limits").get() as { count: number };
  if (count > MAX_ROWS) {
    database
      .prepare("DELETE FROM rate_limits WHERE rowid IN (SELECT rowid FROM rate_limits ORDER BY at ASC LIMIT ?)")
      .run(count - MAX_ROWS);
  }
}

/**
 * Allows `limit` attempts per key in a 15 minute window. Attempts live in the portal database, so they survive a
 * restart and are shared by every server process that uses the same database file.
 */
export function allowAttempt(key: string, limit: number) {
  const now = Date.now();
  return transaction(() => {
    inserts += 1;
    if (inserts % SWEEP_EVERY === 0 || now - lastSweep >= WINDOW_MS) {
      lastSweep = now;
      sweep(now);
    }
    const { count } = db()
      .prepare("SELECT COUNT(*) AS count FROM rate_limits WHERE key = ? AND at > ?")
      .get(key, now - WINDOW_MS) as { count: number };
    if (count >= limit) return false;
    db().prepare("INSERT INTO rate_limits (key, at) VALUES (?, ?)").run(key, now);
    return true;
  });
}

export function clearAttempts(key: string) {
  db().prepare("DELETE FROM rate_limits WHERE key = ?").run(key);
}
