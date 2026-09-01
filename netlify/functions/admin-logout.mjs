import { json, requireSameOrigin } from '../../server/http.mjs';
import { audit, clearSessionCookie, revokeSession } from '../../server/security.mjs';

export default async (request) => {
  if (request.method !== 'POST') return json({ ok: false }, 405, { Allow: 'POST' });
  if (!requireSameOrigin(request)) return json({ ok: false, message: 'Request rejected.' }, 403);
  await audit(request, 'auth.logout');
  await revokeSession(request);
  return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie() });
};

export const config = { path: '/api/admin-logout', method: 'POST' };
