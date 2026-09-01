import crypto from 'node:crypto';
import sharp from 'sharp';
import { mediaStore } from '../../server/platform.mjs';
import { json, requireSameOrigin, requestBodyTooLarge } from '../../server/http.mjs';
import { audit, verifySession } from '../../server/security.mjs';

const MAX_UPLOAD = 4.5 * 1024 * 1024;

function sniff(buffer) {
  if (buffer.length >= 12 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return 'png';
  if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'jpeg';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return '';
}

export default async (request) => {
  const session = await verifySession(request);
  if (!session) return json({ ok: false, message: 'Unauthorized.' }, 401);
  if (session.restricted) return json({ ok: false, message: 'Password change required.' }, 403);
  if (request.method !== 'POST') return json({ ok: false, message: 'Method not allowed.' }, 405, { Allow: 'POST' });
  if (!requireSameOrigin(request)) return json({ ok: false, message: 'Request rejected.' }, 403);
  if (requestBodyTooLarge(request, MAX_UPLOAD + 512 * 1024)) return json({ ok: false, message: 'Image must be smaller than 4.5 MB.' }, 413);
  const contentType = (request.headers.get('content-type') || '').toLowerCase();
  if (!contentType.startsWith('multipart/form-data;')) return json({ ok: false, message: 'Invalid upload request.' }, 415);

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') return json({ ok: false, message: 'Choose an image first.' }, 400);
    if (file.size <= 0 || file.size > MAX_UPLOAD) return json({ ok: false, message: 'Image must be smaller than 4.5 MB.' }, 413);

    const input = Buffer.from(await file.arrayBuffer());
    const format = sniff(input);
    if (!format) return json({ ok: false, message: 'Use a valid JPG, PNG or WebP image.' }, 400);

    const processor = sharp(input, { failOn: 'error', limitInputPixels: 40_000_000, animated: false });
    const meta = await processor.metadata();
    if (!['jpeg', 'png', 'webp'].includes(meta.format || '')) return json({ ok: false, message: 'Unsupported image format.' }, 400);
    if (!meta.width || !meta.height || meta.width > 12000 || meta.height > 12000 || (meta.pages || 1) > 1) {
      return json({ ok: false, message: 'Image dimensions are not supported.' }, 400);
    }

    const output = await processor
      .rotate()
      .resize({ width: 4096, height: 4096, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 88, effort: 4 })
      .toBuffer();

    const id = \`\${Date.now()}-\${crypto.randomBytes(12).toString('hex')}.webp\`;
    await mediaStore().set(id, output);
    await audit(request, 'media.upload', { details: { format, inputBytes: input.length, outputBytes: output.length } });
    return json({ ok: true, url: \`/api/media?id=\${encodeURIComponent(id)}\` });
  } catch {
    return json({ ok: false, message: 'Upload failed. Check the image and try again.' }, 400);
  }
};

export const config = { path: '/api/admin-media', method: 'POST', rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ['ip', 'domain'] } };
