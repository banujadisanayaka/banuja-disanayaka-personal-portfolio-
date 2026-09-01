import { getMasterContent } from '../../server/cms.mjs';
import { publicProjection } from '../../server/content-schema.mjs';

export default async (request) => {
  if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
  try {
    const content = await getMasterContent();
    return new Response(JSON.stringify({ content: content ? publicProjection(content) : null }), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=15, s-maxage=15, stale-while-revalidate=60',
        'x-content-type-options': 'nosniff'
      }
    });
  } catch {
    return new Response(JSON.stringify({ content: null }), {
      status: 503,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff'
      }
    });
  }
};

export const config = { path: '/api/content', method: 'GET' };
