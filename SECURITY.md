# Security

Report a vulnerability privately to the portal owners; do not open a public issue. Never commit `.env` files, the
`data/` folder or any `*.db` file: they hold password hashes and personal details.

What the portal does to protect data:

- Passwords: scrypt (N=2^16, r=8, p=2) with a random salt, parameters stored per hash and upgraded at sign-in.
- Sessions: 256-bit random tokens in an HTTP-only, SameSite=Lax, Secure `__Host-` cookie; only a SHA-256 of each token is stored.
- Every query uses bound parameters; every permission is checked on the server.
- Per-caller, per-account and global rate limits stored in the database (they survive restarts), a password policy, and an
  audit log for sign-ups, sign-ins (successful and failed), blocks, email confirmation, password changes and resets,
  role changes and deletions.
- Email confirmation before a new account can sign in, and single-use password reset links (1 hour). Tokens are random,
  only their SHA-256 is stored, links are built from `PORTAL_BASE_URL` (never request headers), and sign-up, reset and
  resend requests answer the same whether or not an address has an account.
- Supply chain: every GitHub Action and the Docker base image are pinned by digest, CI scans the git history for secrets
  (TruffleHog) and the repository for vulnerabilities and misconfiguration (Trivy), and CodeQL and `npm audit` run on every pull request.
- A nonce-based Content Security Policy, HSTS, frame, referrer and MIME-sniffing protections, and `no-store` on pages.
- The database file is created with owner-only permissions; the Docker image runs as a non-root user on a read-only filesystem.
