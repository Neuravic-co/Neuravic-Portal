import "server-only";

const WINDOW_MS = 15 * 60 * 1000;
/** Upper bound on tracked keys, so a flood of made-up emails cannot grow memory without limit. */
const MAX_KEYS = 10_000;
const attempts = new Map<string, number[]>();
let lastSweep = 0;

/** Drops keys whose attempts have all expired; if the map is still too big, drops the oldest keys. */
function sweep(now: number) {
  if (attempts.size < 500 && now - lastSweep < WINDOW_MS) return;
  lastSweep = now;
  for (const [key, times] of attempts) {
    if (times.every((time) => now - time >= WINDOW_MS)) attempts.delete(key);
  }
  for (const key of attempts.keys()) {
    if (attempts.size <= MAX_KEYS) break;
    attempts.delete(key);
  }
}

/** Allows `limit` attempts per key in a 15 minute window. In memory, so it resets when the server restarts. */
export function allowAttempt(key: string, limit: number) {
  const now = Date.now();
  sweep(now);
  const recent = (attempts.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  // Re-insert so the Map keeps recently used keys at the end, where trimming leaves them alone.
  attempts.delete(key);
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
