import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

process.env.PORTAL_DB_PATH = join(mkdtempSync(join(tmpdir(), "portal-team-")), "team.db");
const { db } = await import("../lib/db.ts");
const { getHierarchy, getTeam, listPeople, listTeams, teamsFor } = await import("../lib/team.ts");

const person = (name: string) =>
  Number(
    db()
      .prepare("INSERT INTO users (employee_id, full_name, email, password_hash) VALUES (?, ?, ?, 'x')")
      .run(`NV-${name}`, name, `${name.toLowerCase()}@example.com`).lastInsertRowid,
  );
const team = (name: string, lead: number | null) =>
  Number(db().prepare("INSERT INTO teams (name, lead_id) VALUES (?, ?)").run(name, lead).lastInsertRowid);
const enrol = (teamId: number, userId: number) =>
  db().prepare("INSERT INTO team_members (team_id, user_id) VALUES (?, ?)").run(teamId, userId);

const lead = person("Lena");
const others = ["Omar", "Nour", "Ravi", "Sara", "Tariq", "Uma"].map(person);
const alpha = team("Alpha", lead);
enrol(alpha, lead);
others.forEach((id) => enrol(alpha, id));
const beta = team("Beta", null);
const outsider = person("Zed");

test("listTeams gives each team a count and at most five names, lead first", () => {
  const teams = listTeams();
  const a = teams.find((t) => t.id === alpha)!;
  assert.equal(a.member_count, 7);
  assert.equal(a.preview.length, 5);
  assert.equal(a.preview[0], "Lena");
  assert.equal(a.lead_name, "Lena");
  const b = teams.find((t) => t.id === beta)!;
  assert.deepEqual(b.preview, []);
  assert.equal(b.member_count, 0);
});

test("rows are plain objects that can be sent to client components", () => {
  for (const row of [...listPeople(), ...listTeams()]) assert.equal(Object.getPrototypeOf(row), Object.prototype);
});

test("getTeam returns members with the lead first, and null for unknown ids", () => {
  const found = getTeam(alpha)!;
  assert.equal(found.members[0].full_name, "Lena");
  assert.equal(found.members.length, 7);
  assert.equal(getTeam(999_999), null);
});

test("teamsFor marks the lead", () => {
  assert.deepEqual(teamsFor(lead).map((t) => [t.name, t.is_lead]), [["Alpha", 1]]);
  assert.deepEqual(teamsFor(outsider), []);
});

test("hierarchy nests teams under entities and lists unplaced teams and people", () => {
  const entity = Number(db().prepare("INSERT INTO entities (name) VALUES ('Neuravic')").run().lastInsertRowid);
  db().prepare("UPDATE teams SET entity_id = ? WHERE id = ?").run(entity, alpha);
  const tree = getHierarchy();
  assert.equal(tree.entities.length, 1);
  assert.deepEqual(tree.entities[0].teams.map((t) => t.name), ["Alpha"]);
  assert.equal(tree.entities[0].teams[0].members[0].full_name, "Lena");
  assert.deepEqual(tree.unassignedTeams.map((t) => t.name), ["Beta"]);
  assert.deepEqual(tree.unplacedPeople.map((p) => p.full_name), ["Zed"]);
});
