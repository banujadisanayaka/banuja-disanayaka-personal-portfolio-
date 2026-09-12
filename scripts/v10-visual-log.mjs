import fs from 'node:fs/promises';
import sharp from 'sharp';
// Keep review evidence available when the optional GitHub artifact archive is full.
for (const name of ['desktop-opening','mobile-opening','small-mobile-opening','desktop-story','desktop-gaze','mobile-gaze','tablet-gaze','desktop-perspectives','mobile-perspectives','desktop-story-between','mobile-story-between','mobile-story-connect','desktop-hero-designer']) {
  const path = `qa-artifacts/v10/${name}.png`;
  try { await fs.access(path); } catch { continue; }
  const bytes = await sharp(path).resize({width:1000,withoutEnlargement:true}).webp({quality:76}).toBuffer();
  console.log(`V10_VISUAL ${name}.webp ${bytes.toString('base64')}`);
}
