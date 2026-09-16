import fs from 'node:fs/promises';
import sharp from 'sharp';

const names = [
  'identity-desktop',
  'work-desktop',
  'photography-desktop',
  'about-desktop',
  'perspectives-desktop',
  'journey-desktop',
  'veloria-desktop',
  'contact-desktop',
  'identity-mobile',
  'photography-mobile'
];

let preserved = 0;
for (const name of names) {
  const path = `qa-artifacts/v12-2/${name}.png`;
  await fs.access(path);
  const bytes = await sharp(path)
    .resize({width:1000, withoutEnlargement:true})
    .webp({quality:76})
    .toBuffer();
  console.log(`V122_VISUAL ${name}.webp ${bytes.toString('base64')}`);
  preserved += 1;
}

if (preserved !== names.length) {
  throw new Error(`Expected ${names.length} V12.2 review images, preserved ${preserved}`);
}

console.log(`V12.2 visual fallback preserved ${preserved} review images in the Actions log.`);
