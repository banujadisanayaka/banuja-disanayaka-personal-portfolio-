# Banuja Personal Digital Platform — V7.3 Security Hardening

V7.3 is the production-security architecture release for the existing Netlify project `banuja-personal-log`.

## Architecture
- `public/` is the only CDN publish directory.
- `netlify/functions/` contains serverless endpoints.
- `server/` contains private server-only authentication, validation, CMS and storage modules.
- Netlify Blobs stores CMS state, revisions, media, sessions, rate-limit state and audit events.

## Security controls
- no hard-coded authentication fallbacks
- temporary bootstrap credential expires and forces immediate password rotation
- scrypt password hashing with per-password salt and environment pepper
- server-side revocable sessions using a `__Host-` Secure, HttpOnly, SameSite=Strict cookie
- 2-hour idle and 8-hour absolute session limits
- separate session and rate-limit secrets
- same-origin enforcement on mutations
- server-side login throttling/lockout plus Netlify function rate limiting on the login and media-processing endpoints (kept within the Free-plan rule limit)
- server-side CMS schema and URL validation
- public content projection excludes hidden content
- image signature validation, decode limits, metadata stripping and normalized WebP output
- CSP, HSTS, frame denial, restrictive permissions policy and admin no-cache/noindex headers
- CMS revision history and rollback
- audit logging for authentication, password changes, publishing, restores and uploads

## First production login
Production secrets are configured in Netlify. The bootstrap password is temporary and must be changed immediately in `/admin/`. After successful password rotation, the bootstrap verifier is no longer used because the new credential is stored in the protected security Blob store.

## Deployment
Deploy the repository root. Netlify reads `netlify.toml`, publishes `public/`, installs dependencies from `package.json`, and bundles the functions.

## Recovery
If CMS content is accidentally changed, use Admin → Security & recovery → Restore points. Password changes revoke every active session.

## Source control

This repository is the canonical source for the production portfolio. Netlify should build from `main`; the public CDN root is `public/`, and server/auth code remains outside that directory.
