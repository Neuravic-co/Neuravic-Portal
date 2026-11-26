import assert from "node:assert/strict";
import { test } from "node:test";
import { asRole, canCreateTeams, canManageTeam } from "../lib/roles.ts";

test("unknown roles fall back to member", () => {
  assert.equal(asRole("root"), "member");
  assert.equal(asRole("admin"), "admin");
  assert.equal(asRole(""), "member");
});

test("members cannot create teams, managers and admins can", () => {
  assert.equal(canCreateTeams("member"), false);
  assert.equal(canCreateTeams("manager"), true);
  assert.equal(canCreateTeams("admin"), true);
});

test("managers only manage the teams they lead; admins manage all", () => {
  assert.equal(canManageTeam({ id: 1, role: "manager" }, { lead_id: 1 }), true);
  assert.equal(canManageTeam({ id: 1, role: "manager" }, { lead_id: 2 }), false);
  assert.equal(canManageTeam({ id: 1, role: "member" }, { lead_id: 1 }), false);
  assert.equal(canManageTeam({ id: 9, role: "admin" }, { lead_id: 2 }), true);
});
