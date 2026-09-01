import { json } from '../../server/http.mjs';
import { expectedUser, verifySession } from '../../server/security.mjs';

export default async (request) => {
  if (request.method !== 'GET') return json({ authorized: false }, 405, { Allow: 'GET' });
  const session = await verifySession(request, { allowPasswordChange: true });
  if (!session) return json({ authorized: false }, 401);
  return json({
    authorized: true,
    mustChangePassword: Boolean(session.mustChangePassword),
    user: { name: 'Banuja', username: expectedUser() },
    session: { idleSeconds: 7200, absoluteSeconds: 28800 }
  });
};

export const config = { path: '/api/admin-session', method: 'GET' };
