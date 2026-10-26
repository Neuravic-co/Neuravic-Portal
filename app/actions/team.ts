"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db, type TeamRow } from "@/lib/db";
import { text, type FormState } from "@/lib/form";
import { asRole, canCreateTeams, canManageTeam, ROLES } from "@/lib/roles";

const NOT_ALLOWED: FormState = { error: "You do not have permission to do that." };

function findTeam(id: number) {
  return db().prepare("SELECT * FROM teams WHERE id = ?").get(id) as TeamRow | undefined;
}

function userExists(id: number) {
  return Boolean(db().prepare("SELECT 1 FROM users WHERE id = ?").get(id));
}

function readTeamFields(form: FormData) {
  const values = {
    name: text(form, "name", 60),
    description: text(form, "description", 300),
    lead_id: text(form, "lead_id", 12),
  };
  const fieldErrors: Record<string, string> = {};
  if (values.name.length < 2) fieldErrors.name = "Give the team a name of at least 2 characters.";
  const lead = values.lead_id ? Number(values.lead_id) : null;
  if (lead !== null && (!Number.isInteger(lead) || !userExists(lead))) fieldErrors.lead_id = "Choose a lead from the list.";
  return { values, lead, fieldErrors };
}

function nameTaken(name: string, exceptId = 0) {
  return Boolean(db().prepare("SELECT 1 FROM teams WHERE name = ? COLLATE NOCASE AND id != ?").get(name, exceptId));
}

function refresh(teamId?: number) {
  revalidatePath("/team");
  if (teamId) revalidatePath(`/team/${teamId}`);
}

export async function createTeam(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!canCreateTeams(user.role)) return NOT_ALLOWED;

  const { values, lead, fieldErrors } = readTeamFields(form);
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };
  if (nameTaken(values.name)) return { fieldErrors: { name: "A team with this name already exists." }, values };

  // Managers lead the teams they create, so they can go on managing them. Admins can pick anyone.
  const leadId = asRole(user.role) === "admin" ? (lead ?? user.id) : user.id;
  const database = db();
  const result = database
    .prepare("INSERT INTO teams (name, description, lead_id, created_by) VALUES (?, ?, ?, ?)")
    .run(values.name, values.description, leadId, user.id);
  const teamId = Number(result.lastInsertRowid);
  database.prepare("INSERT OR IGNORE INTO team_members (team_id, user_id) VALUES (?, ?)").run(teamId, leadId);

  refresh(teamId);
  redirect(`/team/${teamId}`);
}

export async function updateTeam(teamId: number, _previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const team = findTeam(teamId);
  if (!team || !canManageTeam(user, team)) return NOT_ALLOWED;

  const { values, lead, fieldErrors } = readTeamFields(form);
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };
  if (nameTaken(values.name, teamId)) return { fieldErrors: { name: "A team with this name already exists." }, values };

  // Only an admin can hand a team to a different lead.
  const leadId = asRole(user.role) === "admin" ? lead : team.lead_id;
  const database = db();
  database.prepare("UPDATE teams SET name = ?, description = ?, lead_id = ? WHERE id = ?").run(values.name, values.description, leadId, teamId);
  if (leadId) database.prepare("INSERT OR IGNORE INTO team_members (team_id, user_id) VALUES (?, ?)").run(teamId, leadId);

  refresh(teamId);
  return { success: "Team details saved.", values };
}

export async function deleteTeam(teamId: number) {
  const user = await requireUser();
  const team = findTeam(teamId);
  if (!team || !canManageTeam(user, team)) return;
  db().prepare("DELETE FROM teams WHERE id = ?").run(teamId);
  refresh();
  redirect("/team");
}

export async function addMembers(teamId: number, _previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const team = findTeam(teamId);
  if (!team || !canManageTeam(user, team)) return NOT_ALLOWED;

  const ids = form
    .getAll("user_id")
    .map((value) => Number(value))
    .filter((id) => Number.isInteger(id) && id > 0);
  if (ids.length === 0) return { error: "Choose at least one person to add." };

  const insert = db().prepare("INSERT OR IGNORE INTO team_members (team_id, user_id) SELECT ?, id FROM users WHERE id = ?");
  let added = 0;
  for (const id of ids) added += Number(insert.run(teamId, id).changes);

  refresh(teamId);
  return { success: added === 1 ? "1 person added to the team." : `${added} people added to the team.` };
}

export async function removeMember(teamId: number, memberId: number) {
  const user = await requireUser();
  const team = findTeam(teamId);
  // The lead stays on the team; change the lead first to remove them.
  if (!team || !canManageTeam(user, team) || team.lead_id === memberId) return;
  db().prepare("DELETE FROM team_members WHERE team_id = ? AND user_id = ?").run(teamId, memberId);
  refresh(teamId);
}

export async function setRole(personId: number, _previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  if (asRole(user.role) !== "admin") return NOT_ALLOWED;

  const role = text(form, "role", 10);
  if (!ROLES.some((item) => item.id === role)) return { error: "Choose a valid role." };

  const database = db();
  const person = database.prepare("SELECT role FROM users WHERE id = ?").get(personId) as { role: string } | undefined;
  if (!person) return { error: "That person no longer exists." };
  if (person.role === "admin" && role !== "admin") {
    const admins = (database.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").get() as { count: number }).count;
    if (admins <= 1) return { error: "The portal needs at least one admin. Make someone else admin first." };
  }

  database.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, personId);
  revalidatePath("/", "layout");
  return { success: "Role updated." };
}
