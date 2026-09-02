# Security Notes

Do not commit or place plaintext credentials, salts, password hashes, peppers, session secrets, API keys, tokens, identity-document data, signatures, or private addresses in this repository.

## Required production environment variables
- `ADMIN_USERNAME`
- `ADMIN_BOOTSTRAP_SALT`
- `ADMIN_BOOTSTRAP_HASH`
- `ADMIN_PASSWORD_PEPPER`
- `ADMIN_SESSION_PEPPER`
- `RATE_LIMIT_SECRET`
- `ADMIN_BOOTSTRAP_EXPIRES`

All secret values belong in Netlify environment variables with function/runtime scope. The bootstrap credential is temporary and should expire quickly.

## Platform posture
- the public site is intentionally internet-accessible; admin authorization is enforced by the hardened server-side session flow rather than by site-wide visitor passwords
- Netlify Forms are disabled because V8 does not accept public form submissions; contact actions are outbound links only
- CMS/authentication writes remain behind Netlify Functions with same-origin checks, revocable sessions and server-side validation
- `/admin/` and `/api/*` remain excluded from indexing, and admin responses must not be cached
- production security headers are defined in `netlify.toml` and verified by repository QA
- uploaded CMS media must pass the existing server-side signature/decode/normalization pipeline; do not bypass it with direct public uploads

## Operational recommendations
- keep MFA/passkey enabled on the Netlify and GitHub accounts
- use a private Git repository for ongoing source control
- rotate credentials immediately if any temporary password or secret is exposed
- periodically review Admin security/audit events and CMS restore points
- keep Netlify Forms disabled unless a future release deliberately adds a reviewed public form workflow
- require green Portfolio QA and Netlify Build Smoke checks for the exact release commit before production merge
