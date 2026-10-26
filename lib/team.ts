import "server-only";
import { db, type TeamRow } from "@/lib/db";

export type Person = {
  id: number;
  employee_id: string;
  full_name: string;
  email: string;
  job_title: string;
  department: string;
  office: string;
  role: string;
  created_at: string;
  team_count: number;
};

export type TeamSummary = TeamRow & {
  lead_name: string | null;
  member_count: number;
  /** Up to five member names, for the avatar stack. */
  preview: string[];
};

export type TeamMember = Pick<Person, "id" | "full_name" | "email" | "job_title" | "department" | "office" | "role"> & { added_at: string };

/** node:sqlite rows have no prototype, which React cannot send to client components, so copy them. */
const plain = <T,>(rows: unknown[]) => rows.map((row) => ({ ...(row as object) }) as T);

export function listPeople(): Person[] {
  const people = db()
    .prepare(
      `SELECT u.id, u.employee_id, u.full_name, u.email, u.job_title, u.department, u.office, u.role, u.created_at,
              (SELECT COUNT(*) FROM team_members m WHERE m.user_id = u.id) AS team_count
       FROM users u ORDER BY u.full_name COLLATE NOCASE`,
    )
    .all();
  return plain<Person>(people);
}

export function listTeams(): TeamSummary[] {
  const rows = db()
    .prepare(
      `SELECT t.*, l.full_name AS lead_name,
              (SELECT COUNT(*) FROM team_members m WHERE m.team_id = t.id) AS member_count
       FROM teams t LEFT JOIN users l ON l.id = t.lead_id
       ORDER BY t.name COLLATE NOCASE`,
    )
    .all();
  const teams = plain<Omit<TeamSummary, "preview">>(rows);
  const preview = db().prepare(
    `SELECT u.full_name FROM team_members m JOIN users u ON u.id = m.user_id
     WHERE m.team_id = ? ORDER BY (u.id = ?) DESC, m.added_at LIMIT 5`,
  );
  return teams.map((team) => ({
    ...team,
    preview: (preview.all(team.id, team.lead_id ?? 0) as { full_name: string }[]).map((row) => row.full_name),
  }));
}

export function getTeam(id: number) {
  const team = db()
    .prepare("SELECT t.*, l.full_name AS lead_name FROM teams t LEFT JOIN users l ON l.id = t.lead_id WHERE t.id = ?")
    .get(id) as (TeamRow & { lead_name: string | null }) | undefined;
  if (!team) return null;
  const members = db()
    .prepare(
      `SELECT u.id, u.full_name, u.email, u.job_title, u.department, u.office, u.role, m.added_at
       FROM team_members m JOIN users u ON u.id = m.user_id
       WHERE m.team_id = ? ORDER BY (u.id = ?) DESC, u.full_name COLLATE NOCASE`,
    )
    .all(id, team.lead_id ?? 0);
  return { team: { ...team }, members: plain<TeamMember>(members) };
}

export function teamsFor(userId: number) {
  const rows = db()
    .prepare(
      `SELECT t.id, t.name, (t.lead_id = ?) AS is_lead FROM team_members m JOIN teams t ON t.id = m.team_id
       WHERE m.user_id = ? ORDER BY t.name COLLATE NOCASE`,
    )
    .all(userId, userId);
  return plain<{ id: number; name: string; is_lead: number }>(rows);
}
