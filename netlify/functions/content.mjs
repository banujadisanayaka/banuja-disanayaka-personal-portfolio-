import { contentVersion, getMasterContent } from '../../server/cms.mjs';
import { publicProjection } from '../../server/content-schema.mjs';

const jsonHeaders = (etag) => ({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=300, stale-if-error=86400',
  'x-content-type-options': 'nosniff',
  ...(etag ? { etag } : {})
});

export default async (request) => {
  if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });

  try {
    const content = await getMasterContent();
    const version = contentVersion(content);
    const etag = `"${version}"`;

    if (request.headers.get('if-none-match') === etag) {
      return new Response(null, { status: 304, headers: jsonHeaders(etag) });
    }

    return new Response(JSON.stringify({ content: content ? publicProjection(content) : null, version }), {
      headers: jsonHeaders(etag)
    });
  } catch {
    return new Response(JSON.stringify({ content: null, version: 'unavailable' }), {
      status: 503,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'retry-after': '30',
        'x-content-type-options': 'nosniff'
      }
    });
  }
};

export const config = { path: '/api/content', method: 'GET' };
