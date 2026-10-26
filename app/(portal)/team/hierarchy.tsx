"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { ArrowRight, Building2, ChevronDown, Crown, Pencil, Plus, Search, Trash2, UserPlus, Users } from "lucide-react";
import { addMembers, createEntity, createTeam, deleteEntity, updateEntity } from "@/app/actions/team";
import { BrandMark } from "@/components/brand-mark";
import { FormAlert, SelectField, SubmitButton, TextField } from "@/components/form-fields";
import type { FormState } from "@/lib/form";
import { canCreateTeams, canManageTeam, initials, type Role } from "@/lib/roles";

type Person = { id: number; full_name: string; job_title: string; role: string };
type TeamNode = { id: number; name: string; description: string; lead_id: number | null; members: Person[] };
type EntityNode = { id: number; name: string; description: string; teams: TeamNode[] };
type Viewer = { id: number; role: Role };

/** Which inline form is open. Only one at a time keeps the tree calm. */
type Open =
  | { kind: "entity" }
  | { kind: "edit-entity"; id: number }
  | { kind: "delete-entity"; id: number }
  | { kind: "team"; entityId: number | null }
  | { kind: "people"; teamId: number }
  | null;

type Props = {
  entities: EntityNode[];
  unassignedTeams: TeamNode[];
  unplacedPeople: Person[];
  people: Person[];
  viewer: Viewer;
};

