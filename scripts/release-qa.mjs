import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sanitizeContent, publicProjection} from '../server/content-schema.mjs';
import {withV9Defaults} from '../server/v9-content.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const defaults=JSON.parse(read('public/content-default.json'));
assert.equal(defaults.dailyGaze.length,115);
assert.equal(new Set(defaults.dailyGaze.map(p=>p.id)).size,115);
const routes=['public/index.html','public/daily-gaze/index.html','public/resume/index.html','public/about/index.html',...['tfc-orders-tracker','class-tracker','second-brain','banu-2','veloria'].map(p=>`public/work/${p}/index.html`)];
for(const path of routes){const html=read(path);assert.equal((html.match(/<h1[ >]/g)||[]).length,1,path+' has one main heading');assert.match(html,/<main id="main"/);assert.match(html,/rel="canonical"/);assert.match(html,/name="description"/);assert.doesNotMatch(html,/PORTRAIT ASSET SLOT|drive\.google|thumbnail\?id|scanline|<canvas|AI DESIGNER/i);for(const [,url]of html.matchAll(/(?:href|src)="(\/[^"?#]*)"/g)){const target='public'+url;assert.ok(fs.existsSync(target)||url==='/favicon.svg',`${path} links to missing ${url}`)}}
for(const photo of defaults.dailyGaze){assert.ok(photo.alt.length>15);assert.ok(photo.width>0&&photo.height>0);assert.ok(photo.derivatives.length>=2);assert.ok(photo.derivatives.every(d=>d.width<=photo.width&&fs.existsSync('public'+d.url)));assert.equal(photo.derivatives.at(-1).url,photo.preview)}
const raw={profile:{firstName:'Old'},dailyGaze:[],contact:{email:'owner@example.com'}};const before=JSON.stringify(raw);const migrated=withV9Defaults(raw);assert.equal(JSON.stringify(raw),before,'Read migration does not alter stored source');assert.equal(migrated.contact.email,'owner@example.com');assert.equal(migrated.dailyGaze.length,115);
const edited=structuredClone(defaults);edited.dailyGaze=[];assert.equal(withV9Defaults(edited).dailyGaze.length,0,'V9 removals stay removed');
edited.dailyGaze=[{...defaults.dailyGaze[0],visible:false},{...defaults.dailyGaze[1],downloadable:false}];const publicData=publicProjection(edited);assert.equal(publicData.dailyGaze.length,1);assert.equal(publicData.dailyGaze[0].download,'');
for(const url of ['javascript:alert(1)','//evil.example','/\\evil.example','https://user:password@evil.example']){const bad=sanitizeContent({...defaults,profile:{...defaults.profile,suitImage:url}});assert.equal(bad.profile.suitImage,'')}
assert.match(read('public/v9-site.css'),/prefers-reduced-motion/);assert.match(read('public/v9-site.css'),/forced-colors/);assert.doesNotMatch(read('public/v9-site.js'),/setInterval|innerHTML|localStorage/);
console.log('V9 release QA passed: source links, 115 photographs, metadata, non-destructive migration, visibility and URL boundaries.');

const about=read('public/about/index.html');
for(const file of ['public/index.html','public/about/index.html','public/resume/index.html']){assert.match(read(file),/Thurston College, Colombo 07/);assert.match(read(file),/2011–2021/);assert.match(read(file),/G.C.E. O\/L/)}
for(const slug of ['tfc-orders-tracker','class-tracker','second-brain','banu-2','veloria']){const html=read(`public/work/${slug}/index.html`);assert.equal((html.match(/data-panel=/g)||[]).length,4);for(const id of ['context','workflow','experience','architecture','reflection'])assert.ok(html.includes(`id="${id}"`));const words=html.replace(/<[^>]*>/g,' ').split(/\s+/).length;assert.ok(words>900,`${slug} has a substantive case study`)}
assert.match(about,/Akashna as CEO/);
assert.match(read('public/v9-motion.js'),/pointercancel/);
assert.doesNotMatch(read('public/v9-motion.js'),/setInterval|innerHTML|localStorage/);
console.log('Expanded education, personal story and five complete project narratives passed.');
