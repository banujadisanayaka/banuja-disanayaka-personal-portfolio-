import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { securityStore } from './platform.mjs';
import { clientIp } from './http.mjs';

const scrypt = promisify(crypto.scrypt);
export const COOKIE_NAME = '__Host-banuja_admin_session';
export const IDLE_SECONDS = 60 * 60 * 2;
export const ABSOLUTE_SECONDS = 60 * 60 * 8;
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;
const CREDENTIAL_KEY = 'credential/admin';
const SESSION_PREFIX = 'session/';
const AUDIT_PREFIX = 'audit/';

function envRequired(name) {
  const value = String(globalThis.Netlify?.env?.get?.(name) || '').trim();
  if (!value) throw new Error(\`Missing required security configuration: \${name}\`);
  return value;
}

function encodeB64Url(value) {
  return Buffer.from(value).toString('base64url');
}
function decodeB64Url(value = '') {
  try { return Buffer.from(value, 'base64url'); } catch { return Buffer.alloc(0); }
}

export function expectedUser() {
  return envRequired('ADMIN_USERNAME').toLowerCase();
}

function pepper() { return envRequired('ADMIN_PASSWORD_PEPPER'); }
function sessionPepper() { return envRequired('ADMIN_SESSION_PEPPER'); }
function rateSecret() { return envRequired('RATE_LIMIT_SECRET'); }

async function derive(password, salt) {
  const material = \`\${String(password || '')}\\u0000\${pepper()}\`;
  return Buffer.from(await scrypt(material, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 128 * 1024 * 1024 }));
}

export function passwordPolicy(password) {
  const value = String(password || '');
  const local = expectedUser().split('@')[0];
  const reasons = [];
  if (value.length < 16) reasons.push('Use at least 16 characters.');
  if (value.length > 128) reasons.push('Password is too long.');
  if (!/[a-z]/.test(value)) reasons.push('Add a lowercase letter.');
  if (!/[A-Z]/.test(value)) reasons.push('Add an uppercase letter.');
  if (!/\\d/.test(value)) reasons.push('Add a number.');
  if (!/[^A-Za-z0-9]/.test(value)) reasons.push('Add a symbol.');
  if (local && value.toLowerCase().includes(local.toLowerCase())) reasons.push('Do not include the username.');
  if (/(password|qwerty|123456|letmein|admin)/i.test(value)) reasons.push('Choose a less predictable password.');
  return { ok: reasons.length === 0, reasons };
}

async function bootstrapCredential() {
  const expiryRaw = envRequired('ADMIN_BOOTSTRAP_EXPIRES');
  const expiry = Date.parse(expiryRaw);
  if (!Number.isFinite(expiry) || Date.now() > expiry) throw new Error('Bootstrap credential has expired.');
  const salt = envRequired('ADMIN_BOOTSTRAP_SALT');
  const hash = envRequired('ADMIN_BOOTSTRAP_HASH');
  return {
    username: expectedUser(),
    salt,
    hash,
    version: 1,
    mustChangePassword: true,
    source: 'bootstrap'
  };
}

export async function getCredential() {
  const stored = await securityStore().get(CREDENTIAL_KEY, { type: 'json' });
  if (stored && typeof stored === 'object' && stored.username && stored.salt && stored.hash) return stored;
  return bootstrapCredential();
}

export async function verifyPassword(username, password) {
  const supplied = String(username || '').trim().toLowerCase();
  if (supplied !== expectedUser()) return { ok: false };
  const credential = await getCredential();
  const salt = decodeB64Url(credential.salt);
  const expected = decodeB64Url(credential.hash);
  if (!salt.length || !expected.length) throw new Error('Credential configuration is invalid.');
  const actual = await derive(password, salt);
  const ok = actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  return { ok, credential };
}

export async function setPassword(newPassword) {
  const policy = passwordPolicy(newPassword);
  if (!policy.ok) return { ok: false, reasons: policy.reasons };
  const salt = crypto.randomBytes(24);
  const hash = await derive(newPassword, salt);
  const record = {
    username: expectedUser(),
    salt: encodeB64Url(salt),
    hash: encodeB64Url(hash),
    version: Date.now(),
    mustChangePassword: false,
    changedAt: new Date().toISOString(),
    source: 'secure-store'
  };
  await securityStore().setJSON(CREDENTIAL_KEY, record);
  return { ok: true, credential: record };
}

function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const item = part.trim();
    if (!item) continue;
    const i = item.indexOf('=');
    if (i < 1) continue;
    out[item.slice(0, i)] = item.slice(i + 1);
  }
  return out;
}

function sessionKey(token) {
  const digest = crypto.createHmac('sha256', sessionPepper()).update(token).digest('base64url');
  return \`\${SESSION_PREFIX}\${digest}\`;
}

function uaHash(request) {
  return crypto.createHmac('sha256', sessionPepper()).update(request.headers.get('user-agent') || '').digest('base64url');
}

export async function createSession(request, { mustChangePassword = false } = {}) {
  const token = crypto.randomBytes(32).toString('base64url');
  const now = Date.now();
  const record = {
    username: expectedUser(),
    createdAt: now,
    lastSeenAt: now,
    idleExpiresAt: now + IDLE_SECONDS * 1000,
    absoluteExpiresAt: now + ABSOLUTE_SECONDS * 1000,
    ua: uaHash(request),
    mustChangePassword: Boolean(mustChangePassword)
  };
  await securityStore().setJSON(sessionKey(token), record);
  return { token, record };
}

export function sessionCookie(token) {
  return \`\${COOKIE_NAME}=\${token}; Path=/; Max-Age=\${ABSOLUTE_SECONDS}; HttpOnly; Secure; SameSite=Strict\`;
}

export function clearSessionCookie() {
  return \`\${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict\`;
}

export async function verifySession(request, { allowPasswordChange = false } = {}) {
  try {
    const token = parseCookies(request.headers.get('cookie') || '')[COOKIE_NAME];
    if (!token || token.length < 32 || token.length > 128) return null;
    const store = securityStore();
    const key = sessionKey(token);
    const record = await store.get(key, { type: 'json' });
    if (!record) return null;
    const now = Date.now();
    if (record.absoluteExpiresAt <= now || record.idleExpiresAt <= now) {
      await store.delete(key);
      return null;
    }
    if (record.username !== expectedUser() || record.ua !== uaHash(request)) {
      await store.delete(key);
      return null;
    }
    if (record.mustChangePassword && !allowPasswordChange) return { ...record, token, restricted: true };
    if (now - record.lastSeenAt > TOUCH_INTERVAL_MS) {
      record.lastSeenAt = now;
      record.idleExpiresAt = Math.min(now + IDLE_SECONDS * 1000, record.absoluteExpiresAt);
      await store.setJSON(key, record);
    }
    return { ...record, token };
  } catch {
    return null;
  }
}

export async function revokeSession(request) {
  const token = parseCookies(request.headers.get('cookie') || '')[COOKIE_NAME];
  if (!token) return;
  try { await securityStore().delete(sessionKey(token)); } catch {}
}

export async function revokeAllSessions() {
  const store = securityStore();
  const { blobs } = await store.list({ prefix: SESSION_PREFIX });
  await Promise.all(blobs.map(({ key }) => store.delete(key)));
}

function anonymized(value) {
  return crypto.createHmac('sha256', rateSecret()).update(String(value || '')).digest('base64url').slice(0, 24);
}

function requestFingerprint(request) {
  return {
    ipHash: anonymized(clientIp(request)),
    uaHash: anonymized(request.headers.get('user-agent') || '')
  };
}

export async function audit(request, action, details = {}) {
  try {
    const store = securityStore();
    const at = new Date().toISOString();
    const id = crypto.randomBytes(6).toString('hex');
    await store.setJSON(\`\${AUDIT_PREFIX}\${at}-\${id}\`, {
      at,
      action,
      actor: details.actor || 'admin',
      ...requestFingerprint(request),
      details: details.details || null
    });
    if (Math.random() < 0.05) {
      const { blobs } = await store.list({ prefix: AUDIT_PREFIX });
      const stale = blobs.map(x => x.key).sort().reverse().slice(500);
      await Promise.all(stale.map(key => store.delete(key)));
    }
  } catch {}
}

const IP_WINDOW = 10 * 60 * 1000;
const ACCOUNT_WINDOW = 60 * 60 * 1000;
const IP_LIMIT = 5;
const ACCOUNT_LIMIT = 10;
const IP_LOCK = 15 * 60 * 1000;
const ACCOUNT_LOCK = 30 * 60 * 1000;

function rateKey(kind, raw) {
  return \`rate/\${kind}/\${anonymized(raw)}\`;
}

async function getRateRecord(key, windowMs) {
  const store = securityStore();
  const now = Date.now();
  const record = (await store.get(key, { type: 'json' })) || { failures: [], lockUntil: 0 };
  record.failures = Array.isArray(record.failures) ? record.failures.filter(t => Number.isFinite(t) && now - t < windowMs) : [];
  record.lockUntil = Number(record.lockUntil || 0);
  return record;
}

export async function checkLoginRateLimit(request, username) {
  const ip = clientIp(request);
  const normalizedUser = String(username || '').trim().toLowerCase();
  const ipKey = rateKey('ip', ip);
  const userKey = rateKey('user', normalizedUser || 'unknown');
  const [ipRec, userRec] = await Promise.all([
    getRateRecord(ipKey, IP_WINDOW),
    getRateRecord(userKey, ACCOUNT_WINDOW)
  ]);
  const now = Date.now();
  const lockUntil = Math.max(ipRec.lockUntil, userRec.lockUntil);
  return {
    allowed: lockUntil <= now,
    retryAfter: lockUntil > now ? Math.ceil((lockUntil - now) / 1000) : 0,
    ipKey,
    userKey,
    ipRec,
    userRec
  };
}

export async function recordLoginFailure(state) {
  const store = securityStore();
  const now = Date.now();
  state.ipRec.failures.push(now);
  state.userRec.failures.push(now);
  if (state.ipRec.failures.length >= IP_LIMIT) state.ipRec.lockUntil = Math.max(state.ipRec.lockUntil, now + IP_LOCK);
  if (state.userRec.failures.length >= ACCOUNT_LIMIT) state.userRec.lockUntil = Math.max(state.userRec.lockUntil, now + ACCOUNT_LOCK);
  await Promise.all([
    store.setJSON(state.ipKey, state.ipRec),
    store.setJSON(state.userKey, state.userRec)
  ]);
  const count = Math.max(state.ipRec.failures.length, state.userRec.failures.length);
  return Math.min(5000, 450 * Math.max(1, 2 ** Math.min(count - 1, 4)));
}

export async function clearLoginFailures(state) {
  const store = securityStore();
  await Promise.all([store.delete(state.ipKey), store.delete(state.userKey)]);
}
