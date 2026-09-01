import { json, requireJson, requireSameOrigin, requestBodyTooLarge } from '../../server/http.mjs';
import {
  audit,
  clearSessionCookie,
  expectedUser,
  passwordPolicy,
  revokeAllSessions,
  setPassword,
  verifyPassword,
  verifySession
} from '../../server/security.mjs';

export default async (request) => {
  if (request.method !== 'POST') return json({ ok: false, message: 'Method not allowed.' }, 405, { Allow: 'POST' });
  if (!requireSameOrigin(request)) return json({ ok: false, message: 'Request rejected.' }, 403);
  if (!requireJson(request)) return json({ ok: false, message: 'Invalid request.' }, 415);
  if (requestBodyTooLarge(request, 8 * 1024)) return json({ ok: false, message: 'Invalid request.' }, 413);

  const session = await verifySession(request, { allowPasswordChange: true });
  if (!session) return json({ ok: false, message: 'Unauthorized.' }, 401);

  try {
    const { currentPassword, newPassword } = await request.json();
    const current = await verifyPassword(expectedUser(), currentPassword);
    if (!current.ok) {
      await audit(request, 'password.change.failure', { details: { reason: 'current-password' } });
      await new Promise(resolve => setTimeout(resolve, 900));
      return json({ ok: false, message: 'Current password is incorrect.' }, 401);
    }

    const policy = passwordPolicy(newPassword);
    if (!policy.ok) return json({ ok: false, message: policy.reasons.join(' ') }, 400);

    const saved = await setPassword(newPassword);
    if (!saved.ok) return json({ ok: false, message: saved.reasons.join(' ') }, 400);
    await audit(request, 'password.change.success');
    await revokeAllSessions();
    return json({ ok: true, reauthenticate: true }, 200, { 'set-cookie': clearSessionCookie() });
  } catch {
    return json({ ok: false, message: 'Unable to change password.' }, 400);
  }
};

export const config = { path: '/api/admin-password', method: 'POST' };
