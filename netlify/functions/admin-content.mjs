import { json, requireJson, requireSameOrigin, requestBodyTooLarge } from '../../server/http.mjs';
import { contentVersion, getMasterContent, saveMasterContent } from '../../server/cms.mjs';
import { audit, verifySession } from '../../server/security.mjs';

export default async (request) => {
  const session = await verifySession(request);
  if (!session) return json({ ok: false, message: 'Unauthorized.' }, 401);
  if (session.restricted) return json({ ok: false, message: 'Password change required.' }, 403);

  if (request.method === 'GET') {
    try {
      const content = await getMasterContent();
      return json({ ok: true, content, version: contentVersion(content) });
    } catch {
      return json({ ok: false, message: 'Unable to load content.' }, 500);
    }
  }

  if (request.method === 'PUT') {
    if (!requireSameOrigin(request)) return json({ ok: false, message: 'Request rejected.' }, 403);
    if (!requireJson(request)) return json({ ok: false, message: 'Invalid request.' }, 415);
    if (requestBodyTooLarge(request, 600 * 1024)) return json({ ok: false, message: 'Content payload is too large.' }, 413);

    try {
      const payload = await request.json();
      const raw = JSON.stringify(payload?.content ?? null);
      if (!payload || typeof payload !== 'object' || raw.length > 550 * 1024) {
        return json({ ok: false, message: 'Invalid content.' }, 400);
      }

      const baseVersion = String(payload?.baseVersion || '');
      if (!baseVersion) {
        const current = await getMasterContent();
        return json({
          ok: false,
          code: 'VERSION_REQUIRED',
          message: 'Reload the editor before publishing. A content version is required to protect newer edits.',
          version: contentVersion(current)
        }, 428);
      }

      const saved = await saveMasterContent(payload.content, { reason: 'publish', baseVersion });

      await audit(request, 'content.publish', {
        details: {
          projects: saved.content.projects.length,
          dailyGaze: saved.content.dailyGaze.length,
          ecosystem: saved.content.ecosystem.length
        }
      });

      return json({ ok: true, content: saved.content, version: saved.version });
    } catch (error) {
      if (error?.code === 'VERSION_CONFLICT') {
        return json({
          ok: false,
          code: 'VERSION_CONFLICT',
          message: 'This portfolio content changed after you opened it. Reload before publishing to avoid overwriting newer edits.',
          version: error.version || 'unknown'
        }, 409);
      }
      return json({ ok: false, message: 'Content validation failed. Review URLs and field lengths.' }, 400);
    }
  }

  return json({ ok: false, message: 'Method not allowed.' }, 405, { Allow: 'GET, PUT' });
};

export const config = { path: '/api/admin-content', method: ['GET', 'PUT'] };
