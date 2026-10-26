# Neuravic Portal

The internal Neuravic portal, built with Next.js and the same colours as the main Neuravic site. Every page needs an
account: people sign up once, then sign in.

## Pages

| Route | Page | What it shows |
| --- | --- | --- |
| `/login`, `/signup` | Sign in / Create account | The way in. Signed-in users are sent to the overview. |
| `/` | Overview | A welcome, profile progress, shortcuts and the next public holidays |
| `/pims` | PIMS | The signed-in person's own information: edit details, change password, see their role and teams |
| `/team`, `/team/[id]` | Team Manager | Teams with a lead and members, and a directory of everyone who signed up |
| `/tools` | Tools | Open source and Closed & paid, each split into AI tools and other tools, with logos |
| `/calendar` | Calendar & holidays | A month calendar with UAE (Dubai) and Egypt (Cairo) public holidays |
| `/support` | IT & support | IT toolkit for fixes (remote help, diagnostics, network, recovery, security, utilities) and quick fixes |

## Run it

```bash
npm install
npm run dev        # http://localhost:5174
```

Checks: `npm run lint`, `npm run typecheck`, `npm run build`. Node 22.13 or newer is needed for the built-in SQLite.

## Accounts and data

- Accounts and sessions are stored in SQLite (`node:sqlite`), by default in `data/portal.db`. The folder is git-ignored.
  Set `PORTAL_DB_PATH` to keep it somewhere else, for example on a persistent volume.
- Passwords are hashed with scrypt. Sessions are random tokens kept in an HTTP-only cookie; only their hash is stored.
- Sign-in is limited to 5 attempts per 15 minutes for each email and address.
- Set `PORTAL_ALLOWED_EMAIL_DOMAINS` (see `.env.example`) to allow only company emails to sign up.
- SQLite needs a writable disk, so host it on a server or container, not on a serverless platform.

## Roles

| Role | Can do |
| --- | --- |
| Admin | Change anyone's role, and create, edit or delete any team. The first account to sign up becomes admin. |
| Manager | Create teams (they lead them), and add or remove members of the teams they lead. |
| Member | See teams and the people directory. Everyone starts as a member. |

The portal always keeps at least one admin. Every permission is checked on the server, not only hidden in the page.

## Content

Static lists live in `lib/`: `tools.ts` (the Tools page), `it-tools.ts` (the IT toolkit), `holidays.ts` (2026 and
2027; lunar holidays are marked as expected) and `support.ts` (quick fixes). Logos come from
[Simple Icons](https://simpleicons.org); tools without one show a lettered tile.
