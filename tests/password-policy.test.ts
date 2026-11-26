import assert from "node:assert/strict";
import { test } from "node:test";
import { passwordProblem } from "../lib/password-policy.ts";

test("rejects short passwords", () => {
  assert.match(passwordProblem("short1!") ?? "", /at least/);
});

test("rejects common and patterned passwords", () => {
  for (const bad of ["password123456", "Qwertyuiop1234", "aaaaaaaaaaaa", "1234567890", "abcdefghijk"]) {
    assert.ok(passwordProblem(bad), `${bad} should be refused`);
  }
});

test("rejects passwords containing the email name or person's name", () => {
  assert.match(passwordProblem("zeyad-is-great-99", { email: "zeyad@neuravic.com" }) ?? "", /email/);
  assert.match(passwordProblem("my-johnson-secret-99", { name: "Amy Johnson" }) ?? "", /name/);
});

test("accepts a long unique passphrase", () => {
  assert.equal(passwordProblem("correct horse battery staple 42", { email: "a.b@neuravic.com", name: "A B" }), null);
});