export function Hierarchy({ entities, unassignedTeams, unplacedPeople, people, viewer }: Props) {
  const [open, setOpen] = useState<Open>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const isAdmin = viewer.role === "admin";

  const toggle = (key: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const allKeys = useMemo(
    () => [...entities.map((entity) => `e${entity.id}`), ...[...entities.flatMap((entity) => entity.teams), ...unassignedTeams].map((team) => `t${team.id}`)],
    [entities, unassignedTeams],
  );

  const needle = query.trim().toLowerCase();
  const matches = (person: Person) => needle !== "" && `${person.full_name} ${person.job_title}`.toLowerCase().includes(needle);

  const teamCount = entities.reduce((sum, entity) => sum + entity.teams.length, 0) + unassignedTeams.length;
  const placedCount = people.length - unplacedPeople.length;
  const close = () => setOpen(null);

  const renderTeam = (team: TeamNode) => (
    <TeamBranch
      key={team.id}
      team={team}
      viewer={viewer}
      people={people}
      collapsed={collapsed.has(`t${team.id}`) && !team.members.some(matches)}
      onToggle={() => toggle(`t${team.id}`)}
      adding={open?.kind === "people" && open.teamId === team.id}
      onAdd={() => setOpen({ kind: "people", teamId: team.id })}
      onClose={close}
      matches={matches}
    />
  );

  return (
    <section className="card hierarchy" aria-label="Organisation hierarchy">
      <div className="card__head">
        <div>
          <h2 className="card__title">Organisation hierarchy</h2>
          <p className="card__sub">Entity → Teams → People. {isAdmin ? "Use the + buttons to grow the tree." : "Only admins can add entities."}</p>
        </div>
        <div className="toolbar">
          <label className="search">
            <span className="sr-only">Find a person in the hierarchy</span>
            <Search aria-hidden="true" />
            <input type="search" placeholder="Find a person" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <button className="btn" type="button" onClick={() => setCollapsed(collapsed.size > 0 ? new Set() : new Set(allKeys))}>
            {collapsed.size > 0 ? "Expand all" : "Collapse all"}
          </button>
        </div>
      </div>

      <div className="tree">
        <div className="node node--root">
          <BrandMark className="node__mark" id="tree-mark" />
          <div className="node__text">
            <span className="node__kicker">Organisation</span>
            <strong className="node__name">Neuravic</strong>
            <span className="node__meta">
              {entities.length} {entities.length === 1 ? "entity" : "entities"} · {teamCount} {teamCount === 1 ? "team" : "teams"} · {placedCount} of {people.length} people placed
            </span>
          </div>
          {isAdmin ? (
            <button className="btn btn--on-dark" type="button" aria-expanded={open?.kind === "entity"} onClick={() => setOpen(open?.kind === "entity" ? null : { kind: "entity" })}>
              <Plus aria-hidden="true" /> Add entity
            </button>
          ) : null}
        </div>

        <ul className="tree__level">
          {open?.kind === "entity" ? (
            <li className="tree__item tree__item--form">
              <EntityForm onDone={close} />
            </li>
          ) : null}

          {entities.length === 0 && open?.kind !== "entity" ? (
            <li className="tree__item">
              <p className="node node--empty">{isAdmin ? "No entities yet. Add the first one, for example “Neuravic UAE” or “Neuravic Egypt”." : "No entities yet."}</p>
            </li>
          ) : null}

          {entities.map((entity) => {
            const key = `e${entity.id}`;
            const hidden = collapsed.has(key) && !entity.teams.some((team) => team.members.some(matches));
            const members = new Set(entity.teams.flatMap((team) => team.members.map((member) => member.id))).size;
            return (
              <li className="tree__item" key={entity.id}>
                <div className="node node--entity">
                  <button className="node__toggle" type="button" aria-expanded={!hidden} aria-label={`${hidden ? "Expand" : "Collapse"} ${entity.name}`} onClick={() => toggle(key)}>
                    <ChevronDown aria-hidden="true" />
                  </button>
                  <span className="node__icon">
                    <Building2 aria-hidden="true" />
                  </span>
                  <div className="node__text">
                    <span className="node__kicker">Entity</span>
                    <strong className="node__name">{entity.name}</strong>
                    <span className="node__meta">
                      {entity.teams.length} {entity.teams.length === 1 ? "team" : "teams"} · {members} {members === 1 ? "person" : "people"}
                      {entity.description ? ` · ${entity.description}` : ""}
                    </span>
                  </div>
                  <div className="node__actions">
                    {canCreateTeams(viewer.role) ? (
                      <button className="btn btn--small" type="button" onClick={() => setOpen({ kind: "team", entityId: entity.id })}>
                        <Plus aria-hidden="true" /> Team
                      </button>
                    ) : null}
                    {isAdmin ? (
                      <>
                        <button className="btn btn--icon btn--small" type="button" aria-label={`Edit ${entity.name}`} onClick={() => setOpen({ kind: "edit-entity", id: entity.id })}>
                          <Pencil aria-hidden="true" />
                        </button>
                        <button className="btn btn--icon btn--small btn--danger-outline" type="button" aria-label={`Delete ${entity.name}`} onClick={() => setOpen({ kind: "delete-entity", id: entity.id })}>
                          <Trash2 aria-hidden="true" />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                {open?.kind === "edit-entity" && open.id === entity.id ? <EntityForm entity={entity} onDone={close} /> : null}
                {open?.kind === "delete-entity" && open.id === entity.id ? (
                  <form className="inline-form inline-form--danger" action={deleteEntity.bind(null, entity.id)}>
                    <p>
                      Delete <strong>{entity.name}</strong>? Its {entity.teams.length} {entity.teams.length === 1 ? "team stays" : "teams stay"} and move to “Not in an entity”.
                    </p>
                    <div className="danger__actions">
                      <button className="btn" type="button" onClick={close}>
                        Keep it
                      </button>
                      <button className="btn btn--danger" type="submit">
                        <Trash2 aria-hidden="true" /> Delete entity
                      </button>
                    </div>
                  </form>
                ) : null}

                {!hidden ? (
                  <ul className="tree__level">
                    {open?.kind === "team" && open.entityId === entity.id ? (
                      <li className="tree__item tree__item--form">
                        <TeamForm entityId={entity.id} entityName={entity.name} people={people} viewer={viewer} onDone={close} />
                      </li>
                    ) : null}
                    {entity.teams.length === 0 && !(open?.kind === "team" && open.entityId === entity.id) ? (
                      <li className="tree__item">
                        <p className="node node--empty">No teams in {entity.name} yet.</p>
                      </li>
                    ) : null}
                    {entity.teams.map(renderTeam)}
                  </ul>
                ) : null}
              </li>
            );
          })}

          {unassignedTeams.length > 0 ? (
            <li className="tree__item">
              <div className="node node--entity node--muted">
                <span className="node__icon">
                  <Building2 aria-hidden="true" />
                </span>
                <div className="node__text">
                  <span className="node__kicker">No entity</span>
                  <strong className="node__name">Not in an entity</strong>
                  <span className="node__meta">Open a team and pick its entity to place it in the tree.</span>
                </div>
              </div>
              <ul className="tree__level">{unassignedTeams.map(renderTeam)}</ul>
            </li>
          ) : null}

          {unplacedPeople.length > 0 ? (
            <li className="tree__item">
              <div className="node node--entity node--muted">
                <span className="node__icon">
                  <Users aria-hidden="true" />
                </span>
                <div className="node__text">
                  <span className="node__kicker">Not placed</span>
                  <strong className="node__name">Not on a team yet</strong>
                  <span className="node__meta">
                    {unplacedPeople.length} {unplacedPeople.length === 1 ? "person" : "people"} waiting to join a team
                  </span>
                </div>
              </div>
              <div className="people-grid people-grid--loose">
                {unplacedPeople.map((person) => (
                  <PersonChip key={person.id} person={person} highlight={matches(person)} />
                ))}
              </div>
            </li>
          ) : null}
        </ul>
      </div>
    </section>
  );
}

function TeamBranch({
  team,
  viewer,
  people,
  collapsed,
  onToggle,
  adding,
  onAdd,
  onClose,
  matches,
}: {
  team: TeamNode;
  viewer: Viewer;
  people: Person[];
  collapsed: boolean;
  onToggle: () => void;
  adding: boolean;
  onAdd: () => void;
  onClose: () => void;
  matches: (person: Person) => boolean;
}) {
  const lead = team.members.find((member) => member.id === team.lead_id);
  const memberIds = new Set(team.members.map((member) => member.id));
  return (
    <li className="tree__item">
      <div className="node node--team">
        <button className="node__toggle" type="button" aria-expanded={!collapsed} aria-label={`${collapsed ? "Expand" : "Collapse"} ${team.name}`} onClick={onToggle}>
          <ChevronDown aria-hidden="true" />
        </button>
        <span className="node__icon node__icon--team" aria-hidden="true">
          {initials(team.name)}
        </span>
        <div className="node__text">
          <span className="node__kicker">Team</span>
          <strong className="node__name">{team.name}</strong>
          <span className="node__meta">
            <span className="node__lead">
              <Crown aria-hidden="true" className="node__crown" /> {lead?.full_name ?? "No lead"}
            </span>
            · {team.members.length} {team.members.length === 1 ? "person" : "people"}
          </span>
        </div>
        <div className="node__actions">
          {canManageTeam(viewer, team) ? (
            <button className="btn btn--small" type="button" aria-expanded={adding} onClick={adding ? onClose : onAdd}>
              <UserPlus aria-hidden="true" /> People
            </button>
          ) : null}
          <Link className="btn btn--small btn--quiet" href={`/team/${team.id}`}>
            Open <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </div>

      {adding ? <PeopleForm teamId={team.id} teamName={team.name} candidates={people.filter((person) => !memberIds.has(person.id))} onDone={onClose} /> : null}

      {!collapsed && team.members.length > 0 ? (
        <div className="people-grid">
          {team.members.map((member) => (
            <PersonChip key={member.id} person={member} lead={member.id === team.lead_id} highlight={matches(member)} />
          ))}
        </div>
      ) : null}
    </li>
  );
}

function PersonChip({ person, lead = false, highlight = false }: { person: Person; lead?: boolean; highlight?: boolean }) {
  return (
    <div className={`person-chip${lead ? " person-chip--lead" : ""}${highlight ? " person-chip--match" : ""}`}>
      <span className="avatar avatar--sm" aria-hidden="true">
        {initials(person.full_name)}
      </span>
      <span className="person-chip__text">
        <strong>
          {person.full_name}
          {lead ? <Crown aria-label="Team lead" className="node__crown" /> : null}
        </strong>
        <span>{person.job_title}</span>
      </span>
    </div>
  );
}

function EntityForm({ entity, onDone }: { entity?: EntityNode; onDone: () => void }) {
  const [state, action, pending] = useActionState(entity ? updateEntity.bind(null, entity.id) : createEntity, {} as FormState);
  return (
    <form className="inline-form" action={action} noValidate>
      <p className="inline-form__title">{entity ? `Edit ${entity.name}` : "New entity"}</p>
      <FormAlert state={state} />
      <div className="form__row">
        <TextField label="Entity name" name="name" state={state} defaultValue={entity?.name} placeholder="e.g. Neuravic UAE" />
        <TextField label="Description" name="description" state={state} defaultValue={entity?.description} placeholder="Optional" />
      </div>
      <div className="inline-form__actions">
        <button className="btn" type="button" onClick={onDone}>
          {state.success ? "Done" : "Cancel"}
        </button>
        <SubmitButton pending={pending}>{entity ? "Save entity" : "Add entity"}</SubmitButton>
      </div>
    </form>
  );
}

function TeamForm({ entityId, entityName, people, viewer, onDone }: { entityId: number; entityName: string; people: Person[]; viewer: Viewer; onDone: () => void }) {
  const [state, action, pending] = useActionState(createTeam, {} as FormState);
  return (
    <form className="inline-form" action={action} noValidate>
      <p className="inline-form__title">New team in {entityName}</p>
      <input type="hidden" name="entity_id" value={entityId} />
      <input type="hidden" name="stay" value="1" />
      <FormAlert state={state} />
      <div className="form__row">
        <TextField label="Team name" name="name" state={state} placeholder="e.g. Platform" />
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
      <TextField label="What the team does" name="description" state={state} placeholder="Optional" />
      <div className="inline-form__actions">
        <button className="btn" type="button" onClick={onDone}>
          {state.success ? "Done" : "Cancel"}
        </button>
        <SubmitButton pending={pending}>Add team</SubmitButton>
      </div>
    </form>
  );
}

function PeopleForm({ teamId, teamName, candidates, onDone }: { teamId: number; teamName: string; candidates: Person[]; onDone: () => void }) {
  const [state, action, pending] = useActionState(addMembers.bind(null, teamId), {} as FormState);
  const [query, setQuery] = useState("");
  const shown = candidates.filter((person) => `${person.full_name} ${person.job_title}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <form className="inline-form" action={action}>
      <p className="inline-form__title">Add people to {teamName}</p>
      <FormAlert state={state} />
      {candidates.length === 0 ? (
        <p className="card__sub">Everyone in the portal is already on this team.</p>
      ) : (
        <>
          <label className="search search--full">
            <span className="sr-only">Search people</span>
            <Search aria-hidden="true" />
            <input type="search" placeholder="Search people" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <fieldset className="picker">
            <legend className="sr-only">People to add</legend>
            {shown.map((person) => (
              <label className="picker__item" key={person.id}>
                <input type="checkbox" name="user_id" value={person.id} />
                <span className="avatar avatar--sm" aria-hidden="true">
                  {initials(person.full_name)}
                </span>
                <span>
                  <span className="list__title">{person.full_name}</span>
                  <span className="list__meta">{person.job_title}</span>
                </span>
              </label>
            ))}
            {shown.length === 0 ? <p className="empty">No one matches “{query}”.</p> : null}
          </fieldset>
        </>
      )}
      <div className="inline-form__actions">
        <button className="btn" type="button" onClick={onDone}>
          {state.success ? "Done" : "Cancel"}
        </button>
        {candidates.length > 0 ? (
          <SubmitButton pending={pending}>
            <UserPlus aria-hidden="true" /> Add to team
          </SubmitButton>
        ) : null}
      </div>
    </form>
  );
}
