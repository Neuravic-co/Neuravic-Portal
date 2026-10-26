import "server-only";

const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, number[]>();

/** Allows `limit` attempts per key in a 15 minute window. In memory, so it resets when the server restarts. */
export function allowAttempt(key: string, limit: number) {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= limit) {
    attempts.set(key, recent);
    return false;
  }
  recent.push(now);
  attempts.set(key, recent);
  return true;
}

export function clearAttempts(key: string) {
  attempts.delete(key);
}
