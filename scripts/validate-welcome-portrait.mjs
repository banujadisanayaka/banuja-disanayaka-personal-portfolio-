import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';

// Keep the supplied cutout as one binary asset. Never assemble or mask it at runtime.
const path = 'public/assets/v9/portrait-cutout-8a7c9e4c1dc9.webp';
const bytes = await readFile(path);
assert.equal(bytes.length, 35292, 'The complete supplied portrait must be present');
assert.equal(createHash('sha256').update(bytes).digest('hex'),
  '8a7c9e4c1dc98c72739b23c5953e2b577200311243b98e9c3da99b9fb4e031b6',
  'The supplied portrait must retain its verified pixels');
const metadata = await sharp(bytes).metadata();
assert.equal(metadata.format, 'webp');
assert.equal(metadata.width, 720);
assert.equal(metadata.height, 1080);
assert.equal(metadata.hasAlpha, true, 'The portrait must have real transparency');
// Decode the entire image as well as its header, catching corrupt compressed data.
const {data, info} = await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const alphaAt = (x, y) => data[(Math.round(y * (info.height - 1)) * info.width + Math.round(x * (info.width - 1))) * 4 + 3];
for (const y of [.16, .20, .25, .30, .36, .42, .50]) {
  assert.ok(alphaAt(.5, y) > 180, `Head, neck, collar, tie and torso remain opaque at ${y}`);
}
for (const x of [.1, .9]) for (const y of [.25, .5, .75]) {
  assert.ok(alphaAt(x, y) < 48, 'Studio background stays transparent');
}
console.log('Verified complete static welcome portrait: 720×1080, real alpha, intact head/neck/tie.');
