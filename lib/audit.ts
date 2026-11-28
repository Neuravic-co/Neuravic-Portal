import "server-only";
import { db } from "./db.ts";

export type AuditAction =
  | "signup.admin"
  | "signin.blocked"
  | "signin.success"
  | "signin.failed"
  | "signup"
  | "email.verified"
  | "password.reset.requested"
  | "password.reset"
  | "password.changed"
  | "role.changed"
  | "team.deleted"
  | "entity.deleted";

/**
 * Records who did something sensitive. Rows go in the `audit_log` table (read it with any SQLite tool). It must never
 * stop the action it describes, so a failure to write is logged and swallowed.
 */
export function audit(actor: { id: number; email?: string } | null, action: AuditAction, detail = "") {
  try {
    db()
      .prepare("INSERT INTO audit_log (actor_id, actor_email, action, detail) VALUES (?, ?, ?, ?)")
      .run(actor?.id ?? null, actor?.email ?? "", action, detail.slice(0, 300));
  } catch (error) {
    console.error("audit log write failed", error);
  }
}
