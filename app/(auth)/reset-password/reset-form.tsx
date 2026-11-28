"use client";

import { useActionState } from "react";
import { resetPassword } from "@/app/actions/email";
import { FormAlert, PasswordField, SubmitButton } from "@/components/form-fields";
import type { FormState } from "@/lib/form";
import { PASSWORD_MIN } from "@/lib/profile";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, {} as FormState);
  return (
    <form className="form" action={action} noValidate>
      <FormAlert state={state} />
      <input type="hidden" name="token" value={token} />
      <PasswordField label="New password" name="password" autoComplete="new-password" state={state} hint={`At least ${PASSWORD_MIN} characters. Avoid common passwords and your own details.`} />
      <PasswordField label="Confirm new password" name="confirm" autoComplete="new-password" state={state} />
      <SubmitButton pending={pending} wide>
        Set new password
      </SubmitButton>
    </form>
  );
}
