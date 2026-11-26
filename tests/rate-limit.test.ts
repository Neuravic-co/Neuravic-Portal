import assert from "node:assert/strict";
import { test } from "node:test";
import { allowAttempt, clearAttempts } from "../lib/rate-limit.ts";

test("allows up to the limit, then blocks", () => {
  for (let i = 0; i < 3; i++) assert.equal(allowAttempt("a", 3), true);
  assert.equal(allowAttempt("a", 3), false);
  assert.equal(allowAttempt("a", 3), false);
});

test("keys are independent", () => {
  assert.equal(allowAttempt("b1", 1), true);
  assert.equal(allowAttempt("b1", 1), false);
  assert.equal(allowAttempt("b2", 1), true);
});

test("clearAttempts resets a key", () => {
  allowAttempt("c", 1);
  assert.equal(allowAttempt("c", 1), false);
  clearAttempts("c");
  assert.equal(allowAttempt("c", 1), true);
});

test("a flood of distinct keys stays bounded and recent keys still count", () => {
  for (let i = 0; i < 12_000; i++) allowAttempt(`flood-${i}`, 5);
  assert.equal(allowAttempt("recent", 1), true);
  assert.equal(allowAttempt("recent", 1), false);
});
