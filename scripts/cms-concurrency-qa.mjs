import assert from 'node:assert/strict';
import { contentVersion, saveMasterContentToStore } from '../server/cms.mjs';

class FakeStore {
  constructor(initial = null) {
    this.current = initial ? { data: structuredClone(initial), etag: '"e1"' } : null;
    this.revisions = new Map();
    this.counter = 1;
    this.waitingReads = 0;
    this.releaseReads = null;
    this.readBarrier = new Promise(resolve => { this.releaseReads = resolve; });
  }

  async getWithMetadata(key) {
    if (key !== 'site-content') return null;
    const snapshot = this.current ? { data: structuredClone(this.current.data), etag: this.current.etag } : null;

    if (this.waitingReads < 2) {
      this.waitingReads += 1;
      if (this.waitingReads === 2) this.releaseReads();
      await this.readBarrier;
    }

    return snapshot;
  }

  async setJSON(key, value, options = {}) {
    if (key !== 'site-content') {
      this.revisions.set(key, structuredClone(value));
      return { modified: true, etag: `"r${this.revisions.size}"` };
    }

    if (options.onlyIfNew) {
      if (this.current) return { modified: false };
    } else if (options.onlyIfMatch) {
      if (!this.current || this.current.etag !== options.onlyIfMatch) return { modified: false };
    }

    this.counter += 1;
    this.current = { data: structuredClone(value), etag: `"e${this.counter}"` };
    return { modified: true, etag: this.current.etag };
  }

  async list({ prefix } = {}) {
    const blobs = [...this.revisions.keys()]
      .filter(key => !prefix || key.startsWith(prefix))
      .map(key => ({ key, etag: '"revision"' }));
    return { blobs, directories: [] };
  }

  async delete(key) {
    this.revisions.delete(key);
  }

  async get(key) {
    return this.revisions.get(key) || null;
  }
}

async function raceFromExisting() {
  const initial = { profile: { firstName: 'BASE' } };
  const store = new FakeStore(initial);
  const baseVersion = contentVersion(initial);

  const [a, b] = await Promise.allSettled([
    saveMasterContentToStore(store, { profile: { firstName: 'ALPHA' } }, { baseVersion, reason: 'test-a' }),
    saveMasterContentToStore(store, { profile: { firstName: 'BETA' } }, { baseVersion, reason: 'test-b' })
  ]);

  const results = [a, b];
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1, 'exactly one concurrent publish should commit');
  assert.equal(results.filter(result => result.status === 'rejected').length, 1, 'exactly one concurrent publish should be rejected');
  const rejected = results.find(result => result.status === 'rejected');
  assert.equal(rejected.reason?.code, 'VERSION_CONFLICT', 'losing writer must receive VERSION_CONFLICT');
}

async function raceFromEmpty() {
  const store = new FakeStore(null);

  const [a, b] = await Promise.allSettled([
    saveMasterContentToStore(store, { profile: { firstName: 'FIRST' } }, { baseVersion: 'empty', reason: 'test-first' }),
    saveMasterContentToStore(store, { profile: { firstName: 'SECOND' } }, { baseVersion: 'empty', reason: 'test-second' })
  ]);

  const results = [a, b];
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1, 'only one first publish may create the CMS record');
  assert.equal(results.filter(result => result.status === 'rejected').length, 1, 'the second first-publish race must be rejected');
  const rejected = results.find(result => result.status === 'rejected');
  assert.equal(rejected.reason?.code, 'VERSION_CONFLICT', 'losing first writer must receive VERSION_CONFLICT');
}

await raceFromExisting();
await raceFromEmpty();
console.log('CMS concurrency QA passed: ETag conditional writes reject simultaneous stale publishers.');
