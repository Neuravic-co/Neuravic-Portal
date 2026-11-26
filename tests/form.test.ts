import assert from "node:assert/strict";
import { test } from "node:test";
import { EMAIL_PATTERN, secret, text } from "../lib/form.ts";

test("text trims and truncates, and ignores files and missing fields", () => {
  const form = new FormData();
  form.set("a", "  hello  ");
  form.set("b", "x".repeat(500));
  form.set("c", new Blob(["file"]), "f.txt");
  assert.equal(text(form, "a"), "hello");
  assert.equal(text(form, "b", 10), "xxxxxxxxxx");
  assert.equal(text(form, "c"), "");
  assert.equal(text(form, "missing"), "");
});

test("secret keeps whitespace but is capped", () => {
  const form = new FormData();
  form.set("p", "  spaced  ");
  form.set("long", "y".repeat(500));
  assert.equal(secret(form, "p"), "  spaced  ");
  assert.equal(secret(form, "long").length, 200);
});

test("email pattern", () => {
  for (const ok of ["a@b.co", "first.last@neuravic.com"]) assert.ok(EMAIL_PATTERN.test(ok), ok);
  for (const bad of ["", "a@b", "a b@c.com", "@c.com"]) assert.ok(!EMAIL_PATTERN.test(bad), bad);
});
