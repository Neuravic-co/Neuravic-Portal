# Security

Report a vulnerability privately to the portal owners; do not open a public issue. Never commit `.env` files, the
`data/` folder or any `*.db` file: they hold password hashes and personal details.

What the portal does to protect data:

- Passwords: scrypt (N=2^16, r=8, p=2) with a random salt, parameters stored per hash and upgraded at sign-in.
- Sessions: 256-bit random tokens in an HTTP-only, SameSite=Lax, Secure `__Host-` cookie; only a SHA-256 of each token is stored.
- Every query uses bound parameters; every permission is checked on the server.
- Per-address and per-account sign-in limits, a password policy, and an audit log for sensitive actions.
- A nonce-based Content Security Policy, HSTS, frame, referrer and MIME-sniffing protections, and `no-store` on pages.
- The database file is created with owner-only permissions; the Docker image runs as a non-root user on a read-only filesystem.
