"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePassword, updateProfile } from "@/app/actions/profile";
import { FormAlert, PasswordField, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/form-fields";
import type { FormState } from "@/lib/form";
import { DEPARTMENTS, OFFICES, PASSWORD_MIN } from "@/lib/profile";

type Profile = {
  full_name: string;
  job_title: string;
  department: string;
  office: string;
  phone: string;
  start_date: string;
  bio: string;
};

export function ProfileForm({ user }: { user: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, {} as FormState);
  return (
    <form className="form" action={action} noValidate>
      <FormAlert state={state} />
      <div className="form__row">
        <TextField label="Full name" name="full_name" autoComplete="name" state={state} defaultValue={user.full_name} />
        <TextField label="Job title" name="job_title" autoComplete="organization-title" state={state} defaultValue={user.job_title} />
      </div>
      <div className="form__row">
        <SelectField label="Department" name="department" state={state} defaultValue={user.department} options={DEPARTMENTS.map((item) => ({ id: item, label: item }))} />
        <SelectField label="Office" name="office" state={state} defaultValue={user.office} options={OFFICES} />
      </div>
      <div className="form__row">
        <TextField label="Phone" name="phone" type="tel" autoComplete="tel" state={state} defaultValue={user.phone} hint="Optional" />
        <TextField label="Start date" name="start_date" type="date" state={state} defaultValue={user.start_date} hint="Optional" />
      </div>
      <TextAreaField label="Short bio" name="bio" state={state} defaultValue={user.bio} hint="Optional. What you work on, up to 600 characters." />
      <div className="form__foot">
        <span />
        <SubmitButton pending={pending}>Save changes</SubmitButton>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, {} as FormState);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) form.current?.reset();
  }, [state]);

  return (
    <form className="form" action={action} ref={form} noValidate>
      <FormAlert state={state} />
      <PasswordField label="Current password" name="current" autoComplete="current-password" state={state} />
      <div className="form__row">
        <PasswordField label="New password" name="password" autoComplete="new-password" state={state} hint={`At least ${PASSWORD_MIN} characters.`} />
        <PasswordField label="Confirm new password" name="confirm" autoComplete="new-password" state={state} />
      </div>
      <div className="form__foot">
        <span />
        <SubmitButton pending={pending}>Update password</SubmitButton>
      </div>
    </form>
  );
}
