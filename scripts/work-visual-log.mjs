// Functional browser assertions remain required; this preserves review images
// when GitHub's optional artifact archive cannot accept another upload.
import fs from 'node:fs/promises';
import sharp from 'sharp';

for (const name of ['desktop-carousel', 'tablet-carousel', 'mobile-carousel', 'mobile-preview', 'small-mobile-carousel', 'small-mobile-preview', 'landscape-preview']) {
  const path = `qa-artifacts/work/${name}.png`;
  try { await fs.access(path); } catch { continue; }
  const bytes = await sharp(path).resize({width:900, withoutEnlargement:true}).webp({quality:72}).toBuffer();
  console.log(`WORK_VISUAL ${name}.webp ${bytes.toString('base64')}`);
}
