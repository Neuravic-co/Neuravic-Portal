import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

type ScryptOptions = { N: number; r: number; p: number; maxmem: number };
export const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

/** scrypt cost: N=2^16, r=8, p=2 (about 64 MB per hash), the OWASP-recommended floor. Stored with each hash. */
export const COST = { N: 65_536, r: 8, p: 2 } as const;
const memoryFor = (cost: { N: number; r: number }) => 128 * cost.N * cost.r * 2;
/** Upper limits for numbers read back from the database: at most about 256 MB per hash. */
const MAX = { N: 2 ** 17, r: 8, p: 4 } as const;
/** Hashes made before the cost was stored in the hash used these settings. */
const LEGACY_COST = { N: 16_384, r: 8, p: 1 } as const;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password.normalize("NFKC"), salt, KEY_LENGTH, { ...COST, maxmem: memoryFor(COST) });
  return `scrypt$${COST.N}$${COST.r}$${COST.p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

/** Reads `scrypt$N$r$p$salt$key`, or the older `scrypt$salt$key`. Returns null for anything else. */
function parseHash(stored: string) {
  const parts = stored.split("$");
  if (parts[0] !== "scrypt") return null;
  let salt: string | undefined;
  let key: string | undefined;
  let cost: { N: number; r: number; p: number } = LEGACY_COST;
  if (parts.length === 6) {
    cost = { N: Number(parts[1]), r: Number(parts[2]), p: Number(parts[3]) };
    [salt, key] = [parts[4], parts[5]];
  } else if (parts.length === 3) {
    [salt, key] = [parts[1], parts[2]];
  }
  if (!salt || !key) return null;
  // Never trust stored numbers blindly: a corrupted row must not be able to ask for gigabytes of memory.
  const powerOfTwo = Number.isInteger(cost.N) && cost.N >= 1024 && cost.N <= MAX.N && (cost.N & (cost.N - 1)) === 0;
  const sane = powerOfTwo && Number.isInteger(cost.r) && cost.r >= 1 && cost.r <= MAX.r && Number.isInteger(cost.p) && cost.p >= 1 && cost.p <= MAX.p;
  return sane ? { salt: Buffer.from(salt, "base64"), key: Buffer.from(key, "base64"), cost } : null;
}

/** Whether the password matches, and whether the stored hash is weaker than today's settings and should be redone. */
export async function checkPassword(password: string, stored: string) {
  const parsed = parseHash(stored);
  if (!parsed || parsed.key.length === 0) return { valid: false, rehash: false };
  const { salt, key, cost } = parsed;
  const attempt = async (candidate: string) =>
    timingSafeEqual(await scryptAsync(candidate, salt, key.length, { ...cost, maxmem: memoryFor(cost) }), key);
  // Legacy hashes were made from the raw password, new ones from its NFKC form, so accept either until rehashed.
  const normalised = password.normalize("NFKC");
  const valid = (await attempt(normalised)) || (normalised !== password && (await attempt(password)));
  const weaker = cost.N < COST.N || cost.r < COST.r || cost.p < COST.p;
  return { valid, rehash: valid && weaker };
}

export async function verifyPassword(password: string, stored: string) {
  return (await checkPassword(password, stored)).valid;
}

