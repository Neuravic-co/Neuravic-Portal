# Neuravic Portal

The internal Neuravic portal, built with Next.js and the same colours as the main Neuravic site. Every page needs an
account: people sign up once, then sign in.

## Pages

| Route | Page | What it shows |
| --- | --- | --- |
| `/login`, `/signup` | Sign in / Create account | The way in. Signed-in users are sent to the overview. |
| `/` | Overview | A welcome, profile progress, shortcuts and the next public holidays |
| `/pims` | PIMS | The signed-in person's own information: edit details, change password, see their role and teams |
| `/team`, `/team/[id]` | Team Manager | The organisation as a connected tree (Entity → Teams → People), team pages and a people directory |
| `/tools` | Tools | Open source and Closed & paid, each split into AI tools and other tools, with logos |
| `/calendar` | Calendar & holidays | A month calendar with UAE (Dubai) and Egypt (Cairo) public holidays |
| `/support` | IT & support | IT toolkit for fixes (remote help, diagnostics, network, recovery, security, utilities) and quick fixes |

## Run it

```bash
npm install
npm run dev        # http://localhost:5174
```

Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:e2e` (browser tests for sign-up, sign-in, themes and the command palette; run `npx playwright install chromium` once, and build first). Node 22.18 or newer is needed (built-in SQLite and TypeScript tests); `.nvmrc` pins 24.

Press **Ctrl K** (or ⌘K) anywhere to jump to a page. The theme button in the sidebar switches between system, light and dark.

## Accounts and data

- Accounts and sessions are stored in SQLite (`node:sqlite`), by default in `data/portal.db`. The folder is git-ignored.
  Set `PORTAL_DB_PATH` to keep it somewhere else, for example on a persistent volume.
- Passwords are hashed with scrypt. Sessions are random tokens kept in an HTTP-only cookie; only their hash is stored.
- Sign-in is limited to 5 attempts per 15 minutes for each email and caller, and 30 per account in total. A password reset lifts the account limit. The counters live in the database, so they survive restarts.
- Set `PORTAL_ALLOWED_EMAIL_DOMAINS` (see `.env.example`) to allow only company emails to sign up. In production,
  sign-up stays closed until it is set (or `PORTAL_ALLOW_OPEN_SIGNUP=true`), because the first account becomes admin.
- Set `PORTAL_TRUST_PROXY=true` only behind a reverse proxy that overwrites `X-Forwarded-For`. Without it, callers are
  told apart by a fingerprint of their browser headers, so one person cannot use up everyone else's attempts.
- Security activity is written to the audit log: sign-ups, successful and failed sign-ins, blocks, email
  confirmations, password changes and resets, role changes and deletions.
- Changing a password signs out every other session.
- Passwords use scrypt (N=2^16, r=8, p=2) with the cost stored in each hash; older hashes are upgraded when their owner signs in. In production the session cookie is `__Host-` prefixed.
- The database file and folder are created owner-only, and `GET /api/health` reports whether it can be read.
- SQLite needs a writable disk, so host it on a server or container, not on a serverless platform.

## Email

Email is switched on by setting `SMTP_HOST` (see `.env.example`). With it on:

- A new account must confirm its email address from a link before it can sign in, so a company domain in
  `PORTAL_ALLOWED_EMAIL_DOMAINS` really proves the person owns that mailbox. Sign-up gives the same answer whether or not
  an address is already registered; the real owner gets an email instead.
- **Forgot your password?** on the sign-in page emails a one-hour, single-use link. Using it signs the account out everywhere.
- Links are built from `PORTAL_BASE_URL`, never from request headers. Tokens are random and only their hash is stored.
- In production, sign-up from an allowed domain stays closed until email is set up (or `PORTAL_ALLOW_UNVERIFIED_EMAIL=true`).
  Accounts that existed before this feature count as confirmed.

For development, `docker compose -f docker-compose.dev.yml up -d` starts [Mailpit](https://mailpit.axllent.org), a test
mail server (it replaces MailHog, which is no longer maintained). Use `SMTP_HOST=127.0.0.1 SMTP_PORT=1025` and read mail
at http://localhost:8025. CI runs Mailpit too, and the browser tests read the confirmation and reset emails from it.
For production use a provider such as Resend, Postmark or Amazon SES with `SMTP_REQUIRE_TLS=true`.

## Roles

| Role | Can do |
| --- | --- |
| Admin | Add, edit and delete entities, change anyone's role, and create, edit or delete any team. The first account to sign up becomes admin. |
| Manager | Create teams inside an entity (they lead them), and add or remove members of the teams they lead. |
| Member | See teams and the people directory. Everyone starts as a member. |

Deleting an entity keeps its teams; they show under "Not in an entity" until they are moved. The portal always keeps at least one admin. Every permission is checked on the server, not only hidden in the page.

## Content

Static lists live in `lib/`: `tools.ts` (the Tools page), `it-tools.ts` (the IT toolkit), `holidays.ts` (2026 and
2027; lunar holidays are marked as expected) and `support.ts` (quick fixes). Logos come from
[Simple Icons](https://simpleicons.org); tools without one show a lettered tile.

## Deploy

```bash
docker compose up -d --build   # serves on 127.0.0.1:5174; put an HTTPS reverse proxy in front
```

The image is multi-stage, runs as a non-root user on a read-only filesystem, keeps data in the `portal-data` volume and
has a health check on `/api/health`. Copy `.env.example` to `.env` first and set the sign-up variables. GitHub Actions
(`.github/workflows/ci.yml`) runs lint, typecheck, tests, build, `npm audit` and a Docker build on every pull request;
Dependabot proposes weekly updates. See `SECURITY.md`.
