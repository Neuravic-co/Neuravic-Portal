import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Crown } from "lucide-react";
import { removeMember } from "@/app/actions/team";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/holidays";
import { officeLabel } from "@/lib/profile";
import { asRole, canManageTeam, initials, ROLE_TONE, roleLabel } from "@/lib/roles";
import { getTeam, listEntities, listPeople } from "@/lib/team";
import { AddMembers, DeleteTeam, EditTeam } from "./team-forms";

type Props = { params: Promise<{ id: string }> };

function load(id: string) {
  const teamId = Number(id);
  return Number.isInteger(teamId) && teamId > 0 ? getTeam(teamId) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = load((await params).id);
  return { title: found ? `${found.team.name} · Team Manager` : "Team Manager" };
}

export default async function TeamDetailPage({ params }: Props) {
  const user = await requireUser();
  const found = load((await params).id);
  if (!found) notFound();

  const { team, members } = found;
  const manage = canManageTeam(user, team);
  const isAdmin = asRole(user.role) === "admin";
  const memberIds = new Set(members.map((member) => member.id));
  const people = manage || isAdmin ? listPeople() : [];
  const candidates = people.filter((person) => !memberIds.has(person.id));

  return (
    <>
      <Link className="back-link" href="/team">
        <ArrowLeft aria-hidden="true" /> All teams
      </Link>

      <header className="page-head">
        <div>
          <p className="page-head__eyebrow">Team Manager · {team.entity_name ?? "No entity"}</p>
          <h1 className="page-head__title">{team.name}</h1>
          <p className="page-head__lead">{team.description || "No description yet."}</p>
        </div>
        <div className="team-meta">
          <span className="team-card__lead">
            <Crown aria-hidden="true" /> Lead: {team.lead_name ?? "None"}
          </span>
          <span className="card__sub">
            {members.length} {members.length === 1 ? "member" : "members"} · created {formatDate(team.created_at.slice(0, 10))}
          </span>
        </div>
      </header>

      <div className="grid grid--split">
        <section className="card" aria-labelledby="members-title">
          <div className="card__head">
            <div>
              <h2 className="card__title" id="members-title">
                Members
              </h2>
              <p className="card__sub">{manage ? "Remove people who have left the team. The lead always stays on it." : "Only the team lead or an admin can change members."}</p>
            </div>
          </div>
          {members.length === 0 ? (
            <p className="empty">No members yet.</p>
          ) : (
            <ul className="list">
              {members.map((member) => (
                <li className="list__item list__item--center" key={member.id}>
                  <span className="avatar" aria-hidden="true">
                    {initials(member.full_name)}
                  </span>
                  <span className="list__text">
                    <span className="list__title">
                      {member.full_name}
                      {member.id === user.id ? <span className="you"> (you)</span> : null}
                    </span>
                    <span className="list__meta">
                      {member.job_title} · {member.department} · {officeLabel(member.office)}
                    </span>
                  </span>
                  {member.id === team.lead_id ? (
                    <span className="badge badge--green">Lead</span>
                  ) : (
                    <span className={ROLE_TONE[asRole(member.role)]}>{roleLabel(member.role)}</span>
                  )}
                  {manage && member.id !== team.lead_id ? (
                    <form action={removeMember.bind(null, team.id, member.id)}>
                      <button className="btn btn--ghost" type="submit" aria-label={`Remove ${member.full_name} from ${team.name}`}>
                        Remove
                      </button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        {manage ? (
          <div className="stack">
            <AddMembers teamId={team.id} candidates={candidates.map(({ id, full_name, job_title, department }) => ({ id, full_name, job_title, department }))} />
            <EditTeam
              teamId={team.id}
              team={{
                name: team.name,
                description: team.description,
                lead_id: team.lead_id ? String(team.lead_id) : "",
                entity_id: team.entity_id ? String(team.entity_id) : "",
              }}
              entities={listEntities().map((entity) => ({ id: String(entity.id), label: entity.name }))}
              leads={isAdmin ? people.map((person) => ({ id: String(person.id), label: `${person.full_name} · ${person.job_title}` })) : null}
            />
            <DeleteTeam teamId={team.id} name={team.name} />
          </div>
        ) : null}
      </div>
    </>
  );
}
