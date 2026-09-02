import { contentVersion, getMasterContent } from '../../server/cms.mjs';
import { publicProjection } from '../../server/content-schema.mjs';

const jsonHeaders = (etag, { error = false } = {}) => ({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': error ? 'no-store' : 'public, max-age=0, s-maxage=0, must-revalidate',
  'x-content-type-options': 'nosniff',
  'x-robots-tag': 'noindex, nofollow, noarchive',
  'referrer-policy': 'no-referrer',
  'cross-origin-resource-policy': 'same-origin',
  ...(etag ? { etag } : {})
});

export default async (request) => {
  if (request.method !== 'GET') {
    return new Response(null, {
      status: 405,
      headers: {
        Allow: 'GET',
        'x-robots-tag': 'noindex, nofollow, noarchive',
        'referrer-policy': 'no-referrer',
        'cross-origin-resource-policy': 'same-origin'
      }
    });
  }

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
        ...jsonHeaders(null, { error: true }),
        'retry-after': '30'
      }
    });
  }
};

export const config = { path: '/api/content', method: 'GET' };
