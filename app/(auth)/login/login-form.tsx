"use client";

import { useActionState } from "react";
import { signIn } from "@/app/actions/auth";
import { FormAlert, PasswordField, SubmitButton, TextField } from "@/components/form-fields";
import type { FormState } from "@/lib/form";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, {} as FormState);
  return (
    <form className="form" action={action} noValidate>
      <FormAlert state={state} />
      <TextField label="Work email" name="email" type="email" autoComplete="email" state={state} required />
      <PasswordField label="Password" name="password" autoComplete="current-password" state={state} />
      <SubmitButton pending={pending} wide>
        Sign in
      </SubmitButton>
    </form>
  );
}
