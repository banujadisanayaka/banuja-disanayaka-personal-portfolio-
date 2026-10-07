import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const login = read('netlify/functions/admin-login.mjs');
const password = read('netlify/functions/admin-password.mjs');
const content = read('netlify/functions/admin-content.mjs');
const revisions = read('netlify/functions/admin-revisions.mjs');
const cms = read('server/cms.mjs');
const media = read('netlify/functions/admin-media.mjs');
const http = read('server/http.mjs');
const security = read('server/security.mjs');
const netlify = read('netlify.toml');
const sathiwPhoto = read('netlify/functions/sathiw-photo.mts');

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
assert(/onlyIfMatch/.test(cms), 'CMS writer must use Blob ETag compare-and-swap for existing content');
assert(/onlyIfNew/.test(cms), 'CMS writer must atomically protect first-write creation');
assert(/baseVersion/.test(revisions) && /VERSION_CONFLICT/.test(revisions), 'revision restore must be version-guarded');
assert(/requestBodyTooLarge\(request,\s*600\s*\*\s*1024\)/.test(content), 'admin-content must cap content payload size');
assert(/requestBodyTooLarge\(request,\s*5\s*\*\s*1024\s*\*\s*1024\)/.test(media) || /requestBodyTooLarge/.test(media), 'admin-media should cap upload request size');

assert(/origin\s*!==\s*expected/.test(http), 'same-origin helper must compare request origin exactly');
assert(/'x-robots-tag':\s*'noindex, nofollow, noarchive'/.test(http), 'JSON API responses must opt out of search indexing');
assert(/'referrer-policy':\s*'no-referrer'/.test(http), 'JSON API responses must avoid referrer disclosure');
assert(/'cross-origin-resource-policy':\s*'same-origin'/.test(http), 'JSON API responses must remain same-origin resources');
assert(/for\s*=\s*"\/api\/\*"[\s\S]*X-Robots-Tag\s*=\s*"noindex, nofollow, noarchive"/.test(netlify), 'Netlify must apply noindex to the API surface');
assert(/for\s*=\s*"\/moments\/sathiw-7th-birthday\/\*"[\s\S]*X-Robots-Tag\s*=\s*"noindex, nofollow, noarchive, noimageindex"/.test(netlify), 'Client gallery must retain route-level noindex headers');
assert(/X-Robots-Tag/.test(sathiwPhoto) && /noimageindex/.test(sathiwPhoto), 'Original client-photo responses must opt out of indexing');
assert(/Cross-Origin-Resource-Policy/.test(sathiwPhoto) && /same-origin/.test(sathiwPhoto), 'Original client-photo responses must remain same-origin resources');

assert(/HttpOnly/.test(security), 'session cookie must remain HttpOnly');
assert(/Secure/.test(security), 'session cookie must remain Secure');
assert(/SameSite=Strict/.test(security), 'session cookie must remain SameSite=Strict');

if (failures.length) {
  console.error(`Security QA failed with ${failures.length} issue(s):`);
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log('Security QA passed: static security invariants present. Executable CMS race behavior is tested separately.');
