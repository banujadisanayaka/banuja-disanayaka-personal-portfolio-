import { json, requireJson, requireSameOrigin, requestBodyTooLarge } from '../../server/http.mjs';
import { listRevisions, restoreRevision } from '../../server/cms.mjs';
import { audit, verifySession } from '../../server/security.mjs';

export default async (request) => {
  const session = await verifySession(request);
  if (!session) return json({ ok: false, message: 'Unauthorized.' }, 401);
  if (session.restricted) return json({ ok: false, message: 'Password change required.' }, 403);

  if (request.method === 'GET') {
    try {
      return json({ ok: true, revisions: await listRevisions(25) });
    } catch {
      return json({ ok: false, message: 'Unable to load revisions.' }, 500);
    }
  }

  if (request.method === 'POST') {
    if (!requireSameOrigin(request)) return json({ ok: false, message: 'Request rejected.' }, 403);
    if (!requireJson(request)) return json({ ok: false, message: 'Invalid request.' }, 415);
    if (requestBodyTooLarge(request, 8 * 1024)) return json({ ok: false, message: 'Invalid request.' }, 413);
    try {
      const { key } = await request.json();
      const content = await restoreRevision(key);
      await audit(request, 'content.restore', { details: { revision: String(key || '').slice(0, 180) } });
      return json({ ok: true, content });
    } catch {
      return json({ ok: false, message: 'Unable to restore that revision.' }, 400);
    }
  }

  return json({ ok: false, message: 'Method not allowed.' }, 405, { Allow: 'GET, POST' });
};

export const config = { path: '/api/admin-revisions', method: ['GET', 'POST'] };
