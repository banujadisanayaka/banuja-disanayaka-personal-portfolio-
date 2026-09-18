import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../public/', import.meta.url));
const LEGACY_ORIGIN = 'https://banuja-personal-log.netlify.app';
const CANONICAL_ORIGIN = 'https://banujadisanayaka.netlify.app';
const TEXT_EXTENSIONS = new Set(['.html', '.json', '.xml', '.txt', '.webmanifest']);

let replacements = 0;

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    if (!TEXT_EXTENSIONS.has(extname(entry.name))) continue;

    const source = await readFile(path, 'utf8');
    if (!source.includes(LEGACY_ORIGIN)) continue;

    const updated = source.replaceAll(LEGACY_ORIGIN, CANONICAL_ORIGIN);
    replacements += source.split(LEGACY_ORIGIN).length - 1;
    await writeFile(path, updated, 'utf8');
  }
}

await walk(ROOT);
console.log(`[canonical-origin] replaced ${replacements} legacy-origin reference(s)`);
