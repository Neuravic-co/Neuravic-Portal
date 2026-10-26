"use client";

import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import type { FormState } from "@/lib/form";

type Common = { label: string; name: string; state: FormState; hint?: string };

function describedBy(name: string, state: FormState, hint?: string) {
  const ids = [hint ? `${name}-hint` : "", state.fieldErrors?.[name] ? `${name}-error` : ""].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

function Messages({ name, state, hint }: Omit<Common, "label">) {
  return (
    <>
      {hint ? (
        <span className="field__hint" id={`${name}-hint`}>
          {hint}
        </span>
      ) : null}
      {state.fieldErrors?.[name] ? (
        <span className="field__error" id={`${name}-error`}>
          {state.fieldErrors[name]}
        </span>
      ) : null}
    </>
  );
}

export function TextField({
  label,
  name,
  state,
  hint,
  defaultValue = "",
  ...rest
}: Common & { defaultValue?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "defaultValue">) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        // Remount with the returned value so a failed submit keeps what the person typed.
        key={state.values?.[name] ?? defaultValue}
        id={name}
        name={name}
        className="input"
        defaultValue={state.values?.[name] ?? defaultValue}
        aria-invalid={state.fieldErrors?.[name] ? true : undefined}
        aria-describedby={describedBy(name, state, hint)}
        {...rest}
      />
      <Messages name={name} state={state} hint={hint} />
    </div>
  );
}

export function TextAreaField({ label, name, state, hint, defaultValue = "" }: Common & { defaultValue?: string }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <textarea
        key={state.values?.[name] ?? defaultValue}
        id={name}
        name={name}
        className="input"
        maxLength={600}
        defaultValue={state.values?.[name] ?? defaultValue}
        aria-invalid={state.fieldErrors?.[name] ? true : undefined}
        aria-describedby={describedBy(name, state, hint)}
      />
      <Messages name={name} state={state} hint={hint} />
    </div>
  );
}

export function SelectField({
  label,
  name,
  state,
  hint,
  options,
  defaultValue = "",
}: Common & { options: { id: string; label: string }[]; defaultValue?: string }) {
  const value = state.values?.[name] ?? defaultValue;
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <select
        key={value}
        id={name}
        name={name}
        className="input"
        defaultValue={value}
        aria-invalid={state.fieldErrors?.[name] ? true : undefined}
        aria-describedby={describedBy(name, state, hint)}
      >
        <option value="" disabled>
          Choose…
        </option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <Messages name={name} state={state} hint={hint} />
    </div>
  );
}

export function PasswordField({ label, name, state, hint, autoComplete }: Common & { autoComplete: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <div className="password">
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          className="input"
          autoComplete={autoComplete}
          required
          aria-invalid={state.fieldErrors?.[name] ? true : undefined}
          aria-describedby={describedBy(name, state, hint)}
        />
        <button
          type="button"
          className="password__toggle"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </div>
      <Messages name={name} state={state} hint={hint} />
    </div>
  );
}

export function FormAlert({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <p className="alert alert--error" role="alert">
        <AlertCircle aria-hidden="true" />
        <span>{state.error}</span>
      </p>
    );
  }
  if (state.success) {
    return (
      <p className="alert alert--success" role="status">
        <CheckCircle2 aria-hidden="true" />
        <span>{state.success}</span>
      </p>
    );
  }
  return null;
}

export function SubmitButton({ pending, children, wide = false }: { pending: boolean; children: React.ReactNode; wide?: boolean }) {
  return (
    <button className={`btn btn--primary${wide ? " btn--wide" : ""}`} type="submit" disabled={pending} aria-busy={pending}>
      {pending ? <Loader2 className="spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
