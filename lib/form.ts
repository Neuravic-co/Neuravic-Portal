export type FormState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
  /** What the person typed, sent back so a failed submit does not clear the form. Never includes passwords. */
  values?: Record<string, string>;
};

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function text(form: FormData, key: string, max = 200) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function secret(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.slice(0, 200) : "";
}
