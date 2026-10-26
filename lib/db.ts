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
  role: string;
  created_at: string;
  last_login_at: string | null;
};

export type EntityRow = {
  id: number;
  name: string;
  description: string;
  created_at: string;
};

export type TeamRow = {
  id: number;
  entity_id: number | null;
  name: string;
  description: string;
  lead_id: number | null;
  created_by: number | null;
  created_at: string;
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
    role TEXT NOT NULL DEFAULT 'member',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    last_login_at TEXT
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
  CREATE TABLE IF NOT EXISTS entities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_id INTEGER REFERENCES entities(id) ON DELETE SET NULL,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    description TEXT NOT NULL DEFAULT '',
    lead_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
  CREATE TABLE IF NOT EXISTS team_members (
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    added_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    PRIMARY KEY (team_id, user_id)
  );
  CREATE INDEX IF NOT EXISTS team_members_user ON team_members(user_id);
`;

/** Brings a database made by an earlier version of the portal up to date. */
function migrate(database: DatabaseSync) {
  const columns = database.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!columns.some((column) => column.name === "role")) {
    database.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'member'");
  }
  const teamColumns = database.prepare("PRAGMA table_info(teams)").all() as { name: string }[];
  if (!teamColumns.some((column) => column.name === "entity_id")) {
    database.exec("ALTER TABLE teams ADD COLUMN entity_id INTEGER REFERENCES entities(id) ON DELETE SET NULL");
  }
  database.exec("CREATE INDEX IF NOT EXISTS teams_entity ON teams(entity_id)");
  // Someone has to be able to hand out roles: if there is no admin yet, the earliest account becomes one.
  database.exec(`
    UPDATE users SET role = 'admin'
    WHERE id = (SELECT MIN(id) FROM users) AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin')
  `);
}

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
    migrate(database);
    globalForDb.portalDb = database;
  }
  return globalForDb.portalDb;
}
