# Security Notes

Do not commit or place plaintext credentials, salts, password hashes, peppers, session secrets, API keys, or tokens in this repository.

Required production environment variables:
- `ADMIN_USERNAME`
- `ADMIN_BOOTSTRAP_SALT`
- `ADMIN_BOOTSTRAP_HASH`
- `ADMIN_PASSWORD_PEPPER`
- `ADMIN_SESSION_PEPPER`
- `RATE_LIMIT_SECRET`
- `ADMIN_BOOTSTRAP_EXPIRES`

All secret values belong in Netlify environment variables with function/runtime scope. The bootstrap credential is temporary and should expire quickly.

Operational recommendations:
- keep MFA/passkey enabled on the Netlify account
- use a private Git repository for ongoing source control
- rotate credentials if a temporary password is exposed
- periodically review Admin security/audit events and CMS restore points
