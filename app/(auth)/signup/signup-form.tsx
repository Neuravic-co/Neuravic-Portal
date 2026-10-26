"use client";

import { useActionState } from "react";
import { signUp } from "@/app/actions/auth";
import { FormAlert, PasswordField, SelectField, SubmitButton, TextField } from "@/components/form-fields";
import type { FormState } from "@/lib/form";
import { DEPARTMENTS, OFFICES, PASSWORD_MIN } from "@/lib/profile";

export function SignupForm() {
  const [state, action, pending] = useActionState(signUp, {} as FormState);
  return (
    <form className="form" action={action} noValidate>
      <FormAlert state={state} />
      <TextField label="Full name" name="full_name" autoComplete="name" state={state} required />
      <TextField label="Work email" name="email" type="email" autoComplete="email" state={state} required />
      <TextField label="Job title" name="job_title" autoComplete="organization-title" state={state} required />
      <div className="form__row">
        <SelectField label="Department" name="department" state={state} options={DEPARTMENTS.map((item) => ({ id: item, label: item }))} />
        <SelectField label="Office" name="office" state={state} options={OFFICES} />
      </div>
      <PasswordField label="Password" name="password" autoComplete="new-password" state={state} hint={`At least ${PASSWORD_MIN} characters.`} />
      <PasswordField label="Confirm password" name="confirm" autoComplete="new-password" state={state} />
      <SubmitButton pending={pending} wide>
        Create account
      </SubmitButton>
    </form>
  );
}
