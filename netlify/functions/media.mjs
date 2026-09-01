import { mediaStore } from '../../server/platform.mjs';

function mime(key = '') {
  if (key.endsWith('.png')) return 'image/png';
  if (key.endsWith('.jpg') || key.endsWith('.jpeg')) return 'image/jpeg';
  return 'image/webp';
}

export default async (request) => {
  if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';
  if (!/^[A-Za-z0-9._-]{1,180}$/.test(id)) return new Response('Not found', { status: 404 });
  try {
    const data = await mediaStore().get(id, { type: 'arrayBuffer' });
    if (!data) return new Response('Not found', { status: 404 });
    return new Response(data, {
      headers: {
        'content-type': mime(id),
        'cache-control': 'public, max-age=31536000, immutable',
        'x-content-type-options': 'nosniff',
        'cross-origin-resource-policy': 'same-origin',
        'content-security-policy': "default-src 'none'; sandbox"
      }
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
};

export const config = { path: '/api/media', method: 'GET' };
