import type { Metadata } from "next";
import { Crown, IdCard, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { asRole } from "@/lib/roles";
import { listPeople, listTeams } from "@/lib/team";
import { TeamManager } from "./team-manager";

export const metadata: Metadata = { title: "Team Manager" };

export default async function TeamPage() {
  const user = await requireUser();
  const teams = listTeams();
  const people = listPeople();
  const leading = teams.filter((team) => team.lead_id === user.id).length;

  return (
    <>
      <PageHeader
        eyebrow="Team Manager"
        title="Teams and people"
        lead="See who is on which team, set up new teams and keep members up to date."
      />

      <div className="grid grid--stats">
        <div className="card stat">
          <span className="stat__label">
            <Users aria-hidden="true" /> Teams
          </span>
          <span className="stat__value">{teams.length}</span>
          <span className="stat__note">{teams.reduce((sum, team) => sum + team.member_count, 0)} memberships in total</span>
        </div>
        <div className="card stat">
          <span className="stat__label">
            <IdCard aria-hidden="true" /> People
          </span>
          <span className="stat__value">{people.length}</span>
          <span className="stat__note">{people.filter((person) => person.team_count === 0).length} not on a team yet</span>
        </div>
        <div className="card stat">
          <span className="stat__label">
            <ShieldCheck aria-hidden="true" /> Managers & admins
          </span>
          <span className="stat__value">{people.filter((person) => asRole(person.role) !== "member").length}</span>
          <span className="stat__note">Can create and run teams</span>
        </div>
        <div className="card stat">
          <span className="stat__label">
            <Crown aria-hidden="true" /> You lead
          </span>
          <span className="stat__value">{leading}</span>
          <span className="stat__note">{leading === 1 ? "team" : "teams"}</span>
        </div>
      </div>

      <TeamManager
        teams={teams}
        people={people}
        viewer={{ id: user.id, role: asRole(user.role) }}
      />
    </>
  );
}
