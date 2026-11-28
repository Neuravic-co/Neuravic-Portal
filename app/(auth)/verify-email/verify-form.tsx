"use client";

import { useActionState } from "react";
import { verifyEmail } from "@/app/actions/email";
import { FormAlert, SubmitButton } from "@/components/form-fields";
import type { FormState } from "@/lib/form";

export function VerifyForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(verifyEmail, {} as FormState);
  return (
    <form className="form" action={action}>
      <FormAlert state={state} />
      <input type="hidden" name="token" value={token} />
      <SubmitButton pending={pending} wide>
        Confirm email
      </SubmitButton>
    </form>
  );
}
