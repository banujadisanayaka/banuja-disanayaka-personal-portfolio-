import defaults from '../public/content-default.json' with { type: 'json' };
import { sanitizeContent } from './content-schema.mjs';

// Read-time migration. Existing stored content and its concurrency version are
// untouched until the owner publishes. The normal atomic writer retains a revision.
export function withV9Defaults(stored) {
  if (stored?.schemaVersion === 9) return sanitizeContent(stored);
  const extraPhotos = (stored?.dailyGaze || []).filter(g => {
    const url=String(g.preview||'');
    return url.startsWith('/api/media?') && !defaults.dailyGaze.some(d=>d.preview===url);
  });
  const contact={...defaults.contact};
  for(const [key,value] of Object.entries(stored?.contact||{})) if(value)contact[key]=value;
  return sanitizeContent({...defaults,contact,dailyGaze:[...defaults.dailyGaze,...extraPhotos]});
}
