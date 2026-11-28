import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

/**
 * Who is calling, for rate limiting. Forwarding headers are client-controlled unless a reverse proxy overwrites them,
 * so the address is only read from them when PORTAL_TRUST_PROXY=true.
 *
 * Without a trusted address, callers are told apart by a fingerprint of their browser headers instead of all sharing
 * one bucket. A person who forges these headers can only dodge the tight per-caller limit; the per-account and global
 * limits still hold. What this prevents is one caller using up the tight limit for everybody else, which would let
 * a stranger lock a known colleague out of signing in.
 */
export async function clientKey() {
  const list = await headers();
  if (process.env.PORTAL_TRUST_PROXY === "true") {
    const forwarded = list.get("x-forwarded-for")?.split(",");
    // The last entry is the one our own proxy appended; earlier ones can be forged by the client.
    const address = forwarded?.at(-1)?.trim() || list.get("x-real-ip");
    if (address) return address;
  }
  const fingerprint = createHash("sha256")
    .update(`${list.get("user-agent") ?? ""}|${list.get("accept-language") ?? ""}`)
    .digest("hex")
    .slice(0, 16);
  return `anon-${fingerprint}`;
}
