"use client";

import { useActionState } from "react";
import { requestReset, requestVerification } from "@/app/actions/email";
import { FormAlert, SubmitButton, TextField } from "@/components/form-fields";
import type { FormState } from "@/lib/form";

const ACTIONS = { reset: requestReset, verify: requestVerification } as const;

/** One email box and a button, used to ask for a password reset link or a new confirmation link. */
export function EmailRequestForm({ kind, button }: { kind: keyof typeof ACTIONS; button: string }) {
  const [state, action, pending] = useActionState(ACTIONS[kind], {} as FormState);
  return (
    <form className="form" action={action} noValidate>
      <FormAlert state={state} />
      <TextField label="Work email" name="email" type="email" autoComplete="email" state={state} required />
      <SubmitButton pending={pending} wide>
        {button}
      </SubmitButton>
    </form>
  );
}
