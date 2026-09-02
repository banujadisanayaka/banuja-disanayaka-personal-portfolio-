import crypto from 'node:crypto';
import { cmsStore } from './platform.mjs';
import { sanitizeContent } from './content-schema.mjs';

const CURRENT_KEY = 'site-content';
const REV_PREFIX = 'revision/';

function revKey() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${REV_PREFIX}${stamp}-${crypto.randomBytes(5).toString('hex')}`;
}

function versionConflict(version) {
  const error = new Error('Content version conflict.');
  error.code = 'VERSION_CONFLICT';
  error.version = version;
  return error;
}

export function contentVersion(content) {
  if (!content) return 'empty';
  const clean = sanitizeContent(content);
  return crypto.createHash('sha256').update(JSON.stringify(clean)).digest('base64url').slice(0, 24);
}

export async function getMasterEntry() {
  const entry = await cmsStore().getWithMetadata(CURRENT_KEY, { type: 'json', consistency: 'strong' });
  if (!entry) return { content: null, etag: null, version: 'empty' };
  const content = entry.data ? sanitizeContent(entry.data) : null;
  return { content, etag: entry.etag || null, version: contentVersion(content) };
}

export async function getMasterContent() {
  return (await getMasterEntry()).content;
}

export async function saveMasterContent(content, metadata = {}) {
  const clean = sanitizeContent(content);
  const store = cmsStore();
  const currentEntry = await store.getWithMetadata(CURRENT_KEY, { type: 'json', consistency: 'strong' });
  const current = currentEntry?.data ? sanitizeContent(currentEntry.data) : null;
  const currentVersion = contentVersion(current);
  const baseVersion = String(metadata.baseVersion || '');

  if (!baseVersion || baseVersion !== currentVersion) throw versionConflict(currentVersion);

  if (current) {
    await store.setJSON(revKey(), {
      at: new Date().toISOString(),
      reason: metadata.reason || 'publish',
      content: current
    });
  }

  const write = currentEntry?.etag
    ? await store.setJSON(CURRENT_KEY, clean, { onlyIfMatch: currentEntry.etag })
    : await store.setJSON(CURRENT_KEY, clean, { onlyIfNew: true });

  if (!write?.modified) {
    const latest = await store.getWithMetadata(CURRENT_KEY, { type: 'json', consistency: 'strong' });
    const latestContent = latest?.data ? sanitizeContent(latest.data) : null;
    throw versionConflict(contentVersion(latestContent));
  }

  await trimRevisions(100);
  return {
    content: clean,
    version: contentVersion(clean),
    etag: write.etag || null
  };
}

export async function listRevisions(limit = 25) {
  const store = cmsStore();
  const { blobs } = await store.list({ prefix: REV_PREFIX });
  const keys = blobs.map(x => x.key).sort().reverse().slice(0, Math.max(1, Math.min(limit, 50)));
  const rows = [];
  for (const key of keys) {
    const item = await store.get(key, { type: 'json', consistency: 'strong' });
    if (item) rows.push({ key, at: item.at || '', reason: item.reason || 'publish' });
  }
  return rows;
}

export async function restoreRevision(key, { baseVersion } = {}) {
  if (!/^revision\/[A-Za-z0-9._:-]{10,180}$/.test(String(key || ''))) throw new Error('Invalid revision.');
  const store = cmsStore();
  const item = await store.get(key, { type: 'json', consistency: 'strong' });
  if (!item?.content) throw new Error('Revision not found.');
  return saveMasterContent(item.content, { reason: `restore:${key}`, baseVersion });
}

async function trimRevisions(maxCount) {
  const store = cmsStore();
  const { blobs } = await store.list({ prefix: REV_PREFIX });
  const keys = blobs.map(x => x.key).sort().reverse();
  const stale = keys.slice(maxCount);
  await Promise.all(stale.map(key => store.delete(key)));
}
