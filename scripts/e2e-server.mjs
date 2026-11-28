// Starts the production server on a fresh, throwaway database for the browser tests.
import { spawn } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = join(tmpdir(), "neuravic-portal-e2e");
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });

const port = process.env.E2E_PORT ?? "5180";
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", port], {
  stdio: "inherit",
  env: {
    ...process.env,
    PORTAL_DB_PATH: join(dir, "portal.db"),
    PORTAL_TRUST_PROXY: "",
    PORTAL_ALLOWED_EMAIL_DOMAINS: "neuravic.test",
    // Links in emails point back at this server. SMTP_HOST (set by CI for the Mailpit test mail server) turns mail on;
    // without it accounts are trusted on sign-up, which production only allows when this flag says so.
    PORTAL_BASE_URL: `http://localhost:${port}`,
    PORTAL_ALLOW_UNVERIFIED_EMAIL: process.env.SMTP_HOST ? "" : "true",
    NODE_ENV: "production",
  },
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.kill(signal));
server.on("exit", (code) => process.exit(code ?? 0));
