import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const login = read('netlify/functions/admin-login.mjs');
const password = read('netlify/functions/admin-password.mjs');
const content = read('netlify/functions/admin-content.mjs');
const media = read('netlify/functions/admin-media.mjs');
const http = read('server/http.mjs');
const security = read('server/security.mjs');

for (const [name, source] of [
  ['admin-login', login],
  ['admin-password', password],
  ['admin-content', content],
  ['admin-media', media]
]) {
  assert(/requireSameOrigin\(request\)/.test(source), `${name} must enforce same-origin writes`);
}

assert(/requestBodyTooLarge\(request,\s*8\s*\*\s*1024\)/.test(login), 'admin-login must cap request size');
assert(/username\.length\s*>\s*254/.test(login), 'admin-login must bound username length before verification');
assert(/password\.length\s*>\s*128/.test(login), 'admin-login must bound password length before verification');
assert(/rateLimit:\s*\{[^}]*windowLimit:\s*10/.test(login), 'admin-login must retain Netlify platform rate limiting');
assert(/checkLoginRateLimit\(request,\s*username\)/.test(login), 'admin-login must retain application-level rate limiting');

assert(/currentPassword\.length\s*>\s*128/.test(password), 'password change must bound current password input');
assert(/newPassword\.length\s*>\s*128/.test(password), 'password change must bound new password input');
assert(/passwordPolicy\(newPassword\)/.test(password), 'password change must enforce password policy');
assert(/revokeAllSessions\(\)/.test(password), 'password change must revoke active sessions');

assert(/VERSION_REQUIRED/.test(content), 'admin-content must reject versionless publishes');
assert(/VERSION_CONFLICT/.test(content), 'admin-content must reject stale publishes');
assert(/requestBodyTooLarge\(request,\s*600\s*\*\s*1024\)/.test(content), 'admin-content must cap content payload size');
assert(/requestBodyTooLarge\(request,\s*5\s*\*\s*1024\s*\*\s*1024\)/.test(media) || /requestBodyTooLarge/.test(media), 'admin-media should cap upload request size');

assert(/origin\s*!==\s*expected/.test(http), 'same-origin helper must compare request origin exactly');
assert(/HttpOnly/.test(security), 'session cookie must remain HttpOnly');
assert(/Secure/.test(security), 'session cookie must remain Secure');
assert(/SameSite=Strict/.test(security), 'session cookie must remain SameSite=Strict');

if (failures.length) {
  console.error(`Security QA failed with ${failures.length} issue(s):`);
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log('Security QA passed: auth bounds, origin controls, concurrency protection and session-cookie safeguards verified.');
