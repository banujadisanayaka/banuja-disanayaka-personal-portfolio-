# Banuja Disanayaka — Personal Portfolio V8

V8 is the immersive public-experience release for the existing Netlify project `banuja-personal-log`. It keeps the hardened V7.3 server-side CMS/authentication architecture intact while replacing the public portfolio with the cinematic, responsive V8 experience.

## Architecture
- `public/` is the only CDN publish directory.
- `netlify/functions/` contains serverless endpoints.
- `server/` contains private server-only authentication, validation, CMS and storage modules.
- Netlify Blobs stores CMS state, revisions, media, sessions, rate-limit state and audit events.
- `scripts/` contains production, responsive, browser, security and CMS-concurrency QA.

## V8 public experience
- cinematic responsive homepage with progressive-enhancement motion
- reduced-motion, coarse-pointer and no-JavaScript fallbacks
- four evidence-backed project case studies
- The Daily Gaze photography integration using approved real imagery
- VELORIA ecosystem presentation
- canonical URLs, structured data, Open Graph/Twitter metadata, sitemap and robots policy
- accessible branded 404 and installable-site metadata

## Security controls
- no hard-coded authentication fallbacks
- temporary bootstrap credential expires and forces immediate password rotation
- scrypt password hashing with per-password salt and environment pepper
- server-side revocable sessions using a `__Host-` Secure, HttpOnly, SameSite=Strict cookie
- 2-hour idle and 8-hour absolute session limits
- separate session and rate-limit secrets
- same-origin enforcement on mutations
- server-side login throttling/lockout plus Netlify function rate limiting on the login and media-processing endpoints
- server-side CMS schema and URL validation
- public content projection excludes hidden content
- image signature validation, decode limits, metadata stripping and normalized WebP output
- CSP, HSTS, frame denial, restrictive permissions policy and admin no-cache/noindex headers
- CMS revision history, rollback and audit logging
- unused Netlify Forms are disabled at the project level; contact remains explicit outbound email/social links

## Release gates
The V8 branch is not production-ready until both GitHub Actions workflows are green for the exact PR head:
- **Portfolio QA** — static production checks, responsive/motion resilience, backend security regression, CMS concurrency and real Chromium browser QA
- **Netlify Build Smoke** — Node 24 Netlify build using the production project ID and deploy-preview context

Browser QA validates no-JavaScript resilience, mobile navigation focus/viewport behavior, responsive overflow and deployed API privacy/authentication boundaries against the exact Netlify deploy preview commit.

## First production login
Production secrets are configured in Netlify. The bootstrap password is temporary and must be changed immediately in `/admin/`. After successful password rotation, the bootstrap verifier is no longer used because the new credential is stored in the protected security Blob store.

## Deployment
Netlify builds from `main`, reads `netlify.toml`, publishes `public/`, installs dependencies from `package.json`, and bundles the functions. Production releases should only be merged from the reviewed V8 pull request after all gates are green.

## Recovery
If CMS content is accidentally changed, use Admin → Security & recovery → Restore points. Password changes revoke every active session.

## Source control
This repository is the canonical source for the production portfolio. Server/auth code must remain outside `public/`, and secrets or identity-document information must never be committed to source control.
