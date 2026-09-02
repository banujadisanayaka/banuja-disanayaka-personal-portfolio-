import crypto from 'node:crypto';
import { cmsStore } from './platform.mjs';
import { sanitizeContent } from './content-schema.mjs';

const CURRENT_KEY = 'site-content';
const REV_PREFIX = 'revision/';

function revKey() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${REV_PREFIX}${stamp}-${crypto.randomBytes(5).toString('hex')}`;
}

export async function getMasterContent() {
  const content = await cmsStore().get(CURRENT_KEY, { type: 'json' });
  return content ? sanitizeContent(content) : null;
}

export function contentVersion(content) {
  if (!content) return 'empty';
  const clean = sanitizeContent(content);
  return crypto.createHash('sha256').update(JSON.stringify(clean)).digest('base64url').slice(0, 24);
}

export async function saveMasterContent(content, metadata = {}) {
  const clean = sanitizeContent(content);
  const store = cmsStore();
  const current = await store.get(CURRENT_KEY, { type: 'json' });
  if (current) {
    await store.setJSON(revKey(), {
      at: new Date().toISOString(),
      reason: metadata.reason || 'publish',
      content: sanitizeContent(current)
    });
  }
  await store.setJSON(CURRENT_KEY, clean);
  await trimRevisions(100);
  return clean;
}

export async function listRevisions(limit = 25) {
  const store = cmsStore();
  const { blobs } = await store.list({ prefix: REV_PREFIX });
  const keys = blobs.map(x => x.key).sort().reverse().slice(0, Math.max(1, Math.min(limit, 50)));
  const rows = [];
  for (const key of keys) {
    const item = await store.get(key, { type: 'json' });
    if (item) rows.push({ key, at: item.at || '', reason: item.reason || 'publish' });
  }
  return rows;
}

export async function restoreRevision(key) {
  if (!/^revision\/[A-Za-z0-9._:-]{10,180}$/.test(String(key || ''))) throw new Error('Invalid revision.');
  const store = cmsStore();
  const item = await store.get(key, { type: 'json' });
  if (!item?.content) throw new Error('Revision not found.');
  return saveMasterContent(item.content, { reason: `restore:${key}` });
}

async function trimRevisions(maxCount) {
  const store = cmsStore();
  const { blobs } = await store.list({ prefix: REV_PREFIX });
  const keys = blobs.map(x => x.key).sort().reverse();
  const stale = keys.slice(maxCount);
  await Promise.all(stale.map(key => store.delete(key)));
}
