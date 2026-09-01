export function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
      'x-content-type-options': 'nosniff',
      ...extraHeaders
    }
  });
}

export function clientIp(request) {
  const direct = request.headers.get('x-nf-client-connection-ip');
  if (direct) return direct.trim();
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

export function requireSameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const expected = new URL(request.url).origin;
    if (origin !== expected) return false;
    const site = request.headers.get('sec-fetch-site');
    return !site || site === 'same-origin' || site === 'same-site';
  } catch {
    return false;
  }
}

export function requireJson(request) {
  const type = (request.headers.get('content-type') || '').toLowerCase();
  return type.startsWith('application/json');
}

export function requestBodyTooLarge(request, limitBytes) {
  const raw = request.headers.get('content-length');
  if (!raw) return false;
  const size = Number(raw);
  return Number.isFinite(size) && size > limitBytes;
}
