import assert from "node:assert/strict";
import { test } from "node:test";

const mail = await import("../lib/mail.ts");

test("mail is off until SMTP_HOST is set", () => {
  delete process.env.SMTP_HOST;
  assert.equal(mail.mailEnabled(), false);
  process.env.SMTP_HOST = "127.0.0.1";
  assert.equal(mail.mailEnabled(), true);
  delete process.env.SMTP_HOST;
});

test("links use PORTAL_BASE_URL, without a trailing slash", () => {
  process.env.PORTAL_BASE_URL = "https://portal.example.com//";
  assert.equal(mail.portalUrl("/login"), "https://portal.example.com/login");
  const { text } = mail.resetPasswordMessage("Amira", "tok123");
  assert.ok(text.includes("https://portal.example.com/reset-password?token=tok123"));
  assert.ok(mail.verifyEmailMessage("Amira", "tok456").text.includes("/verify-email?token=tok456"));
  delete process.env.PORTAL_BASE_URL;
});

test("sending does nothing and reports false when mail is off", async () => {
  delete process.env.SMTP_HOST;
  assert.equal(await mail.sendMail("a@example.com", "Hi", "Body"), false);
});
