import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';

const parts = [1,2,3,4,5,6].map(n => `assets-src/v9/portrait-cutout.b64.part${n}`);
const encoded = (await Promise.all(parts.map(file => readFile(file, 'utf8')))).join('').replace(/\s+/g, '');
const bytes = Buffer.from(encoded, 'base64');
const expectedBytes = 35292;
const expectedSha256 = '8a7c9e4c1dc98c72739b23c5953e2b577200311243b98e9c3da99b9fb4e031b6';
const actualSha256 = createHash('sha256').update(bytes).digest('hex');

if (bytes.length !== expectedBytes) {
  throw new Error(`Welcome portrait byte count mismatch: ${bytes.length} !== ${expectedBytes}`);
}
if (actualSha256 !== expectedSha256) {
  throw new Error(`Welcome portrait checksum mismatch: ${actualSha256}`);
}
if (bytes.subarray(0,4).toString('ascii') !== 'RIFF' || bytes.subarray(8,12).toString('ascii') !== 'WEBP') {
  throw new Error('Welcome portrait is not a valid WebP container');
}

await mkdir('public/assets/v9', {recursive:true});
await writeFile('public/assets/v9/portrait-cutout.webp', bytes);
console.log(`Materialized transparent welcome portrait (${bytes.length} bytes, ${actualSha256.slice(0,12)})`);
