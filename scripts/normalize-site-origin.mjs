import fs from 'node:fs/promises';
import path from 'node:path';

const oldOrigin = 'https://banuja-personal-log.netlify.app';
const newOrigin = 'https://banujadisanayaka.netlify.app';
const root = 'public';
const textExtensions = new Set(['.html', '.xml', '.txt', '.json', '.webmanifest']);

async function walk(dir) {
  const entries = await fs.readdir(dir, {withFileTypes: true});
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
      continue;
    }
    if (!textExtensions.has(path.extname(entry.name))) continue;
    const source = await fs.readFile(fullPath, 'utf8');
    if (!source.includes(oldOrigin)) continue;
    await fs.writeFile(fullPath, source.split(oldOrigin).join(newOrigin));
  }
}

await walk(root);

for (const required of ['public/index.html', 'public/robots.txt', 'public/sitemap.xml']) {
  const source = await fs.readFile(required, 'utf8');
  if (source.includes(oldOrigin)) {
    throw new Error(`Legacy site origin remains in ${required}`);
  }
  if (!source.includes(newOrigin)) {
    throw new Error(`Current site origin missing from ${required}`);
  }
}

console.log(`Normalized generated SEO URLs to ${newOrigin}`);
