import { json, requireJson, requireSameOrigin, requestBodyTooLarge } from '../../server/http.mjs';
import {
  audit,
  checkLoginRateLimit,
  clearLoginFailures,
  createSession,
  expectedUser,
  recordLoginFailure,
  sessionCookie,
  verifyPassword
} from '../../server/security.mjs';

export default async (request) => {
  if (request.method !== 'POST') return json({ authorized: false, message: 'Method not allowed.' }, 405, { Allow: 'POST' });
  if (!requireSameOrigin(request)) return json({ authorized: false, message: 'Request rejected.' }, 403);
  if (!requireJson(request)) return json({ authorized: false, message: 'Invalid request.' }, 415);
  if (requestBodyTooLarge(request, 8 * 1024)) return json({ authorized: false, message: 'Invalid request.' }, 413);

  try {
    const payload = await request.json();
    const username = payload?.username;
    const password = payload?.password;
    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      !username.trim() ||
      username.length > 254 ||
      password.length < 1 ||
      password.length > 128
    ) {
      return json({ authorized: false, message: 'Invalid request.' }, 400);
    }

    const state = await checkLoginRateLimit(request, username);
    if (!state.allowed) {
      await audit(request, 'auth.lockout', { actor: 'anonymous', details: { retryAfter: state.retryAfter } });
      return json({ authorized: false, message: 'Too many attempts. Try again later.' }, 429, { 'Retry-After': String(state.retryAfter) });
    }

    const result = await verifyPassword(username, password);
    if (!result.ok) {
      const delay = await recordLoginFailure(state);
      await audit(request, 'auth.failure', { actor: 'anonymous' });
      await new Promise(resolve => setTimeout(resolve, delay));
      return json({ authorized: false, message: 'Incorrect username or password.' }, 401);
    }

    await clearLoginFailures(state);
    const { token } = await createSession(request, { mustChangePassword: Boolean(result.credential.mustChangePassword) });
    await audit(request, 'auth.success', { details: { bootstrap: Boolean(result.credential.mustChangePassword) } });
    const user = expectedUser();
    return json({
      authorized: true,
      mustChangePassword: Boolean(result.credential.mustChangePassword),
      user: { name: 'Banuja', username: user }
    }, 200, { 'set-cookie': sessionCookie(token) });
  } catch {
    return json({ authorized: false, message: 'Authentication service unavailable.' }, 503);
  }
};

export const config = { path: '/api/admin-login', method: 'POST', rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'] } };
