import "server-only";
import { db, type EntityRow, type TeamRow } from "@/lib/db";

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
  entity_name: string | null;
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
      `SELECT t.*, l.full_name AS lead_name, e.name AS entity_name,
              (SELECT COUNT(*) FROM team_members m WHERE m.team_id = t.id) AS member_count
       FROM teams t LEFT JOIN users l ON l.id = t.lead_id LEFT JOIN entities e ON e.id = t.entity_id
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
    .prepare(
      `SELECT t.*, l.full_name AS lead_name, e.name AS entity_name
       FROM teams t LEFT JOIN users l ON l.id = t.lead_id LEFT JOIN entities e ON e.id = t.entity_id WHERE t.id = ?`,
    )
    .get(id) as (TeamRow & { lead_name: string | null; entity_name: string | null }) | undefined;
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

export function listEntities(): EntityRow[] {
  return plain<EntityRow>(db().prepare("SELECT * FROM entities ORDER BY name COLLATE NOCASE").all());
}

export type HierarchyPerson = { id: number; full_name: string; job_title: string; role: string };
export type HierarchyTeam = { id: number; name: string; description: string; lead_id: number | null; members: HierarchyPerson[] };
export type HierarchyEntity = EntityRow & { teams: HierarchyTeam[] };

/** The whole organisation as Entity → Teams → People, plus whatever is not placed yet. */
export function getHierarchy() {
  const database = db();
  const teams = plain<TeamRow>(database.prepare("SELECT * FROM teams ORDER BY name COLLATE NOCASE").all());
  const memberships = plain<HierarchyPerson & { team_id: number }>(
    database
      .prepare(
        `SELECT m.team_id, u.id, u.full_name, u.job_title, u.role
         FROM team_members m JOIN users u ON u.id = m.user_id ORDER BY u.full_name COLLATE NOCASE`,
      )
      .all(),
  );

  const byTeam = new Map<number, HierarchyPerson[]>();
  for (const { team_id, ...person } of memberships) byTeam.set(team_id, [...(byTeam.get(team_id) ?? []), person]);

  const toNode = (team: TeamRow): HierarchyTeam => {
    // The lead goes first, then everyone else by name.
    const members = [...(byTeam.get(team.id) ?? [])].sort((a, b) => Number(b.id === team.lead_id) - Number(a.id === team.lead_id));
    return { id: team.id, name: team.name, description: team.description, lead_id: team.lead_id, members };
  };

  const entities: HierarchyEntity[] = listEntities().map((entity) => ({
    ...entity,
    teams: teams.filter((team) => team.entity_id === entity.id).map(toNode),
  }));
  const unassignedTeams = teams.filter((team) => team.entity_id === null).map(toNode);

  const placed = new Set(memberships.map((membership) => membership.id));
  const unplacedPeople = listPeople()
    .filter((person) => !placed.has(person.id))
    .map(({ id, full_name, job_title, role }) => ({ id, full_name, job_title, role }));

  return { entities, unassignedTeams, unplacedPeople };
}
