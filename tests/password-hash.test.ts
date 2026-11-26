import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import { checkPassword, COST, hashPassword, scryptAsync, verifyPassword } from "../lib/password-hash.ts";

test("hash stores its own cost and verifies the right password only", async () => {
  const hash = await hashPassword("correct horse battery staple");
  assert.match(hash, new RegExp(`^scrypt\\$${COST.N}\\$${COST.r}\\$${COST.p}\\$`));
  assert.equal(await verifyPassword("correct horse battery staple", hash), true);
  assert.equal(await verifyPassword("wrong horse battery staple", hash), false);
});

test("the same password never produces the same hash", async () => {
  assert.notEqual(await hashPassword("same password 123"), await hashPassword("same password 123"));
});

test("a current hash does not ask to be redone", async () => {
  const hash = await hashPassword("up to date password");
  assert.deepEqual(await checkPassword("up to date password", hash), { valid: true, rehash: false });
});

test("legacy three-part hashes still work and ask to be upgraded", async () => {
  const salt = randomBytes(16);
  const key = await scryptAsync("legacy password 1", salt, 64, { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  const legacy = `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
  assert.deepEqual(await checkPassword("legacy password 1", legacy), { valid: true, rehash: true });
  assert.deepEqual(await checkPassword("not the password", legacy), { valid: false, rehash: false });
});

test("equivalent unicode forms match (NFKC)", async () => {
  const hash = await hashPassword("café au lait 2026");
  assert.equal(await verifyPassword("café au lait 2026", hash), true);
});

test("malformed or hostile stored hashes are refused without doing the work", async () => {
  const salt = randomBytes(16).toString("base64");
  const key = randomBytes(64).toString("base64");
  const bad = [
    "",
    "plain-text",
    "bcrypt$12$abc$def",
    `scrypt$${salt}`,
    `scrypt$1048576$8$1$${salt}$${key}`, // N too large: would need gigabytes
    `scrypt$65536$64$1$${salt}$${key}`, // r too large
    `scrypt$65536$8$64$${salt}$${key}`, // p too large
    `scrypt$65535$8$1$${salt}$${key}`, // N not a power of two
    `scrypt$abc$8$1$${salt}$${key}`,
    `scrypt$65536$8$1$${salt}$`,
  ];
  for (const stored of bad) {
    const started = Date.now();
    assert.deepEqual(await checkPassword("anything", stored), { valid: false, rehash: false }, stored);
    assert.ok(Date.now() - started < 1000, "must be rejected before running scrypt");
  }
});
