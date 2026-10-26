"use client";

import { useActionState, useMemo, useState } from "react";
import { Search, Trash2, UserPlus } from "lucide-react";
import { addMembers, deleteTeam, updateTeam } from "@/app/actions/team";
import { FormAlert, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/form-fields";
import type { FormState } from "@/lib/form";
import { initials } from "@/lib/roles";

type Candidate = { id: number; full_name: string; job_title: string; department: string };

export function AddMembers({ teamId, candidates }: { teamId: number; candidates: Candidate[] }) {
  const [state, action, pending] = useActionState(addMembers.bind(null, teamId), {} as FormState);
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return candidates.filter((person) => needle === "" || [person.full_name, person.job_title, person.department].some((value) => value.toLowerCase().includes(needle)));
  }, [candidates, query]);

  return (
    <section className="card" aria-labelledby="add-title">
      <div className="card__head">
        <div>
          <h2 className="card__title" id="add-title">
            Add members
          </h2>
          <p className="card__sub">Tick the people to add, then save.</p>
        </div>
      </div>
      {candidates.length === 0 ? (
        <div className="card__body form">
          <FormAlert state={state} />
          <p className="card__sub">Everyone in the portal is already on this team.</p>
        </div>
      ) : (
        <form action={action} className="card__body form">
          <FormAlert state={state} />
          <label className="search search--full">
            <span className="sr-only">Search people to add</span>
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
                  <span className="list__meta">
                    {person.job_title} · {person.department}
                  </span>
                </span>
              </label>
            ))}
            {shown.length === 0 ? <p className="empty">No one matches “{query}”.</p> : null}
          </fieldset>
          <SubmitButton pending={pending}>
            <UserPlus aria-hidden="true" /> Add to team
          </SubmitButton>
        </form>
      )}
    </section>
  );
}

export function EditTeam({
  teamId,
  team,
  leads,
}: {
  teamId: number;
  team: { name: string; description: string; lead_id: string };
  /** Only admins can change the lead; null hides the field. */
  leads: { id: string; label: string }[] | null;
}) {
  const [state, action, pending] = useActionState(updateTeam.bind(null, teamId), {} as FormState);
  return (
    <section className="card" aria-labelledby="edit-team-title">
      <div className="card__head">
        <h2 className="card__title" id="edit-team-title">
          Team details
        </h2>
      </div>
      <form action={action} className="card__body form" noValidate>
        <FormAlert state={state} />
        <TextField label="Team name" name="name" state={state} defaultValue={team.name} />
        {leads ? <SelectField label="Team lead" name="lead_id" state={state} defaultValue={team.lead_id} options={leads} /> : null}
        <TextAreaField label="What the team does" name="description" state={state} defaultValue={team.description} />
        <div className="form__foot">
          <span />
          <SubmitButton pending={pending}>Save team</SubmitButton>
        </div>
      </form>
    </section>
  );
}

export function DeleteTeam({ teamId, name }: { teamId: number; name: string }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <section className="card danger" aria-labelledby="delete-title">
      <div className="card__body danger__body">
        <div>
          <h2 className="card__title" id="delete-title">
            Delete team
          </h2>
          <p className="card__sub">Removes the team and its member list. People keep their accounts.</p>
        </div>
        {confirming ? (
          <form action={deleteTeam.bind(null, teamId)} className="danger__actions">
            <button className="btn" type="button" onClick={() => setConfirming(false)}>
              Keep it
            </button>
            <button className="btn btn--danger" type="submit">
              <Trash2 aria-hidden="true" /> Delete {name}
            </button>
          </form>
        ) : (
          <button className="btn btn--danger-outline" type="button" onClick={() => setConfirming(true)}>
            <Trash2 aria-hidden="true" /> Delete team
          </button>
        )}
      </div>
    </section>
  );
}
