import { getStore, getDeployStore } from '@netlify/blobs';

function isProduction() {
  try {
    if (globalThis.Netlify?.context?.deploy?.context === 'production') return true;
    return String(globalThis.Netlify?.env?.get?.('CONTEXT') || '').toLowerCase() === 'production';
  } catch {
    return false;
  }
}

export function blobStore(name, { strong = false } = {}) {
  if (isProduction()) {
    return strong ? getStore(name, { consistency: 'strong' }) : getStore(name);
  }
  return getDeployStore(name);
}

export const cmsStore = () => blobStore('banuja-cms', { strong: true });
export const mediaStore = () => blobStore('banuja-media');
export const securityStore = () => blobStore('banuja-security', { strong: true });
