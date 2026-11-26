import { PASSWORD_MIN } from "./profile.ts";

/** The passwords attackers try first. Compared after lower-casing and dropping trailing digits and symbols. */
const COMMON = new Set([
  "password", "passw0rd", "p@ssword", "p@ssw0rd", "letmein", "welcome", "welcome1", "admin", "administrator", "qwerty",
  "qwertyuiop", "qwertyuiopasdfghjkl", "asdfghjkl", "zxcvbnm", "iloveyou", "monkey", "dragon", "football", "baseball",
  "master", "shadow", "superman", "batman", "trustno", "sunshine", "princess", "abc", "abcdef", "abcdefgh", "abcdefghij",
  "changeme", "default", "secret", "login", "neuravic", "neuravicportal", "portal", "company", "summer", "winter",
  "spring", "autumn", "dubai", "cairo", "egypt", "freedom", "whatever", "starwars", "hello", "internet", "computer",
  "michael", "jennifer", "jordan", "charlie", "donald", "mustang", "access", "flower", "hottie", "loveme", "ashley",
  "bailey", "passw", "ninja", "azerty", "pass", "test", "testing", "guest", "user", "root", "temp", "temporary",
]);

const stripTail = (value: string) => value.toLowerCase().replace(/[\d\W_]+$/g, "");

/** True for things like "aaaaaaaaaa", "1234567890" or "abcdefghij". */
function isPattern(password: string) {
  if (new Set(password).size <= 2) return true;
  // Runs along the digit row, the keyboard rows or the alphabet, forwards or backwards ("1234567890", "asdfghjkl").
  const lower = password.toLowerCase();
  const runs = ["12345678901234567890", "qwertyuiopasdfghjklzxcvbnm", "abcdefghijklmnopqrstuvwxyz"];
  if (runs.some((run) => run.includes(lower) || [...run].reverse().join("").includes(lower))) return true;
  const codes = [...lower].map((char) => char.charCodeAt(0));
  const step = codes[1] - codes[0];
  return Math.abs(step) === 1 && codes.every((code, index) => index === 0 || code - codes[index - 1] === step);
}

/** A reason to refuse this password, or null when it is fine. `email` and `name` stop people reusing their own details. */
export function passwordProblem(password: string, details: { email?: string; name?: string } = {}): string | null {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  const lower = password.toLowerCase();
  if (COMMON.has(lower) || COMMON.has(stripTail(password)) || isPattern(password)) {
    return "That password is too common or easy to guess. Try a longer phrase.";
  }
  const local = (details.email ?? "").split("@")[0]?.toLowerCase() ?? "";
  if (local.length >= 3 && lower.includes(local)) return "Do not use your email address in your password.";
  const parts = (details.name ?? "").toLowerCase().split(/\s+/).filter((part) => part.length >= 4);
  if (parts.some((part) => lower.includes(part))) return "Do not use your name in your password.";
  return null;
}
