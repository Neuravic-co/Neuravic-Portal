"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { ArrowRight, Crown, Plus, Search, X } from "lucide-react";
import { createTeam, setRole } from "@/app/actions/team";
import { AvatarStack } from "@/components/avatar-stack";
import { FormAlert, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/form-fields";
import type { FormState } from "@/lib/form";
import { DEPARTMENTS, officeLabel } from "@/lib/profile";
import { canCreateTeams, initials, ROLE_TONE, ROLES, roleLabel, asRole, type Role } from "@/lib/roles";

type Team = {
  id: number;
  name: string;
  description: string;
  lead_id: number | null;
  lead_name: string | null;
  member_count: number;
  preview: string[];
};

type Person = {
  id: number;
  employee_id: string;
  full_name: string;
  email: string;
  job_title: string;
  department: string;
  office: string;
  role: string;
  team_count: number;
};

type Viewer = { id: number; role: Role };
type Tab = "teams" | "people";

export function TeamManager({ teams, people, viewer }: { teams: Team[]; people: Person[]; viewer: Viewer }) {
  const [tab, setTab] = useState<Tab>("teams");
  const [creating, setCreating] = useState(false);

  return (
    <>
      <div className="card filter-bar">
        <div className="tabs tabs--lg" role="tablist" aria-label="Team Manager">
          <button type="button" role="tab" id="tab-teams" aria-selected={tab === "teams"} aria-controls="panel-teams" onClick={() => setTab("teams")}>
            Teams <span className="tabs__count">{teams.length}</span>
          </button>
          <button type="button" role="tab" id="tab-people" aria-selected={tab === "people"} aria-controls="panel-people" onClick={() => setTab("people")}>
            People <span className="tabs__count">{people.length}</span>
          </button>
        </div>
        {tab === "teams" && canCreateTeams(viewer.role) ? (
          <button className={creating ? "btn" : "btn btn--primary"} type="button" aria-expanded={creating} onClick={() => setCreating((value) => !value)}>
            {creating ? <X aria-hidden="true" /> : <Plus aria-hidden="true" />}
            {creating ? "Cancel" : "New team"}
          </button>
        ) : null}
      </div>

      {tab === "teams" ? (
        <div id="panel-teams" role="tabpanel" aria-labelledby="tab-teams">
          {creating ? <NewTeam people={people} viewer={viewer} /> : null}
          <TeamGrid teams={teams} viewer={viewer} />
        </div>
      ) : (
        <div id="panel-people" role="tabpanel" aria-labelledby="tab-people">
          <PeopleDirectory people={people} viewer={viewer} />
        </div>
      )}
    </>
  );
}

function NewTeam({ people, viewer }: { people: Person[]; viewer: Viewer }) {
  const [state, action, pending] = useActionState(createTeam, {} as FormState);
  return (
    <section className="card new-team" aria-labelledby="new-team-title">
      <div className="card__head">
        <div>
          <h2 className="card__title" id="new-team-title">
            New team
          </h2>
          <p className="card__sub">
            {viewer.role === "admin" ? "Pick who leads it. The lead is added as the first member." : "You will lead this team and can add members next."}
          </p>
        </div>
      </div>
      <form className="card__body form" action={action} noValidate>
        <FormAlert state={state} />
        <div className="form__row">
          <TextField label="Team name" name="name" state={state} placeholder="e.g. Platform" required />
          {viewer.role === "admin" ? (
            <SelectField
              label="Team lead"
              name="lead_id"
              state={state}
              defaultValue={String(viewer.id)}
              options={people.map((person) => ({ id: String(person.id), label: `${person.full_name} · ${person.job_title}` }))}
            />
          ) : null}
        </div>
        <TextAreaField label="What the team does" name="description" state={state} hint="Optional. One or two lines." />
        <div className="form__foot">
          <span />
          <SubmitButton pending={pending}>Create team</SubmitButton>
        </div>
      </form>
    </section>
  );
}

function TeamGrid({ teams, viewer }: { teams: Team[]; viewer: Viewer }) {
  if (teams.length === 0) {
    return (
      <div className="card empty">
        <p>No teams yet.</p>
        <p className="card__sub">{canCreateTeams(viewer.role) ? "Create the first one with “New team”." : "A manager or admin can create the first one."}</p>
      </div>
    );
  }
  return (
    <div className="grid teams">
      {teams.map((team) => (
        <Link className="card team-card" href={`/team/${team.id}`} key={team.id}>
          <div className="team-card__head">
            <span className="module__icon" aria-hidden="true">
              {initials(team.name)}
            </span>
            <div className="team-card__title">
              <h2 className="tool__name">{team.name}</h2>
              <p className="tool__category">
                {team.member_count} {team.member_count === 1 ? "member" : "members"}
              </p>
            </div>
            {team.lead_id === viewer.id ? <span className="badge badge--green">You lead</span> : null}
          </div>
          <p className="tool__text">{team.description || "No description yet."}</p>
          <div className="tool__foot">
            <span className="team-card__lead">
              <Crown aria-hidden="true" /> {team.lead_name ?? "No lead"}
            </span>
            <AvatarStack names={team.preview} total={team.member_count} />
          </div>
          <span className="module__link">
            Open team <ArrowRight aria-hidden="true" />
          </span>
        </Link>
      ))}
    </div>
  );
}

function PeopleDirectory({ people, viewer }: { people: Person[]; viewer: Viewer }) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return people
      .filter((person) => department === "" || person.department === department)
      .filter((person) =>
        needle === "" ? true : [person.full_name, person.email, person.job_title, person.employee_id].some((value) => value.toLowerCase().includes(needle)),
      );
  }, [people, query, department]);

  return (
    <section className="card" aria-labelledby="people-title">
      <div className="card__head">
        <div>
          <h2 className="card__title" id="people-title">
            People directory
          </h2>
          <p className="card__sub">{viewer.role === "admin" ? "As an admin you can change anyone's role." : "Everyone who has signed up to the portal."}</p>
        </div>
        <div className="toolbar">
          <label className="sr-only" htmlFor="people-department">
            Department
          </label>
          <select id="people-department" className="input input--compact" value={department} onChange={(event) => setDepartment(event.target.value)}>
            <option value="">All departments</option>
            {DEPARTMENTS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <label className="search">
            <span className="sr-only">Search people</span>
            <Search aria-hidden="true" />
            <input type="search" placeholder="Search people" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
        </div>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Person</th>
              <th scope="col">Department</th>
              <th scope="col">Office</th>
              <th scope="col">Teams</th>
              <th scope="col">Role</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((person) => (
              <tr key={person.id}>
                <td>
                  <span className="person">
                    <span className="avatar avatar--sm" aria-hidden="true">
                      {initials(person.full_name)}
                    </span>
                    <span>
                      <span className="table__primary">
                        {person.full_name}
                        {person.id === viewer.id ? <span className="you"> (you)</span> : null}
                      </span>
                      <span className="table__secondary">{person.job_title} · {person.email}</span>
                    </span>
                  </span>
                </td>
                <td>{person.department}</td>
                <td className="nowrap">{officeLabel(person.office)}</td>
                <td>{person.team_count}</td>
                <td>{viewer.role === "admin" ? <RoleSelect person={person} /> : <span className={ROLE_TONE[asRole(person.role)]}>{roleLabel(person.role)}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="empty">No one matches these filters.</p> : null}
      </div>
    </section>
  );
}

function RoleSelect({ person }: { person: Person }) {
  const [state, action, pending] = useActionState(setRole.bind(null, person.id), {} as FormState);
  return (
    <form action={action} className="role-form">
      <label className="sr-only" htmlFor={`role-${person.id}`}>
        Role for {person.full_name}
      </label>
      <select
        id={`role-${person.id}`}
        name="role"
        className="input input--compact"
        defaultValue={asRole(person.role)}
        // Remount on an error so the select goes back to the saved role.
        key={`${person.role}-${state.error ?? ""}`}
        disabled={pending}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        {ROLES.map((role) => (
          <option key={role.id} value={role.id}>
            {role.label}
          </option>
        ))}
      </select>
      {state.error ? (
        <span className="field__error" role="alert">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
