import fs from 'node:fs/promises';
import sharp from 'sharp';
// Keep review evidence available when the optional GitHub artifact archive is full.
const scenes=[1366,768,390,320].flatMap(width=>[...Array.from({length:6},(_,i)=>`scenes-${width}-${i}`),`scenes-${width}-paused`,`scenes-${width}-toolbar-hidden`]);
for (const name of [...scenes,'desktop-opening','mobile-opening','small-mobile-opening','desktop-story','desktop-gaze','mobile-gaze','tablet-gaze','desktop-perspectives','mobile-perspectives','desktop-story-between','mobile-story-between','mobile-story-connect','desktop-hero-designer','mobile-story-performance']) {
  const path = `qa-artifacts/v10/${name}.png`;
  try { await fs.access(path); } catch { continue; }
  const bytes = await sharp(path).resize({width:1000,withoutEnlargement:true}).webp({quality:76}).toBuffer();
  console.log(`V10_VISUAL ${name}.webp ${bytes.toString('base64')}`);
}
