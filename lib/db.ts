import "server-only";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

export type UserRow = {
  id: number;
  employee_id: string;
  full_name: string;
  email: string;
  password_hash: string;
  job_title: string;
  department: string;
  office: string;
  phone: string;
  start_date: string;
  bio: string;
  created_at: string;
  last_login_at: string | null;
};

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    job_title TEXT NOT NULL DEFAULT '',
    department TEXT NOT NULL DEFAULT '',
    office TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    start_date TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    last_login_at TEXT
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
`;

const globalForDb = globalThis as unknown as { portalDb?: DatabaseSync };

/** One SQLite file, opened once per server process. Set PORTAL_DB_PATH to move it. */
export function db() {
  if (!globalForDb.portalDb) {
    const configured = process.env.PORTAL_DB_PATH;
    const file = configured ? resolve(/*turbopackIgnore: true*/ configured) : join(process.cwd(), "data", "portal.db");
    mkdirSync(dirname(file), { recursive: true });
    const database = new DatabaseSync(file);
    database.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    database.exec(SCHEMA);
    globalForDb.portalDb = database;
  }
  return globalForDb.portalDb;
}
